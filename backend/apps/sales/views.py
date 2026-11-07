from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from django.http import HttpResponse
from datetime import timedelta
from .models import Sale, SaleItem, Warranty
from .serializers import (
    SaleSerializer, SaleListSerializer, SaleCreateSerializer,
    WarrantySerializer
)
from .invoice import generate_invoice_pdf


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['sale_date', 'total_amount']
    ordering = ['-sale_date']

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
        """Get today's sales summary"""
        today = timezone.now().date()
        sales = Sale.objects.filter(sale_date__date=today)
        
        summary = sales.aggregate(
            total_sales=Sum('total_amount'),
            total_profit=Sum('profit'),
            count=Count('id')
        )
        
        return Response({
            'date': today,
            'total_sales': summary['total_sales'] or 0,
            'total_profit': summary['total_profit'] or 0,
            'transaction_count': summary['count'] or 0,
            'average_sale': (summary['total_sales'] or 0) / max(summary['count'] or 1, 1)
        })

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get sales summary for date range"""
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
        
        return Response({
            'period': {'start': start_date, 'end': timezone.now().date()},
            'summary': {
                'total_sales': summary['total_sales'] or 0,
                'total_profit': summary['total_profit'] or 0,
                'transaction_count': summary['count'] or 0,
            },
            'daily': list(daily),
            'by_payment_mode': list(by_payment)
        })

    @action(detail=True, methods=['get'])
    def invoice(self, request, pk=None):
        """Get invoice data for printing/PDF"""
        sale = self.get_object()
        serializer = SaleSerializer(sale)
        
        # Add business info for invoice
        data = serializer.data
        data['business'] = {
            'name': 'Meghani Watch Co.',
            'address': 'Your Business Address',
            'phone': '+91 XXXXXXXXXX',
            'gst': 'GSTIN: XXXXXXXXXXXXXXX',
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
