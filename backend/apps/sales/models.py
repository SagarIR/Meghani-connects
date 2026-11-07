from django.db import models
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
    profit = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True)
    sale_date = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='sales')

    class Meta:
        db_table = 'sales'
        ordering = ['-sale_date']
        indexes = [
            models.Index(fields=['sale_date']),
            models.Index(fields=['invoice_number']),
        ]

    def __str__(self):
        return f"Invoice {self.invoice_number} - ₹{self.total_amount}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = self.generate_invoice_number()
        super().save(*args, **kwargs)

    @staticmethod
    def generate_invoice_number():
        """Generate unique invoice number: INV-YYYYMMDD-XXXX"""
        today = timezone.now().strftime('%Y%m%d')
        prefix = f"INV-{today}-"
        
        last_sale = Sale.objects.filter(
            invoice_number__startswith=prefix
        ).order_by('-invoice_number').first()
        
        if last_sale:
            last_num = int(last_sale.invoice_number.split('-')[-1])
            new_num = last_num + 1
        else:
            new_num = 1
        
        return f"{prefix}{new_num:04d}"


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


class Warranty(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='warranties')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='warranties')
    warranty_months = models.PositiveIntegerField()
    start_date = models.DateField()
    expiry_date = models.DateField()
    serial_number = models.CharField(max_length=100, blank=True)
    notified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'warranties'
        ordering = ['expiry_date']
        indexes = [
            models.Index(fields=['expiry_date']),
        ]

    def __str__(self):
        return f"Warranty: {self.product.name} - Expires {self.expiry_date}"

    @property
    def is_expired(self):
        return self.expiry_date < timezone.now().date()

    @property
    def days_remaining(self):
        if self.is_expired:
            return 0
        return (self.expiry_date - timezone.now().date()).days
