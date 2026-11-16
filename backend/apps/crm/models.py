from django.db import models


class Customer(models.Model):
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('hi', 'Hindi'),
        ('gu', 'Gujarati'),
    ]

    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15, unique=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    date_of_birth = models.DateField(blank=True, null=True)
    language_preference = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default='en')
    loyalty_points = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customers'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['phone']),
            models.Index(fields=['date_of_birth']),
        ]

    def __str__(self):
        return f"{self.name} ({self.phone})"

    def add_loyalty_points(self, sale_amount):
        """Add loyalty points based on purchase amount"""
        from django.conf import settings
        points_per_100 = getattr(settings, 'LOYALTY_POINTS_PER_100', 1)
        points = int(sale_amount / 100) * points_per_100
        self.loyalty_points += points
        self.save()
        return points

    def redeem_points(self, points_to_redeem):
        """Redeem loyalty points for discount"""
        from django.conf import settings
        redemption_rate = getattr(settings, 'LOYALTY_REDEMPTION_RATE', 0.5)
        
        if self.loyalty_points >= points_to_redeem:
            discount = points_to_redeem * redemption_rate
            self.loyalty_points -= points_to_redeem
            self.save()
            return discount
        return 0

    @property
    def total_purchases(self):
        return self.sales.aggregate(total=models.Sum('total_amount'))['total'] or 0

    @property
    def purchase_count(self):
        return self.sales.count()


class Enquiry(models.Model):
    ENQUIRY_TYPE_CHOICES = [
        ('viewing', 'Private Boutique Viewing'),
        ('product', 'Product Inquiry'),
        ('service', 'Watchmaker Service / Repair'),
        ('general', 'General Inquiry'),
    ]

    STATUS_CHOICES = [
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('converted', 'Converted'),
        ('closed', 'Closed'),
    ]

    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    enquiry_type = models.CharField(max_length=20, choices=ENQUIRY_TYPE_CHOICES, default='viewing')
    preferred_date = models.CharField(max_length=100, blank=True)
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True, blank=True, related_name='enquiries')
    product_name = models.CharField(max_length=200, blank=True)
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'enquiries'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['phone']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.name} - {self.get_enquiry_type_display()} ({self.status})"

