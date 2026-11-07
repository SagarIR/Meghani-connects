from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
import json

# Import settings models
from .settings_models import BusinessSettings, UserPreferences


class AuditLog(models.Model):
    """
    Audit log model to track all user actions in the system.
    """
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('view', 'View'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('export', 'Export'),
        ('print', 'Print'),
        ('status_change', 'Status Change'),
        ('payment', 'Payment'),
        ('other', 'Other'),
    ]
    
    SEVERITY_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('critical', 'Critical'),
    ]
    
    # User who performed the action
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs'
    )
    
    # Action details
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='info')
    
    # What was affected (generic foreign key)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Additional context
    model_name = models.CharField(max_length=100, blank=True)
    object_repr = models.CharField(max_length=255, blank=True)
    changes = models.JSONField(null=True, blank=True)  # Store old/new values
    
    # Request context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Metadata
    message = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['content_type', 'object_id']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.action} - {self.model_name} - {self.timestamp}"
    
    @classmethod
    def log(cls, user, action, obj=None, message='', changes=None, request=None, severity='info'):
        """
        Create an audit log entry.
        
        Args:
            user: The user performing the action
            action: The action type (create, update, delete, etc.)
            obj: The object being acted upon (optional)
            message: A human-readable message
            changes: Dict of changes (old_value, new_value)
            request: The HTTP request (for IP and user agent)
            severity: Log severity level
        """
        log_entry = cls(
            user=user,
            action=action,
            message=message,
            changes=changes,
            severity=severity,
        )
        
        if obj:
            log_entry.content_type = ContentType.objects.get_for_model(obj)
            log_entry.object_id = obj.pk
            log_entry.model_name = obj.__class__.__name__
            log_entry.object_repr = str(obj)[:255]
        
        if request:
            log_entry.ip_address = cls._get_client_ip(request)
            log_entry.user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
        
        log_entry.save()
        return log_entry
    
    @staticmethod
    def _get_client_ip(request):
        """Extract client IP from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


class AuditLogMixin:
    """
    Mixin to automatically log CRUD operations on models.
    Add this to your model to enable automatic audit logging.
    """
    
    def save(self, *args, **kwargs):
        from django.contrib.auth import get_user_model
        
        is_new = self.pk is None
        old_instance = None
        
        if not is_new:
            try:
                old_instance = self.__class__.objects.get(pk=self.pk)
            except self.__class__.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)
        
        # Log the action
        user = kwargs.get('user') or getattr(self, '_audit_user', None)
        request = kwargs.get('request') or getattr(self, '_audit_request', None)
        
        if user:
            action = 'create' if is_new else 'update'
            changes = None
            
            if old_instance:
                changes = self._get_changes(old_instance)
            
            AuditLog.log(
                user=user,
                action=action,
                obj=self,
                message=f"{'Created' if is_new else 'Updated'} {self.__class__.__name__}",
                changes=changes,
                request=request,
            )
    
    def delete(self, *args, **kwargs):
        user = kwargs.get('user') or getattr(self, '_audit_user', None)
        request = kwargs.get('request') or getattr(self, '_audit_request', None)
        
        if user:
            AuditLog.log(
                user=user,
                action='delete',
                obj=self,
                message=f"Deleted {self.__class__.__name__}",
                request=request,
            )
        
        super().delete(*args, **kwargs)
    
    def _get_changes(self, old_instance):
        """Compare old and new values."""
        changes = {}
        for field in self._meta.fields:
            field_name = field.name
            old_value = getattr(old_instance, field_name)
            new_value = getattr(self, field_name)
            
            if old_value != new_value:
                # Convert to JSON-serializable format
                try:
                    changes[field_name] = {
                        'old': str(old_value),
                        'new': str(new_value),
                    }
                except:
                    pass
        
        return changes if changes else None
