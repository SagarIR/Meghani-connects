from rest_framework import serializers
from .models import Expense, CashRegister


class ExpenseSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    payment_mode_display = serializers.CharField(source='get_payment_mode_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id', 'voucher_number', 'category', 'category_display', 'amount', 'tax_amount',
            'payment_mode', 'payment_mode_display', 'date', 'description', 'vendor_name',
            'gstin', 'receipt', 'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'voucher_number', 'created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['created_by'] = request.user
        return super().create(validated_data)


class ExpenseListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for expense lists"""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    payment_mode_display = serializers.CharField(source='get_payment_mode_display', read_only=True)

    class Meta:
        model = Expense
        fields = ['id', 'voucher_number', 'category', 'category_display', 'amount', 'payment_mode', 'payment_mode_display', 'date', 'vendor_name', 'description']


class CashRegisterSerializer(serializers.ModelSerializer):
    closed_by_name = serializers.CharField(source='closed_by.name', read_only=True)

    class Meta:
        model = CashRegister
        fields = [
            'id', 'register_date', 'opening_cash', 'cash_sales', 'cash_repairs',
            'cash_expenses', 'expected_closing_cash', 'actual_closing_cash',
            'variance', 'is_closed', 'closed_by', 'closed_by_name', 'closed_at',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'cash_sales', 'cash_repairs', 'cash_expenses',
            'expected_closing_cash', 'variance', 'closed_by', 'closed_at',
            'created_at', 'updated_at'
        ]


class CloseRegisterSerializer(serializers.Serializer):
    actual_closing_cash = serializers.DecimalField(max_digits=12, decimal_places=2)
    notes = serializers.CharField(required=False, allow_blank=True, default='')
