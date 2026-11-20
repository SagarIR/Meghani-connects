from django.contrib import admin
from .models import Customer, Enquiry, LoyaltyTransaction


class LoyaltyTransactionInline(admin.TabularInline):
    model = LoyaltyTransaction
    extra = 0
    readonly_fields = ['transaction_type', 'points', 'balance_after', 'reference_id', 'reason', 'created_at']

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'city', 'email', 'loyalty_points', 'date_of_birth', 'anniversary_date', 'created_at']
    list_filter = ['language_preference', 'city', 'created_at']
    search_fields = ['name', 'phone', 'email', 'gstin']
    ordering = ['-created_at']
    inlines = [LoyaltyTransactionInline]
    
    fieldsets = (
        ('Basic Info', {'fields': ('name', 'phone', 'email', 'city', 'gstin')}),
        ('Details', {'fields': ('address', 'date_of_birth', 'anniversary_date', 'language_preference')}),
        ('Loyalty', {'fields': ('loyalty_points', 'notes')}),
    )


@admin.register(LoyaltyTransaction)
class LoyaltyTransactionAdmin(admin.ModelAdmin):
    list_display = ['customer', 'transaction_type', 'points', 'balance_after', 'reference_id', 'created_at']
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['customer__name', 'customer__phone', 'reference_id', 'reason']
    ordering = ['-created_at']
    readonly_fields = ['customer', 'transaction_type', 'points', 'balance_after', 'reference_id', 'reason', 'created_by', 'created_at']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Enquiry)
class EnquiryAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'enquiry_type', 'preferred_date', 'product_name', 'status', 'created_at']
    list_filter = ['enquiry_type', 'status', 'created_at']
    search_fields = ['name', 'phone', 'email', 'product_name']
    list_editable = ['status']
    ordering = ['-created_at']
