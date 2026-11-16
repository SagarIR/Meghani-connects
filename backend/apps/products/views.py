from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAdminUser, AllowAny
from django.db.models import Q
from django.conf import settings
from django.http import HttpResponse
from .models import Product
from .serializers import (
    ProductSerializer, ProductListSerializer, ProductStockUpdateSerializer,
    PublicProductSerializer
)
from .import_service import ProductImportService


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'brand', 'barcode', 'category']
    ordering_fields = ['name', 'selling_price', 'stock', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by brand
        brand = self.request.query_params.get('brand')
        if brand:
            queryset = queryset.filter(brand__icontains=brand)
        
        # Filter low stock
        low_stock = self.request.query_params.get('low_stock')
        if low_stock == 'true':
            threshold = getattr(settings, 'LOW_STOCK_THRESHOLD', 5)
            queryset = queryset.filter(stock__lte=threshold)
        
        return queryset

    def destroy(self, request, *args, **kwargs):
        """Soft delete - just mark as inactive"""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Quick search for POS system"""
        query = request.query_params.get('q', '')
        if len(query) < 2:
            return Response([])
        
        products = Product.objects.filter(
            Q(name__icontains=query) |
            Q(brand__icontains=query) |
            Q(barcode__icontains=query),
            is_active=True,
            stock__gt=0
        )[:20]
        
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='barcode/(?P<code>[^/.]+)')
    def by_barcode(self, request, code=None):
        """Get product by barcode"""
        try:
            product = Product.objects.get(barcode=code, is_active=True)
            serializer = ProductSerializer(product)
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
            
            if action_type == 'add':
                product.stock += quantity
            elif action_type == 'subtract':
                if product.stock < quantity:
                    return Response({'error': 'Insufficient stock'}, status=status.HTTP_400_BAD_REQUEST)
                product.stock -= quantity
            else:  # set
                product.stock = quantity
            
            product.save()
            return Response(ProductSerializer(product).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get all low stock products"""
        threshold = getattr(settings, 'LOW_STOCK_THRESHOLD', 5)
        products = Product.objects.filter(stock__lte=threshold, is_active=True)
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get all product categories with counts"""
        from django.db.models import Count
        categories = Product.objects.filter(is_active=True).values('category').annotate(
            count=Count('id')
        ).order_by('category')
        return Response(categories)

    @action(detail=False, methods=['get'])
    def brands(self, request):
        """Get all unique brands"""
        brands = Product.objects.filter(is_active=True).exclude(
            brand=''
        ).values_list('brand', flat=True).distinct().order_by('brand')
        return Response(list(brands))


class ProductImportView(APIView):
    """
    Import products from Excel or CSV file.
    """
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """
        Import products from uploaded file.
        
        Query params:
            update_existing: If 'true', update products with matching barcode
        """
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
        
        update_existing = request.query_params.get('update_existing', 'false').lower() == 'true'
        
        service = ProductImportService()
        
        # Determine file type and process
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
    
    def get(self, request):
        """Download sample import template."""
        from io import BytesIO
        
        wb = ProductImportService.get_sample_template()
        
        # Save to BytesIO
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
    permission_classes = [AllowAny]
    serializer_class = PublicProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'brand', 'category', 'description']
    ordering_fields = ['name', 'selling_price', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True)

        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        brand = self.request.query_params.get('brand')
        if brand:
            queryset = queryset.filter(brand__iexact=brand)

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

        return queryset

    @action(detail=False, methods=['get'])
    def brands(self, request):
        """List unique active brands for discovery"""
        brands = Product.objects.filter(is_active=True).exclude(
            brand=''
        ).values_list('brand', flat=True).distinct().order_by('brand')
        return Response(list(brands))

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """List categories with product counts"""
        from django.db.models import Count
        categories = Product.objects.filter(is_active=True).values('category').annotate(
            count=Count('id')
        ).order_by('category')
        return Response(categories)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """List featured watches for public showcase"""
        products = Product.objects.filter(is_active=True)[:8]
        serializer = PublicProductSerializer(products, many=True)
        return Response(serializer.data)
