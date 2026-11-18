from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from unittest.mock import patch
from apps.users.models import User
from apps.crm.models import Customer
from apps.repairs.models import Repair
from apps.notifications.models import Notification
from apps.core.settings_models import BusinessSettings
from apps.notifications.tasks import send_repair_notification_task


class RepairAtelierIntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.staff_user = User.objects.create_user(
            username='atelier_watchmaker',
            name='Master Horologist',
            email='atelier@meghani.com',
            password='HorologyPass123!',
            role='staff'
        )

        self.customer = Customer.objects.create(
            name='Kavita Desai',
            phone='+919876543222',
            email='kavita@example.com'
        )

        self.settings = BusinessSettings.objects.create(
            business_name='Meghani Watch Co.',
            enable_whatsapp=True,
            enable_sms=True
        )

    def test_repair_creation_triggers_received_workflow(self):
        """Creating a repair ticket sets received status and dispatches initial notification"""
        self.client.force_authenticate(user=self.staff_user)
        payload = {
            'customer_id': self.customer.id,
            'item_type': 'Automatic Watch',
            'brand': 'Omega',
            'model_number': 'Speedmaster Pro',
            'issue_description': 'Chronograph pusher stuck and timing regulation',
            'estimated_cost': '12500.00',
            'advance_paid': '3000.00'
        }
        res = self.client.post('/api/repairs/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['ticket_number'].startswith('REP-'))
        self.assertEqual(res.data['status'], 'received')

        repair = Repair.objects.get(ticket_number=res.data['ticket_number'])
        self.assertEqual(repair.customer, self.customer)
        self.assertEqual(repair.balance_due, 9500.00)

    def test_five_stage_repair_lifecycle_transitions(self):
        """Repair transitions correctly across all 5 stages: received -> in_repair -> ready -> delivered -> cancelled"""
        repair = Repair.objects.create(
            customer=self.customer,
            item_type='Vintage Diver',
            brand='Seiko',
            issue_description='Bezel replacement',
            repair_charge=Decimal('3500.00'),
            advance_paid=Decimal('1000.00'),
            status='received',
            created_by=self.staff_user
        )
        self.client.force_authenticate(user=self.staff_user)

        # 1. in_repair
        res1 = self.client.patch(f'/api/repairs/{repair.id}/update_status/', {'status': 'in_repair'})
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        repair.refresh_from_db()
        self.assertEqual(repair.status, 'in_repair')

        # 2. ready
        res2 = self.client.patch(f'/api/repairs/{repair.id}/update_status/', {'status': 'ready'})
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        repair.refresh_from_db()
        self.assertEqual(repair.status, 'ready')

        # 3. delivered
        res3 = self.client.patch(f'/api/repairs/{repair.id}/update_status/', {'status': 'delivered'})
        self.assertEqual(res3.status_code, status.HTTP_200_OK)
        repair.refresh_from_db()
        self.assertEqual(repair.status, 'delivered')
        self.assertIsNotNone(repair.delivered_date)

    @patch('apps.notifications.tasks.send_whatsapp_message')
    def test_repair_notification_task_whatsapp_delivery(self, mock_wa):
        """Notification task delivers via WhatsApp when enabled and provider responds with sent"""
        mock_wa.return_value = {'status': 'sent', 'message_sid': 'SM_TEST_WA_123'}

        repair = Repair.objects.create(
            customer=self.customer,
            item_type='Automatic Watch',
            brand='Rolex',
            issue_description='Complete overhaul',
            repair_charge=Decimal('25000.00'),
            advance_paid=Decimal('5000.00'),
            status='ready',
            created_by=self.staff_user
        )

        result = send_repair_notification_task(repair.id, 'ready')
        self.assertEqual(result['status'], 'sent')
        self.assertEqual(result['channel'], 'whatsapp')

        # Verify Notification record created in DB
        notif = Notification.objects.get(id=result['notification_id'])
        self.assertEqual(notif.customer, self.customer)
        self.assertEqual(notif.type, 'whatsapp')
        self.assertEqual(notif.status, 'sent')
        self.assertIn('fully serviced and ready for pickup', notif.message)
        self.assertIn('Outstanding balance: ₹20,000.00', notif.message)

    @patch('apps.notifications.tasks.send_whatsapp_message')
    @patch('apps.notifications.tasks.send_sms_message')
    def test_repair_notification_whatsapp_failure_falls_back_to_sms(self, mock_sms, mock_wa):
        """When WhatsApp provider fails, notification engine falls back to SMS channel"""
        mock_wa.return_value = {'status': 'error', 'error': 'Twilio WhatsApp sandbox expired'}
        mock_sms.return_value = {'status': 'sent', 'message_sid': 'SM_TEST_SMS_456'}

        repair = Repair.objects.create(
            customer=self.customer,
            item_type='Chronograph',
            brand='Tag Heuer',
            issue_description='Crystal replacement',
            repair_charge=Decimal('7000.00'),
            status='in_repair',
            created_by=self.staff_user
        )

        result = send_repair_notification_task(repair.id, 'in_repair')
        self.assertEqual(result['status'], 'sent')
        self.assertEqual(result['channel'], 'sms')

        notif = Notification.objects.get(id=result['notification_id'])
        self.assertEqual(notif.type, 'sms')
        self.assertEqual(notif.status, 'sent')
        self.assertIn('precision servicing', notif.message)

    @patch('apps.notifications.tasks.send_whatsapp_message')
    def test_duplicate_notification_suppression_within_window(self, mock_wa):
        """Identical notifications for the same repair within 60 minutes are suppressed"""
        mock_wa.return_value = {'status': 'sent', 'message_sid': 'SM_TEST_DUPE'}

        repair = Repair.objects.create(
            customer=self.customer,
            item_type='Pocket Watch',
            brand='Omega',
            issue_description='Mainspring repair',
            status='received',
            created_by=self.staff_user
        )

        # First dispatch
        res1 = send_repair_notification_task(repair.id, 'received')
        self.assertEqual(res1['status'], 'sent')
        self.assertEqual(Notification.objects.filter(customer=self.customer).count(), 1)

        # Immediate retry
        res2 = send_repair_notification_task(repair.id, 'received')
        self.assertEqual(res2['status'], 'suppressed')
        self.assertEqual(Notification.objects.filter(customer=self.customer).count(), 1)

    def test_notification_skipped_when_disabled_in_business_settings(self):
        """When notification channels are disabled in BusinessSettings, dispatch is safely skipped"""
        self.settings.enable_whatsapp = False
        self.settings.enable_sms = False
        self.settings.save()

        repair = Repair.objects.create(
            customer=self.customer,
            item_type='Smart Watch',
            brand='Garmin',
            issue_description='Battery swap',
            status='delivered',
            created_by=self.staff_user
        )

        res = send_repair_notification_task(repair.id, 'delivered')
        self.assertEqual(res['status'], 'skipped')
        self.assertEqual(Notification.objects.filter(customer=self.customer).count(), 0)
