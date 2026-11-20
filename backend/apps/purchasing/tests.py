from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient
from rest_framework import status
from apps.products.models import Product, Brand, Category
from .models import (
    Supplier, ProductSupplier, PurchaseOrder, PurchaseOrderItem,
    GoodsReceipt, GoodsReceiptItem, StockMovement
)
from .services import InventoryService, PurchasingService

User = get_user_model()


class PurchasingWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.admin = User.objects.create_superuser(
            username='admin_pur', email='admin_pur@example.com', password='password123'
        )
        self.admin.role = 'admin'
        self.admin.save()

        self.manager = User.objects.create_user(
            username='mgr_pur', email='mgr_pur@example.com', password='password123'
        )
        self.manager.role = 'manager'
        self.manager.save()

        self.staff = User.objects.create_user(
            username='staff_pur', email='staff_pur@example.com', password='password123'
        )
        self.staff.role = 'staff'
        self.staff.save()

        # Fixture Brand & Category
        self.brand = Brand.objects.create(name='Test Tissot', slug='test-tissot')
        self.category = Category.objects.create(name='Test Watches', slug='analog')

        # Products
        self.product1 = Product.objects.create(
            name='Tissot PRX Powermatic 80',
            brand=self.brand,
            category=self.category,
            cost_price=Decimal('45000.00'),
            selling_price=Decimal('62500.00'),
            mrp=Decimal('65000.00'),
            stock=10,
            barcode='BAR-TISS-001'
        )
        self.product2 = Product.objects.create(
            name='Tissot Gentleman',
            brand=self.brand,
            category=self.category,
            cost_price=Decimal('50000.00'),
            selling_price=Decimal('72000.00'),
            mrp=Decimal('75000.00'),
            stock=5,
            barcode='BAR-TISS-002'
        )

        # Supplier
        self.supplier = Supplier.objects.create(
            name='Test Swatch Group',
            contact_person='Vikram Rathore',
            phone='+919876543210',
            email='test@swatchgroup.com',
            gstin='07AAACS1842C1Z6',
            payment_terms='Net 30 Days'
        )

    def test_supplier_crud_and_permissions(self):
        # Staff can list suppliers
        self.client.force_authenticate(user=self.staff)
        res = self.client.get('/api/purchasing/suppliers/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Staff cannot create supplier (requires Manager or above)
        res = self.client.post('/api/purchasing/suppliers/', {
            'name': 'Unauthorized Supplier',
            'phone': '1234567890'
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # Manager can create supplier
        self.client.force_authenticate(user=self.manager)
        res = self.client.post('/api/purchasing/suppliers/', {
            'name': 'Authorized Supplier',
            'contact_person': 'Ramesh',
            'phone': '9876543210',
            'email': 'ramesh@supplier.com',
            'gstin': '29AAACT2702H1ZQ',
            'payment_terms': 'Net 45 Days'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Supplier.objects.filter(name='Authorized Supplier').exists())

    def test_purchase_order_creation_and_calculation(self):
        self.client.force_authenticate(user=self.manager)
        payload = {
            'supplier': self.supplier.id,
            'status': 'ordered',
            'notes': 'Test order',
            'items': [
                {
                    'product_id': self.product1.id,
                    'ordered_quantity': 4,
                    'unit_cost': '45000.00',
                    'discount_percent': '5.00',
                    'tax_rate': '18.00'
                },
                {
                    'product_id': self.product2.id,
                    'ordered_quantity': 2,
                    'unit_cost': '50000.00',
                    'discount_percent': '0.00',
                    'tax_rate': '18.00'
                }
            ]
        }
        res = self.client.post('/api/purchasing/orders/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        po_id = res.data['id']
        po = PurchaseOrder.objects.get(id=po_id)

        self.assertTrue(po.order_number.startswith('PO-'))
        self.assertEqual(po.items.count(), 2)

        # Item 1: 4 * 45000 = 180,000. Discount 5% = 9,000. Net = 171,000. Tax 18% = 30,780.
        # Item 2: 2 * 50000 = 100,000. Discount 0. Net = 100,000. Tax 18% = 18,000.
        # Gross Subtotal: 280,000. Total Discount: 9,000. Total Tax: 48,780. Grand Total: 319,780.
        self.assertEqual(po.subtotal, Decimal('280000.00'))
        self.assertEqual(po.discount_amount, Decimal('9000.00'))
        self.assertEqual(po.tax_amount, Decimal('48780.00'))
        self.assertEqual(po.total_amount, Decimal('319780.00'))

    def test_goods_receipt_workflow_and_stock_increment(self):
        # Create an ordered PO
        po = PurchaseOrder.objects.create(
            supplier=self.supplier,
            status='ordered',
            created_by=self.manager
        )
        po_item1 = PurchaseOrderItem.objects.create(
            purchase_order=po,
            product=self.product1,
            ordered_quantity=10,
            unit_cost=Decimal('45000.00'),
            tax_rate=Decimal('18.00')
        )
        po_item2 = PurchaseOrderItem.objects.create(
            purchase_order=po,
            product=self.product2,
            ordered_quantity=5,
            unit_cost=Decimal('50000.00'),
            tax_rate=Decimal('18.00')
        )
        po.recalculate_totals()

        initial_stock_p1 = self.product1.stock  # 10
        initial_stock_p2 = self.product2.stock  # 5

        # Partial receipt: Receive 4 of p1, 5 of p2
        self.client.force_authenticate(user=self.staff)
        receipt_payload = {
            'supplier_delivery_note': 'DN-998822',
            'notes': 'Partial first shipment',
            'items': [
                {
                    'purchase_order_item_id': po_item1.id,
                    'quantity_received': 4,
                    'batch_number': 'BATCH-001'
                },
                {
                    'purchase_order_item_id': po_item2.id,
                    'quantity_received': 5,
                    'batch_number': 'BATCH-002'
                }
            ]
        }
        res = self.client.post(f'/api/purchasing/orders/{po.id}/receive/', receipt_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        po.refresh_from_db()
        self.assertEqual(po.status, 'partially_received')

        po_item1.refresh_from_db()
        self.assertEqual(po_item1.received_quantity, 4)
        self.assertEqual(po_item1.pending_quantity, 6)

        po_item2.refresh_from_db()
        self.assertEqual(po_item2.received_quantity, 5)
        self.assertEqual(po_item2.pending_quantity, 0)

        # Stock check
        self.product1.refresh_from_db()
        self.product2.refresh_from_db()
        self.assertEqual(self.product1.stock, initial_stock_p1 + 4)
        self.assertEqual(self.product2.stock, initial_stock_p2 + 5)

        # Verify StockMovement ledger entries
        m1 = StockMovement.objects.filter(product=self.product1, movement_type='purchase_receipt').first()
        self.assertIsNotNone(m1)
        self.assertEqual(m1.quantity_in, 4)
        self.assertEqual(m1.previous_balance, initial_stock_p1)
        self.assertEqual(m1.resulting_balance, initial_stock_p1 + 4)

        # Receive remaining 6 of p1 to complete order
        second_receipt_payload = {
            'supplier_delivery_note': 'DN-998833',
            'items': [
                {
                    'purchase_order_item_id': po_item1.id,
                    'quantity_received': 6
                }
            ]
        }
        res2 = self.client.post(f'/api/purchasing/orders/{po.id}/receive/', second_receipt_payload, format='json')
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)

        po.refresh_from_db()
        self.assertEqual(po.status, 'completed')

    def test_over_receipt_prevention(self):
        po = PurchaseOrder.objects.create(
            supplier=self.supplier,
            status='ordered',
            created_by=self.manager
        )
        po_item = PurchaseOrderItem.objects.create(
            purchase_order=po,
            product=self.product1,
            ordered_quantity=3,
            unit_cost=Decimal('45000.00')
        )

        self.client.force_authenticate(user=self.staff)
        over_receipt_payload = {
            'items': [
                {
                    'purchase_order_item_id': po_item.id,
                    'quantity_received': 5  # Exceeds ordered quantity 3
                }
            ]
        }
        res = self.client.post(f'/api/purchasing/orders/{po.id}/receive/', over_receipt_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_negative_stock_prevention_in_inventory_service(self):
        with self.assertRaises(ValidationError):
            InventoryService.record_movement(
                product_or_id=self.product1,
                movement_type='sale',
                qty_in=0,
                qty_out=100,  # stock is only 10
                reference_id='TEST-INVALID'
            )

    def test_manual_adjustment_endpoint(self):
        self.client.force_authenticate(user=self.manager)
        initial_stock = self.product1.stock  # 10
        payload = {
            'product_id': self.product1.id,
            'direction': 'out',
            'quantity': 2,
            'reason': 'Damaged display unit written off during audit'
        }
        res = self.client.post('/api/purchasing/movements/adjust/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        self.product1.refresh_from_db()
        self.assertEqual(self.product1.stock, initial_stock - 2)

        movement = StockMovement.objects.get(id=res.data['id'])
        self.assertEqual(movement.movement_type, 'manual_adjustment')
        self.assertEqual(movement.quantity_out, 2)
        self.assertEqual(movement.previous_balance, initial_stock)
        self.assertEqual(movement.resulting_balance, initial_stock - 2)
