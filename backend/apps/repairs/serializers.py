from rest_framework import serializers
from .models import Repair
from apps.crm.models import Customer


class RepairSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    balance_due = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    days_in_repair = serializers.IntegerField(read_only=True)

    class Meta:
        model = Repair
        fields = [
            'id', 'ticket_number', 'customer', 'customer_name', 'customer_phone',
            'item_type', 'brand', 'model_number', 'serial_number', 'issue_description',
            'estimated_cost', 'repair_charge', 'advance_paid', 'balance_due',
            'status', 'received_date', 'expected_delivery', 'delivered_date',
            'days_in_repair', 'notes', 'created_by', 'created_by_name'
        ]
        read_only_fields = ['ticket_number', 'created_by', 'received_date', 'delivered_date']


class RepairListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for repair lists"""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)

    class Meta:
        model = Repair
        fields = ['id', 'ticket_number', 'customer_name', 'customer_phone', 'item_type', 'status', 'received_date', 'expected_delivery']


class RepairStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Repair.STATUS_CHOICES)
    repair_charge = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    notes = serializers.CharField(required=False, allow_blank=True)


class RepairCreateSerializer(serializers.ModelSerializer):
    customer_phone = serializers.CharField(write_only=True, required=False)
    customer_name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Repair
        fields = [
            'customer', 'customer_phone', 'customer_name',
            'item_type', 'brand', 'model_number', 'serial_number',
            'issue_description', 'estimated_cost', 'advance_paid',
            'expected_delivery', 'notes'
        ]

    def validate(self, data):
        # If customer not provided, try to find/create by phone
        if not data.get('customer') and data.get('customer_phone'):
            phone = data.pop('customer_phone')
            name = data.pop('customer_name', 'Walk-in Customer')
            customer, _ = Customer.objects.get_or_create(
                phone=phone,
                defaults={'name': name}
            )
            data['customer'] = customer
        elif data.get('customer_phone'):
            data.pop('customer_phone', None)
            data.pop('customer_name', None)
        
        if not data.get('customer'):
            raise serializers.ValidationError({'customer': 'Customer is required'})
        
        return data

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
