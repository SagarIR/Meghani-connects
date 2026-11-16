from django.contrib import admin
from .models import Product, ProductImage, Brand, Category


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'brand', 'category', 'selling_price', 'price_visible', 'stock', 'is_featured', 'is_new_arrival', 'is_active']
    list_filter = ['category', 'brand', 'price_visible', 'is_featured', 'is_new_arrival', 'is_active']
    search_fields = ['name', 'brand', 'barcode']
    list_editable = ['stock', 'price_visible', 'is_featured', 'is_new_arrival', 'is_active']
    ordering = ['-created_at']
    inlines = [ProductImageInline]
    
    fieldsets = (
        ('Basic Info', {'fields': ('name', 'brand', 'category', 'description')}),
        ('Pricing & Visibility', {'fields': ('cost_price', 'selling_price', 'price_visible', 'availability')}),
        ('Inventory', {'fields': ('stock', 'barcode', 'supplier_name')}),
        ('Specifications & Display', {'fields': ('specifications', 'is_featured', 'is_new_arrival')}),
        ('Media', {'fields': ('image',)}),
        ('Settings', {'fields': ('warranty_months', 'is_active')}),
    )


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ['name', 'country', 'established', 'is_featured', 'is_active', 'display_order']
    list_filter = ['is_featured', 'is_active']
    search_fields = ['name', 'country']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['is_featured', 'is_active', 'display_order']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active', 'display_order']
    list_filter = ['is_active']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['is_active', 'display_order']

