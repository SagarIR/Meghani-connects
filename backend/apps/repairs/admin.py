from django.contrib import admin
from .models import Repair, RepairPart


class RepairPartInline(admin.TabularInline):
    model = RepairPart
    extra = 0
    readonly_fields = ['created_at', 'total_cost', 'total_charge']
    fields = ['product', 'quantity', 'unit_cost', 'charge_to_customer', 'total_cost', 'total_charge', 'notes', 'created_at']


@admin.register(Repair)
class RepairAdmin(admin.ModelAdmin):
    list_display = ['ticket_number', 'customer', 'item_type', 'brand', 'service_type', 'assigned_technician', 'status', 'qc_passed', 'received_date', 'expected_delivery']
    list_filter = ['status', 'service_type', 'qc_passed', 'received_date', 'expected_delivery']
    search_fields = ['ticket_number', 'customer__name', 'customer__phone', 'item_type', 'brand', 'assigned_technician__name']
    list_editable = ['status']
    ordering = ['-received_date']
    readonly_fields = ['ticket_number', 'received_date', 'delivered_date']
    inlines = [RepairPartInline]
    
    fieldsets = (
        ('Ticket Info', {'fields': ('ticket_number', 'customer', 'created_by', 'assigned_technician')}),
        ('Item Details', {'fields': ('item_type', 'brand', 'model_number', 'serial_number', 'service_type', 'warranty')}),
        ('Diagnosis & Quality Control', {'fields': ('issue_description', 'diagnosis_notes', 'qc_passed', 'notes')}),
        ('Charges & Parts', {'fields': ('estimated_cost', 'repair_charge', 'advance_paid')}),
        ('Status', {'fields': ('status', 'received_date', 'expected_delivery', 'delivered_date')}),
    )


@admin.register(RepairPart)
class RepairPartAdmin(admin.ModelAdmin):
    list_display = ['repair', 'product', 'quantity', 'unit_cost', 'charge_to_customer', 'created_at']
    search_fields = ['repair__ticket_number', 'product__name', 'product__article_code']
    list_filter = ['created_at']
