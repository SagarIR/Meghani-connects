from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from apps.users.models import User
from apps.products.models import Product
from apps.crm.models import Customer
from apps.sales.models import Sale, SaleItem, Warranty
from apps.sales.invoice import generate_invoice_pdf, generate_repair_invoice_pdf
from apps.repairs.models import Repair
from apps.core.settings_models import BusinessSettings


class SalesTransactionIntegrityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        self.admin = User.objects.create_user(
            username='admin_boss',
            name='Store Owner',
            email='admin@meghani.com',
            password='AdminPass123!',
            role='admin',
            is_staff=True
        )
        
        self.staff = User.objects.create_user(
            username='staff_cashier',
            name='Cashier 1',
            email='cashier@meghani.com',
            password='StaffPass123!',
            role='staff'
        )
        
        self.customer = Customer.objects.create(
            name='Boutique Patron',
            phone='+919876543210',
            loyalty_points=50
        )
        
        self.product = Product.objects.create(
            name='Casio Edifice Chronograph',
            brand='Casio',
            category='analog',
            barcode='CASIO-EDIF-001',
            cost_price=Decimal('5000.00'),
            selling_price=Decimal('8500.00'),
            stock=5,
            warranty_months=24,
            supplier_name='Casio India Authorized'
        )

        self.settings = BusinessSettings.objects.create(
            business_name='Meghani Watch Co.',
            address_line1='Cactus Park, 23, New Sama Rd',
            city='Vadodara',
            pincode='390008',
            phone='+91 91066 80191',
            gst_number='24AAAAA0000A1Z5'
        )

    def test_pos_checkout_success_and_stock_deduction(self):
        """POS checkout atomically creates sale, decrements stock, issues warranty & accrues loyalty"""
        self.client.force_authenticate(user=self.staff)
        
        payload = {
            'customer_id': self.customer.id,
            'items': [
                {
                    'product_id': self.product.id,
                    'quantity': 2,
                    'unit_price': '8500.00'
                }
            ],
            'discount': '500.00',
            'tax': '0.00',
            'payment_mode': 'upi'
        }
        
        res = self.client.post('/api/sales/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        
        # Verify stock decremented: 5 - 2 = 3
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 3)
        
        # Verify Sale totals: 17000 - 500 = 16500
        sale = Sale.objects.get(id=res.data['id'])
        self.assertEqual(sale.total_amount, Decimal('16500.00'))
        self.assertEqual(sale.profit, Decimal('6500.00'))  # (8500 - 5000)*2 - 500 = 6500
        
        # Verify Warranty was generated
        self.assertTrue(Warranty.objects.filter(sale=sale, product=self.product).exists())
        
        # Verify Loyalty points accrued: 16500 / 100 = 165 pts added to 50 = 215
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.loyalty_points, 215)

    def test_insufficient_stock_fails_atomically(self):
        """Sale fails atomically if requested quantity exceeds available stock"""
        self.client.force_authenticate(user=self.staff)
        
        payload = {
            'customer_id': self.customer.id,
            'items': [
                {
                    'product_id': self.product.id,
                    'quantity': 10,  # Only 5 in stock
                    'unit_price': '8500.00'
                }
            ],
            'payment_mode': 'cash'
        }
        
        res = self.client.post('/api/sales/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Stock untouched
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 5)
        self.assertEqual(Sale.objects.count(), 0)

    def test_invalid_discount_rejected(self):
        """Discounts cannot be negative or exceed the transaction subtotal"""
        self.client.force_authenticate(user=self.staff)
        
        # Negative discount
        neg_res = self.client.post('/api/sales/', {
            'items': [{'product_id': self.product.id, 'quantity': 1, 'unit_price': '8500.00'}],
            'discount': '-100.00',
            'payment_mode': 'cash'
        }, format='json')
        self.assertEqual(neg_res.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Discount exceeding subtotal
        excess_res = self.client.post('/api/sales/', {
            'items': [{'product_id': self.product.id, 'quantity': 1, 'unit_price': '8500.00'}],
            'discount': '99999.00',
            'payment_mode': 'cash'
        }, format='json')
        self.assertEqual(excess_res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_sale_deletion_blocked(self):
        """Sales records cannot be deleted via DELETE method (must return 405 Method Not Allowed)"""
        sale = Sale.objects.create(
            total_amount=Decimal('8500.00'),
            payment_mode='cash',
            created_by=self.admin
        )
        self.client.force_authenticate(user=self.admin)
        res = self.client.delete(f'/api/sales/{sale.id}/')
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertTrue(Sale.objects.filter(id=sale.id).exists())

    def test_profit_and_cost_masked_for_staff(self):
        """Staff user cannot see sale profit or item cost_price in GET /api/sales/<id>/"""
        sale = Sale.objects.create(
            total_amount=Decimal('8500.00'),
            profit=Decimal('3500.00'),
            payment_mode='cash',
            created_by=self.admin
        )
        SaleItem.objects.create(
            sale=sale,
            product=self.product,
            quantity=1,
            unit_price=Decimal('8500.00'),
            cost_price=Decimal('5000.00'),
            subtotal=Decimal('8500.00')
        )
        
        # Staff inspection
        self.client.force_authenticate(user=self.staff)
        staff_res = self.client.get(f'/api/sales/{sale.id}/')
        self.assertEqual(staff_res.status_code, status.HTTP_200_OK)
        self.assertNotIn('profit', staff_res.data)
        item_data = staff_res.data['items'][0]
        self.assertNotIn('cost_price', item_data)
        self.assertNotIn('item_profit', item_data)
        
        # Admin inspection
        self.client.force_authenticate(user=self.admin)
        admin_res = self.client.get(f'/api/sales/{sale.id}/')
        self.assertEqual(admin_res.status_code, status.HTTP_200_OK)
        self.assertIn('profit', admin_res.data)
        self.assertIn('cost_price', admin_res.data['items'][0])

    def test_dynamic_pdf_invoice_generation(self):
        """PDF generation generates without errors using dynamic BusinessSettings"""
        sale = Sale.objects.create(
            invoice_number='INV-TEST-0001',
            total_amount=Decimal('8500.00'),
            payment_mode='upi',
            customer=self.customer,
            created_by=self.admin
        )
        SaleItem.objects.create(
            sale=sale,
            product=self.product,
            quantity=1,
            unit_price=Decimal('8500.00'),
            cost_price=Decimal('5000.00'),
            subtotal=Decimal('8500.00')
        )
        
        pdf_buffer = generate_invoice_pdf(sale)
        pdf_bytes = pdf_buffer.getvalue()
        self.assertTrue(len(pdf_bytes) > 1000)
        self.assertTrue(pdf_bytes.startswith(b'%PDF'))

    def test_split_payment_success_and_breakdown(self):
        """Mixed/split payment succeeds when breakdown matches total amount exactly"""
        self.client.force_authenticate(user=self.staff)
        payload = {
            'customer_id': self.customer.id,
            'items': [{'product_id': self.product.id, 'quantity': 1, 'unit_price': '8500.00'}],
            'payment_mode': 'mixed',
            'payment_details': {
                'cash': '5000.00',
                'card': '3500.00'
            }
        }
        res = self.client.post('/api/sales/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['payment_mode'], 'mixed')
        self.assertEqual(res.data['payment_details'], {'cash': 5000.0, 'card': 3500.0})

        sale = Sale.objects.get(id=res.data['id'])
        self.assertEqual(sale.total_amount, Decimal('8500.00'))
        self.assertEqual(sale.payment_details, {'cash': 5000.0, 'card': 3500.0})

        # Test PDF generation with mixed breakdown
        pdf_buf = generate_invoice_pdf(sale)
        self.assertTrue(len(pdf_buf.getvalue()) > 1000)

    def test_split_payment_mismatch_rejected(self):
        """Split payment fails with HTTP 400 if sum of split amounts does not equal total amount"""
        self.client.force_authenticate(user=self.staff)
        # Total is 8500, but sum is 8000
        payload = {
            'customer_id': self.customer.id,
            'items': [{'product_id': self.product.id, 'quantity': 1, 'unit_price': '8500.00'}],
            'payment_mode': 'mixed',
            'payment_details': {
                'cash': '5000.00',
                'card': '3000.00'
            }
        }
        res = self.client.post('/api/sales/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('payment_details', res.data)

    def test_split_payment_single_method_rejected(self):
        """Mixed payment requires at least two non-zero payment methods"""
        self.client.force_authenticate(user=self.staff)
        payload = {
            'customer_id': self.customer.id,
            'items': [{'product_id': self.product.id, 'quantity': 1, 'unit_price': '8500.00'}],
            'payment_mode': 'mixed',
            'payment_details': {
                'cash': '8500.00',
                'card': '0.00'
            }
        }
        res = self.client.post('/api/sales/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('payment_details', res.data)

    def test_split_payment_negative_method_rejected(self):
        """Negative amounts in split payment are strictly rejected"""
        self.client.force_authenticate(user=self.staff)
        payload = {
            'customer_id': self.customer.id,
            'items': [{'product_id': self.product.id, 'quantity': 1, 'unit_price': '8500.00'}],
            'payment_mode': 'mixed',
            'payment_details': {
                'cash': '9500.00',
                'card': '-1000.00'
            }
        }
        res = self.client.post('/api/sales/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_card_and_cash_single_payment_modes(self):
        """Single payment modes (cash, card) succeed and populate payment_details with full amount"""
        self.client.force_authenticate(user=self.staff)
        for mode in ['cash', 'card']:
            payload = {
                'customer_id': self.customer.id,
                'items': [{'product_id': self.product.id, 'quantity': 1, 'unit_price': '8500.00'}],
                'payment_mode': mode
            }
            res = self.client.post('/api/sales/', payload, format='json')
            self.assertEqual(res.status_code, status.HTTP_201_CREATED)
            self.assertEqual(res.data['payment_mode'], mode)
            self.assertEqual(res.data['payment_details'], {mode: 8500.0})

    def test_product_barcode_lookup_and_search(self):
        """Barcode endpoint and search endpoint return matching active products"""
        self.client.force_authenticate(user=self.staff)
        # Barcode lookup
        barcode_res = self.client.get(f'/api/products/barcode/{self.product.barcode}/')
        self.assertEqual(barcode_res.status_code, status.HTTP_200_OK)
        self.assertEqual(barcode_res.data['id'], self.product.id)
        self.assertEqual(barcode_res.data['barcode'], 'CASIO-EDIF-001')

        # POS search
        search_res = self.client.get('/api/products/search/?q=Casio')
        self.assertEqual(search_res.status_code, status.HTTP_200_OK)
        self.assertTrue(len(search_res.data) >= 1)
        self.assertEqual(search_res.data[0]['name'], self.product.name)

    def test_invalid_barcode_returns_404(self):
        """Looking up a non-existent barcode returns 404 Not Found"""
        self.client.force_authenticate(user=self.staff)
        res = self.client.get('/api/products/barcode/UNKNOWN_BARCODE_99999/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_dynamic_business_settings_in_invoice_endpoint(self):
        """Invoice JSON endpoint returns dynamic BusinessSettings and payment details"""
        sale = Sale.objects.create(
            invoice_number='INV-TEST-0002',
            total_amount=Decimal('8500.00'),
            payment_mode='mixed',
            payment_details={'cash': 5000.0, 'upi': 3500.0},
            customer=self.customer,
            created_by=self.admin
        )
        self.client.force_authenticate(user=self.admin)
        res = self.client.get(f'/api/sales/{sale.id}/invoice/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['business']['name'], 'Meghani Watch Co.')
        self.assertEqual(res.data['business']['phone'], '+91 91066 80191')
        self.assertEqual(res.data['business']['gst'], self.settings.gst_number)
        self.assertEqual(res.data['payment_details'], {'cash': 5000.0, 'upi': 3500.0})

    def test_staff_sales_today_and_summary_masks_profit(self):
        """Staff user receives sales volume but profit is masked as None on today/summary endpoints"""
        Sale.objects.create(
            invoice_number='INV-TEST-PROFIT',
            total_amount=Decimal('8500.00'),
            profit=Decimal('3500.00'),
            payment_mode='cash',
            customer=self.customer,
            created_by=self.staff
        )
        # Staff inspection
        self.client.force_authenticate(user=self.staff)
        today_res = self.client.get('/api/sales/today/')
        self.assertEqual(today_res.status_code, status.HTTP_200_OK)
        self.assertEqual(today_res.data['total_sales'], Decimal('8500.00'))
        self.assertIsNone(today_res.data['total_profit'])

        summary_res = self.client.get('/api/sales/summary/?days=7')
        self.assertEqual(summary_res.status_code, status.HTTP_200_OK)
        self.assertEqual(summary_res.data['summary']['total_sales'], Decimal('8500.00'))
        self.assertIsNone(summary_res.data['summary']['total_profit'])
        for day in summary_res.data['daily']:
            self.assertIsNone(day['profit'])

        # Admin inspection
        self.client.force_authenticate(user=self.admin)
        admin_today = self.client.get('/api/sales/today/')
        self.assertEqual(admin_today.status_code, status.HTTP_200_OK)
        self.assertEqual(admin_today.data['total_profit'], Decimal('3500.00'))
