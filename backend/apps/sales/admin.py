from django.contrib import admin
from .models import Sale, SaleItem, Warranty


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ['subtotal']


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


@admin.register(Warranty)
class WarrantyAdmin(admin.ModelAdmin):
    list_display = ['product', 'customer', 'start_date', 'expiry_date', 'notified']
    list_filter = ['notified', 'expiry_date']
    search_fields = ['product__name', 'customer__name', 'customer__phone', 'serial_number']
    ordering = ['expiry_date']
