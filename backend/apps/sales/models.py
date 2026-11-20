from decimal import Decimal
from django.db import models, transaction, IntegrityError
from django.utils import timezone
from apps.users.models import User
from apps.crm.models import Customer
from apps.products.models import Product


class Sale(models.Model):
    PAYMENT_CHOICES = [
        ('cash', 'Cash'),
        ('upi', 'UPI'),
        ('card', 'Card'),
        ('mixed', 'Mixed'),
    ]

    invoice_number = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='sales')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_mode = models.CharField(max_length=20, choices=PAYMENT_CHOICES)
    payment_details = models.JSONField(default=dict, blank=True)
    profit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    sale_date = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='sales')

    class Meta:
        db_table = 'sales'
        ordering = ['-sale_date']
        indexes = [
            models.Index(fields=['sale_date']),
        ]

    def __str__(self):
        return f"Invoice {self.invoice_number} - ₹{self.total_amount}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            max_retries = 5
            for attempt in range(max_retries):
                self.invoice_number = self.generate_invoice_number()
                try:
                    with transaction.atomic():
                        super().save(*args, **kwargs)
                    return
                except IntegrityError as e:
                    if ('unique' in str(e).lower() or 'invoice_number' in str(e).lower()) and attempt < max_retries - 1:
                        self.invoice_number = None
                        continue
                    raise
        super().save(*args, **kwargs)

    @classmethod
    def generate_invoice_number(cls):
        """Generate unique invoice number: INV-YYYYMMDD-XXXX with concurrency protection"""
        today = timezone.now().strftime('%Y%m%d')
        inv_prefix = 'INV'
        try:
            from apps.core.settings_models import BusinessSettings
            bs = BusinessSettings.get_settings()
            if bs and bs.invoice_prefix:
                inv_prefix = bs.invoice_prefix.strip().upper()
        except Exception:
            inv_prefix = 'INV'
        prefix = f"{inv_prefix}-{today}-"
        
        try:
            last_sale = cls.objects.select_for_update().filter(
                invoice_number__startswith=prefix
            ).order_by('-invoice_number').first()
        except Exception:
            last_sale = cls.objects.filter(
                invoice_number__startswith=prefix
            ).order_by('-invoice_number').first()
        
        if last_sale:
            try:
                last_num = int(last_sale.invoice_number.split('-')[-1])
                new_num = last_num + 1
            except (ValueError, IndexError):
                new_num = cls.objects.filter(invoice_number__startswith=prefix).count() + 1
        else:
            new_num = cls.objects.filter(invoice_number__startswith=prefix).count() + 1
        
        candidate = f"{prefix}{new_num:04d}"
        while cls.objects.filter(invoice_number=candidate).exists():
            new_num += 1
            candidate = f"{prefix}{new_num:04d}"
        
        return candidate


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='sale_items')
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'sale_items'

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"

    @property
    def item_profit(self):
        return (self.unit_price - self.cost_price) * self.quantity

    @property
    def returned_quantity(self):
        return sum(item.quantity for item in self.return_items.all())

    @property
    def returnable_quantity(self):
        return max(0, self.quantity - self.returned_quantity)


class SaleReturn(models.Model):
    """
    Sales Return & Refund transaction entity.
    Tracks returned merchandise, refund amounts, condition of returned goods,
    and links to immutable stock movements and warranty adjustments.
    """
    REFUND_CHOICES = [
        ('cash', 'Cash'),
        ('upi', 'UPI'),
        ('card', 'Card'),
        ('store_credit', 'Store Credit'),
    ]

    STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    return_number = models.CharField(max_length=50, unique=True)
    sale = models.ForeignKey(Sale, on_delete=models.PROTECT, related_name='returns')
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='sales_returns')
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2)
    refund_mode = models.CharField(max_length=20, choices=REFUND_CHOICES, default='cash')
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='processed_returns')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sales_returns'
        ordering = ['-created_at']

    def __str__(self):
        return f"Return {self.return_number} (Ref: {self.sale.invoice_number}) - ₹{self.refund_amount}"

    def save(self, *args, **kwargs):
        if not self.return_number:
            self.return_number = self.generate_return_number()
        super().save(*args, **kwargs)

    @classmethod
    def generate_return_number(cls):
        """Generate unique return reference: RET-YYYYMMDD-XXXX with concurrency protection"""
        today = timezone.now().strftime('%Y%m%d')
        prefix = f"RET-{today}-"
        
        with transaction.atomic():
            last_ret = cls.objects.select_for_update().filter(
                return_number__startswith=prefix
            ).order_by('-return_number').first()
            
            if last_ret and last_ret.return_number:
                try:
                    last_num = int(last_ret.return_number.split('-')[-1])
                    new_num = last_num + 1
                except (ValueError, IndexError):
                    new_num = cls.objects.filter(return_number__startswith=prefix).count() + 1
            else:
                new_num = cls.objects.filter(return_number__startswith=prefix).count() + 1
            
            while True:
                candidate = f"{prefix}{new_num:04d}"
                if not cls.objects.filter(return_number=candidate).exists():
                    return candidate
                new_num += 1


