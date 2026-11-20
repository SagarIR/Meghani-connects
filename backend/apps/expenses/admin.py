from django.contrib import admin
from .models import Expense, CashRegister


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['voucher_number', 'category', 'amount', 'payment_mode', 'date', 'vendor_name', 'created_by']
    list_filter = ['category', 'payment_mode', 'date']
    search_fields = ['voucher_number', 'description', 'vendor_name', 'gstin']
    ordering = ['-date', '-created_at']
    readonly_fields = ['voucher_number', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Voucher Info', {'fields': ('voucher_number', 'category', 'amount', 'tax_amount', 'payment_mode', 'date')}),
        ('Vendor & Compliance', {'fields': ('vendor_name', 'gstin', 'description', 'receipt')}),
        ('Audit', {'fields': ('created_by', 'created_at', 'updated_at')}),
    )


@admin.register(CashRegister)
class CashRegisterAdmin(admin.ModelAdmin):
    list_display = [
        'register_date', 'opening_cash', 'cash_sales', 'cash_repairs',
        'cash_expenses', 'expected_closing_cash', 'actual_closing_cash',
        'variance', 'is_closed', 'closed_by'
    ]
    list_filter = ['is_closed', 'register_date']
    ordering = ['-register_date']
    readonly_fields = [
        'register_date', 'opening_cash', 'cash_sales', 'cash_repairs',
        'cash_expenses', 'expected_closing_cash', 'variance',
        'closed_by', 'closed_at', 'created_at', 'updated_at'
    ]
