from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from .models import Sale, SaleItem, SaleReturn, SaleReturnItem, Warranty, WarrantyClaim
from apps.purchasing.services import InventoryService


class SaleReturnService:
    """
    Transactional service orchestrating customer returns and refunds.
    Enforces item returnable quantity limits, handles condition-based
    inventory ledger entries, adjusts warranties, and manages loyalty points.
    """

    @classmethod
    def process_return(cls, sale_or_id, items_data: list, refund_mode: str = 'cash',
                       reason: str = '', user=None) -> SaleReturn:
        if not items_data:
            raise ValidationError({'items': 'At least one item must be specified for return.'})

        if not reason.strip():
            raise ValidationError({'reason': 'A documented reason is mandatory for returns.'})

        sale_id = sale_or_id.id if hasattr(sale_or_id, 'id') else sale_or_id

        with transaction.atomic():
            sale = Sale.objects.select_for_update().get(id=sale_id)

            total_refund = Decimal('0.00')
            processed_items = []

            for spec in items_data:
                sale_item_id = spec.get('sale_item_id') or spec.get('item_id')
                qty = int(spec.get('quantity', 1))
                condition = spec.get('condition', 'resellable')
                notes = spec.get('notes', '')

                if qty <= 0:
                    continue

                try:
                    sale_item = SaleItem.objects.select_for_update().get(id=sale_item_id, sale=sale)
                except SaleItem.DoesNotExist:
                    raise ValidationError({'items': f"Sale item {sale_item_id} does not belong to Invoice #{sale.invoice_number}."})

                returnable = sale_item.returnable_quantity
                if qty > returnable:
                    raise ValidationError({
                        'quantity': f"Cannot return {qty} units of '{sale_item.product.name}'. Maximum returnable quantity is {returnable}."
                    })

                # Calculate item refund amount (default to unit_price * qty if not customized)
                refund_amt = spec.get('refund_amount')
                if refund_amt is not None:
                    refund_amt = Decimal(str(refund_amt))
                else:
                    refund_amt = sale_item.unit_price * qty

                total_refund += refund_amt
                processed_items.append({
                    'sale_item': sale_item,
                    'product': sale_item.product,
                    'quantity': qty,
                    'refund_amount': refund_amt,
                    'condition': condition,
                    'notes': notes
                })

            if not processed_items:
                raise ValidationError({'items': 'No valid return items found.'})

            # Create the master SaleReturn record
            sale_return = SaleReturn.objects.create(
                sale=sale,
                customer=sale.customer,
                refund_amount=total_refund,
                refund_mode=refund_mode,
                reason=reason.strip(),
                status='completed',
                created_by=user if (user and getattr(user, 'is_authenticated', False)) else None
            )

            for item_spec in processed_items:
                sale_item = item_spec['sale_item']
                product = item_spec['product']
                qty = item_spec['quantity']
                condition = item_spec['condition']

                SaleReturnItem.objects.create(
                    sale_return=sale_return,
                    sale_item=sale_item,
                    product=product,
                    quantity=qty,
                    refund_amount=item_spec['refund_amount'],
                    condition=condition,
                    notes=item_spec['notes']
                )

                # Inventory Ledger integration
                if condition == 'resellable':
                    InventoryService.record_movement(
                        product_or_id=product,
                        movement_type='customer_return',
                        qty_in=qty,
                        qty_out=0,
                        reference_id=sale_return.return_number,
                        reason=f"Customer return (Restocked) for Invoice #{sale.invoice_number}",
                        user=user
                    )
                else:
                    # Inward return then immediate damage write-off to reflect physical inspection
                    InventoryService.record_movement(
                        product_or_id=product,
                        movement_type='customer_return',
                        qty_in=qty,
                        qty_out=0,
                        reference_id=sale_return.return_number,
                        reason=f"Customer return ({condition}) for Invoice #{sale.invoice_number}",
                        user=user
                    )
                    InventoryService.record_movement(
                        product_or_id=product,
                        movement_type='damage',
                        qty_in=0,
                        qty_out=qty,
                        reference_id=sale_return.return_number,
                        reason=f"Damaged return write-off for Invoice #{sale.invoice_number}",
                        user=user
                    )

                # Warranty adjustment: If full quantity of product returned, void the warranty
                sale_item.refresh_from_db()
                if sale_item.returnable_quantity == 0:
                    warranties = Warranty.objects.filter(sale=sale, product=product, status__in=['active', 'claimed'])
                    for w in warranties:
                        w.status = 'voided'
                        w.terms = f"{w.terms}\n[VOIDED: Product returned under #{sale_return.return_number} on {timezone.now().date()}]."
                        w.save(update_fields=['status', 'terms', 'updated_at'])

            # Adjust loyalty points if customer profile attached
            if sale.customer and sale.total_amount > 0:
                customer = sale.customer
                ratio = total_refund / sale.total_amount
                # Calculate estimated points to reverse based on refund proportion
                points_to_reverse = int(float(total_refund) * 0.05)
                if points_to_reverse > 0 and customer.loyalty_points > 0:
                    customer.loyalty_points = max(0, customer.loyalty_points - points_to_reverse)
                    customer.save(update_fields=['loyalty_points'])

            return sale_return


class WarrantyService:
    """
    Lifecycle management service for product warranties and claims.
    """

    @classmethod
    def register_claim(cls, warranty_or_id, issue_description: str, repair=None,
                       covered_amount: Decimal = Decimal('0.00'), user=None) -> WarrantyClaim:
        w_id = warranty_or_id.id if hasattr(warranty_or_id, 'id') else warranty_or_id

        with transaction.atomic():
            warranty = Warranty.objects.select_for_update().get(id=w_id)

            if warranty.status == 'voided':
                raise ValidationError({'warranty': 'Cannot file a claim on a voided warranty.'})

            if warranty.is_expired:
                raise ValidationError({'warranty': f"Warranty expired on {warranty.expiry_date}."})

            if not issue_description.strip():
                raise ValidationError({'issue_description': 'Issue description is mandatory for filing a claim.'})

            claim = WarrantyClaim.objects.create(
                warranty=warranty,
                repair=repair,
                issue_description=issue_description.strip(),
                covered_amount=covered_amount,
                status='approved',
                created_by=user if (user and getattr(user, 'is_authenticated', False)) else None
            )

            # Update warranty status to claimed if active
            if warranty.status == 'active':
                warranty.status = 'claimed'
                warranty.save(update_fields=['status', 'updated_at'])

            # If repair ticket was linked, attach warranty
            if repair:
                repair.warranty = warranty
                repair.save(update_fields=['warranty'])

            return claim

    @classmethod
    def void_warranty(cls, warranty_or_id, reason: str, user=None) -> Warranty:
        w_id = warranty_or_id.id if hasattr(warranty_or_id, 'id') else warranty_or_id

        with transaction.atomic():
            warranty = Warranty.objects.select_for_update().get(id=w_id)
            warranty.status = 'voided'
            warranty.terms = f"{warranty.terms}\n[VOIDED: {reason} on {timezone.now().date()}]."
            warranty.save(update_fields=['status', 'terms', 'updated_at'])
            return warranty
