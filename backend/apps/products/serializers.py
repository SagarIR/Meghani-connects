from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    profit_margin = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    profit_percentage = serializers.FloatField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand', 'category', 'cost_price', 'selling_price',
            'price_visible', 'availability',
            'stock', 'barcode', 'supplier_name', 'image', 'description',
            'warranty_months', 'is_active', 'profit_margin', 'profit_percentage',
            'is_low_stock', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing products"""
    class Meta:
        model = Product
        fields = ['id', 'name', 'brand', 'category', 'selling_price', 'price_visible', 'availability', 'stock', 'barcode', 'image', 'is_low_stock']


class PublicProductSerializer(serializers.ModelSerializer):
    """
    Public customer-facing serializer.
    Strictly enforces:
    - Confidential fields (cost_price, supplier_name, profit_margin) are excluded.
    - If price_visible is False, price is never exposed.
    """
    price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand', 'category', 'price', 'price_visible',
            'availability', 'stock', 'barcode', 'image', 'description',
            'warranty_months', 'created_at'
        ]

    def get_price(self, obj):
        if not obj.price_visible or obj.availability == 'on_request':
            return None
        return float(obj.selling_price)


class ProductStockUpdateSerializer(serializers.Serializer):
    quantity = serializers.IntegerField()
    action = serializers.ChoiceField(choices=['add', 'subtract', 'set'])
