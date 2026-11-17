from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from decimal import Decimal
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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            is_admin = request.user.is_superuser or getattr(request.user, 'role', '') in ['admin', 'manager']
            if not is_admin:
                data.pop('cost_price', None)
                data.pop('item_profit', None)
        return data


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
            'total_amount', 'discount', 'tax', 'payment_mode', 'payment_details', 'profit', 'notes',
            'sale_date', 'created_by', 'created_by_name', 'items'
        ]
        read_only_fields = ['invoice_number', 'profit', 'created_by']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            is_admin = request.user.is_superuser or getattr(request.user, 'role', '') in ['admin', 'manager']
            if not is_admin:
                data.pop('profit', None)
        return data


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
    payment_details = serializers.DictField(child=serializers.DecimalField(max_digits=10, decimal_places=2), required=False, default=dict)
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
        total_amount = Decimal('0.00')
        total_profit = Decimal('0.00')
        sale_items = []
        
        for item_data in items_data:
            try:
                product = Product.objects.select_for_update().get(id=item_data['product_id'], is_active=True)
            except Product.DoesNotExist:
                raise serializers.ValidationError({'items': f"Product {item_data['product_id']} not found"})
            
            if product.stock < item_data['quantity']:
                raise serializers.ValidationError({'items': f"Insufficient stock for {product.name} (available: {product.stock})"})
            
            # Authoritative server price verification
            unit_price = item_data.get('unit_price')
            if unit_price is None or Decimal(str(unit_price)) <= 0:
                unit_price = product.selling_price
            else:
                unit_price = Decimal(str(unit_price))
            
            subtotal = unit_price * item_data['quantity']
            item_profit = (unit_price - product.cost_price) * item_data['quantity']
            
            total_amount += subtotal
            total_profit += item_profit
            
            sale_items.append({
                'product': product,
                'quantity': item_data['quantity'],
                'unit_price': unit_price,
                'cost_price': product.cost_price,
                'subtotal': subtotal,
            })
        
        # Validate and apply discount & tax
        discount = Decimal(str(validated_data.get('discount', 0)))
        tax = Decimal(str(validated_data.get('tax', 0)))
        
        if discount < 0:
            raise serializers.ValidationError({'discount': 'Discount amount cannot be negative'})
        if discount > total_amount:
            raise serializers.ValidationError({'discount': f'Discount (₹{discount}) cannot exceed subtotal (₹{total_amount})'})
        if tax < 0:
            raise serializers.ValidationError({'tax': 'Tax amount cannot be negative'})
        
        final_total = total_amount - discount + tax
        final_profit = total_profit - discount

        # Payment Mode & Split Payment Validation
        payment_mode = validated_data['payment_mode']
        raw_payment_details = validated_data.get('payment_details') or {}
        cleaned_payment_details = {}

        if payment_mode == 'mixed':
            if not raw_payment_details:
                raise serializers.ValidationError({
                    'payment_details': "Split payment breakdown is required when payment mode is 'mixed'."
                })
            
            allowed_methods = {'cash', 'upi', 'card'}
            split_sum = Decimal('0.00')
            positive_count = 0

            for method, amount in raw_payment_details.items():
                m_key = str(method).lower().strip()
                if m_key not in allowed_methods:
                    raise serializers.ValidationError({
                        'payment_details': f"Unsupported payment method '{method}'. Allowed methods: cash, upi, card."
                    })
                try:
                    dec_amt = Decimal(str(amount))
                except Exception:
                    raise serializers.ValidationError({
                        'payment_details': f"Invalid amount for payment method '{method}'."
                    })
                
                if dec_amt < 0:
                    raise serializers.ValidationError({
                        'payment_details': f"Amount for '{method}' cannot be negative."
                    })
                if dec_amt > 0:
                    positive_count += 1
                    split_sum += dec_amt
                    cleaned_payment_details[m_key] = float(dec_amt)
            
            if positive_count < 2:
                raise serializers.ValidationError({
                    'payment_details': "Split payment requires at least two payment methods with amounts greater than zero."
                })
            
            if split_sum != final_total:
                raise serializers.ValidationError({
                    'payment_details': f"Sum of split payments (₹{split_sum:,.2f}) must equal final total (₹{final_total:,.2f})."
                })
        else:
            # Single payment mode defaults to the final total
            cleaned_payment_details = {payment_mode: float(final_total)}
        
        # Create sale
        sale = Sale.objects.create(
            customer=customer,
            total_amount=final_total,
            discount=discount,
            tax=tax,
            payment_mode=payment_mode,
            payment_details=cleaned_payment_details,
            profit=final_profit,
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
            customer.add_loyalty_points(final_total)
        
        return sale
