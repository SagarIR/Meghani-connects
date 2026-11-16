from django.contrib import admin
from .models import AuditLog, Offer, GalleryItem, Milestone
from .settings_models import BusinessSettings, UserPreferences


@admin.register(BusinessSettings)
class BusinessSettingsAdmin(admin.ModelAdmin):
    list_display = ['business_name', 'phone', 'email', 'city', 'gst_number', 'updated_at']
    
    def has_add_permission(self, request):
        # Only allow one instance
        return not BusinessSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(UserPreferences)
class UserPreferencesAdmin(admin.ModelAdmin):
    list_display = ['user', 'theme', 'language', 'default_dashboard_period', 'updated_at']
    list_filter = ['theme', 'language']
    search_fields = ['user__username', 'user__email']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'user', 'action', 'model_name', 'object_repr', 'severity', 'ip_address']
    list_filter = ['action', 'severity', 'model_name', 'timestamp']
    search_fields = ['user__username', 'user__email', 'message', 'object_repr', 'ip_address']
    readonly_fields = [
        'user', 'action', 'severity', 'content_type', 'object_id', 
        'model_name', 'object_repr', 'changes', 'ip_address', 
        'user_agent', 'message', 'timestamp'
    ]
    date_hierarchy = 'timestamp'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        # Only superusers can delete audit logs
        return request.user.is_superuser


@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = ['title', 'badge', 'code', 'validity', 'is_active', 'display_order']
    list_filter = ['is_active']
    search_fields = ['title', 'code', 'description']
    list_editable = ['is_active', 'display_order']


@admin.register(GalleryItem)
class GalleryItemAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'is_active', 'display_order']
    list_filter = ['category', 'is_active']
    search_fields = ['title', 'caption']
    list_editable = ['is_active', 'display_order']


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = ['year', 'title', 'is_active', 'display_order']
    list_filter = ['is_active']
    search_fields = ['year', 'title']
    list_editable = ['is_active', 'display_order']

