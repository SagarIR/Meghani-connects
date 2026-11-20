from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAdminUser, AllowAny, IsAuthenticated
from apps.users.permissions import CanManageProducts
from django.db.models import Q
from django.core.exceptions import ValidationError
from django.conf import settings
from django.http import HttpResponse
from .models import Product, ProductImage, Brand, Category, Subcategory
from .serializers import (
    ProductSerializer, ProductListSerializer, ProductStockUpdateSerializer,
    PublicProductSerializer, BrandSerializer, CategorySerializer, SubcategorySerializer,
    ProductImageSerializer
)
from .import_service import ProductImportService


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True).select_related('brand', 'category', 'subcategory')
    serializer_class = ProductSerializer
    permission_classes = [CanManageProducts]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'name', 'brand__name', 'barcode', 'article_code', 'model_number',
        'category__name', 'category__slug', 'subcategory__name'
    ]
    ordering_fields = ['name', 'selling_price', 'mrp', 'stock', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category (by slug or id)
        category = self.request.query_params.get('category')
        if category:
            if category.isdigit():
                queryset = queryset.filter(category_id=int(category))
            else:
                queryset = queryset.filter(Q(category__slug=category) | Q(category_slug=category))

        # Filter by subcategory (by slug or id)
        subcategory = self.request.query_params.get('subcategory')
        if subcategory:
            if subcategory.isdigit():
                queryset = queryset.filter(subcategory_id=int(subcategory))
            else:
                queryset = queryset.filter(subcategory__slug=subcategory)
        
        # Filter by brand (by name, id, or icontains)
        brand = self.request.query_params.get('brand')
        if brand:
            if brand.isdigit():
                queryset = queryset.filter(brand_id=int(brand))
            else:
                queryset = queryset.filter(Q(brand__name__icontains=brand) | Q(brand_text__icontains=brand))
        
        # Filter low stock
        low_stock = self.request.query_params.get('low_stock')
        if low_stock == 'true':
            threshold = getattr(settings, 'LOW_STOCK_THRESHOLD', 5)
            queryset = queryset.filter(stock__lte=threshold)
        
        return queryset

    def destroy(self, request, *args, **kwargs):
        """Soft delete - marks as inactive preserving historical relational integrity"""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Quick search for POS and staff portal"""
        query = request.query_params.get('q', '').strip()
        if len(query) < 2:
            return Response([])
        
        products = Product.objects.filter(
            Q(name__icontains=query) |
            Q(brand__name__icontains=query) |
            Q(brand_text__icontains=query) |
            Q(barcode__icontains=query) |
            Q(article_code__icontains=query) |
            Q(model_number__icontains=query),
            is_active=True,
            stock__gt=0
        ).select_related('brand', 'category', 'subcategory')[:20]
        
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='barcode/(?P<code>[^/.]+)')
    def by_barcode(self, request, code=None):
        """Get product by barcode or article code"""
        try:
            product = Product.objects.select_related('brand', 'category', 'subcategory').get(
                Q(barcode=code) | Q(article_code=code),
                is_active=True
            )
            serializer = ProductSerializer(product, context={'request': request})
            return Response(serializer.data)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def update_stock(self, request, pk=None):
        """Update product stock"""
        product = self.get_object()
        serializer = ProductStockUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            quantity = serializer.data['quantity']
            action_type = serializer.data['action']
            from apps.purchasing.services import InventoryService
            
            try:
                if action_type == 'add':
                    InventoryService.record_movement(
                        product_or_id=product,
                        movement_type='manual_adjustment',
                        qty_in=quantity,
                        qty_out=0,
                        reason='Stock added via product inventory manager',
                        user=request.user
                    )
                elif action_type == 'subtract':
                    InventoryService.record_movement(
                        product_or_id=product,
                        movement_type='manual_adjustment',
                        qty_in=0,
                        qty_out=quantity,
                        reason='Stock deducted via product inventory manager',
                        user=request.user
                    )
                else:  # set
                    delta = quantity - product.stock
                    if delta > 0:
                        InventoryService.record_movement(
                            product_or_id=product,
                            movement_type='manual_adjustment',
                            qty_in=delta,
                            qty_out=0,
                            reason=f'Stock adjusted to {quantity}',
                            user=request.user
                        )
                    elif delta < 0:
                        InventoryService.record_movement(
                            product_or_id=product,
                            movement_type='manual_adjustment',
                            qty_in=0,
                            qty_out=abs(delta),
                            reason=f'Stock adjusted to {quantity}',
                            user=request.user
                        )
                product.refresh_from_db()
                return Response(ProductSerializer(product, context={'request': request}).data)
            except ValidationError as e:
                return Response(e.message_dict if hasattr(e, 'message_dict') else {'error': str(e)},
                                status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get all low stock products"""
        threshold = getattr(settings, 'LOW_STOCK_THRESHOLD', 5)
        products = Product.objects.filter(stock__lte=threshold, is_active=True).select_related('brand', 'category', 'subcategory')
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get all product categories with subcategories and counts"""
        categories = Category.objects.filter(is_active=True).prefetch_related('subcategories')
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def brands(self, request):
        """Get all unique brands"""
        brands = Brand.objects.filter(is_active=True).order_by('display_order', 'name')
        serializer = BrandSerializer(brands, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def metadata(self, request):
        """Standardized attributes and registries for products, horology attributes and inventory"""
        from . import constants
        return Response({
            'movements': constants.WATCH_MOVEMENTS,
            'displays': constants.WATCH_DISPLAYS,
            'strap_materials': constants.STRAP_MATERIALS,
            'case_materials': constants.CASE_MATERIALS,
            'glass_types': constants.GLASS_TYPES,
            'dial_shapes': constants.DIAL_SHAPES,
            'dial_colors': constants.DIAL_COLORS,
            'strap_colors': constants.STRAP_COLORS,
            'genders': constants.GENDER_CHOICES,
            'water_resistance': constants.WATER_RESISTANCE_CHOICES,
            'sizes': constants.PRODUCT_SIZES,
            'units': constants.UNITS_OF_MEASURE,
            'gst_reference_rates': constants.GST_REFERENCE_RATES,
            'payment_terms': constants.SUPPLIER_PAYMENT_TERMS,
            'invoice_types': constants.INVOICE_TYPES,
            'adjustment_reasons': constants.STOCK_ADJUSTMENT_REASONS,
            'customer_classifications': constants.CUSTOMER_CLASSIFICATIONS,
        })

    @action(detail=True, methods=['post'], url_path='gallery')
    def add_gallery_image(self, request, pk=None):
        """Staff: Add gallery image to a product"""
        product = self.get_object()
        image_url = request.data.get('image_url')
        file_obj = request.FILES.get('image') or request.FILES.get('file')
        display_order = request.data.get('display_order', 0)
        img = ProductImage.objects.create(
            product=product,
            image=file_obj,
            image_url=image_url or '',
            display_order=display_order
        )
        return Response(ProductImageSerializer(img).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='gallery/(?P<image_id>[^/.]+)')
    def delete_gallery_image(self, request, pk=None, image_id=None):
        """Staff: Delete gallery image from a product"""
        product = self.get_object()
        try:
            img = product.gallery_images.get(id=image_id)
            img.delete()
            return Response({'success': True, 'message': 'Image deleted'})
        except Exception:
            return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)


class SubcategoryViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for Subcategories belonging to Categories.
    """
    serializer_class = SubcategorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'category__name', 'slug']
    ordering_fields = ['display_order', 'name']
    ordering = ['display_order', 'name']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [CanManageProducts()]

    def get_queryset(self):
        qs = Subcategory.objects.select_related('category')
        category = self.request.query_params.get('category')
        if category:
            if category.isdigit():
                qs = qs.filter(category_id=int(category))
            else:
                qs = qs.filter(category__slug=category)
        if not (self.request.user and self.request.user.is_authenticated):
            qs = qs.filter(is_active=True)
        return qs


