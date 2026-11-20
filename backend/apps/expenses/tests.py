from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from datetime import date
from apps.users.models import User
from apps.expenses.models import Expense


class ExpenseRbacSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_user(
            username='admin_owner',
            name='Store Owner',
            email='admin@meghani.com',
            password='AdminPassword123!',
            role='admin',
            is_staff=True
        )

        self.manager = User.objects.create_user(
            username='manager_raj',
            name='Floor Manager',
            email='manager@meghani.com',
            password='ManagerPassword123!',
            role='manager'
        )

        self.staff = User.objects.create_user(
            username='staff_clerk',
            name='Junior Cashier',
            email='clerk@meghani.com',
            password='StaffPassword123!',
            role='staff'
        )

        self.expense = Expense.objects.create(
            description='Showroom Lighting Electricity',
            amount=Decimal('4500.00'),
            category='utilities',
            date=date.today(),
            vendor_name='Torrent Power'
        )

    def test_staff_cannot_access_expenses(self):
        """Staff users are blocked with 403 Forbidden from viewing or logging store expenses"""
        self.client.force_authenticate(user=self.staff)
        # Cannot list
        list_res = self.client.get('/api/expenses/')
        self.assertEqual(list_res.status_code, status.HTTP_403_FORBIDDEN)

        # Cannot create
        create_res = self.client.post('/api/expenses/', {
            'description': 'Staff Attempt',
            'amount': '1000.00',
            'category': 'utilities',
            'date': str(date.today())
        })
        self.assertEqual(create_res.status_code, status.HTTP_403_FORBIDDEN)

        # Cannot delete
        del_res = self.client.delete(f'/api/expenses/{self.expense.id}/')
        self.assertEqual(del_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_can_view_and_create_but_cannot_delete_expenses(self):
        """Managers can view and create expenses, but cannot delete records (Admin only)"""
        self.client.force_authenticate(user=self.manager)
        # Can list
        list_res = self.client.get('/api/expenses/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)

        # Can create
        create_res = self.client.post('/api/expenses/', {
            'description': 'VIP Client Refreshments',
            'amount': '1250.00',
            'category': 'other',
            'date': str(date.today()),
            'vendor_name': 'Cafe Royal'
        })
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        new_id = create_res.data['id']

        # CANNOT delete (403 Forbidden)
        del_res = self.client.delete(f'/api/expenses/{new_id}/')
        self.assertEqual(del_res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Expense.objects.filter(id=new_id).exists())

    def test_admin_can_full_manage_and_delete_expenses(self):
        """Administrators have full CRUD access including deletion"""
        self.client.force_authenticate(user=self.admin)
        list_res = self.client.get('/api/expenses/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)

        del_res = self.client.delete(f'/api/expenses/{self.expense.id}/')
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Expense.objects.filter(id=self.expense.id).exists())

    def test_expense_voucher_generation_and_payment_modes(self):
        """Expenses generate sequential audit voucher numbers and validate payment mode"""
        self.client.force_authenticate(user=self.manager)
        res = self.client.post('/api/expenses/', {
            'category': 'transport',
            'amount': '850.00',
            'payment_mode': 'upi',
            'vendor_name': 'Blue Dart Express',
            'description': 'Swiss watch courier shipping'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['voucher_number'].startswith('EXP-'))
        self.assertEqual(res.data['payment_mode'], 'upi')

    def test_daily_till_reconciliation_workflow(self):
        """Cash register calculates expected drawer cash and records physical variance upon close"""
        from apps.expenses.models import CashRegister
        self.client.force_authenticate(user=self.manager)

        # Get or open today's till
        res = self.client.get('/api/expenses/registers/today/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        reg_id = res.data['id']
        self.assertFalse(res.data['is_closed'])
        expected_cash = Decimal(str(res.data['expected_closing_cash']))

        # Close the till with exact cash
        close_res = self.client.post(f'/api/expenses/registers/{reg_id}/close/', {
            'actual_closing_cash': str(expected_cash + Decimal('50.00')),  # ₹50 excess
            'notes': 'Over by ₹50 due to round-off'
        })
        self.assertEqual(close_res.status_code, status.HTTP_200_OK)
        self.assertTrue(close_res.data['is_closed'])
        self.assertEqual(Decimal(str(close_res.data['variance'])), Decimal('50.00'))

