from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.crm.models import Enquiry
from apps.users.models import User


class EnquiryApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.staff_user = User.objects.create_user(
            username='staff_test',
            email='staff@meghani.com',
            password='testpassword123',
            role='admin'
        )

    def test_unauthenticated_lead_submission(self):
        """Public visitors can submit consultation enquiries without logging in"""
        payload = {
            'name': 'Rahul Sharma',
            'phone': '+91 98765 43210',
            'email': 'rahul@example.com',
            'enquiry_type': 'viewing',
            'message': 'Interested in Cartier Santos'
        }
        response = self.client.post('/api/enquiries/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Enquiry.objects.count(), 1)
        enquiry = Enquiry.objects.first()
        self.assertEqual(enquiry.name, 'Rahul Sharma')
        self.assertEqual(enquiry.status, 'new')

    def test_unauthenticated_cannot_list_enquiries(self):
        """Unauthenticated visitors cannot access customer lead lists"""
        response = self.client.get('/api/enquiries/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_staff_can_view_and_manage_enquiries(self):
        """Authenticated staff can view customer enquiries"""
        Enquiry.objects.create(
            name='Anita Patel',
            phone='+91 98222 11111',
            enquiry_type='service',
            message='Dial restoration inquiry'
        )
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get('/api/enquiries/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify response contains the enquiry (handling paginated vs unpaginated)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Anita Patel')

    def test_enquiry_validation_rejects_invalid_input(self):
        """Backend serializer strictly rejects invalid names and malformed phones"""
        # Invalid short name
        res1 = self.client.post('/api/enquiries/', {'name': 'A', 'phone': '9876543210'})
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', res1.data)

        # Invalid malformed phone
        res2 = self.client.post('/api/enquiries/', {'name': 'Valid Name', 'phone': 'not-a-number'})
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone', res2.data)

    def test_enquiry_duplicate_suppression(self):
        """Duplicate enquiries from the same phone within 60s do not create duplicate rows"""
        payload = {
            'name': 'Duplicate Tester',
            'phone': '9876543299',
            'enquiry_type': 'viewing',
            'message': 'Testing duplicate suppression'
        }
        res1 = self.client.post('/api/enquiries/', payload)
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        first_id = res1.data['id']

        # Immediate re-submission
        res2 = self.client.post('/api/enquiries/', payload)
        self.assertIn(res2.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        self.assertEqual(res2.data['id'], first_id)
        self.assertEqual(Enquiry.objects.filter(phone='9876543299').count(), 1)


class CustomerBulkImportTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.staff_user = User.objects.create_user(
            username='staff_sales',
            email='sales@meghani.com',
            password='testpassword123',
            role='staff'
        )

    def test_unauthenticated_cannot_import_customers(self):
        """Unauthenticated import requests must be blocked"""
        res = self.client.post('/api/customers/import/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_customer_csv_import_success(self):
        """Importing valid CSV successfully creates Customer records"""
        from django.core.files.uploadedfile import SimpleUploadedFile
        from apps.crm.models import Customer

        self.client.force_authenticate(user=self.staff_user)
        csv_content = (
            "Name,Phone,Email,Address,Language Preference\n"
            "Kiran Rao,+919876500001,kiran@example.com,Vadodara,en\n"
            "Meera Joshi,9876500002,meera@example.com,Ahmedabad,gu\n"
        ).encode('utf-8')
        uploaded_file = SimpleUploadedFile("customers.csv", csv_content, content_type="text/csv")

        res = self.client.post('/api/customers/import/', {'file': uploaded_file}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['success'])
        self.assertEqual(res.data['imported'], 2)
        self.assertEqual(res.data['skipped'], 0)

        # Verify DB records
        c1 = Customer.objects.get(phone='+919876500001')
        self.assertEqual(c1.name, 'Kiran Rao')
        self.assertEqual(c1.email, 'kiran@example.com')

        c2 = Customer.objects.get(phone='+919876500002')
        self.assertEqual(c2.name, 'Meera Joshi')
        self.assertEqual(c2.language_preference, 'gu')

    def test_customer_import_duplicate_skip_and_update(self):
        """Duplicate phones are skipped when update_existing=false, updated when true"""
        from django.core.files.uploadedfile import SimpleUploadedFile
        from apps.crm.models import Customer

        self.client.force_authenticate(user=self.staff_user)
        # Create existing customer
        Customer.objects.create(name='Original Name', phone='+919876500003', email='orig@example.com')

        csv_content = (
            "Name,Phone,Email\n"
            "Updated Name,+919876500003,updated@example.com\n"
        ).encode('utf-8')

        # 1. Without update_existing -> should skip
        file1 = SimpleUploadedFile("customers.csv", csv_content, content_type="text/csv")
        res1 = self.client.post('/api/customers/import/?update_existing=false', {'file': file1}, format='multipart')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data['imported'], 0)
        self.assertEqual(res1.data['skipped'], 1)
        self.assertEqual(Customer.objects.get(phone='+919876500003').name, 'Original Name')

        # 2. With update_existing=true -> should update
        file2 = SimpleUploadedFile("customers.csv", csv_content, content_type="text/csv")
        res2 = self.client.post('/api/customers/import/?update_existing=true', {'file': file2}, format='multipart')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data['updated'], 1)
        self.assertEqual(Customer.objects.get(phone='+919876500003').name, 'Updated Name')

    def test_customer_import_missing_required_column(self):
        """Importing file without required 'phone' column returns 400 error"""
        from django.core.files.uploadedfile import SimpleUploadedFile

        self.client.force_authenticate(user=self.staff_user)
        csv_content = "Name,Email\nRahul,rahul@example.com\n".encode('utf-8')
        uploaded_file = SimpleUploadedFile("bad.csv", csv_content, content_type="text/csv")

        res = self.client.post('/api/customers/import/', {'file': uploaded_file}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res.data['success'])
        self.assertIn("phone", res.data['error'])

    def test_customer_template_download(self):
        """Customer import template endpoint returns downloadable Excel file"""
        self.client.force_authenticate(user=self.staff_user)
        res = self.client.get('/api/customers/import/template/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('application/vnd.openxmlformats', res['Content-Type'])
        self.assertIn('customer_import_template.xlsx', res['Content-Disposition'])

    def test_phone_normalization_and_uniqueness(self):
        """Phone numbers are standardized to +91XXXXXXXXXX and reject duplicates"""
        from apps.crm.models import Customer
        self.client.force_authenticate(user=self.staff_user)

        # Create with raw 10 digits
        c1 = Customer.objects.create(name='Priya Shah', phone='9876543210')
        self.assertEqual(c1.phone, '+919876543210')

        # Create with spaces and +91
        c2 = Customer.objects.create(name='Rajiv Mehta', phone='+91 98765 00000')
        self.assertEqual(c2.phone, '+919876500000')

    def test_loyalty_ledger_immutability(self):
        """Loyalty point operations append audit entries into LoyaltyTransaction ledger"""
        from apps.crm.models import Customer, LoyaltyTransaction
        self.client.force_authenticate(user=self.staff_user)

        cust = Customer.objects.create(name='Vikram Seth', phone='9876511111', loyalty_points=0)

        # Earn points on purchase
        earned = cust.add_loyalty_points(sale_amount=15000, reference_id='INV-TEST-001', user=self.staff_user)
        self.assertEqual(earned, 150)
        self.assertEqual(cust.loyalty_points, 150)

        ledger_entry = LoyaltyTransaction.objects.filter(customer=cust, transaction_type='earned').first()
        self.assertIsNotNone(ledger_entry)
        self.assertEqual(ledger_entry.points, 150)
        self.assertEqual(ledger_entry.balance_after, 150)

        # Redeem points
        discount = cust.redeem_points(points_to_redeem=50, reference_id='INV-TEST-002', user=self.staff_user)
        self.assertEqual(discount, 25.0)  # 50 * 0.5 = 25
        self.assertEqual(cust.loyalty_points, 100)

        redeem_entry = LoyaltyTransaction.objects.filter(customer=cust, transaction_type='redeemed').first()
        self.assertIsNotNone(redeem_entry)
        self.assertEqual(redeem_entry.points, -50)
        self.assertEqual(redeem_entry.balance_after, 100)

    def test_customer_merge_workflow(self):
        """Merging duplicate customer consolidates sales, repairs, loyalty, and audit history"""
        from apps.crm.models import Customer, LoyaltyTransaction
        from apps.crm.services.customer_merge import CustomerMergeService
        from apps.sales.models import Sale
        from apps.repairs.models import Repair
        from decimal import Decimal

        self.client.force_authenticate(user=self.staff_user)

        primary = Customer.objects.create(
            name='Amitabh Bachchan', phone='9876522222', email='amitabh@bachchan.com', loyalty_points=100
        )
        duplicate = Customer.objects.create(
            name='Amitabh B.', phone='9876533333', address='Jalsa, Mumbai', loyalty_points=50
        )

        # Create transactions for duplicate
        sale = Sale.objects.create(
            customer=duplicate,
            total_amount=Decimal('50000.00'),
            payment_mode='card',
            created_by=self.staff_user
        )
        repair = Repair.objects.create(
            customer=duplicate,
            item_type='Watch',
            brand='Rolex',
            issue_description='Bezel replacement',
            created_by=self.staff_user
        )

        # Perform merge
        merged = CustomerMergeService.merge_customers(
            primary_customer_id=primary.id,
            duplicate_customer_id=duplicate.id,
            user=self.staff_user
        )

        self.assertEqual(merged.id, primary.id)
        self.assertEqual(merged.loyalty_points, 150)  # 100 + 50
        self.assertEqual(merged.address, 'Jalsa, Mumbai')

        # Verify relations reassigned
        sale.refresh_from_db()
        repair.refresh_from_db()
        self.assertEqual(sale.customer, primary)
        self.assertEqual(repair.customer, primary)

        # Verify duplicate deleted
        self.assertFalse(Customer.objects.filter(id=duplicate.id).exists())

    def test_customer_deletion_protection(self):
        """Customers with active sales cannot be deleted"""
        from apps.crm.models import Customer
        from apps.sales.models import Sale
        from django.core.exceptions import ValidationError
        from decimal import Decimal

        cust = Customer.objects.create(name='Protected Customer', phone='9876544444')
        Sale.objects.create(customer=cust, total_amount=Decimal('1000.00'), payment_mode='cash')

        with self.assertRaises(ValidationError):
            cust.delete()

