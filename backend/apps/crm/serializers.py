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

    def validate_name(self, value):
        val = (value or '').strip()
        if len(val) < 2:
            raise serializers.ValidationError("Name must be at least 2 characters.")
        return val

    def validate_phone(self, value):
        import re
        cleaned = re.sub(r'[\s\-\(\)]', '', (value or '').strip())
        if not re.match(r'^\+?[0-9]{8,15}$', cleaned):
            raise serializers.ValidationError("Please provide a valid contact number (8 to 15 digits).")
        return cleaned

    def create(self, validated_data):
        from django.utils import timezone
        from datetime import timedelta
        phone = validated_data.get('phone', '')
        enquiry_type = validated_data.get('enquiry_type', 'viewing')
        recent_threshold = timezone.now() - timedelta(seconds=60)
        existing = Enquiry.objects.filter(
            phone=phone,
            enquiry_type=enquiry_type,
            created_at__gte=recent_threshold
        ).first()
        if existing:
            return existing
        return super().create(validated_data)

