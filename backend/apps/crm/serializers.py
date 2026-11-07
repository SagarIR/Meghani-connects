from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    total_purchases = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    purchase_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'phone', 'email', 'address', 'date_of_birth',
            'language_preference', 'loyalty_points', 'notes',
            'total_purchases', 'purchase_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'loyalty_points', 'created_at', 'updated_at']


class CustomerListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for customer lists"""
    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'loyalty_points']


class CustomerLoyaltySerializer(serializers.Serializer):
    points = serializers.IntegerField(min_value=1)
    action = serializers.ChoiceField(choices=['add', 'redeem'])
