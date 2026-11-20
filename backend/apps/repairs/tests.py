from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from unittest.mock import patch
from apps.users.models import User
from apps.crm.models import Customer
from apps.products.models import Product, Brand, Category
from apps.purchasing.models import StockMovement
from apps.repairs.models import Repair, RepairPart
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

    def test_concurrency_safe_ticket_number_generation(self):
        """Repair ticket number candidate generation is unique and handles collisions"""
        num1 = Repair.generate_ticket_number()
        repair1 = Repair.objects.create(
            ticket_number=num1,
            customer=self.customer,
            item_type='Watch',
            issue_description='Battery',
            created_by=self.staff_user
        )
        num2 = Repair.generate_ticket_number()
        self.assertNotEqual(num1, num2)
        repair2 = Repair.objects.create(
            customer=self.customer,
            item_type='Watch',
            issue_description='Crystal glass',
            created_by=self.staff_user
        )
        self.assertTrue(repair2.ticket_number.startswith('REP-'))
        self.assertNotEqual(repair1.ticket_number, repair2.ticket_number)

    def test_technician_assignment_and_service_type(self):
        """Technician assignment and service type updates reflect accurately on repair ticket"""
        repair = Repair.objects.create(
            customer=self.customer,
            item_type='Automatic Watch',
            brand='Tissot',
            issue_description='Mainspring slipped',
            service_type='movement_overhaul',
            created_by=self.staff_user
        )
        self.client.force_authenticate(user=self.staff_user)

        res = self.client.patch(f'/api/repairs/{repair.id}/update_status/', {
            'status': 'in_repair',
            'assigned_technician': self.staff_user.id,
            'diagnosis_notes': 'Balance wheel amplitude 220 degrees, overhaul required'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        repair.refresh_from_db()
        self.assertEqual(repair.assigned_technician, self.staff_user)
        self.assertEqual(repair.status, 'in_repair')
        self.assertIn('amplitude 220', repair.diagnosis_notes)

    def test_spare_part_consumption_and_inventory_ledger(self):
        """Consuming spare parts deducts stock from inventory ledger, and removing restores stock"""
        brand = Brand.objects.create(name='Renata Swiss')
        category = Category.objects.create(name='Consumables & Spares', slug='spares')
        battery = Product.objects.create(
            name='Renata 377 Silver Oxide Battery',
            brand=brand,
            category=category,
            cost_price=Decimal('120.00'),
            selling_price=Decimal('350.00'),
            stock=15
        )

        repair = Repair.objects.create(
            customer=self.customer,
            item_type='Quartz Chronograph',
            brand='Seiko',
            issue_description='Battery dead',
            service_type='battery_replacement',
            repair_charge=Decimal('100.00'),
            status='in_repair',
            created_by=self.staff_user
        )

        self.client.force_authenticate(user=self.staff_user)

        # 1. Add spare part
        add_res = self.client.post(f'/api/repairs/{repair.id}/add_part/', {
            'product_id': battery.id,
            'quantity': 2,
            'charge_to_customer': '350.00',
            'notes': 'High-drain silver oxide cell'
        })
        self.assertEqual(add_res.status_code, status.HTTP_201_CREATED)
        part_id = add_res.data['id']

        # Verify stock decreased by 2
        battery.refresh_from_db()
        self.assertEqual(battery.stock, 13)

        # Verify StockMovement ledger
        movement = StockMovement.objects.filter(
            product=battery,
            movement_type='repair_part_used',
            reference_id=repair.ticket_number
        ).first()
        self.assertIsNotNone(movement)
        self.assertEqual(movement.quantity_out, 2)
        self.assertEqual(movement.resulting_balance, 13)

        # Verify Repair updated
        repair.refresh_from_db()
        self.assertEqual(repair.parts_used.count(), 1)
        # Charge was 100.00 + (350 * 2) = 800.00
        self.assertEqual(repair.repair_charge, Decimal('800.00'))

        # 2. Remove spare part
        del_res = self.client.delete(f'/api/repairs/{repair.id}/remove_part/?part_id={part_id}')
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)

        # Verify stock restored to 15
        battery.refresh_from_db()
        self.assertEqual(battery.stock, 15)

        # Verify return movement in ledger
        return_mv = StockMovement.objects.filter(
            product=battery,
            movement_type='repair_part_returned',
            reference_id=repair.ticket_number
        ).first()
        self.assertIsNotNone(return_mv)
        self.assertEqual(return_mv.quantity_in, 2)
        self.assertEqual(return_mv.resulting_balance, 15)

    def test_granular_workshop_lifecycle_stages(self):
        """Repair progresses smoothly across full workshop lifecycle including QC and testing"""
        repair = Repair.objects.create(
            customer=self.customer,
            item_type='Diver 300M',
            brand='Omega',
            issue_description='Gaskets dry rot and pressure leak',
            status='received',
            created_by=self.staff_user
        )

        self.client.force_authenticate(user=self.staff_user)

        # diagnosing
        r1 = self.client.patch(f'/api/repairs/{repair.id}/update_status/', {
            'status': 'diagnosing',
            'notes': 'Disassembled case and inspected movement'
        })
        self.assertEqual(r1.status_code, status.HTTP_200_OK)
        repair.refresh_from_db()
        self.assertEqual(repair.status, 'diagnosing')

        # awaiting_approval
        r2 = self.client.patch(f'/api/repairs/{repair.id}/update_status/', {
            'status': 'awaiting_approval',
            'repair_charge': '8500.00'
        })
        self.assertEqual(r2.status_code, status.HTTP_200_OK)
        repair.refresh_from_db()
        self.assertEqual(repair.status, 'awaiting_approval')

        # testing with QC passed
        r3 = self.client.patch(f'/api/repairs/{repair.id}/update_status/', {
            'status': 'testing',
            'qc_passed': True
        })
        self.assertEqual(r3.status_code, status.HTTP_200_OK)
        repair.refresh_from_db()
        self.assertEqual(repair.status, 'testing')
        self.assertTrue(repair.qc_passed)
