from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.users.permissions import CanManageRepairs
from django.db.models import Count
from django.utils import timezone
from django.http import HttpResponse
from django.core.exceptions import ValidationError
from apps.users.models import User
from .models import Repair, RepairPart
from .serializers import (
    RepairSerializer, RepairListSerializer, RepairStatusSerializer,
    RepairCreateSerializer, RepairPartSerializer, RepairPartAddSerializer
)
from .services import RepairService
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
        """Update repair status across the workshop repair lifecycle stages"""
        repair = self.get_object()
        serializer = RepairStatusSerializer(data=request.data)
        
        if serializer.is_valid():
            new_status = serializer.validated_data['status']
            notes = serializer.validated_data.get('notes', '')
            repair_charge = serializer.validated_data.get('repair_charge')
            qc_passed = serializer.validated_data.get('qc_passed')
            service_type = serializer.validated_data.get('service_type')
            diagnosis_notes = serializer.validated_data.get('diagnosis_notes')

            tech_id = serializer.validated_data.get('assigned_technician')
            assigned_tech = None
            if tech_id is not None:
                assigned_tech = User.objects.filter(id=tech_id).first()

            try:
                repair, old_status = RepairService.transition_status(
                    repair=repair,
                    new_status=new_status,
                    notes=notes,
                    repair_charge=repair_charge,
                    assigned_technician=assigned_tech,
                    qc_passed=qc_passed,
                    service_type=service_type,
                    diagnosis_notes=diagnosis_notes,
                    user=request.user
                )

                # Dispatch asynchronous status update notification if status changed
                if old_status != new_status:
                    self._dispatch_repair_notification(repair, new_status)

                return Response(RepairSerializer(repair, context={'request': request}).data)
            except ValidationError as e:
                return Response({'error': str(e.message if hasattr(e, 'message') else e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_part(self, request, pk=None):
        """
        Consumes spare parts from catalog for this repair, automatically deducting
        stock and creating an immutable StockMovement entry.
        """
        repair = self.get_object()
        serializer = RepairPartAddSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.validated_data['product_id']
        quantity = serializer.validated_data['quantity']
        charge = serializer.validated_data.get('charge_to_customer')
        notes = serializer.validated_data.get('notes', '')

        try:
            part = RepairService.add_spare_part(
                repair=repair,
                product=product,
                quantity=quantity,
                charge_to_customer=charge,
                user=request.user,
                notes=notes
            )
            return Response(RepairPartSerializer(part).data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'error': str(e.message if hasattr(e, 'message') else e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['delete', 'post'])
    def remove_part(self, request, pk=None):
        """
        Removes a spare part from this repair and returns the items back to inventory stock.
        """
        repair = self.get_object()
        part_id = request.data.get('part_id') or request.query_params.get('part_id')
        if not part_id:
            return Response({'error': 'part_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            part = repair.parts_used.get(id=part_id)
        except RepairPart.DoesNotExist:
            return Response({'error': 'Repair part not found on this ticket'}, status=status.HTTP_404_NOT_FOUND)

        RepairService.remove_spare_part(part, user=request.user)
        return Response({'message': 'Repair part removed and returned to stock', 'part_id': int(part_id)})

    @action(detail=False, methods=['get'])
    def technicians(self, request):
        """List of active staff and technicians available for job assignment"""
        techs = User.objects.filter(is_active=True).values('id', 'name', 'username', 'role')
        return Response(list(techs))

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
