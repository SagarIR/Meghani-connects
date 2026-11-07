from django.contrib import admin
from .models import Notification, MessageTemplate


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['customer', 'type', 'status', 'sent_on', 'created_at']
    list_filter = ['type', 'status', 'created_at']
    search_fields = ['customer__name', 'customer__phone', 'message']
    ordering = ['-created_at']
    readonly_fields = ['customer', 'message', 'type', 'status', 'sent_on', 'error_message', 'created_at']


@admin.register(MessageTemplate)
class MessageTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'template']
