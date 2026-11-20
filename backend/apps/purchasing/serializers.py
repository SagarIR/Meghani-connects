from decimal import Decimal
from rest_framework import serializers
from apps.products.models import Product
from .models import (
    Supplier, ProductSupplier, PurchaseOrder, PurchaseOrderItem,
    GoodsReceipt, GoodsReceiptItem, StockMovement
)
from .services import PurchasingService, InventoryService


class SupplierSerializer(serializers.ModelSerializer):
    products_count = serializers.SerializerMethodField()
    active_pos_count = serializers.SerializerMethodField()

    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'contact_person', 'phone', 'email', 'address',
            'gstin', 'payment_terms', 'opening_balance', 'notes', 'is_active',
            'products_count', 'active_pos_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_products_count(self, obj):
        return obj.product_links.count()

    def get_active_pos_count(self, obj):
        return obj.purchase_orders.filter(status__in=['ordered', 'partially_received']).count()


class ProductSupplierSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_brand = serializers.CharField(source='product.brand_name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)

    class Meta:
        model = ProductSupplier
        fields = [
            'id', 'product', 'product_name', 'product_brand', 'supplier',
            'supplier_name', 'supplier_sku', 'last_cost_price', 'lead_time_days',
            'is_preferred', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_brand = serializers.CharField(source='product.brand_name', read_only=True)
    product_article_code = serializers.CharField(source='product.article_code', read_only=True)
    pending_quantity = serializers.IntegerField(read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = [
            'id', 'product', 'product_name', 'product_brand', 'product_article_code',
            'ordered_quantity', 'received_quantity', 'pending_quantity',
            'unit_cost', 'discount_percent', 'tax_rate', 'subtotal'
        ]
        read_only_fields = ['id', 'received_quantity', 'subtotal']


class PurchaseOrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    ordered_quantity = serializers.IntegerField(min_value=1)
    unit_cost = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))
    discount_percent = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, default=Decimal('0.00'))
    tax_rate = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, default=Decimal('18.00'))


class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    items = PurchaseOrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'order_number', 'supplier', 'supplier_name', 'status',
            'status_display', 'order_date', 'expected_delivery_date',
            'supplier_invoice_number', 'supplier_invoice_date',
            'subtotal', 'tax_amount', 'discount_amount', 'total_amount',
            'created_by_name', 'notes', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'subtotal', 'tax_amount', 'discount_amount',
            'total_amount', 'created_at', 'updated_at'
        ]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return getattr(obj.created_by, 'name', '') or obj.created_by.username
        return 'System'


class PurchaseOrderCreateSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemCreateSerializer(many=True, write_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'supplier', 'status', 'expected_delivery_date',
            'supplier_invoice_number', 'supplier_invoice_date',
            'notes', 'items'
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') else None

        from django.db import transaction
        with transaction.atomic():
            po = PurchaseOrder.objects.create(
                created_by=user if (user and user.is_authenticated) else None,
                **validated_data
            )
            for item in items_data:
                product = Product.objects.get(id=item['product_id'])
                PurchaseOrderItem.objects.create(
                    purchase_order=po,
                    product=product,
                    ordered_quantity=item['ordered_quantity'],
                    unit_cost=item['unit_cost'],
                    discount_percent=item.get('discount_percent', Decimal('0.00')),
                    tax_rate=item.get('tax_rate', Decimal('18.00'))
                )
            po.recalculate_totals()
            return po


class GoodsReceiptItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = GoodsReceiptItem
        fields = [
            'id', 'purchase_order_item', 'product', 'product_name',
            'quantity_received', 'unit_cost', 'batch_number', 'notes'
        ]
        read_only_fields = ['id']


class GoodsReceiptSerializer(serializers.ModelSerializer):
    purchase_order_number = serializers.CharField(source='purchase_order.order_number', read_only=True)
    supplier_name = serializers.CharField(source='purchase_order.supplier.name', read_only=True)
    received_by_name = serializers.SerializerMethodField()
    items = GoodsReceiptItemSerializer(many=True, read_only=True)

    class Meta:
        model = GoodsReceipt
        fields = [
            'id', 'receipt_number', 'purchase_order', 'purchase_order_number',
            'supplier_name', 'received_by_name', 'received_at',
            'supplier_delivery_note', 'notes', 'items', 'created_at'
        ]
        read_only_fields = ['id', 'receipt_number', 'created_at']

    def get_received_by_name(self, obj):
        if obj.received_by:
            return getattr(obj.received_by, 'name', '') or obj.received_by.username
        return 'Staff'


class ReceiveGoodsItemSerializer(serializers.Serializer):
    purchase_order_item_id = serializers.IntegerField()
    quantity_received = serializers.IntegerField(min_value=1)
    batch_number = serializers.CharField(required=False, allow_blank=True, default='')
    notes = serializers.CharField(required=False, allow_blank=True, default='')


class GoodsReceiptCreateSerializer(serializers.Serializer):
    supplier_delivery_note = serializers.CharField(required=False, allow_blank=True, default='')
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    items = ReceiveGoodsItemSerializer(many=True)


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_brand = serializers.CharField(source='product.brand_name', read_only=True)
    product_article_code = serializers.CharField(source='product.article_code', read_only=True)
    movement_type_display = serializers.CharField(source='get_movement_type_display', read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StockMovement
        fields = [
            'id', 'product', 'product_name', 'product_brand', 'product_article_code',
            'movement_type', 'movement_type_display', 'quantity_in', 'quantity_out',
            'previous_balance', 'resulting_balance', 'reference_id', 'reason',
            'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'previous_balance', 'resulting_balance', 'created_at']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return getattr(obj.created_by, 'name', '') or obj.created_by.username
        return 'System'
