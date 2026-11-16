from django.contrib import admin
from .models import Customer, Enquiry


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email', 'loyalty_points', 'date_of_birth', 'created_at']
    list_filter = ['language_preference', 'created_at']
    search_fields = ['name', 'phone', 'email']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Info', {'fields': ('name', 'phone', 'email')}),
        ('Details', {'fields': ('address', 'date_of_birth', 'language_preference')}),
        ('Loyalty', {'fields': ('loyalty_points', 'notes')}),
    )


@admin.register(Enquiry)
class EnquiryAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'enquiry_type', 'preferred_date', 'product_name', 'status', 'created_at']
    list_filter = ['enquiry_type', 'status', 'created_at']
    search_fields = ['name', 'phone', 'email', 'product_name']
    list_editable = ['status']
    ordering = ['-created_at']

