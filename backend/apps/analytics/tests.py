from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from apps.users.models import User
from apps.crm.models import Customer
from apps.products.models import Product
from apps.sales.models import Sale, Warranty
from apps.notifications.models import Notification
from apps.analytics.tasks import check_and_send_birthday_wishes, check_warranty_expiry_notifications


class AnalyticsSecurityAndCeleryTests(TestCase):
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
            username='staff_clerk',
            name='Cashier 1',
            email='clerk@meghani.com',
            password='StaffPass123!',
            role='staff'
        )

    def test_celery_birthday_task_execution(self):
        """Birthday wish Celery task creates Notification records without TypeError"""
        today = timezone.now().date()
        Customer.objects.create(
            name='Birthday Customer',
            phone='+919111122222',
            date_of_birth=today
        )
        
        # Execute Celery task directly
        result = check_and_send_birthday_wishes()
        self.assertIn("Sent", result)
        
        # Verify notification record was persisted with correct fields
        notif = Notification.objects.filter(type='whatsapp').first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.customer.name, 'Birthday Customer')
        self.assertEqual(notif.type, 'whatsapp')

    def test_celery_warranty_task_execution(self):
        """Warranty reminder Celery task creates Notification records without TypeError"""
        today = timezone.now().date()
        customer = Customer.objects.create(
            name='Warranty Patron',
            phone='+919333344444'
        )
        product = Product.objects.create(
            name='Titan Edge Ceramic',
            brand='Titan',
            category='analog',
            cost_price=Decimal('10000.00'),
            selling_price=Decimal('18000.00'),
            stock=2
        )
        sale = Sale.objects.create(
            total_amount=Decimal('18000.00'),
            payment_mode='cash'
        )
        Warranty.objects.create(
            sale=sale,
            product=product,
            customer=customer,
            warranty_months=12,
            start_date=today - timedelta(days=360),
            expiry_date=today + timedelta(days=3),  # Expiring in 3 days (within 7-day cutoff)
            notified=False
        )
        
        # Execute Celery task directly
        result = check_warranty_expiry_notifications()
        self.assertIn("Sent", result)
        
        notif = Notification.objects.filter(customer=customer, type='whatsapp').first()
        self.assertIsNotNone(notif)
        self.assertIn('Titan Edge Ceramic', notif.message)

    def test_staff_cannot_view_profit_report(self):
        """Staff user receives 403 Forbidden on /api/analytics/reports/profit/"""
        self.client.force_authenticate(user=self.staff)
        res = self.client.get('/api/analytics/reports/profit/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        
        # Admin can access
        self.client.force_authenticate(user=self.admin)
        admin_res = self.client.get('/api/analytics/reports/profit/')
        self.assertEqual(admin_res.status_code, status.HTTP_200_OK)

    def test_dashboard_stats_masks_profit_for_staff(self):
        """Staff user receives null for profit on /api/analytics/dashboard/stats/"""
        # Create a sale with profit
        Sale.objects.create(
            total_amount=Decimal('10000.00'),
            profit=Decimal('4000.00'),
            payment_mode='cash',
            sale_date=timezone.now()
        )
        
        # Staff sees sales but profit is None
        self.client.force_authenticate(user=self.staff)
        staff_res = self.client.get('/api/analytics/dashboard/stats/')
        self.assertEqual(staff_res.status_code, status.HTTP_200_OK)
        self.assertIsNone(staff_res.data['today']['profit'])
        self.assertIsNone(staff_res.data['month']['profit'])
        
        # Admin sees exact numerical profit
        self.client.force_authenticate(user=self.admin)
        admin_res = self.client.get('/api/analytics/dashboard/stats/')
        self.assertEqual(admin_res.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(admin_res.data['today']['profit'])
        self.assertEqual(admin_res.data['today']['profit'], Decimal('4000.00'))

    def test_staff_cannot_view_sales_report(self):
        """Staff user receives 403 Forbidden on analytical sales reports"""
        self.client.force_authenticate(user=self.staff)
        res = self.client.get('/api/analytics/reports/sales/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin)
        admin_res = self.client.get('/api/analytics/reports/sales/')
        self.assertEqual(admin_res.status_code, status.HTTP_200_OK)
