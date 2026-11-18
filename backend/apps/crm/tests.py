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
