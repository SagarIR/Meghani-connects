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
            'stock', 'barcode', 'supplier_name', 'image', 'description',
            'warranty_months', 'is_active', 'profit_margin', 'profit_percentage',
            'is_low_stock', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing products"""
    class Meta:
        model = Product
        fields = ['id', 'name', 'brand', 'category', 'selling_price', 'stock', 'barcode', 'image', 'is_low_stock']


class ProductStockUpdateSerializer(serializers.Serializer):
    quantity = serializers.IntegerField()
    action = serializers.ChoiceField(choices=['add', 'subtract', 'set'])
