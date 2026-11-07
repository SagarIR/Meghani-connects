from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
from .models import Expense
from .serializers import ExpenseSerializer, ExpenseListSerializer


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'vendor_name']
    ordering_fields = ['date', 'amount', 'category']
    ordering = ['-date', '-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ExpenseListSerializer
        return ExpenseSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        return queryset

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get expense summary for date range"""
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now().date() - timedelta(days=days)
        
        expenses = Expense.objects.filter(date__gte=start_date)
        
        # Total
        total = expenses.aggregate(total=Sum('amount'))['total'] or 0
        
        # By category
        by_category = expenses.values('category').annotate(
            total=Sum('amount')
        ).order_by('-total')
        
        return Response({
            'period': {'start': start_date, 'end': timezone.now().date()},
            'total': total,
            'by_category': list(by_category)
        })

    @action(detail=False, methods=['get'])
    def monthly(self, request):
        """Get monthly expense breakdown"""
        months = int(request.query_params.get('months', 6))
        
        monthly_data = Expense.objects.annotate(
            month=TruncMonth('date')
        ).values('month').annotate(
            total=Sum('amount')
        ).order_by('-month')[:months]
        
        return Response(list(monthly_data))

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get expense categories with totals (current month)"""
        today = timezone.now().date()
        first_day = today.replace(day=1)
        
        categories = Expense.objects.filter(
            date__gte=first_day
        ).values('category').annotate(
            total=Sum('amount')
        ).order_by('-total')
        
        return Response(list(categories))
