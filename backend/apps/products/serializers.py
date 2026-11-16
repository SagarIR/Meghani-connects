from rest_framework import serializers
from .models import Product, ProductImage, Brand, Category


class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'url', 'display_order']

    def get_url(self, obj):
        if obj.image:
            return obj.image.url
        return obj.image_url


class BrandSerializer(serializers.ModelSerializer):
    count = serializers.SerializerMethodField()
    slug = serializers.SlugField(required=False, allow_blank=True)

    class Meta:
        model = Brand
        fields = [
            'id', 'name', 'slug', 'country', 'established', 'tagline',
            'description', 'hero_image', 'is_featured', 'is_active', 'count', 'display_order'
        ]

    def get_count(self, obj):
        return Product.objects.filter(brand__iexact=obj.name, is_active=True).count()

    def create(self, validated_data):
        from django.utils.text import slugify
        if not validated_data.get('slug'):
            validated_data['slug'] = slugify(validated_data.get('name', 'brand'))
        return super().create(validated_data)


class CategorySerializer(serializers.ModelSerializer):
    count = serializers.SerializerMethodField()
    slug = serializers.SlugField(required=False, allow_blank=True)

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'tagline', 'description', 'image_url',
            'features', 'is_active', 'count', 'display_order'
        ]

    def get_count(self, obj):
        return Product.objects.filter(category=obj.slug, is_active=True).count()

    def create(self, validated_data):
        from django.utils.text import slugify
        if not validated_data.get('slug'):
            validated_data['slug'] = slugify(validated_data.get('name', 'category'))
        return super().create(validated_data)


class FlexibleImageField(serializers.Field):
    """
    Accepts both uploaded files and direct image URL strings.
    Gracefully handles local storage paths, Cloudinary URLs, and external web links.
    """
    def to_representation(self, value):
        if not value:
            return None
        val_str = str(value)
        if val_str.startswith('http://') or val_str.startswith('https://'):
            return val_str
        if hasattr(value, 'url'):
            try:
                return value.url
            except Exception:
                return val_str
        return val_str

    def to_internal_value(self, data):
        if not data:
            return ''
        if hasattr(data, 'read'):
            return data
        if isinstance(data, str):
            return data
        return str(data)


class ProductSerializer(serializers.ModelSerializer):
    image = FlexibleImageField(required=False, allow_null=True)
    profit_margin = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    profit_percentage = serializers.FloatField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    gallery_images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand', 'category', 'cost_price', 'selling_price',
            'price_visible', 'availability',
            'stock', 'barcode', 'supplier_name', 'image', 'gallery_images',
            'description', 'specifications', 'warranty_months',
            'is_featured', 'is_new_arrival', 'is_active',
            'profit_margin', 'profit_percentage', 'is_low_stock',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing products"""
    image = FlexibleImageField(required=False, allow_null=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'brand', 'category', 'selling_price', 'price_visible', 'availability', 'stock', 'barcode', 'image', 'is_featured', 'is_new_arrival', 'is_low_stock']


class PublicProductSerializer(serializers.ModelSerializer):
    """
    Public customer-facing serializer.
    Strictly enforces:
    - Confidential fields (cost_price, supplier_name, profit_margin) are excluded.
    - If price_visible is False, price is never exposed.
    """
    price = serializers.SerializerMethodField()
    gallery_images = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand', 'category', 'price', 'price_visible',
            'availability', 'stock', 'barcode', 'image', 'gallery_images',
            'description', 'specifications', 'warranty_months',
            'is_featured', 'is_new_arrival', 'created_at'
        ]

    def get_price(self, obj):
        if not obj.price_visible or obj.availability == 'on_request':
            return None
        return float(obj.selling_price)

    def get_gallery_images(self, obj):
        images = []
        if obj.image:
            img_url = obj.image.url if hasattr(obj.image, 'url') else str(obj.image)
            images.append(img_url)
        for img in obj.gallery_images.all():
            url = img.image.url if img.image else img.image_url
            if url and url not in images:
                images.append(url)
        return images


class ProductStockUpdateSerializer(serializers.Serializer):
    quantity = serializers.IntegerField()
    action = serializers.ChoiceField(choices=['add', 'subtract', 'set'])