class SaleReturnItem(models.Model):
    CONDITION_CHOICES = [
        ('resellable', 'Resellable (Restocked)'),
        ('damaged', 'Damaged / Shop-soiled'),
        ('defective', 'Defective / Sent to Service'),
    ]

    sale_return = models.ForeignKey(SaleReturn, on_delete=models.CASCADE, related_name='items')
    sale_item = models.ForeignKey(SaleItem, on_delete=models.PROTECT, related_name='return_items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='returned_items')
    quantity = models.PositiveIntegerField(default=1)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='resellable')
    notes = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'sale_return_items'

    def __str__(self):
        return f"Return Item: {self.product.name} x {self.quantity} ({self.get_condition_display()})"


class Warranty(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('claimed', 'Claimed'),
        ('expired', 'Expired'),
        ('voided', 'Voided'),
    ]

    DEFAULT_TERMS = (
        'Standard Meghani Watch Co. Horological Manufacturer Warranty. '
        'Covers internal mechanical and quartz movement defects. '
        'Excludes normal wear-and-tear, battery degradation, strap deterioration, '
        'and water ingress caused by user negligence unless certified ISO diver rated.'
    )

    warranty_code = models.CharField(max_length=50, unique=True, blank=True, null=True)
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='warranties')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='warranties')
    warranty_months = models.PositiveIntegerField()
    start_date = models.DateField()
    expiry_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    serial_number = models.CharField(max_length=100, blank=True)
    terms = models.TextField(blank=True, default=DEFAULT_TERMS)
    notified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'warranties'
        ordering = ['expiry_date']
        indexes = [
            models.Index(fields=['expiry_date']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Warranty {self.warranty_code or self.id}: {self.product.name} - Status: {self.get_status_display()}"

    def save(self, *args, **kwargs):
        if not self.warranty_code:
            self.warranty_code = self.generate_warranty_code()
        
        # Check automatic expiration if status is active
        if self.status == 'active' and self.expiry_date < timezone.now().date():
            self.status = 'expired'
            
        super().save(*args, **kwargs)

    @classmethod
    def generate_warranty_code(cls):
        """Generate unique warranty certificate code: WR-YYYYMMDD-XXXX"""
        today = timezone.now().strftime('%Y%m%d')
        prefix = f"WR-{today}-"
        
        with transaction.atomic():
            last_w = cls.objects.select_for_update().filter(
                warranty_code__startswith=prefix
            ).order_by('-warranty_code').first()
            
            if last_w and last_w.warranty_code:
                try:
                    last_num = int(last_w.warranty_code.split('-')[-1])
                    new_num = last_num + 1
                except (ValueError, IndexError):
                    new_num = cls.objects.filter(warranty_code__startswith=prefix).count() + 1
            else:
                new_num = cls.objects.filter(warranty_code__startswith=prefix).count() + 1
            
            while True:
                candidate = f"{prefix}{new_num:04d}"
                if not cls.objects.filter(warranty_code=candidate).exists():
                    return candidate
                new_num += 1

    @property
    def is_expired(self):
        return self.expiry_date < timezone.now().date() or self.status == 'expired'

    @property
    def days_remaining(self):
        if self.is_expired or self.status == 'voided':
            return 0
        return max(0, (self.expiry_date - timezone.now().date()).days)


class WarrantyClaim(models.Model):
    """
    Formal warranty claim logged when a customer reports an issue on a covered timepiece.
    Integrates seamlessly with the Watch Repair service module.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Assessment'),
        ('approved', 'Approved (Under Warranty)'),
        ('rejected', 'Rejected (Out of Scope / Void)'),
        ('completed', 'Completed / Serviced'),
    ]

    claim_number = models.CharField(max_length=50, unique=True)
    warranty = models.ForeignKey(Warranty, on_delete=models.PROTECT, related_name='claims')
    repair = models.ForeignKey('repairs.Repair', on_delete=models.SET_NULL, null=True, blank=True, related_name='warranty_claims')
    issue_description = models.TextField()
    claim_date = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    resolution_notes = models.TextField(blank=True, default='')
    covered_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='claims_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'warranty_claims'
        ordering = ['-claim_date']

    def __str__(self):
        return f"Claim {self.claim_number} - {self.warranty.product.name} ({self.get_status_display()})"

    def save(self, *args, **kwargs):
        if not self.claim_number:
            self.claim_number = self.generate_claim_number()
        super().save(*args, **kwargs)

    @classmethod
    def generate_claim_number(cls):
        """Generate unique claim reference: CLM-YYYYMMDD-XXXX"""
        today = timezone.now().strftime('%Y%m%d')
        prefix = f"CLM-{today}-"
        
        with transaction.atomic():
            last_c = cls.objects.select_for_update().filter(
                claim_number__startswith=prefix
            ).order_by('-claim_number').first()
            
            if last_c and last_c.claim_number:
                try:
                    last_num = int(last_c.claim_number.split('-')[-1])
                    new_num = last_num + 1
                except (ValueError, IndexError):
                    new_num = cls.objects.filter(claim_number__startswith=prefix).count() + 1
            else:
                new_num = cls.objects.filter(claim_number__startswith=prefix).count() + 1
            
            while True:
                candidate = f"{prefix}{new_num:04d}"
                if not cls.objects.filter(claim_number=candidate).exists():
                    return candidate
                new_num += 1
