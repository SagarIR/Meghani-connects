from django.db import models


class Product(models.Model):
    CATEGORY_CHOICES = [
        ('analog', 'Analog Watch'),
        ('digital', 'Digital Watch'),
        ('smart', 'Smart Watch'),
        ('wall', 'Wall Clock'),
        ('accessory', 'Accessory'),
    ]

    name = models.CharField(max_length=200)
    brand = models.CharField(max_length=100, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    barcode = models.CharField(max_length=50, unique=True, blank=True, null=True)
    supplier_name = models.CharField(max_length=100, blank=True)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    description = models.TextField(blank=True)
    warranty_months = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['barcode']),
            models.Index(fields=['category']),
            models.Index(fields=['brand']),
        ]

    def __str__(self):
        return f"{self.brand} - {self.name}" if self.brand else self.name

    @property
    def profit_margin(self):
        return self.selling_price - self.cost_price

    @property
    def profit_percentage(self):
        if self.cost_price > 0:
            return round((self.profit_margin / self.cost_price) * 100, 2)
        return 0

    @property
    def is_low_stock(self):
        from django.conf import settings
        return self.stock <= getattr(settings, 'LOW_STOCK_THRESHOLD', 5)
