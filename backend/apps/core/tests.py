from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.models import BusinessSettings, Offer, GalleryItem, Milestone


class PublicCoreApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.settings = BusinessSettings.objects.create(
            business_name='Meghani Connects Luxury Timepieces',
            phone='+91 99042 22166',
            whatsapp_number='+919904222166',
            email='concierge@meghaniconnects.com',
            address_line1='Station Road, Surendranagar, Gujarat 363001',
            opening_hours_weekdays='10:00 AM - 8:30 PM',
            opening_hours_sunday='10:30 AM - 2:00 PM',
            privacy_policy='We respect your data privacy.'
        )
        self.offer = Offer.objects.create(
            title='Festive Horology Offer',
            code='HOROLOGY10',
            discount='10% Off',
            is_active=True,
            display_order=1
        )
        self.inactive_offer = Offer.objects.create(
            title='Expired Offer',
            code='EXPIRED',
            discount='Expired',
            is_active=False,
            display_order=2
        )
        self.gallery = GalleryItem.objects.create(
            title='VIP Lounge',
            category='Storefront',
            image_url='https://images.unsplash.com/photo-1547996160-71dfabb19283?w=800',
            is_active=True,
            display_order=1
        )
        self.milestone = Milestone.objects.create(
            year='1985',
            title='Founding',
            description='First boutique established',
            display_order=1
        )

    def test_public_settings_endpoint(self):
        """Public settings endpoint returns store information"""
        response = self.client.get('/api/settings/public/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['business_name'], 'Meghani Connects Luxury Timepieces')
        self.assertEqual(response.data['phone'], '+91 99042 22166')
        self.assertEqual(response.data['privacy_policy'], 'We respect your data privacy.')

    def test_public_offers_endpoint(self):
        """Offers endpoint only returns active offers ordered correctly"""
        response = self.client.get('/api/offers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if isinstance(response.data, dict) and 'results' in response.data else response.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['code'], 'HOROLOGY10')

    def test_public_gallery_endpoint(self):
        """Gallery endpoint returns active items"""
        response = self.client.get('/api/gallery/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if isinstance(response.data, dict) and 'results' in response.data else response.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], 'VIP Lounge')

    def test_public_milestones_endpoint(self):
        """Milestones endpoint returns historical roadmap"""
        response = self.client.get('/api/milestones/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if isinstance(response.data, dict) and 'results' in response.data else response.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['year'], '1985')
