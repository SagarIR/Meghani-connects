from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import HttpResponse
from io import BytesIO
from django.db.models import Q, Sum
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.users.permissions import IsManagerOrAbove
from .models import Customer, Enquiry, LoyaltyTransaction
from .serializers import (
    CustomerSerializer, CustomerListSerializer, CustomerLoyaltySerializer,
    EnquirySerializer, LoyaltyTransactionSerializer, CustomerMergeSerializer
)
from .services.customer_merge import CustomerMergeService
from .import_service import CustomerImportService


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'phone', 'email']
    ordering_fields = ['name', 'loyalty_points', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return CustomerListSerializer
        return CustomerSerializer

    def destroy(self, request, *args, **kwargs):
        is_admin = request.user.is_superuser or getattr(request.user, 'role', '') in ['admin', 'manager']
        if not is_admin:
            return Response(
                {'error': 'Only administrators and managers are authorized to delete customer records.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Quick search by phone or name"""
        query = request.query_params.get('q', '')
        if len(query) < 2:
            return Response([])
        
        customers = Customer.objects.filter(
            Q(name__icontains=query) | Q(phone__icontains=query)
        )[:10]
        
        serializer = CustomerListSerializer(customers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='phone/(?P<phone>[^/.]+)')
    def by_phone(self, request, phone=None):
        """Get customer by phone number"""
        try:
            customer = Customer.objects.get(phone=phone)
            serializer = CustomerSerializer(customer)
            return Response(serializer.data)
        except Customer.DoesNotExist:
            return Response({'error': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def purchases(self, request, pk=None):
        """Get customer purchase history"""
        customer = self.get_object()
        from apps.sales.serializers import SaleListSerializer
        sales = customer.sales.all().order_by('-sale_date')[:20]
        serializer = SaleListSerializer(sales, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def repairs(self, request, pk=None):
        """Get customer repair history"""
        customer = self.get_object()
        from apps.repairs.serializers import RepairListSerializer
        repairs = customer.repairs.all().order_by('-received_date')[:20]
        serializer = RepairListSerializer(repairs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def loyalty(self, request, pk=None):
        """Add or redeem loyalty points via immutable ledger"""
        customer = self.get_object()
        serializer = CustomerLoyaltySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        points = serializer.validated_data['points']
        action_type = serializer.validated_data['action']
        reason = serializer.validated_data.get('reason', '')

        if action_type == 'add':
            earned = customer.add_loyalty_points(
                sale_amount=points * 100,
                reference_id=f"ADJ-{request.user.id if request.user.is_authenticated else 'SYS'}",
                reason=reason or 'Manual loyalty point adjustment by staff',
                user=request.user
            )
            return Response({
                'message': f'{points} points added',
                'new_balance': customer.loyalty_points
            })
        else:  # redeem
            if customer.loyalty_points < points:
                return Response({'error': f'Insufficient points. Customer has {customer.loyalty_points} points.'},
                                status=status.HTTP_400_BAD_REQUEST)
            discount = customer.redeem_points(
                points_to_redeem=points,
                reference_id=f"RED-{request.user.id if request.user.is_authenticated else 'SYS'}",
                reason=reason or 'Manual loyalty redemption',
                user=request.user
            )
            return Response({
                'message': f'{points} points redeemed',
                'discount': discount,
                'new_balance': customer.loyalty_points
            })

    @action(detail=True, methods=['get'], url_path='loyalty-ledger')
    def loyalty_ledger(self, request, pk=None):
        """Get customer's immutable loyalty points ledger"""
        customer = self.get_object()
        ledger = customer.loyalty_ledger.all()
        return Response(LoyaltyTransactionSerializer(ledger, many=True).data)

    @action(detail=True, methods=['get'], url_path='dossier')
    def dossier(self, request, pk=None):
        """Unified 360 Customer Intelligence Dossier"""
        customer = self.get_object()
        from apps.sales.serializers import SaleListSerializer, WarrantySerializer
        from apps.repairs.serializers import RepairListSerializer

        sales = customer.sales.all().order_by('-sale_date')
        repairs = customer.repairs.all().order_by('-received_date')
        warranties = customer.warranties.all().order_by('-created_at')
        ledger = customer.loyalty_ledger.all()[:15]

        return Response({
            'customer': CustomerSerializer(customer).data,
            'sales': SaleListSerializer(sales, many=True).data,
            'repairs': RepairListSerializer(repairs, many=True).data,
            'warranties': WarrantySerializer(warranties, many=True).data,
            'loyalty_ledger': LoyaltyTransactionSerializer(ledger, many=True).data,
            'summary': {
                'lifetime_spend': float(customer.total_purchases),
                'total_orders': customer.purchase_count,
                'total_repairs': customer.repair_count,
                'active_warranties': customer.active_warranties_count,
                'loyalty_balance': customer.loyalty_points
            }
        })

    @action(detail=False, methods=['get'], url_path='duplicates', permission_classes=[IsManagerOrAbove])
    def potential_duplicates(self, request):
        """Scan and detect potential duplicate customer profiles"""
        duplicates = CustomerMergeService.find_potential_duplicates()
        result = []
        for d in duplicates:
            result.append({
                'type': d['type'],
                'match_value': d['match_value'],
                'primary': CustomerListSerializer(d['primary_candidate']).data,
                'duplicate': CustomerListSerializer(d['duplicate_candidate']).data
            })
        return Response(result)

    @action(detail=False, methods=['post'], url_path='merge', permission_classes=[IsManagerOrAbove])
    def merge(self, request):
        """Consolidate duplicate customer profile into primary"""
        serializer = CustomerMergeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            merged = CustomerMergeService.merge_customers(
                primary_customer_id=serializer.validated_data['primary_customer_id'],
                duplicate_customer_id=serializer.validated_data['duplicate_customer_id'],
                user=request.user
            )
            return Response(CustomerSerializer(merged).data, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response(e.message_dict if hasattr(e, 'message_dict') else {'detail': str(e)},
                            status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def birthdays_today(self, request):
        """Get customers with birthday today"""
        today = timezone.now().date()
        customers = Customer.objects.filter(
            date_of_birth__month=today.month,
            date_of_birth__day=today.day
        )
        serializer = CustomerListSerializer(customers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def top_customers(self, request):
        """Get top customers by purchase value"""
        limit = int(request.query_params.get('limit', 10))
        customers = Customer.objects.annotate(
            total_spent=Sum('sales__total_amount')
        ).filter(total_spent__isnull=False).order_by('-total_spent')[:limit]
        
        data = [{
            'id': c.id,
            'name': c.name,
            'phone': c.phone,
            'total_spent': c.total_spent,
            'loyalty_points': c.loyalty_points
        } for c in customers]
        
        return Response(data)


class EnquiryViewSet(viewsets.ModelViewSet):
    queryset = Enquiry.objects.all()
    serializer_class = EnquirySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'phone', 'email', 'product_name']
    ordering_fields = ['created_at', 'status']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def convert_to_customer(self, request, pk=None):
        """Convert a web enquiry into a CRM Customer record."""
        enquiry = self.get_object()
        
        customer, created = Customer.objects.get_or_create(
            phone=enquiry.phone,
            defaults={
                'name': enquiry.name,
                'email': enquiry.email or '',
                'notes': f"Converted from Web Enquiry #{enquiry.id}: {enquiry.message or enquiry.enquiry_type}",
            }
        )
        
        enquiry.status = 'converted'
        enquiry.save()
        
        return Response({
            'message': 'Customer record successfully created' if created else 'Existing customer record linked',
            'customer_id': customer.id,
            'customer_name': customer.name,
            'created': created
        })


class CustomerImportView(APIView):
    """
    Import customers from Excel (.xlsx/.xls) or CSV (.csv) file.
    Supports ?update_existing=true to update existing records by phone.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response(
                {
                    'success': False,
                    'error': 'No file uploaded',
                    'imported': 0,
                    'updated': 0,
                    'skipped': 0,
                    'errors': [],
                    'total_errors': 0
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        update_existing = request.query_params.get('update_existing', 'false').lower() == 'true'
        service = CustomerImportService()

        filename = file.name.lower()
        if filename.endswith('.xlsx') or filename.endswith('.xls'):
            result = service.import_from_excel(file, update_existing)
        elif filename.endswith('.csv'):
            result = service.import_from_csv(file, update_existing)
        else:
            return Response(
                {
                    'success': False,
                    'error': 'Unsupported file format. Please upload an Excel (.xlsx) or CSV (.csv) file.',
                    'imported': 0,
                    'updated': 0,
                    'skipped': 0,
                    'errors': [],
                    'total_errors': 0
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        status_code = status.HTTP_200_OK if result.get('success') else status.HTTP_400_BAD_REQUEST
        return Response(result, status=status_code)


class CustomerExportTemplateView(APIView):
    """
    Download sample Excel template for customer bulk import.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wb = CustomerImportService.get_sample_template()
        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)

        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="customer_import_template.xlsx"'
        return response


