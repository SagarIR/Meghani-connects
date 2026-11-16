from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.products.models import Product


class PublicProductCatalogueTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Regular visible watch
        self.product1 = Product.objects.create(
            name='Titan Classic Analog',
            brand='Titan',
            category='analog',
            cost_price=2000.00,
            selling_price=3500.00,
            price_visible=True,
            availability='in_stock',
            stock=10,
            supplier_name='Confidential Supplier Ltd'
        )

        # Exclusive watch with price hidden
        self.product2 = Product.objects.create(
            name='Exclusive Atelier Tourbillon',
            brand='Meghani Atelier',
            category='analog',
            cost_price=150000.00,
            selling_price=350000.00,
            price_visible=False,
            availability='on_request',
            stock=1,
            supplier_name='Secret Artisan'
        )

    def test_unauthenticated_public_catalogue_access(self):
        """Public visitors can view the catalogue without logging in"""
        response = self.client.get('/api/products/public/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_confidential_fields_omitted(self):
        """Ensure cost_price and supplier_name are never exposed publicly"""
        response = self.client.get(f'/api/products/public/{self.product1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        self.assertNotIn('cost_price', data)
        self.assertNotIn('supplier_name', data)
        self.assertNotIn('profit_margin', data)
        self.assertNotIn('profit_percentage', data)
        self.assertEqual(data['price'], 3500.00)

    def test_price_visibility_enforcement(self):
        """When price_visible is false or on_request, price MUST be None"""
        response = self.client.get(f'/api/products/public/{self.product2.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        self.assertIsNone(data['price'])
        self.assertFalse(data['price_visible'])
        self.assertEqual(data['availability'], 'on_request')
        self.assertNotIn('cost_price', data)

    def test_image_upload_endpoint(self):
        """Test secure image upload handler with mocked service"""
        from unittest.mock import patch
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        with patch('apps.core.cloudinary_service.CloudinaryMediaService.upload_image') as mock_upload:
            mock_upload.return_value = {
                'success': True,
                'url': 'https://res.cloudinary.com/meghani-watches/image/upload/v1234/test_watch.jpg',
                'public_id': 'meghani-watches/test_watch',
                'provider': 'cloudinary'
            }
            
            uploaded_file = SimpleUploadedFile("test_watch.png", b"fake_png_data", content_type="image/png")
            response = self.client.post('/api/upload/image/', {'file': uploaded_file}, format='multipart')
            
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertTrue(response.data.get('success'))
            self.assertEqual(response.data.get('provider'), 'cloudinary')
            self.assertIn('res.cloudinary.com', response.data.get('url'))

    def test_public_brands_and_categories_endpoints(self):
        """Verify dynamic brands and categories endpoints"""
        from apps.products.models import Brand, Category
        Brand.objects.create(name='Rolex', slug='rolex', display_order=1, is_active=True)
        Brand.objects.create(name='Secret Brand', slug='secret', display_order=2, is_active=False)
        Category.objects.create(name='Chronograph', slug='chronograph', display_order=1, is_active=True)

        # Brands
        res_brands = self.client.get('/api/brands/')
        self.assertEqual(res_brands.status_code, status.HTTP_200_OK)
        brand_results = res_brands.data['results'] if isinstance(res_brands.data, dict) and 'results' in res_brands.data else res_brands.data
        self.assertEqual(len(brand_results), 1)
        self.assertEqual(brand_results[0]['slug'], 'rolex')

        # Categories
        res_cats = self.client.get('/api/categories/')
        self.assertEqual(res_cats.status_code, status.HTTP_200_OK)
        cat_results = res_cats.data['results'] if isinstance(res_cats.data, dict) and 'results' in res_cats.data else res_cats.data
        self.assertEqual(len(cat_results), 1)
        self.assertEqual(cat_results[0]['slug'], 'chronograph')



