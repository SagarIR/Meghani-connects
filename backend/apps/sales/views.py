from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.users.permissions import CanManageSales
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from django.http import HttpResponse
from datetime import timedelta
from decimal import Decimal
from .models import Sale, SaleItem, Warranty
from .serializers import (
    SaleSerializer, SaleListSerializer, SaleCreateSerializer,
    WarrantySerializer
)
from .invoice import generate_invoice_pdf


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [CanManageSales]
    http_method_names = ['get', 'post', 'head', 'options']
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['sale_date', 'total_amount']
    ordering = ['-sale_date']

    def destroy(self, request, *args, **kwargs):
        return Response(
            {'error': 'Sales records cannot be deleted. Voiding or returns must be recorded as an adjustment.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def create(self, request, *args, **kwargs):
        serializer = SaleCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        sale = serializer.save()
        return Response(SaleSerializer(sale, context={'request': request}).data, status=status.HTTP_201_CREATED)

    def get_serializer_class(self):
        if self.action == 'list':
            return SaleListSerializer
        if self.action == 'create':
            return SaleCreateSerializer
        return SaleSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(sale_date__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(sale_date__date__lte=end_date)
        
        # Filter by payment mode
        payment_mode = self.request.query_params.get('payment_mode')
        if payment_mode:
            queryset = queryset.filter(payment_mode=payment_mode)
        
        # Filter by customer
        customer_id = self.request.query_params.get('customer_id')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        return queryset

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's sales summary (masks profit for non-admin staff)"""
        today = timezone.now().date()
        sales = Sale.objects.filter(sale_date__date=today)
        
        summary = sales.aggregate(
            total_sales=Sum('total_amount'),
            total_profit=Sum('profit'),
            count=Count('id')
        )
        
        is_admin = request.user.is_superuser or getattr(request.user, 'role', '') in ['admin', 'manager']
        return Response({
            'date': today,
            'total_sales': summary['total_sales'] or 0,
            'total_profit': (summary['total_profit'] or 0) if is_admin else None,
            'transaction_count': summary['count'] or 0,
            'average_sale': (summary['total_sales'] or 0) / max(summary['count'] or 1, 1)
        })

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get sales summary for date range (masks profit for non-admin staff)"""
        days = int(request.query_params.get('days', 7))
        start_date = timezone.now().date() - timedelta(days=days)
        
        sales = Sale.objects.filter(sale_date__date__gte=start_date)
        
        # Overall summary
        summary = sales.aggregate(
            total_sales=Sum('total_amount'),
            total_profit=Sum('profit'),
            count=Count('id')
        )
        
        # Daily breakdown
        daily = sales.annotate(
            date=TruncDate('sale_date')
        ).values('date').annotate(
            sales=Sum('total_amount'),
            profit=Sum('profit'),
            count=Count('id')
        ).order_by('date')
        
        # Payment mode breakdown
        by_payment = sales.values('payment_mode').annotate(
            total=Sum('total_amount'),
            count=Count('id')
        )

        # Authoritative tender reconciliation resolving mixed split tenders
        tender_breakdown = {'cash': Decimal('0.00'), 'upi': Decimal('0.00'), 'card': Decimal('0.00')}
        for s in sales.only('payment_mode', 'total_amount', 'payment_details'):
            if s.payment_mode in tender_breakdown:
                tender_breakdown[s.payment_mode] += Decimal(str(s.total_amount))
            elif s.payment_mode == 'mixed' and isinstance(s.payment_details, dict):
                for method, amt in s.payment_details.items():
                    m = method.lower()
                    if m in tender_breakdown:
                        try:
                            tender_breakdown[m] += Decimal(str(amt or 0))
                        except Exception:
                            pass
        
        is_admin = request.user.is_superuser or getattr(request.user, 'role', '') in ['admin', 'manager']
        daily_list = list(daily)
        if not is_admin:
            for item in daily_list:
                item['profit'] = None

        return Response({
            'period': {'start': start_date, 'end': timezone.now().date()},
            'summary': {
                'total_sales': summary['total_sales'] or 0,
                'total_profit': (summary['total_profit'] or 0) if is_admin else None,
                'transaction_count': summary['count'] or 0,
            },
            'daily': daily_list,
            'by_payment_mode': list(by_payment),
            'tender_breakdown': {k: float(v) for k, v in tender_breakdown.items()}
        })

    @action(detail=True, methods=['get'])
    def invoice(self, request, pk=None):
        """Get invoice data for printing/PDF with dynamic BusinessSettings"""
        sale = self.get_object()
        serializer = SaleSerializer(sale, context={'request': request})
        
        # Add dynamic business info for invoice
        data = serializer.data
        try:
            from apps.core.settings_models import BusinessSettings
            biz = BusinessSettings.get_settings()
            addr_parts = [biz.address_line1, biz.address_line2, f"{biz.city} - {biz.pincode}" if biz.city else ""]
            clean_addr = ", ".join([p for p in addr_parts if p])
            data['business'] = {
                'name': biz.business_name or 'Meghani Watch Co.',
                'address': clean_addr or 'Cactus Park, New Sama Rd, Vadodara, Gujarat - 390008',
                'phone': biz.phone or '+91 91066 80191',
                'gst': biz.gst_number or 'GSTIN: 24AAAAA0000A1Z5',
                'footer': biz.invoice_footer or 'Thank you for your purchase!',
            }
        except Exception:
            data['business'] = {
                'name': 'Meghani Watch Co.',
                'address': 'Cactus Park, New Sama Rd, Vadodara, Gujarat - 390008',
                'phone': '+91 91066 80191',
                'gst': 'GSTIN: 24AAAAA0000A1Z5',
                'footer': 'Thank you for your purchase!',
            }
        
        return Response(data)

    @action(detail=True, methods=['get'], url_path='invoice/pdf')
    def invoice_pdf(self, request, pk=None):
        """Download invoice as PDF"""
        sale = self.get_object()
        pdf_buffer = generate_invoice_pdf(sale)
        
        response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice_{sale.invoice_number}.pdf"'
        return response


class WarrantyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Warranty.objects.all()
    serializer_class = WarrantySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product__name', 'customer__name', 'customer__phone', 'serial_number']
    ordering = ['expiry_date']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter expiring soon
        days_ahead = self.request.query_params.get('expiring_in_days')
        if days_ahead:
            cutoff = timezone.now().date() + timedelta(days=int(days_ahead))
            queryset = queryset.filter(
                expiry_date__lte=cutoff,
                expiry_date__gte=timezone.now().date()
            )
        
        # Filter by customer
        customer_id = self.request.query_params.get('customer_id')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        return queryset

    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Get warranties expiring in next 30 days"""
        days = int(request.query_params.get('days', 30))
        cutoff = timezone.now().date() + timedelta(days=days)
        
        warranties = Warranty.objects.filter(
            expiry_date__lte=cutoff,
            expiry_date__gte=timezone.now().date(),
            notified=False
        ).select_related('product', 'customer')
        
        serializer = WarrantySerializer(warranties, many=True)
        return Response(serializer.data)
