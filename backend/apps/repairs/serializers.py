from rest_framework import serializers
from .models import Repair, RepairPart
from apps.crm.models import Customer
from apps.users.models import User
from apps.products.models import Product


class RepairPartSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_article_code = serializers.CharField(source='product.article_code', read_only=True)
    product_brand = serializers.CharField(source='product.brand', read_only=True)
    total_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_charge = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = RepairPart
        fields = [
            'id', 'repair', 'product', 'product_name', 'product_article_code',
            'product_brand', 'quantity', 'unit_cost', 'charge_to_customer',
            'total_cost', 'total_charge', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'repair', 'unit_cost', 'total_cost', 'total_charge', 'created_at']


class RepairSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    assigned_technician_name = serializers.CharField(source='assigned_technician.name', read_only=True)
    balance_due = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    days_in_repair = serializers.IntegerField(read_only=True)
    warranty_code = serializers.CharField(source='warranty.warranty_code', read_only=True)
    is_warranty_repair = serializers.BooleanField(read_only=True)
    service_type_display = serializers.CharField(source='get_service_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    parts_used = RepairPartSerializer(many=True, read_only=True)
    total_parts_charge = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Repair
        fields = [
            'id', 'ticket_number', 'customer', 'customer_name', 'customer_phone',
            'item_type', 'brand', 'model_number', 'serial_number', 'service_type', 'service_type_display',
            'warranty', 'warranty_code', 'is_warranty_repair', 'issue_description', 'diagnosis_notes',
            'estimated_cost', 'repair_charge', 'advance_paid', 'balance_due',
            'status', 'status_display', 'assigned_technician', 'assigned_technician_name', 'qc_passed',
            'received_date', 'expected_delivery', 'delivered_date',
            'days_in_repair', 'notes', 'parts_used', 'total_parts_charge',
            'created_by', 'created_by_name'
        ]
        read_only_fields = ['ticket_number', 'created_by', 'received_date', 'delivered_date']


class RepairListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for repair lists"""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    assigned_technician_name = serializers.CharField(source='assigned_technician.name', read_only=True)
    service_type_display = serializers.CharField(source='get_service_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Repair
        fields = [
            'id', 'ticket_number', 'customer_name', 'customer_phone', 'item_type',
            'brand', 'service_type', 'service_type_display', 'status', 'status_display',
            'assigned_technician', 'assigned_technician_name', 'qc_passed',
            'received_date', 'expected_delivery'
        ]


class RepairStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Repair.STATUS_CHOICES)
    repair_charge = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    notes = serializers.CharField(required=False, allow_blank=True)
    assigned_technician = serializers.IntegerField(required=False, allow_null=True)
    qc_passed = serializers.BooleanField(required=False)
    diagnosis_notes = serializers.CharField(required=False, allow_blank=True)
    service_type = serializers.CharField(required=False)


class RepairPartAddSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(default=1)
    charge_to_customer = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_product_id(self, value):
        try:
            return Product.objects.get(id=value)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product does not exist.")


class RepairCreateSerializer(serializers.ModelSerializer):
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all(), required=False)
    customer_id = serializers.IntegerField(write_only=True, required=False)
    customer_phone = serializers.CharField(write_only=True, required=False)
    customer_name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Repair
        fields = [
            'id', 'ticket_number', 'customer', 'customer_id', 'customer_phone', 'customer_name',
            'item_type', 'brand', 'model_number', 'serial_number', 'service_type', 'warranty',
            'issue_description', 'diagnosis_notes', 'estimated_cost', 'repair_charge', 'advance_paid',
            'assigned_technician', 'expected_delivery', 'notes', 'status'
        ]
        read_only_fields = ['id', 'ticket_number', 'status']

    def validate(self, data):
        # Support customer_id if provided
        if not data.get('customer') and data.get('customer_id'):
            cid = data.pop('customer_id')
            try:
                data['customer'] = Customer.objects.get(id=cid)
            except Customer.DoesNotExist:
                raise serializers.ValidationError({'customer': 'Customer not found'})
        elif data.get('customer_id'):
            data.pop('customer_id', None)

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
