from rest_framework import serializers
from .models import AuditLog
from .settings_models import BusinessSettings, UserPreferences


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_name', 'user_email', 'action', 'severity',
            'model_name', 'object_id', 'object_repr', 'changes',
            'ip_address', 'message', 'timestamp'
        ]
        read_only_fields = fields


class BusinessSettingsSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = BusinessSettings
        fields = [
            'id', 'business_name', 'tagline', 'logo', 'logo_url',
            'phone', 'alternate_phone', 'email', 'website',
            'address_line1', 'address_line2', 'city', 'state', 'pincode',
            'gst_number', 'pan_number',
            'invoice_prefix', 'repair_prefix', 'invoice_footer', 'terms_and_conditions',
            'loyalty_points_per_100', 'loyalty_redemption_rate', 'low_stock_threshold',
            'enable_whatsapp', 'enable_sms', 'enable_email',
            'updated_at'
        ]
        read_only_fields = ['id', 'logo_url', 'updated_at']
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None


class UserPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreferences
        fields = [
            'id', 'theme', 'language',
            'notify_low_stock', 'notify_new_repair', 'notify_repair_ready', 'notify_daily_summary',
            'default_dashboard_period', 'auto_print_receipt', 'default_payment_mode',
            'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']