class ProductImportView(APIView):
    """
    Import products from Excel or CSV file.
    """
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
        
        update_existing = request.query_params.get('update_existing', 'false').lower() == 'true'
        service = ProductImportService()
        
        filename = file.name.lower()
        if filename.endswith('.xlsx') or filename.endswith('.xls'):
            result = service.import_from_excel(file, update_existing)
        elif filename.endswith('.csv'):
            result = service.import_from_csv(file, update_existing)
        else:
            return Response(
                {'error': 'Unsupported file format. Use Excel (.xlsx) or CSV (.csv)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(result)


class ProductExportTemplateView(APIView):
    """
    Download sample Excel template for product import.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from io import BytesIO
        wb = ProductImportService.get_sample_template()
        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="product_import_template.xlsx"'
        return response


class PublicProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public customer-facing product catalogue endpoint.
    Unauthenticated read-only access.
    Excludes internal confidential fields (cost_price, supplier_name, profit_margin).
    Strictly respects price visibility (returns None if price_visible=False).
    """
    serializer_class = PublicProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'brand__name', 'category__name', 'description', 'article_code', 'model_number']
    ordering_fields = ['name', 'selling_price', 'created_at']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['add_gallery_image', 'delete_gallery_image']:
            return [CanManageProducts()]
        return [AllowAny()]

    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True).select_related('brand', 'category', 'subcategory')

        category = self.request.query_params.get('category')
        if category:
            if category.isdigit():
                queryset = queryset.filter(category_id=int(category))
            else:
                queryset = queryset.filter(Q(category__slug=category) | Q(category_slug=category))

        subcategory = self.request.query_params.get('subcategory')
        if subcategory:
            if subcategory.isdigit():
                queryset = queryset.filter(subcategory_id=int(subcategory))
            else:
                queryset = queryset.filter(subcategory__slug=subcategory)

        brand = self.request.query_params.get('brand')
        if brand:
            if brand.isdigit():
                queryset = queryset.filter(brand_id=int(brand))
            else:
                queryset = queryset.filter(Q(brand__name__iexact=brand) | Q(brand_text__iexact=brand))

        availability = self.request.query_params.get('availability')
        if availability:
            queryset = queryset.filter(availability=availability)

        min_price = self.request.query_params.get('min_price')
        if min_price:
            try:
                queryset = queryset.filter(selling_price__gte=float(min_price))
            except ValueError:
                pass

        max_price = self.request.query_params.get('max_price')
        if max_price:
            try:
                queryset = queryset.filter(selling_price__lte=float(max_price))
            except ValueError:
                pass

        featured = self.request.query_params.get('featured')
        if featured == 'true':
            queryset = queryset.filter(is_featured=True)

        return queryset

    @action(detail=False, methods=['get'])
    def brands(self, request):
        """List active brands with details"""
        db_brands = Brand.objects.filter(is_active=True)
        serializer = BrandSerializer(db_brands, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """List categories with subcategories and product counts"""
        db_categories = Category.objects.filter(is_active=True).prefetch_related('subcategories')
        serializer = CategorySerializer(db_categories, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def metadata(self, request):
        """Standardized attributes and registries for public catalogue and filters"""
        from . import constants
        return Response({
            'movements': constants.WATCH_MOVEMENTS,
            'displays': constants.WATCH_DISPLAYS,
            'strap_materials': constants.STRAP_MATERIALS,
            'case_materials': constants.CASE_MATERIALS,
            'glass_types': constants.GLASS_TYPES,
            'dial_shapes': constants.DIAL_SHAPES,
            'dial_colors': constants.DIAL_COLORS,
            'strap_colors': constants.STRAP_COLORS,
            'genders': constants.GENDER_CHOICES,
            'water_resistance': constants.WATER_RESISTANCE_CHOICES,
            'sizes': constants.PRODUCT_SIZES,
            'units': constants.UNITS_OF_MEASURE,
            'gst_reference_rates': constants.GST_REFERENCE_RATES,
        })

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """List featured watches for public showcase"""
        products = Product.objects.filter(is_active=True, is_featured=True).select_related('brand', 'category', 'subcategory')
        if not products.exists():
            products = Product.objects.filter(is_active=True).select_related('brand', 'category', 'subcategory')[:8]
        serializer = PublicProductSerializer(products, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='gallery')
    def add_gallery_image(self, request, pk=None):
        """Add an additional gallery image to a product"""
        product = self.get_object()
        image_url = request.data.get('image_url')
        file_obj = request.FILES.get('image') or request.FILES.get('file')
        display_order = request.data.get('display_order', 0)
        img = ProductImage.objects.create(
            product=product,
            image=file_obj,
            image_url=image_url or '',
            display_order=display_order
        )
        return Response(ProductImageSerializer(img).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='gallery/(?P<image_id>[^/.]+)')
    def delete_gallery_image(self, request, pk=None, image_id=None):
        """Delete a gallery image from a product"""
        product = self.get_object()
        try:
            img = product.gallery_images.get(id=image_id)
            img.delete()
            return Response({'success': True, 'message': 'Image deleted'})
        except Exception:
            return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)


class BrandViewSet(viewsets.ModelViewSet):
    serializer_class = BrandSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'country', 'tagline']
    ordering_fields = ['display_order', 'name', 'created_at']
    ordering = ['display_order', 'name']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [CanManageProducts()]

    def get_queryset(self):
        if self.request.user and self.request.user.is_authenticated:
            return Brand.objects.all()
        return Brand.objects.filter(is_active=True)

    def get_object(self):
        lookup_val = self.kwargs.get('pk') or self.kwargs.get('slug')
        if lookup_val and str(lookup_val).isdigit():
            return Brand.objects.get(id=int(lookup_val))
        return Brand.objects.get(slug=lookup_val)


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'tagline', 'description']
    ordering_fields = ['display_order', 'name']
    ordering = ['display_order', 'name']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [CanManageProducts()]

    def get_queryset(self):
        if self.request.user and self.request.user.is_authenticated:
            return Category.objects.all().prefetch_related('subcategories')
        return Category.objects.filter(is_active=True).prefetch_related('subcategories')

    def get_object(self):
        lookup_val = self.kwargs.get('pk') or self.kwargs.get('slug')
        if lookup_val and str(lookup_val).isdigit():
            return Category.objects.get(id=int(lookup_val))
        return Category.objects.get(slug=lookup_val)
