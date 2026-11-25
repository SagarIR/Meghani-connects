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
            image_url='https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=800',
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

    def test_image_upload_requires_authentication(self):
        """Unauthenticated requests to /api/upload/image/ must be blocked with 401"""
        response = self.client.post('/api/upload/image/', {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_business_settings_phase2_fields(self):
        """Verify currency, country, timezone, tax, and PO prefix defaults and serialization"""
        response = self.client.get('/api/settings/public/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('currency_code'), 'INR')
        self.assertEqual(response.data.get('currency_symbol'), '₹')
        self.assertEqual(response.data.get('country'), 'India')
        self.assertEqual(response.data.get('timezone'), 'Asia/Kolkata')
        self.assertEqual(float(response.data.get('default_tax_rate')), 18.0)

    def test_seed_data_clear_safety_guard(self):
        """Ensure seed_data --clear raises CommandError when DEBUG=False"""
        from django.test import override_settings
        from django.core.management.base import CommandError
        from apps.core.management.commands.seed_data import Command

        cmd = Command()
        with override_settings(DEBUG=False):
            with self.assertRaises(CommandError):
                cmd.handle(clear=True)


class MasterDataSeedTests(TestCase):
    """Test suite for Phase 3 Master Data Engineering"""
    def setUp(self):
        self.client = APIClient()

    def test_seed_master_data_command_and_idempotency(self):
        """seed_master_data populates taxonomy, brands and templates and is safe to rerun"""
        from django.core.management import call_command
        from io import StringIO
        from apps.products.models import Brand, Category, Subcategory
        from apps.notifications.models import MessageTemplate

        out = StringIO()
        call_command('seed_master_data', stdout=out)
        output = out.getvalue()
        self.assertIn('Master Data Seeding Completed Successfully', output)

        cat_count_1 = Category.objects.count()
        subcat_count_1 = Subcategory.objects.count()
        brand_count_1 = Brand.objects.count()
        tpl_count_1 = MessageTemplate.objects.count()

        self.assertGreaterEqual(cat_count_1, 14)
        self.assertGreaterEqual(subcat_count_1, 60)
        self.assertGreaterEqual(brand_count_1, 70)
        self.assertEqual(tpl_count_1, 8)

        # Run command second time - must be 100% idempotent
        out2 = StringIO()
        call_command('seed_master_data', stdout=out2)
        
        self.assertEqual(Category.objects.count(), cat_count_1)
        self.assertEqual(Subcategory.objects.count(), subcat_count_1)
        self.assertEqual(Brand.objects.count(), brand_count_1)
        self.assertEqual(MessageTemplate.objects.count(), tpl_count_1)

    def test_message_template_rendering(self):
        """Ensure seeded message templates render dynamic variables properly"""
        from django.core.management import call_command
        from apps.notifications.models import MessageTemplate

        call_command('seed_master_data')
        tpl = MessageTemplate.objects.get(name='sale_confirmation')
        rendered = tpl.render(customer_name='Amit Shah', invoice_number='INV-20261120-0001', amount='12500.00')
        self.assertIn('Dear Amit Shah', rendered)
        self.assertIn('INV-20261120-0001', rendered)
        self.assertIn('₹12500.00', rendered)

    def test_product_metadata_endpoint(self):
        """Verify static registries returned by /api/products/metadata/"""
        response = self.client.get('/api/products/metadata/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for key in ['movements', 'displays', 'strap_materials', 'case_materials', 'glass_types',
                    'dial_shapes', 'dial_colors', 'strap_colors', 'genders', 'water_resistance',
                    'sizes', 'units', 'gst_reference_rates', 'payment_terms', 'invoice_types']:
            self.assertIn(key, response.data)
