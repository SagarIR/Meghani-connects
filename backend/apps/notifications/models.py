from django.db import models
from apps.crm.models import Customer


class Notification(models.Model):
    TYPE_CHOICES = [
        ('whatsapp', 'WhatsApp'),
        ('sms', 'SMS'),
        ('email', 'Email'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sent_on = models.DateTimeField(blank=True, null=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['type']),
        ]

    def __str__(self):
        return f"{self.type} to {self.customer.name} - {self.status}"


class MessageTemplate(models.Model):
    name = models.CharField(max_length=50, unique=True)
    template = models.TextField()
    description = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'message_templates'
        ordering = ['name']

    def __str__(self):
        return self.name

    def render(self, **kwargs):
        """Render template with provided variables"""
        message = self.template
        for key, value in kwargs.items():
            message = message.replace(f'{{{key}}}', str(value))
        return message
