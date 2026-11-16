from django.db import models


class Product(models.Model):
    CATEGORY_CHOICES = [
        ('analog', 'Analog Watch'),
        ('digital', 'Digital Watch'),
        ('smart', 'Smart Watch'),
        ('wall', 'Wall Clock'),
        ('accessory', 'Accessory'),
    ]

    AVAILABILITY_CHOICES = [
        ('in_stock', 'In Stock'),
        ('out_of_stock', 'Out of Stock'),
        ('on_request', 'On Request'),
        ('discontinued', 'Discontinued'),
    ]

    name = models.CharField(max_length=200)
    brand = models.CharField(max_length=100, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    price_visible = models.BooleanField(default=True)
    availability = models.CharField(max_length=20, choices=AVAILABILITY_CHOICES, default='in_stock')
    stock = models.PositiveIntegerField(default=0)
    barcode = models.CharField(max_length=50, unique=True, blank=True, null=True)
    supplier_name = models.CharField(max_length=100, blank=True)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    description = models.TextField(blank=True)
    warranty_months = models.PositiveIntegerField(default=0)
    specifications = models.JSONField(default=dict, blank=True)
    is_featured = models.BooleanField(default=False)
    is_new_arrival = models.BooleanField(default=False)
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


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='gallery_images')
    image = models.ImageField(upload_to='products/gallery/', blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'product_images'
        ordering = ['display_order', 'id']

    def __str__(self):
        return f"Image for {self.product.name}"


class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    country = models.CharField(max_length=100, blank=True)
    established = models.CharField(max_length=20, blank=True)
    tagline = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    hero_image = models.URLField(max_length=500, blank=True)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'brands'
        ordering = ['display_order', 'name']

    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    tagline = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    image_url = models.URLField(max_length=500, blank=True)
    features = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'categories'
        ordering = ['display_order', 'name']

    def __str__(self):
        return self.name

