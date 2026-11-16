from rest_framework import serializers
from .models import Customer, Enquiry


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


class EnquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Enquiry
        fields = [
            'id', 'name', 'phone', 'email', 'enquiry_type', 'preferred_date',
            'product', 'product_name', 'message', 'status', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

