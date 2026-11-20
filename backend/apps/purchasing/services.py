from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError
from apps.products.models import Product
from .models import PurchaseOrder, PurchaseOrderItem, GoodsReceipt, GoodsReceiptItem, StockMovement, ProductSupplier


class InventoryService:
    """
    Central service for transactional stock movements.
    Enforces concurrency protection, prevents negative stock,
    and guarantees an immutable ledger record for every inventory delta.
    """

    @classmethod
    def record_movement(cls, product_or_id, movement_type: str, qty_in: int = 0, qty_out: int = 0,
                        reference_id: str = '', reason: str = '', user=None) -> StockMovement:
        qty_in = max(0, int(qty_in))
        qty_out = max(0, int(qty_out))

        if qty_in == 0 and qty_out == 0:
            raise ValidationError({'error': 'Movement quantity must be greater than zero.'})

        with transaction.atomic():
            product_id = product_or_id.id if hasattr(product_or_id, 'id') else product_or_id
            product = Product.objects.select_for_update().get(id=product_id)

            prev_balance = product.stock

            if qty_out > prev_balance:
                raise ValidationError({
                    'error': f"Insufficient stock for '{product.name}'. Current stock: {prev_balance}, requested deduction: {qty_out}"
                })

            new_balance = prev_balance + qty_in - qty_out

            movement = StockMovement.objects.create(
                product=product,
                movement_type=movement_type,
                quantity_in=qty_in,
                quantity_out=qty_out,
                previous_balance=prev_balance,
                resulting_balance=new_balance,
                reference_id=reference_id,
                reason=reason,
                created_by=user if (user and getattr(user, 'is_authenticated', False)) else None
            )

            product.stock = new_balance
            product.save(update_fields=['stock', 'updated_at'])

            return movement


class PurchasingService:
    """
    Service orchestrating Purchase Orders and Goods Receipts.
    """

    @classmethod
    def receive_goods(cls, purchase_order_or_id, items_data: list, received_by=None,
                      delivery_note: str = '', notes: str = '') -> GoodsReceipt:
        """
        Receives goods against an active purchase order.
        Increments received quantities, transitions PO status, creates a GoodsReceipt,
        and atomically books stock movements into Product.stock and the immutable ledger.
        """
        po_id = purchase_order_or_id.id if hasattr(purchase_order_or_id, 'id') else purchase_order_or_id

        with transaction.atomic():
            po = PurchaseOrder.objects.select_for_update().get(id=po_id)

            if po.status not in ['ordered', 'partially_received']:
                raise ValidationError({
                    'status': f"Cannot receive goods for purchase order with status '{po.get_status_display()}'. Must be 'Ordered' or 'Partially Received'."
                })

            if not items_data:
                raise ValidationError({'items': 'Goods receipt must contain at least one item.'})

            receipt = GoodsReceipt.objects.create(
                purchase_order=po,
                received_by=received_by if (received_by and getattr(received_by, 'is_authenticated', False)) else None,
                supplier_delivery_note=delivery_note,
                notes=notes
            )

            for item_spec in items_data:
                po_item_id = item_spec.get('purchase_order_item_id') or item_spec.get('item_id')
                qty_received = int(item_spec.get('quantity_received', 0))

                if qty_received <= 0:
                    continue

                po_item = PurchaseOrderItem.objects.select_for_update().get(id=po_item_id, purchase_order=po)

                # Validate against over-receipt
                pending = po_item.pending_quantity
                if qty_received > pending:
                    raise ValidationError({
                        'quantity_received': f"Received quantity ({qty_received}) exceeds pending ordered quantity ({pending}) for '{po_item.product.name}'."
                    })

                # Create receipt item
                GoodsReceiptItem.objects.create(
                    goods_receipt=receipt,
                    purchase_order_item=po_item,
                    product=po_item.product,
                    quantity_received=qty_received,
                    unit_cost=po_item.unit_cost,
                    batch_number=item_spec.get('batch_number', ''),
                    notes=item_spec.get('notes', '')
                )

                # Update PO item received quantity
                po_item.received_quantity += qty_received
                po_item.save(update_fields=['received_quantity'])

                # Book into stock and immutable movement ledger
                InventoryService.record_movement(
                    product_or_id=po_item.product,
                    movement_type='purchase_receipt',
                    qty_in=qty_received,
                    qty_out=0,
                    reference_id=receipt.receipt_number,
                    reason=f"Goods Receipt for PO #{po.order_number}",
                    user=received_by
                )

                # Update last cost price on product and product-supplier relationship
                ProductSupplier.objects.update_or_create(
                    product=po_item.product,
                    supplier=po.supplier,
                    defaults={'last_cost_price': po_item.unit_cost}
                )

            po.update_status_from_receipts()
            return receipt
