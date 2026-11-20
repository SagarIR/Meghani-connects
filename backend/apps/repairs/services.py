from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.purchasing.services import InventoryService
from .models import Repair, RepairPart


class RepairService:
    """
    Business service layer for atelier repairs, status lifecycle progression,
    technician assignment, and inventory-deducted spare parts consumption.
    """

    @staticmethod
    @transaction.atomic
    def add_spare_part(repair: Repair, product, quantity: int = 1, charge_to_customer: Decimal = None, user=None, notes: str = ''):
        """
        Consumes spare parts or consumables from catalog and records an immutable
        StockMovement in the inventory ledger.
        """
        if quantity <= 0:
            raise ValidationError("Quantity of spare parts consumed must be greater than zero.")

        if product.stock < quantity:
            raise ValidationError(f"Insufficient stock for {product.name}. Current stock: {product.stock}, requested: {quantity}.")

        unit_cost = product.cost_price or Decimal('0.00')
        if charge_to_customer is None:
            charge_to_customer = product.selling_price or Decimal('0.00')

        # 1. Deduct from inventory ledger
        InventoryService.record_movement(
            product_or_id=product,
            movement_type='repair_part_used',
            qty_out=quantity,
            reference_id=repair.ticket_number,
            reason=f"Atelier repair part consumed: {product.name} ({quantity} units) for ticket {repair.ticket_number}",
            user=user
        )

        # 2. Record RepairPart
        repair_part = RepairPart.objects.create(
            repair=repair,
            product=product,
            quantity=quantity,
            unit_cost=unit_cost,
            charge_to_customer=charge_to_customer,
            notes=notes
        )

        # 3. Update repair total charge if repair_charge is unset or needs update
        if repair.repair_charge is not None:
            repair.repair_charge = repair.repair_charge + (charge_to_customer * quantity)
            repair.save(update_fields=['repair_charge'])

        return repair_part

    @staticmethod
    @transaction.atomic
    def remove_spare_part(repair_part: RepairPart, user=None):
        """
        Reverses spare part consumption, returning units to catalog stock via
        an immutable StockMovement ledger entry.
        """
        product = repair_part.product
        quantity = repair_part.quantity
        repair = repair_part.repair

        # 1. Return stock in inventory ledger
        InventoryService.record_movement(
            product_or_id=product,
            movement_type='repair_part_returned',
            qty_in=quantity,
            reference_id=repair.ticket_number,
            reason=f"Atelier repair part returned: {product.name} ({quantity} units) from ticket {repair.ticket_number}",
            user=user
        )

        # 2. Adjust repair charge if set
        if repair.repair_charge is not None:
            deduction = repair_part.charge_to_customer * quantity
            repair.repair_charge = max(Decimal('0.00'), repair.repair_charge - deduction)
            repair.save(update_fields=['repair_charge'])

        # 3. Delete RepairPart record
        part_id = repair_part.id
        repair_part.delete()
        return part_id

    @staticmethod
    @transaction.atomic
    def transition_status(
        repair: Repair,
        new_status: str,
        notes: str = '',
        repair_charge: Decimal = None,
        assigned_technician=None,
        qc_passed: bool = None,
        service_type: str = None,
        diagnosis_notes: str = None,
        user=None
    ):
        """
        Transitions a repair job through the workshop lifecycle.
        """
        old_status = repair.status
        valid_statuses = [s[0] for s in Repair.STATUS_CHOICES]
        if new_status not in valid_statuses:
            raise ValidationError(f"Invalid status '{new_status}'. Allowed choices: {valid_statuses}")

        repair.status = new_status

        if repair_charge is not None:
            repair.repair_charge = repair_charge

        if assigned_technician is not None:
            repair.assigned_technician = assigned_technician

        if qc_passed is not None:
            repair.qc_passed = qc_passed

        if service_type is not None:
            repair.service_type = service_type

        if diagnosis_notes is not None:
            repair.diagnosis_notes = diagnosis_notes

        if notes:
            timestamp = timezone.now().strftime('%Y-%m-%d %H:%M')
            author = user.name if user and hasattr(user, 'name') and user.name else (user.username if user else 'System')
            entry = f"[{timestamp} - {author}] {notes}"
            repair.notes = f"{repair.notes}\n{entry}".strip() if repair.notes else entry

        if new_status == 'delivered' and not repair.delivered_date:
            repair.delivered_date = timezone.now()

        repair.save()
        return repair, old_status
