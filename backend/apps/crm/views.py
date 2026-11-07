from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Sum
from django.utils import timezone
from .models import Customer
from .serializers import CustomerSerializer, CustomerListSerializer, CustomerLoyaltySerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'phone', 'email']
    ordering_fields = ['name', 'loyalty_points', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return CustomerListSerializer
        return CustomerSerializer

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
        """Add or redeem loyalty points"""
        customer = self.get_object()
        serializer = CustomerLoyaltySerializer(data=request.data)
        
        if serializer.is_valid():
            points = serializer.data['points']
            action_type = serializer.data['action']
            
            if action_type == 'add':
                customer.loyalty_points += points
                customer.save()
                return Response({
                    'message': f'{points} points added',
                    'new_balance': customer.loyalty_points
                })
            else:  # redeem
                if customer.loyalty_points < points:
                    return Response({'error': 'Insufficient points'}, status=status.HTTP_400_BAD_REQUEST)
                discount = customer.redeem_points(points)
                return Response({
                    'message': f'{points} points redeemed',
                    'discount': discount,
                    'new_balance': customer.loyalty_points
                })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
