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

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(RepairSerializer(serializer.instance, context={'request': request}).data, status=status.HTTP_201_CREATED, headers=headers)

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

    def perform_create(self, serializer):
        repair = serializer.save()
        self._dispatch_repair_notification(repair, 'received')

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update repair status across the 5-stage repair lifecycle"""
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
            
            # Dispatch asynchronous status update notification if status changed
            if old_status != new_status:
                self._dispatch_repair_notification(repair, new_status)
            
            return Response(RepairSerializer(repair).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _dispatch_repair_notification(self, repair, status_event):
        """
        Safely dispatches repair notifications via Celery background task with SMS fallback.
        Ensures repair operations are never blocked if the message provider or broker fails.
        """
        try:
            from apps.notifications.tasks import send_repair_notification_task
            try:
                send_repair_notification_task.delay(repair.id, status_event)
            except Exception:
                # If Celery worker/broker is unreachable, invoke task logic safely
                send_repair_notification_task(repair.id, status_event)
        except Exception:
            pass  # Never block repair lifecycle on notification failure

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
