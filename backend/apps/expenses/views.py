from decimal import Decimal
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.users.permissions import IsManagerOrAbove, IsStaffOrAbove, IsAdmin
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
from .models import Expense, CashRegister
from .serializers import (
    ExpenseSerializer, ExpenseListSerializer,
    CashRegisterSerializer, CloseRegisterSerializer
)


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsManagerOrAbove]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['voucher_number', 'description', 'vendor_name', 'gstin']
    ordering_fields = ['date', 'amount', 'category']
    ordering = ['-date', '-created_at']

    def destroy(self, request, *args, **kwargs):
        is_admin = request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'
        if not is_admin:
            return Response(
                {'error': 'Only administrators are authorized to delete expense records.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

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

        # Filter by payment mode
        payment_mode = self.request.query_params.get('payment_mode')
        if payment_mode:
            queryset = queryset.filter(payment_mode=payment_mode)
        
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


class CashRegisterViewSet(viewsets.ModelViewSet):
    """
    Daily POS physical cash drawer & till reconciliation.
    """
    queryset = CashRegister.objects.select_related('closed_by').all().order_by('-register_date')
    serializer_class = CashRegisterSerializer
    permission_classes = [IsManagerOrAbove]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['register_date', 'variance']

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get or initialize today's till register with live recalculated cash totals"""
        today_date = timezone.now().date()
        register, created = CashRegister.objects.get_or_create(
            register_date=today_date,
            defaults={'opening_cash': Decimal('2000.00')}  # standard float for watch boutique till
        )
        register.recalculate()
        return Response(CashRegisterSerializer(register).data)

    @action(detail=True, methods=['post'], url_path='close')
    def close_till(self, request, pk=None):
        """Close and lock the cash drawer with actual physical cash count"""
        register = self.get_object()
        serializer = CloseRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        actual_cash = serializer.validated_data['actual_closing_cash']
        notes = serializer.validated_data.get('notes', '')

        register.recalculate()
        register.actual_closing_cash = actual_cash
        register.variance = actual_cash - register.expected_closing_cash
        register.is_closed = True
        register.closed_by = request.user
        register.closed_at = timezone.now()
        if notes:
            register.notes = f"{register.notes}\nClosing Note: {notes}".strip()
        register.save()

        return Response(CashRegisterSerializer(register).data)
