from rest_framework import serializers
from .models import Product, ProductImage, Brand, Category, Subcategory


class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'url', 'display_order']

    def get_url(self, obj):
        if obj.image:
            val_str = str(obj.image)
            if val_str.startswith(('http://', 'https://', '/')):
                return val_str
            return obj.image.url
        return obj.image_url


class SubcategorySerializer(serializers.ModelSerializer):
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    slug = serializers.SlugField(required=False, allow_blank=True)

    class Meta:
        model = Subcategory
        fields = [
            'id', 'category', 'category_slug', 'category_name', 'name', 'slug',
            'description', 'display_order', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        from django.utils.text import slugify
        if not validated_data.get('slug'):
            validated_data['slug'] = slugify(validated_data.get('name', 'subcat'))
        return super().create(validated_data)


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
        return Product.objects.filter(brand=obj, is_active=True).count()

    def create(self, validated_data):
        from django.utils.text import slugify
        if not validated_data.get('slug'):
            validated_data['slug'] = slugify(validated_data.get('name', 'brand'))
        return super().create(validated_data)


class CategorySerializer(serializers.ModelSerializer):
    count = serializers.SerializerMethodField()
    slug = serializers.SlugField(required=False, allow_blank=True)
    subcategories = SubcategorySerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'tagline', 'description', 'image_url',
            'features', 'is_active', 'count', 'display_order', 'subcategories'
        ]

    def get_count(self, obj):
        return Product.objects.filter(category=obj, is_active=True).count()

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
        if val_str.startswith(('http://', 'https://', '/')):
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
    brand_id = serializers.PrimaryKeyRelatedField(
        queryset=Brand.objects.all(), source='brand', required=False, allow_null=True
    )
    brand = serializers.SlugRelatedField(
        slug_field='name', queryset=Brand.objects.all(), required=False, allow_null=True
    )
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', required=False, allow_null=True
    )
    category = serializers.SlugRelatedField(
        slug_field='slug', queryset=Category.objects.all(), required=False, allow_null=True
    )
    subcategory_id = serializers.PrimaryKeyRelatedField(
        queryset=Subcategory.objects.all(), source='subcategory', required=False, allow_null=True
    )
    subcategory = serializers.SlugRelatedField(
        slug_field='slug', queryset=Subcategory.objects.all(), required=False, allow_null=True
    )
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True, default='')
    profit_margin = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    profit_percentage = serializers.FloatField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    gallery_images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'article_code', 'model_number', 'size',
            'name', 'brand', 'brand_id', 'category', 'category_id',
            'subcategory', 'subcategory_id', 'subcategory_name',
            'mrp', 'cost_price', 'selling_price',
            'hsn_code', 'tax_rate', 'unit',
            'price_visible', 'availability',
            'stock', 'barcode', 'supplier_name', 'image', 'gallery_images',
            'description', 'specifications', 'warranty_months',
            'is_featured', 'is_new_arrival', 'is_active',
            'profit_margin', 'profit_percentage', 'is_low_stock',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            is_admin = request.user.is_superuser or getattr(request.user, 'role', '') in ['admin', 'manager']
            if not is_admin and 'cost_price' in attrs:
                if self.instance:
                    attrs['cost_price'] = self.instance.cost_price
                else:
                    raise serializers.ValidationError({'cost_price': 'Permission denied: only managers can set cost price.'})

        selling_price = attrs.get('selling_price', getattr(self.instance, 'selling_price', None))
        cost_price = attrs.get('cost_price', getattr(self.instance, 'cost_price', None))
        mrp = attrs.get('mrp', getattr(self.instance, 'mrp', None))

        if cost_price is not None and cost_price < 0:
            raise serializers.ValidationError({'cost_price': 'Cost price cannot be negative.'})
        if selling_price is not None and selling_price < 0:
            raise serializers.ValidationError({'selling_price': 'Selling price cannot be negative.'})
        if mrp is not None and mrp < 0:
            raise serializers.ValidationError({'mrp': 'MRP cannot be negative.'})
        if selling_price is not None and mrp is not None and selling_price > mrp:
            raise serializers.ValidationError({'selling_price': 'Selling price cannot exceed MRP.'})

        # Validate subcategory matches category
        category = attrs.get('category', getattr(self.instance, 'category', None))
        subcategory = attrs.get('subcategory', getattr(self.instance, 'subcategory', None))
        if subcategory and category and subcategory.category_id != category.id:
            raise serializers.ValidationError({'subcategory': f'Subcategory {subcategory.name} does not belong to {category.name}.'})

        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            is_admin = request.user.is_superuser or getattr(request.user, 'role', '') in ['admin', 'manager']
            if not is_admin:
                data.pop('cost_price', None)
                data.pop('supplier_name', None)
                data.pop('profit_margin', None)
                data.pop('profit_percentage', None)
        return data


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing products"""
    image = FlexibleImageField(required=False, allow_null=True)
    brand = serializers.CharField(source='brand_name', read_only=True)
    category = serializers.CharField(source='category_slug_val', read_only=True)
    subcategory = serializers.CharField(source='subcategory_name', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'article_code', 'name', 'brand', 'category', 'subcategory',
            'mrp', 'selling_price', 'hsn_code', 'tax_rate', 'unit', 'price_visible', 'availability',
            'stock', 'barcode', 'image', 'is_featured', 'is_new_arrival', 'is_low_stock'
        ]


class PublicProductSerializer(serializers.ModelSerializer):
    """
    Public customer-facing serializer.
    Strictly enforces:
    - Confidential fields (cost_price, supplier_name, profit_margin) are excluded.
    - If price_visible is False, price is never exposed.
    """
    image = FlexibleImageField(required=False, allow_null=True)
    brand = serializers.CharField(source='brand_name', read_only=True)
    category = serializers.CharField(source='category_slug_val', read_only=True)
    subcategory = serializers.CharField(source='subcategory_name', read_only=True)
    price = serializers.SerializerMethodField()
    gallery_images = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'article_code', 'model_number', 'size', 'name', 'brand',
            'category', 'subcategory', 'unit', 'mrp', 'price', 'price_visible',
            'availability', 'barcode', 'image', 'gallery_images',
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
            val_str = str(obj.image)
            if val_str.startswith(('http://', 'https://', '/')):
                images.append(val_str)
            elif hasattr(obj.image, 'url'):
                try:
                    images.append(obj.image.url)
                except Exception:
                    images.append(val_str)
            else:
                images.append(val_str)
        for img in obj.gallery_images.all():
            if img.image_url:
                url = img.image_url
            elif img.image:
                img_str = str(img.image)
                url = img_str if img_str.startswith(('http://', 'https://', '/')) else img.image.url
            else:
                url = None
            if url and url not in images:
                images.append(url)
        return images


class ProductStockUpdateSerializer(serializers.Serializer):
    quantity = serializers.IntegerField()
    action = serializers.ChoiceField(choices=['add', 'subtract', 'set'])
