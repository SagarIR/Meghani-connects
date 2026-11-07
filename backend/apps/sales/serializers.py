from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from .models import Sale, SaleItem, Warranty
from apps.products.models import Product
from apps.crm.models import Customer


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_brand = serializers.CharField(source='product.brand', read_only=True)
    item_profit = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = SaleItem
        fields = ['id', 'product', 'product_name', 'product_brand', 'quantity', 'unit_price', 'cost_price', 'subtotal', 'item_profit']
        read_only_fields = ['cost_price', 'subtotal']


class SaleItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2)


class WarrantySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)

    class Meta:
        model = Warranty
        fields = ['id', 'product', 'product_name', 'customer', 'customer_name', 'warranty_months', 
                  'start_date', 'expiry_date', 'serial_number', 'is_expired', 'days_remaining']


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)

    class Meta:
        model = Sale
        fields = [
            'id', 'invoice_number', 'customer', 'customer_name', 'customer_phone',
            'total_amount', 'discount', 'tax', 'payment_mode', 'profit', 'notes',
            'sale_date', 'created_by', 'created_by_name', 'items'
        ]
        read_only_fields = ['invoice_number', 'profit', 'created_by']


class SaleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for sale lists"""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = ['id', 'invoice_number', 'customer_name', 'total_amount', 'payment_mode', 'sale_date', 'item_count']

    def get_item_count(self, obj):
        return obj.items.count()


class SaleCreateSerializer(serializers.Serializer):
    customer_id = serializers.IntegerField(required=False, allow_null=True)
    items = SaleItemCreateSerializer(many=True)
    discount = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_mode = serializers.ChoiceField(choices=Sale.PAYMENT_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required")
        return value

    @transaction.atomic
    def create(self, validated_data):
        user = self.context['request'].user
        items_data = validated_data.pop('items')
        customer_id = validated_data.pop('customer_id', None)
        
        # Get customer if provided
        customer = None
        if customer_id:
            try:
                customer = Customer.objects.get(id=customer_id)
            except Customer.DoesNotExist:
                raise serializers.ValidationError({'customer_id': 'Customer not found'})
        
        # Calculate totals
        total_amount = 0
        total_profit = 0
        sale_items = []
        
        for item_data in items_data:
            try:
                product = Product.objects.get(id=item_data['product_id'], is_active=True)
            except Product.DoesNotExist:
                raise serializers.ValidationError({'items': f"Product {item_data['product_id']} not found"})
            
            if product.stock < item_data['quantity']:
                raise serializers.ValidationError({'items': f"Insufficient stock for {product.name}"})
            
            subtotal = item_data['unit_price'] * item_data['quantity']
            item_profit = (item_data['unit_price'] - product.cost_price) * item_data['quantity']
            
            total_amount += subtotal
            total_profit += item_profit
            
            sale_items.append({
                'product': product,
                'quantity': item_data['quantity'],
                'unit_price': item_data['unit_price'],
                'cost_price': product.cost_price,
                'subtotal': subtotal,
            })
        
        # Apply discount
        discount = validated_data.get('discount', 0)
        total_amount -= discount
        total_profit -= discount
        
        # Add tax
        tax = validated_data.get('tax', 0)
        total_amount += tax
        
        # Create sale
        sale = Sale.objects.create(
            customer=customer,
            total_amount=total_amount,
            discount=discount,
            tax=tax,
            payment_mode=validated_data['payment_mode'],
            profit=total_profit,
            notes=validated_data.get('notes', ''),
            created_by=user,
        )
        
        # Create sale items and update stock
        for item in sale_items:
            product = item.pop('product')
            SaleItem.objects.create(sale=sale, product=product, **item)
            
            # Deduct stock
            product.stock -= item['quantity']
            product.save()
            
            # Create warranty if product has warranty
            if product.warranty_months > 0 and customer:
                start_date = timezone.now().date()
                expiry_date = start_date + relativedelta(months=product.warranty_months)
                Warranty.objects.create(
                    sale=sale,
                    product=product,
                    customer=customer,
                    warranty_months=product.warranty_months,
                    start_date=start_date,
                    expiry_date=expiry_date,
                )
        
        # Add loyalty points
        if customer:
            customer.add_loyalty_points(total_amount)
        
        return sale
