from django.contrib import admin
from .models import Expense


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['category', 'amount', 'date', 'vendor_name', 'created_by']
    list_filter = ['category', 'date']
    search_fields = ['description', 'vendor_name']
    ordering = ['-date', '-created_at']
    
    fieldsets = (
        ('Expense Details', {'fields': ('category', 'amount', 'date')}),
        ('Additional Info', {'fields': ('description', 'vendor_name', 'receipt')}),
        ('Created By', {'fields': ('created_by',)}),
    )
