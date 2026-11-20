from django.contrib import admin
from .models import Sale, SaleItem, SaleReturn, SaleReturnItem, Warranty, WarrantyClaim


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ['subtotal', 'returned_quantity', 'returnable_quantity']


class SaleReturnItemInline(admin.TabularInline):
    model = SaleReturnItem
    extra = 0
    readonly_fields = ['sale_item', 'product', 'quantity', 'refund_amount', 'condition']


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'customer', 'total_amount', 'profit', 'payment_mode', 'sale_date']
    list_filter = ['payment_mode', 'sale_date']
    search_fields = ['invoice_number', 'customer__name', 'customer__phone']
    ordering = ['-sale_date']
    readonly_fields = ['invoice_number', 'profit']
    inlines = [SaleItemInline]
    
    fieldsets = (
        ('Invoice Info', {'fields': ('invoice_number', 'customer', 'sale_date')}),
        ('Amounts', {'fields': ('total_amount', 'discount', 'tax', 'profit')}),
        ('Payment', {'fields': ('payment_mode', 'notes')}),
        ('Staff', {'fields': ('created_by',)}),
    )


@admin.register(SaleReturn)
class SaleReturnAdmin(admin.ModelAdmin):
    list_display = ['return_number', 'sale', 'customer', 'refund_amount', 'refund_mode', 'status', 'created_at']
    list_filter = ['status', 'refund_mode', 'created_at']
    search_fields = ['return_number', 'sale__invoice_number', 'customer__name', 'reason']
    ordering = ['-created_at']
    readonly_fields = ['return_number', 'created_at', 'updated_at']
    inlines = [SaleReturnItemInline]


class WarrantyClaimInline(admin.TabularInline):
    model = WarrantyClaim
    extra = 0
    readonly_fields = ['claim_number', 'claim_date', 'status', 'covered_amount']


@admin.register(Warranty)
class WarrantyAdmin(admin.ModelAdmin):
    list_display = ['warranty_code', 'product', 'customer', 'status', 'start_date', 'expiry_date', 'notified']
    list_filter = ['status', 'notified', 'expiry_date']
    search_fields = ['warranty_code', 'product__name', 'customer__name', 'customer__phone', 'serial_number']
    ordering = ['expiry_date']
    readonly_fields = ['warranty_code', 'created_at', 'updated_at']
    inlines = [WarrantyClaimInline]


@admin.register(WarrantyClaim)
class WarrantyClaimAdmin(admin.ModelAdmin):
    list_display = ['claim_number', 'warranty', 'status', 'claim_date', 'covered_amount', 'created_by']
    list_filter = ['status', 'claim_date']
    search_fields = ['claim_number', 'warranty__warranty_code', 'warranty__customer__name', 'issue_description']
    ordering = ['-claim_date']
    readonly_fields = ['claim_number', 'created_at', 'updated_at']
