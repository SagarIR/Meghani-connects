from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.users.permissions import CanManageSales, IsManagerOrAbove
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from django.http import HttpResponse
from django.core.exceptions import ValidationError
from datetime import timedelta
from decimal import Decimal
from .models import Sale, SaleItem, SaleReturn, SaleReturnItem, Warranty, WarrantyClaim
from .serializers import (
    SaleSerializer, SaleListSerializer, SaleCreateSerializer,
    SaleReturnSerializer, SaleReturnCreateSerializer,
    WarrantySerializer, WarrantyClaimSerializer, WarrantyClaimCreateSerializer
)
from .services import SaleReturnService, WarrantyService
from .invoice import generate_invoice_pdf


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [CanManageSales]
    http_method_names = ['get', 'post', 'head', 'options']
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['invoice_number', 'customer__name', 'customer__phone', 'payment_mode', 'notes']
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

    @action(detail=True, methods=['post'], url_path='return')
    def process_return(self, request, pk=None):
        """
        Process a sales return against this invoice.
        Restocks resellable inventory into the immutable ledger and voids warranties if full quantity returned.
        """
        sale = self.get_object()
        serializer = SaleReturnCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            sale_return = SaleReturnService.process_return(
                sale_or_id=sale,
                items_data=serializer.validated_data['items'],
                refund_mode=serializer.validated_data.get('refund_mode', 'cash'),
                reason=serializer.validated_data['reason'],
                user=request.user
            )
            return Response(SaleReturnSerializer(sale_return).data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response(e.message_dict if hasattr(e, 'message_dict') else {'detail': str(e)},
                            status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='returns')
    def get_returns(self, request, pk=None):
        """Get all returns logged against this invoice"""
        sale = self.get_object()
        returns = sale.returns.all()
        return Response(SaleReturnSerializer(returns, many=True).data)


class SaleReturnViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Audit and history view of all Sales Returns & Refunds.
    """
    queryset = SaleReturn.objects.select_related('sale', 'customer', 'created_by').prefetch_related('items__product').all().order_by('-created_at')
    serializer_class = SaleReturnSerializer
    permission_classes = [CanManageSales]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['return_number', 'sale__invoice_number', 'customer__name', 'reason']
    ordering_fields = ['created_at', 'refund_amount']

    def get_queryset(self):
        queryset = super().get_queryset()
        sale_id = self.request.query_params.get('sale_id')
        if sale_id:
            queryset = queryset.filter(sale_id=sale_id)
        customer_id = self.request.query_params.get('customer_id')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        return queryset


class WarrantyViewSet(viewsets.ModelViewSet):
    """
    Warranty certificate and claims management.
    """
    queryset = Warranty.objects.select_related('product', 'customer', 'sale').prefetch_related('claims').all().order_by('expiry_date')
    serializer_class = WarrantySerializer
    permission_classes = [CanManageSales]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['warranty_code', 'product__name', 'customer__name', 'customer__phone', 'serial_number']
    ordering_fields = ['expiry_date', 'created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Status filter
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        # Filter expiring soon
        days_ahead = self.request.query_params.get('expiring_in_days')
        if days_ahead:
            cutoff = timezone.now().date() + timedelta(days=int(days_ahead))
            queryset = queryset.filter(
                expiry_date__lte=cutoff,
                expiry_date__gte=timezone.now().date(),
                status='active'
            )
        
        # Filter by customer
        customer_id = self.request.query_params.get('customer_id')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        return queryset

    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Get active warranties expiring in next 30 days"""
        days = int(request.query_params.get('days', 30))
        cutoff = timezone.now().date() + timedelta(days=days)
        
        warranties = Warranty.objects.filter(
            expiry_date__lte=cutoff,
            expiry_date__gte=timezone.now().date(),
            status='active',
            notified=False
        ).select_related('product', 'customer')
        
        serializer = WarrantySerializer(warranties, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='claim')
    def file_claim(self, request, pk=None):
        """File a warranty claim on this timepiece"""
        warranty = self.get_object()
        serializer = WarrantyClaimCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        repair = None
        repair_id = serializer.validated_data.get('repair_id')
        if repair_id:
            from apps.repairs.models import Repair
            repair = Repair.objects.filter(id=repair_id).first()

        try:
            claim = WarrantyService.register_claim(
                warranty_or_id=warranty,
                issue_description=serializer.validated_data['issue_description'],
                repair=repair,
                covered_amount=serializer.validated_data.get('covered_amount', Decimal('0.00')),
                user=request.user
            )
            return Response(WarrantyClaimSerializer(claim).data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response(e.message_dict if hasattr(e, 'message_dict') else {'detail': str(e)},
                            status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='void')
    def void_warranty(self, request, pk=None):
        """Administratively void a warranty (Manager/Admin only)"""
        is_admin = request.user.is_superuser or getattr(request.user, 'role', '') in ['admin', 'manager']
        if not is_admin:
            return Response(
                {'detail': 'Only managers or administrators are authorized to void warranties.'},
                status=status.HTTP_403_FORBIDDEN
            )

        warranty = self.get_object()
        reason = request.data.get('reason', '').strip()
        if not reason:
            return Response({'detail': 'Reason is mandatory to void warranty.'}, status=status.HTTP_400_BAD_REQUEST)

        voided_w = WarrantyService.void_warranty(warranty, reason=reason, user=request.user)
        return Response(WarrantySerializer(voided_w).data)


class WarrantyClaimViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only view of all warranty claims.
    """
    queryset = WarrantyClaim.objects.select_related('warranty', 'warranty__product', 'warranty__customer', 'repair', 'created_by').all().order_by('-claim_date')
    serializer_class = WarrantyClaimSerializer
    permission_classes = [CanManageSales]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['claim_number', 'warranty__warranty_code', 'warranty__customer__name', 'issue_description']
