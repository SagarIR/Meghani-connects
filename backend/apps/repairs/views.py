from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.users.permissions import CanManageRepairs
from django.db.models import Count
from django.utils import timezone
from django.http import HttpResponse
from .models import Repair
from .serializers import RepairSerializer, RepairListSerializer, RepairStatusSerializer, RepairCreateSerializer
from apps.sales.invoice import generate_repair_invoice_pdf


class RepairViewSet(viewsets.ModelViewSet):
    queryset = Repair.objects.all()
    serializer_class = RepairSerializer
    permission_classes = [CanManageRepairs]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['ticket_number', 'customer__name', 'customer__phone', 'item_type', 'brand']
    ordering_fields = ['received_date', 'expected_delivery', 'status']
    ordering = ['-received_date']

    def get_serializer_class(self):
        if self.action == 'list':
            return RepairListSerializer
        if self.action == 'create':
            return RepairCreateSerializer
        return RepairSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by customer
        customer_id = self.request.query_params.get('customer_id')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        # Filter pending (not delivered/cancelled)
        pending = self.request.query_params.get('pending')
        if pending == 'true':
            queryset = queryset.exclude(status__in=['delivered', 'cancelled'])
        
        return queryset

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update repair status"""
        repair = self.get_object()
        serializer = RepairStatusSerializer(data=request.data)
        
        if serializer.is_valid():
            old_status = repair.status
            new_status = serializer.data['status']
            
            repair.status = new_status
            
            # Update repair charge if provided
            if 'repair_charge' in serializer.data:
                repair.repair_charge = serializer.data['repair_charge']
            
            # Add notes if provided
            if serializer.data.get('notes'):
                repair.notes = f"{repair.notes}\n[{timezone.now().strftime('%Y-%m-%d %H:%M')}] {serializer.data['notes']}"
            
            # Set delivered date if status is delivered
            if new_status == 'delivered':
                repair.delivered_date = timezone.now()
            
            repair.save()
            
            # Send notification if status changed to ready
            if old_status != 'ready' and new_status == 'ready':
                self._send_ready_notification(repair)
            
            return Response(RepairSerializer(repair).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _send_ready_notification(self, repair):
        """Send notification when repair is ready"""
        try:
            from apps.notifications.services.whatsapp import send_whatsapp_message
            message = f"Your {repair.item_type} is ready for pickup. Ticket: {repair.ticket_number}. Please collect from Meghani Watch Co."
            send_whatsapp_message(repair.customer.phone, message)
        except Exception:
            pass  # Don't fail if notification fails

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get repair summary by status"""
        summary = Repair.objects.values('status').annotate(count=Count('id'))
        
        # Also get overdue (expected_delivery < today, not delivered)
        overdue_count = Repair.objects.filter(
            expected_delivery__lt=timezone.now().date()
        ).exclude(status__in=['delivered', 'cancelled']).count()
        
        return Response({
            'by_status': list(summary),
            'overdue_count': overdue_count,
        })

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending repairs (not delivered/cancelled)"""
        repairs = Repair.objects.exclude(
            status__in=['delivered', 'cancelled']
        ).order_by('expected_delivery', 'received_date')
        
        serializer = RepairListSerializer(repairs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue repairs"""
        repairs = Repair.objects.filter(
            expected_delivery__lt=timezone.now().date()
        ).exclude(status__in=['delivered', 'cancelled'])
        
        serializer = RepairListSerializer(repairs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='ticket/(?P<ticket>[^/.]+)')
    def by_ticket(self, request, ticket=None):
        """Get repair by ticket number"""
        try:
            repair = Repair.objects.get(ticket_number=ticket)
            serializer = RepairSerializer(repair)
            return Response(serializer.data)
        except Repair.DoesNotExist:
            return Response({'error': 'Repair not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'], url_path='invoice/pdf')
    def invoice_pdf(self, request, pk=None):
        """Download repair receipt as PDF"""
        repair = self.get_object()
        pdf_buffer = generate_repair_invoice_pdf(repair)
        
        response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="repair_{repair.ticket_number}.pdf"'
        return response
