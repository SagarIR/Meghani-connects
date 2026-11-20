from django.db import models
from django.core.exceptions import ValidationError
from django.db.models import Q


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
    article_code = models.CharField(max_length=100, unique=True, blank=True, null=True)
    model_number = models.CharField(max_length=100, blank=True, default='')
    size = models.CharField(max_length=50, blank=True, default='')

    # Normalized relational master references
    brand = models.ForeignKey('Brand', on_delete=models.PROTECT, null=True, blank=True, related_name='products')
    category = models.ForeignKey('Category', on_delete=models.PROTECT, null=True, blank=True, related_name='products')
    subcategory = models.ForeignKey('Subcategory', on_delete=models.SET_NULL, null=True, blank=True, related_name='products')

    # Preserved legacy columns for zero-downtime backwards compatibility
    brand_text = models.CharField(max_length=100, blank=True, default='')
    category_slug = models.CharField(max_length=20, choices=CATEGORY_CHOICES, blank=True, default='')

    # Pricing & Stock
    mrp = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
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
            models.Index(fields=['article_code']),
            models.Index(fields=['model_number']),
        ]
        constraints = [
            models.CheckConstraint(check=Q(cost_price__gte=0), name='product_cost_price_gte_0'),
            models.CheckConstraint(check=Q(selling_price__gte=0), name='product_selling_price_gte_0'),
            models.CheckConstraint(check=Q(stock__gte=0), name='product_stock_gte_0'),
            models.CheckConstraint(check=Q(mrp__isnull=True) | Q(mrp__gte=0), name='product_mrp_gte_0'),
        ]

    def __init__(self, *args, **kwargs):
        # Gracefully resolve string brand or category if passed directly in instantiation/tests
        if 'brand' in kwargs and isinstance(kwargs['brand'], str):
            b_val = kwargs.pop('brand')
            kwargs['brand_text'] = b_val
            if b_val:
                from .models import Brand
                b_obj = Brand.objects.filter(name__iexact=b_val).first()
                if b_obj:
                    kwargs['brand'] = b_obj

        if 'category' in kwargs and isinstance(kwargs['category'], str):
            c_val = kwargs.pop('category')
            kwargs['category_slug'] = c_val
            if c_val:
                from .models import Category
                c_obj = Category.objects.filter(slug=c_val).first() or Category.objects.filter(name__iexact=c_val).first()
                if c_obj:
                    kwargs['category'] = c_obj

        super().__init__(*args, **kwargs)

    def __str__(self):
        b = self.brand_name
        return f"{b} - {self.name}" if b else self.name

    @property
    def brand_name(self):
        if self.brand:
            return self.brand.name
        return self.brand_text or ''

    @property
    def category_name(self):
        if self.category:
            return self.category.name
        return ''

    @property
    def category_slug_val(self):
        if self.category:
            return self.category.slug
        return self.category_slug or ''

    @property
    def subcategory_name(self):
        if self.subcategory:
            return self.subcategory.name
        return ''

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

    def clean(self):
        super().clean()
        if self.cost_price is not None and self.cost_price < 0:
            raise ValidationError({'cost_price': 'Cost price cannot be negative.'})
        if self.selling_price is not None and self.selling_price < 0:
            raise ValidationError({'selling_price': 'Selling price cannot be negative.'})
        if self.mrp is not None and self.mrp < 0:
            raise ValidationError({'mrp': 'MRP cannot be negative.'})
        if self.mrp is not None and self.selling_price is not None and self.selling_price > self.mrp:
            raise ValidationError({'selling_price': 'Selling price cannot exceed MRP.'})
        if self.stock is not None and self.stock < 0:
            raise ValidationError({'stock': 'Stock cannot be negative.'})

    def save(self, *args, **kwargs):
        # Auto-sync legacy fields for backwards compatibility
        if self.brand:
            self.brand_text = self.brand.name
        elif self.brand_text and not self.brand:
            from .models import Brand
            b = Brand.objects.filter(name__iexact=self.brand_text).first()
            if b:
                self.brand = b

        if self.category:
            valid_slugs = [c[0] for c in self.CATEGORY_CHOICES]
            self.category_slug = self.category.slug if self.category.slug in valid_slugs else 'analog'
        elif self.category_slug and not self.category:
            from .models import Category
            c = Category.objects.filter(slug=self.category_slug).first()
            if c:
                self.category = c

        # Default MRP to selling_price if not explicitly set
        if self.mrp is None or self.mrp == 0:
            self.mrp = self.selling_price

        # Auto-generate article_code if missing
        if not self.article_code and self.id:
            brand_code = (self.brand_name[:3] if self.brand_name else 'MW').upper()
            self.article_code = f"{brand_code}-{self.id:04d}"

        self.full_clean(exclude=['article_code'] if not self.article_code else None)
        super().save(*args, **kwargs)

        # If article_code was generated after initial save (for new instances with id)
        if not self.article_code and self.id:
            brand_code = (self.brand_name[:3] if self.brand_name else 'MW').upper()
            self.article_code = f"{brand_code}-{self.id:04d}"
            super().save(update_fields=['article_code'])


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


class Subcategory(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='subcategories')
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120)
    description = models.TextField(blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'subcategories'
        verbose_name_plural = 'subcategories'
        ordering = ['display_order', 'name']
        constraints = [
            models.UniqueConstraint(fields=['category', 'slug'], name='unique_category_subcategory_slug'),
        ]

    def __str__(self):
        return f"{self.category.name} - {self.name}"



