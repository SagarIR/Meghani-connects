from rest_framework import serializers
from .models import Notification, MessageTemplate


class NotificationSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'customer', 'customer_name', 'customer_phone',
            'message', 'type', 'status', 'sent_on', 'error_message', 'created_at'
        ]
        read_only_fields = ['status', 'sent_on', 'error_message', 'created_at']


class MessageTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageTemplate
        fields = ['id', 'name', 'template', 'description', 'is_active']


class SendNotificationSerializer(serializers.Serializer):
    customer_id = serializers.IntegerField()
    message = serializers.CharField()
    type = serializers.ChoiceField(choices=Notification.TYPE_CHOICES, default='whatsapp')


class BulkNotificationSerializer(serializers.Serializer):
    customer_ids = serializers.ListField(child=serializers.IntegerField())
    message = serializers.CharField()
    type = serializers.ChoiceField(choices=Notification.TYPE_CHOICES, default='whatsapp')
