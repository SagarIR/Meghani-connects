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
