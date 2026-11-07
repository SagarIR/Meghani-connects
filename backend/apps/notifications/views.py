from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Notification, MessageTemplate
from .serializers import (
    NotificationSerializer, MessageTemplateSerializer,
    SendNotificationSerializer, BulkNotificationSerializer
)
from .services.whatsapp import send_whatsapp_message, verify_twilio_config
from .services.sms import send_sms_message
from apps.crm.models import Customer
from rest_framework.permissions import IsAdminUser
from rest_framework.views import APIView


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by type
        type_filter = self.request.query_params.get('type')
        if type_filter:
            queryset = queryset.filter(type=type_filter)
        
        return queryset

    @action(detail=False, methods=['post'])
    def send(self, request):
        """Send a notification to a customer"""
        serializer = SendNotificationSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                customer = Customer.objects.get(id=serializer.data['customer_id'])
            except Customer.DoesNotExist:
                return Response({'error': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)
            
            message = serializer.data['message']
            notif_type = serializer.data['type']
            
            # Create notification record
            notification = Notification.objects.create(
                customer=customer,
                message=message,
                type=notif_type,
                status='pending'
            )
            
            # Send based on type
            if notif_type == 'whatsapp':
                result = send_whatsapp_message(customer.phone, message)
            elif notif_type == 'sms':
                result = send_sms_message(customer.phone, message)
            else:
                result = {'status': 'error', 'error': 'Unsupported notification type'}
            
            # Update notification status
            if result['status'] == 'sent':
                notification.status = 'sent'
                notification.sent_on = timezone.now()
            else:
                notification.status = 'failed'
                notification.error_message = result.get('error', 'Unknown error')
            
            notification.save()
            
            return Response({
                'notification': NotificationSerializer(notification).data,
                'result': result
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def bulk(self, request):
        """Send bulk notifications to multiple customers"""
        serializer = BulkNotificationSerializer(data=request.data)
        
        if serializer.is_valid():
            customer_ids = serializer.data['customer_ids']
            message = serializer.data['message']
            notif_type = serializer.data['type']
            
            customers = Customer.objects.filter(id__in=customer_ids)
            results = []
            
            for customer in customers:
                notification = Notification.objects.create(
                    customer=customer,
                    message=message,
                    type=notif_type,
                    status='pending'
                )
                
                if notif_type == 'whatsapp':
                    result = send_whatsapp_message(customer.phone, message)
                elif notif_type == 'sms':
                    result = send_sms_message(customer.phone, message)
                else:
                    result = {'status': 'error', 'error': 'Unsupported type'}
                
                if result['status'] == 'sent':
                    notification.status = 'sent'
                    notification.sent_on = timezone.now()
                else:
                    notification.status = 'failed'
                    notification.error_message = result.get('error', '')
                
                notification.save()
                
                results.append({
                    'customer_id': customer.id,
                    'customer_name': customer.name,
                    'status': notification.status
                })
            
            return Response({
                'total': len(results),
                'sent': len([r for r in results if r['status'] == 'sent']),
                'failed': len([r for r in results if r['status'] == 'failed']),
                'results': results
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MessageTemplateViewSet(viewsets.ModelViewSet):
    queryset = MessageTemplate.objects.filter(is_active=True)
    serializer_class = MessageTemplateSerializer


class TwilioConfigView(APIView):
    """
    Verify Twilio configuration status (admin only)
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Check Twilio configuration and connection status"""
        result = verify_twilio_config()
        return Response(result)


class TestNotificationView(APIView):
    """
    Send a test notification (admin only)
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        """Send a test notification to verify setup"""
        phone = request.data.get('phone')
        message = request.data.get('message', 'This is a test message from Meghani Connect 360')
        notif_type = request.data.get('type', 'whatsapp')
        
        if not phone:
            return Response({'error': 'Phone number required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if notif_type == 'whatsapp':
            result = send_whatsapp_message(phone, message)
        elif notif_type == 'sms':
            result = send_sms_message(phone, message)
        else:
            return Response({'error': 'Invalid notification type'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(result)
