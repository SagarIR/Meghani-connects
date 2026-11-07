from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'brand', 'category', 'selling_price', 'stock', 'barcode', 'is_active']
    list_filter = ['category', 'brand', 'is_active']
    search_fields = ['name', 'brand', 'barcode']
    list_editable = ['stock', 'is_active']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Info', {'fields': ('name', 'brand', 'category', 'description')}),
        ('Pricing', {'fields': ('cost_price', 'selling_price')}),
        ('Inventory', {'fields': ('stock', 'barcode', 'supplier_name')}),
        ('Media', {'fields': ('image',)}),
        ('Settings', {'fields': ('warranty_months', 'is_active')}),
    )
