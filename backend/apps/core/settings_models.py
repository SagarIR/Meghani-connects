"""
Business Settings Models
"""
from django.db import models
from django.conf import settings


class BusinessSettings(models.Model):
    """
    Store business configuration settings.
    Only one instance should exist (singleton pattern).
    """
    # Business Information
    business_name = models.CharField(max_length=200, default='Meghani Watch Co.')
    tagline = models.CharField(max_length=300, blank=True)
    logo = models.ImageField(upload_to='business/', null=True, blank=True)
    
    # Contact Information
    phone = models.CharField(max_length=20, blank=True)
    alternate_phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    
    # Address
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    
    # Tax Information
    gst_number = models.CharField(max_length=20, blank=True, verbose_name='GSTIN')
    pan_number = models.CharField(max_length=15, blank=True, verbose_name='PAN')
    
    # Invoice Settings
    invoice_prefix = models.CharField(max_length=10, default='INV')
    repair_prefix = models.CharField(max_length=10, default='REP')
    invoice_footer = models.TextField(blank=True, default='Thank you for your business!')
    terms_and_conditions = models.TextField(blank=True)
    
    # Loyalty Settings
    loyalty_points_per_100 = models.IntegerField(default=1, help_text='Points earned per ₹100 spent')
    loyalty_redemption_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.50,
        help_text='Value of 1 point in rupees'
    )
    
    # Stock Settings
    low_stock_threshold = models.IntegerField(default=5)
    
    # Notification Settings
    enable_whatsapp = models.BooleanField(default=False)
    enable_sms = models.BooleanField(default=False)
    enable_email = models.BooleanField(default=True)
    
    # System
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='settings_updates'
    )
    
    class Meta:
        verbose_name = 'Business Settings'
        verbose_name_plural = 'Business Settings'
    
    def __str__(self):
        return self.business_name
    
    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        self.pk = 1
        super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        """Get or create singleton settings instance"""
        obj, created = cls.objects.get_or_create(pk=1)
        return obj


class UserPreferences(models.Model):
    """
    User-specific preferences and settings
    """
    THEME_CHOICES = [
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('system', 'System'),
    ]
    
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('hi', 'Hindi'),
        ('gu', 'Gujarati'),
    ]
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='preferences'
    )
    
    # Display
    theme = models.CharField(max_length=10, choices=THEME_CHOICES, default='light')
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='en')
    
    # Notifications
    notify_low_stock = models.BooleanField(default=True)
    notify_new_repair = models.BooleanField(default=True)
    notify_repair_ready = models.BooleanField(default=True)
    notify_daily_summary = models.BooleanField(default=False)
    
    # Dashboard
    default_dashboard_period = models.CharField(
        max_length=20,
        choices=[('today', 'Today'), ('week', 'This Week'), ('month', 'This Month')],
        default='today'
    )
    
    # POS
    auto_print_receipt = models.BooleanField(default=True)
    default_payment_mode = models.CharField(
        max_length=20,
        choices=[('cash', 'Cash'), ('upi', 'UPI'), ('card', 'Card')],
        default='cash'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'User Preferences'
        verbose_name_plural = 'User Preferences'
    
    def __str__(self):
        return f"Preferences for {self.user.username}"
