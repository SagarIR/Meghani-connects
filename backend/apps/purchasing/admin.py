from django.contrib import admin
from .models import (
    Supplier, ProductSupplier, PurchaseOrder, PurchaseOrderItem,
    GoodsReceipt, GoodsReceiptItem, StockMovement
)


class ProductSupplierInline(admin.TabularInline):
    model = ProductSupplier
    extra = 1


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'supplier_type', 'contact_person', 'phone', 'email', 'gstin', 'is_active', 'created_at')
    search_fields = ('name', 'contact_person', 'phone', 'email', 'gstin')
    list_filter = ('supplier_type', 'is_active', 'created_at')
    inlines = [ProductSupplierInline]


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 0
    readonly_fields = ('subtotal',)


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'supplier', 'status', 'order_date', 'total_amount', 'created_by')
    search_fields = ('order_number', 'supplier__name', 'supplier_invoice_number')
    list_filter = ('status', 'order_date')
    readonly_fields = ('order_number', 'subtotal', 'tax_amount', 'discount_amount', 'total_amount', 'created_at', 'updated_at')
    inlines = [PurchaseOrderItemInline]


class GoodsReceiptItemInline(admin.TabularInline):
    model = GoodsReceiptItem
    extra = 0
    readonly_fields = ('product', 'quantity_received', 'unit_cost', 'batch_number')


@admin.register(GoodsReceipt)
class GoodsReceiptAdmin(admin.ModelAdmin):
    list_display = ('receipt_number', 'purchase_order', 'received_by', 'received_at')
    search_fields = ('receipt_number', 'purchase_order__order_number', 'supplier_delivery_note')
    list_filter = ('received_at',)
    readonly_fields = ('receipt_number', 'received_at', 'created_at')
    inlines = [GoodsReceiptItemInline]


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = (
        'product', 'movement_type', 'quantity_in', 'quantity_out',
        'previous_balance', 'resulting_balance', 'reference_id', 'created_at'
    )
    search_fields = ('product__name', 'product__article_code', 'reference_id', 'reason')
    list_filter = ('movement_type', 'created_at')
    readonly_fields = (
        'product', 'movement_type', 'quantity_in', 'quantity_out',
        'previous_balance', 'resulting_balance', 'reference_id', 'reason',
        'created_by', 'created_at'
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
