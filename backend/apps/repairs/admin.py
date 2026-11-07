from django.contrib import admin
from .models import Repair


@admin.register(Repair)
class RepairAdmin(admin.ModelAdmin):
    list_display = ['ticket_number', 'customer', 'item_type', 'brand', 'status', 'received_date', 'expected_delivery']
    list_filter = ['status', 'received_date', 'expected_delivery']
    search_fields = ['ticket_number', 'customer__name', 'customer__phone', 'item_type', 'brand']
    list_editable = ['status']
    ordering = ['-received_date']
    readonly_fields = ['ticket_number', 'received_date']
    
    fieldsets = (
        ('Ticket Info', {'fields': ('ticket_number', 'customer', 'created_by')}),
        ('Item Details', {'fields': ('item_type', 'brand', 'model_number', 'serial_number')}),
        ('Issue', {'fields': ('issue_description', 'notes')}),
        ('Charges', {'fields': ('estimated_cost', 'repair_charge', 'advance_paid')}),
        ('Status', {'fields': ('status', 'received_date', 'expected_delivery', 'delivered_date')}),
    )
