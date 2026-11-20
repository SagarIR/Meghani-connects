from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
import re


def normalize_phone_number(raw_phone: str) -> str:
    """
    Standardize Indian phone numbers into consistent format:
    e.g. '98765 43210', '+91 9876543210', '09876543210' -> '+919876543210'
    """
    if not raw_phone:
        return ''
    digits = re.sub(r'\D', '', str(raw_phone))
    if len(digits) == 10:
        return f"+91{digits}"
    elif len(digits) == 11 and digits.startswith('0'):
        return f"+91{digits[1:]}"
    elif len(digits) == 12 and digits.startswith('91'):
        return f"+{digits}"
    elif len(digits) > 10:
        return f"+{digits}"
    return raw_phone.strip()


class Customer(models.Model):
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('hi', 'Hindi'),
        ('gu', 'Gujarati'),
    ]

    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, unique=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True, default='Vadodara')
    gstin = models.CharField(max_length=20, blank=True, default='')
    date_of_birth = models.DateField(blank=True, null=True)
    anniversary_date = models.DateField(blank=True, null=True)
    language_preference = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default='en')
    loyalty_points = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customers'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['date_of_birth']),
            models.Index(fields=['anniversary_date']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.name} ({self.phone})"

    def clean(self):
        super().clean()
        if self.phone:
            normalized = normalize_phone_number(self.phone)
            # Check uniqueness against other customers
            existing = Customer.objects.filter(phone=normalized).exclude(id=self.id).first()
            if existing:
                raise ValidationError({'phone': f"Phone number '{normalized}' is already registered to '{existing.name}'."})
            self.phone = normalized

    def save(self, *args, **kwargs):
        if self.phone:
            self.phone = normalize_phone_number(self.phone)
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.sales.exists() or self.repairs.exists():
            raise ValidationError('Cannot delete customer profile with existing sales or repair history. Historical transactions must be preserved.')
        super().delete(*args, **kwargs)

    def add_loyalty_points(self, sale_amount, reference_id='', reason='', user=None):
        """Add loyalty points and record in immutable loyalty ledger"""
        from django.conf import settings
        points_per_100 = getattr(settings, 'LOYALTY_POINTS_PER_100', 1)
        earned = int(float(sale_amount) / 100) * points_per_100

        if earned <= 0:
            return 0

        with transaction.atomic():
            new_bal = self.loyalty_points + earned
            self.loyalty_points = new_bal
            self.save(update_fields=['loyalty_points', 'updated_at'])

            LoyaltyTransaction.objects.create(
                customer=self,
                transaction_type='earned',
                points=earned,
                balance_after=new_bal,
                reference_id=reference_id,
                reason=reason or f"Earned on purchase of ₹{float(sale_amount):,.2f}",
                created_by=user
            )
            return earned

    def redeem_points(self, points_to_redeem, reference_id='', reason='', user=None):
        """Redeem loyalty points for discount and record in ledger"""
        from django.conf import settings
        points_to_redeem = int(points_to_redeem)
        if points_to_redeem <= 0 or self.loyalty_points < points_to_redeem:
            return 0

        redemption_rate = getattr(settings, 'LOYALTY_REDEMPTION_RATE', 0.5)

        with transaction.atomic():
            new_bal = self.loyalty_points - points_to_redeem
            self.loyalty_points = new_bal
            self.save(update_fields=['loyalty_points', 'updated_at'])

            LoyaltyTransaction.objects.create(
                customer=self,
                transaction_type='redeemed',
                points=-points_to_redeem,
                balance_after=new_bal,
                reference_id=reference_id,
                reason=reason or f"Redeemed {points_to_redeem} points for POS discount",
                created_by=user
            )
            return points_to_redeem * redemption_rate

    @property
    def total_purchases(self):
        return self.sales.aggregate(total=models.Sum('total_amount'))['total'] or 0

    @property
    def purchase_count(self):
        return self.sales.count()

    @property
    def repair_count(self):
        return self.repairs.count()

    @property
    def active_warranties_count(self):
        return self.warranties.filter(status='active', expiry_date__gte=timezone.now().date()).count()


class LoyaltyTransaction(models.Model):
    """
    Immutable ledger of all loyalty point debits, credits, and reversals.
    """
    TRANSACTION_CHOICES = [
        ('earned', 'Points Earned (Purchase)'),
        ('redeemed', 'Points Redeemed (Discount)'),
        ('reversed', 'Points Reversed (Return / Refund)'),
        ('adjustment', 'Manual Administrative Adjustment'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='loyalty_ledger')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_CHOICES)
    points = models.IntegerField()
    balance_after = models.PositiveIntegerField()
    reference_id = models.CharField(max_length=100, blank=True, default='')
    reason = models.CharField(max_length=255)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='loyalty_transactions')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'loyalty_transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.customer.name} - {self.get_transaction_type_display()}: {self.points:+d} (Bal: {self.balance_after})"


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
