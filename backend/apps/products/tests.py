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
        """Test secure image upload handler with mocked service for authenticated staff"""
        from unittest.mock import patch
        from django.core.files.uploadedfile import SimpleUploadedFile
        from apps.users.models import User
        
        staff_user = User.objects.create_user(username='upload_staff', password='pass', role='staff')
        self.client.force_authenticate(user=staff_user)
        
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
        Brand.objects.all().delete()
        Category.objects.all().delete()
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


class ProductManagementAndStockTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        from apps.users.models import User
        self.admin = User.objects.create_user(username='admin_pos', password='pospass123', role='admin', is_staff=True)
        self.staff = User.objects.create_user(username='staff_pos', password='pospass123', role='staff')
        self.product = Product.objects.create(
            name='Seiko Presage Cocktail',
            brand='Seiko',
            category='analog',
            barcode='SEIKO-COCKTAIL-01',
            cost_price=22000.00,
            selling_price=38000.00,
            stock=10,
            is_active=True
        )

    def test_product_crud_and_barcode_uniqueness(self):
        """Creating a product with duplicate barcode returns 400 Bad Request"""
        self.client.force_authenticate(user=self.admin)
        duplicate_payload = {
            'name': 'Duplicate Seiko',
            'brand': 'Seiko',
            'category': 'analog',
            'barcode': 'SEIKO-COCKTAIL-01',  # already exists
            'cost_price': '22000.00',
            'selling_price': '38000.00',
            'stock': 5
        }
        res = self.client.post('/api/products/', duplicate_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('barcode', res.data)

    def test_stock_update_actions(self):
        """Stock can be updated via add, subtract, and set actions"""
        self.client.force_authenticate(user=self.admin)
        url = f'/api/products/{self.product.id}/update_stock/'

        # Add 5 -> 15
        res_add = self.client.post(url, {'quantity': 5, 'action': 'add'}, format='json')
        self.assertEqual(res_add.status_code, status.HTTP_200_OK)
        self.assertEqual(res_add.data['stock'], 15)

        # Subtract 3 -> 12
        res_sub = self.client.post(url, {'quantity': 3, 'action': 'subtract'}, format='json')
        self.assertEqual(res_sub.status_code, status.HTTP_200_OK)
        self.assertEqual(res_sub.data['stock'], 12)

        # Subtract exceeding stock fails
        res_excess = self.client.post(url, {'quantity': 99, 'action': 'subtract'}, format='json')
        self.assertEqual(res_excess.status_code, status.HTTP_400_BAD_REQUEST)

        # Set stock directly
        res_set = self.client.post(url, {'quantity': 2, 'action': 'set'}, format='json')
        self.assertEqual(res_set.status_code, status.HTTP_200_OK)
        self.assertEqual(res_set.data['stock'], 2)

    def test_soft_delete_and_low_stock(self):
        """Soft delete marks product inactive; low_stock endpoint returns items below threshold"""
        self.client.force_authenticate(user=self.admin)

        # Low stock check (stock is 10, let's create a low stock item with stock=2)
        low_prod = Product.objects.create(
            name='Rare Limited Watch',
            brand='Audemars',
            category='analog',
            barcode='AP-ROYAL-OAK',
            cost_price=1200000.00,
            selling_price=2500000.00,
            stock=2,
            is_active=True
        )
        res_low = self.client.get('/api/products/low_stock/')
        self.assertEqual(res_low.status_code, status.HTTP_200_OK)
        self.assertTrue(any(p['id'] == low_prod.id for p in res_low.data))

        # Soft delete
        res_del = self.client.delete(f'/api/products/{low_prod.id}/')
        self.assertEqual(res_del.status_code, status.HTTP_204_NO_CONTENT)
        low_prod.refresh_from_db()
        self.assertFalse(low_prod.is_active)


class CatalogNormalizationAndIntegrityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        from apps.users.models import User
        self.admin = User.objects.create_user(username='admin_cat', password='catpass123', role='admin', is_staff=True)
        self.staff = User.objects.create_user(username='staff_cat', password='catpass123', role='staff')

        from apps.products.models import Brand, Category, Subcategory
        self.brand_titan = Brand.objects.get_or_create(name='Titan', defaults={'slug': 'titan'})[0]
        self.cat_analog = Category.objects.get_or_create(slug='analog', defaults={'name': 'Analog Timepieces'})[0]
        self.cat_smart = Category.objects.get_or_create(slug='smart', defaults={'name': 'Smart & Hybrid'})[0]

        self.sub_mens = Subcategory.objects.get_or_create(
            category=self.cat_analog, slug='mens-analog', defaults={'name': "Men's Analog"}
        )[0]
        self.sub_smart = Subcategory.objects.get_or_create(
            category=self.cat_smart, slug='smartwatches', defaults={'name': "Smartwatches"}
        )[0]

    def test_relational_brand_and_category_fk(self):
        """Product relations link directly to Brand and Category instances with PROTECT on delete"""
        from django.db.models import ProtectedError
        prod = Product.objects.create(
            name='Titan Edge Ceramic',
            brand=self.brand_titan,
            category=self.cat_analog,
            subcategory=self.sub_mens,
            cost_price=10000.00,
            selling_price=18000.00,
            mrp=20000.00
        )
        self.assertEqual(prod.brand.id, self.brand_titan.id)
        self.assertEqual(prod.category.id, self.cat_analog.id)
        self.assertEqual(prod.subcategory.id, self.sub_mens.id)
        self.assertTrue(prod.article_code.startswith('TIT-'))

        # Deleting brand is protected
        with self.assertRaises(ProtectedError):
            self.brand_titan.delete()

        # Deleting category is protected
        with self.assertRaises(ProtectedError):
            self.cat_analog.delete()

    def test_subcategory_must_belong_to_category_validation(self):
        """API rejects assigning a subcategory that does not belong to the selected category"""
        self.client.force_authenticate(user=self.admin)
        payload = {
            'name': 'Mismatched Watch',
            'brand': 'Titan',
            'category': 'analog',
            'subcategory': 'smartwatches',  # Belongs to smart, not analog!
            'cost_price': '2000.00',
            'selling_price': '4000.00',
            'mrp': '5000.00',
            'stock': 10
        }
        res = self.client.post('/api/products/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('subcategory', res.data)

    def test_cost_price_permission_protection(self):
        """Staff cannot create/edit products (403), and reading products omits confidential cost_price and profit"""
        prod = Product.objects.create(
            name='Permission Test Watch',
            brand=self.brand_titan,
            category=self.cat_analog,
            cost_price=5000.00,
            selling_price=9000.00,
            mrp=10000.00,
            stock=5
        )
        # 1. Staff write attempt is blocked with 403 Forbidden
        self.client.force_authenticate(user=self.staff)
        res_post = self.client.post('/api/products/', {'name': 'Unauthorized', 'brand': 'Titan', 'category': 'analog', 'cost_price': 1000, 'selling_price': 2000, 'stock': 1})
        self.assertEqual(res_post.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Staff read has cost_price and profit stripped
        res_get = self.client.get(f'/api/products/{prod.id}/')
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        self.assertNotIn('cost_price', res_get.data)
        self.assertNotIn('profit_margin', res_get.data)

        # 3. Admin read includes cost_price and profit
        self.client.force_authenticate(user=self.admin)
        res_admin = self.client.get(f'/api/products/{prod.id}/')
        self.assertEqual(res_admin.status_code, status.HTTP_200_OK)
        self.assertIn('cost_price', res_admin.data)
        self.assertEqual(float(res_admin.data['cost_price']), 5000.00)

    def test_price_validation_selling_price_cannot_exceed_mrp(self):
        """Selling price exceeding MRP is rejected with 400 Bad Request"""
        self.client.force_authenticate(user=self.admin)
        payload = {
            'name': 'Overpriced Watch',
            'brand': 'Titan',
            'category': 'analog',
            'cost_price': '2000.00',
            'selling_price': '7000.00',
            'mrp': '5000.00',  # Selling price > MRP!
            'stock': 5
        }
        res = self.client.post('/api/products/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('selling_price', res.data)

    def test_product_deletion_historical_sales_protection(self):
        """Hard delete is blocked by PROTECT when product has historical sales"""
        from apps.sales.models import Sale, SaleItem
        from django.db.models import ProtectedError

        prod = Product.objects.create(
            name='Historical Sale Watch',
            brand=self.brand_titan,
            category=self.cat_analog,
            cost_price=3000.00,
            selling_price=5000.00,
            stock=10
        )
        sale = Sale.objects.create(
            total_amount=5000.00,
            payment_mode='cash'
        )
        SaleItem.objects.create(
            sale=sale,
            product=prod,
            quantity=1,
            unit_price=5000.00,
            cost_price=3000.00,
            subtotal=5000.00
        )

        with self.assertRaises(ProtectedError):
            prod.delete()





