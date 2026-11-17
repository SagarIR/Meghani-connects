from rest_framework.views import APIView
from rest_framework.response import Response
from apps.users.permissions import CanViewReports
from django.db.models import Sum, Count, Avg
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from django.http import HttpResponse
from django.conf import settings
from datetime import timedelta
from apps.sales.models import Sale, SaleItem, Warranty
from apps.repairs.models import Repair
from apps.products.models import Product
from apps.expenses.models import Expense
from apps.crm.models import Customer
from .reports import (
    SalesReport, ProductReport, RepairReport, ExpenseReport,
    CustomerReport, InventoryReport, export_to_csv, export_to_excel, export_to_pdf
)
from .services.forecasting import SalesForecast
from .services.stock_predictor import StockPredictor
from .services.alerts import AlertService
from .services.profit_predictor import ProfitPredictor
from .services.ai_insights import AIInsightsService


class DashboardStatsView(APIView):
    """Dashboard overview statistics"""
    
    def get(self, request):
        today = timezone.now().date()
        month_start = today.replace(day=1)
        
        # Today's stats
        today_sales = Sale.objects.filter(sale_date__date=today)
        today_summary = today_sales.aggregate(
            total=Sum('total_amount'),
            profit=Sum('profit'),
            count=Count('id')
        )
        
        # Pending repairs
        pending_repairs = Repair.objects.exclude(
            status__in=['delivered', 'cancelled']
        ).count()
        
        # Low stock items
        threshold = getattr(settings, 'LOW_STOCK_THRESHOLD', 5)
        low_stock_count = Product.objects.filter(
            stock__lte=threshold, is_active=True
        ).count()
        
        # Monthly stats
        month_sales = Sale.objects.filter(sale_date__date__gte=month_start)
        month_summary = month_sales.aggregate(
            total=Sum('total_amount'),
            profit=Sum('profit'),
            count=Count('id')
        )
        
        is_admin = request.user.is_superuser or getattr(request.user, 'role', '') in ['admin', 'manager']
        return Response({
            'today': {
                'sales': today_summary['total'] or 0,
                'profit': (today_summary['profit'] or 0) if is_admin else None,
                'transactions': today_summary['count'] or 0,
            },
            'month': {
                'sales': month_summary['total'] or 0,
                'profit': (month_summary['profit'] or 0) if is_admin else None,
                'transactions': month_summary['count'] or 0,
            },
            'alerts': {
                'pending_repairs': pending_repairs,
                'low_stock_items': low_stock_count,
            }
        })


class SalesChartView(APIView):
    """Sales chart data for visualization"""
    
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now().date() - timedelta(days=days)
        
        daily_sales = Sale.objects.filter(
            sale_date__date__gte=start_date
        ).annotate(
            date=TruncDate('sale_date')
        ).values('date').annotate(
            sales=Sum('total_amount'),
            profit=Sum('profit'),
            count=Count('id')
        ).order_by('date')
        
        return Response(list(daily_sales))


class TopProductsView(APIView):
    """Top selling products"""
    
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        limit = int(request.query_params.get('limit', 10))
        start_date = timezone.now().date() - timedelta(days=days)
        
        top_products = SaleItem.objects.filter(
            sale__sale_date__date__gte=start_date
        ).values(
            'product__id', 'product__name', 'product__brand'
        ).annotate(
            quantity_sold=Sum('quantity'),
            revenue=Sum('subtotal')
        ).order_by('-quantity_sold')[:limit]
        
        return Response(list(top_products))


class RecentActivityView(APIView):
    """Recent sales and repairs"""
    
    def get(self, request):
        # Recent sales
        recent_sales = Sale.objects.select_related('customer').order_by('-sale_date')[:5]
        sales_data = [{
            'id': s.id,
            'type': 'sale',
            'invoice': s.invoice_number,
            'customer': s.customer.name if s.customer else 'Walk-in',
            'amount': s.total_amount,
            'date': s.sale_date,
        } for s in recent_sales]
        
        # Recent repairs
        recent_repairs = Repair.objects.select_related('customer').order_by('-received_date')[:5]
        repairs_data = [{
            'id': r.id,
            'type': 'repair',
            'ticket': r.ticket_number,
            'customer': r.customer.name,
            'item': r.item_type,
            'status': r.status,
            'date': r.received_date,
        } for r in recent_repairs]
        
        return Response({
            'sales': sales_data,
            'repairs': repairs_data,
        })


class AlertsView(APIView):
    """All active alerts and notifications"""
    
    def get(self, request):
        threshold = getattr(settings, 'LOW_STOCK_THRESHOLD', 5)
        today = timezone.now().date()
        
        # Low stock products
        low_stock = list(Product.objects.filter(
            stock__lte=threshold, is_active=True
        ).values('id', 'name', 'stock', 'brand')[:10])
        
        # Overdue repairs
        overdue = list(Repair.objects.filter(
            expected_delivery__lt=today
        ).exclude(
            status__in=['delivered', 'cancelled']
        ).values('id', 'ticket_number', 'customer__name', 'item_type', 'expected_delivery')[:10])
        
        # Expiring warranties (next 7 days)
        expiring = list(Warranty.objects.filter(
            expiry_date__lte=today + timedelta(days=7),
            expiry_date__gte=today,
            notified=False
        ).values('id', 'product__name', 'customer__name', 'expiry_date')[:10])
        
        # Birthday customers
        birthdays = list(Customer.objects.filter(
            date_of_birth__month=today.month,
            date_of_birth__day=today.day
        ).values('id', 'name', 'phone')[:10])
        
        return Response({
            'low_stock': low_stock,
            'overdue_repairs': overdue,
            'expiring_warranties': expiring,
            'birthdays_today': birthdays,
        })


class SalesReportView(APIView):
    """Detailed sales report"""
    
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date:
            start_date = (timezone.now().date() - timedelta(days=30)).isoformat()
        if not end_date:
            end_date = timezone.now().date().isoformat()
        
        sales = Sale.objects.filter(
            sale_date__date__gte=start_date,
            sale_date__date__lte=end_date
        )
        
        # Summary
        summary = sales.aggregate(
            total_sales=Sum('total_amount'),
            total_profit=Sum('profit'),
            total_discount=Sum('discount'),
            count=Count('id')
        )
        
        # By payment mode
        by_payment = sales.values('payment_mode').annotate(
            total=Sum('total_amount'),
            count=Count('id')
        )
        
        # Daily breakdown
        daily = sales.annotate(
            date=TruncDate('sale_date')
        ).values('date').annotate(
            sales=Sum('total_amount'),
            profit=Sum('profit'),
            count=Count('id')
        ).order_by('date')
        
        return Response({
            'period': {'start': start_date, 'end': end_date},
            'summary': {
                'total_sales': summary['total_sales'] or 0,
                'total_profit': summary['total_profit'] or 0,
                'total_discount': summary['total_discount'] or 0,
                'transaction_count': summary['count'] or 0,
                'average_sale': (summary['total_sales'] or 0) / max(summary['count'] or 1, 1),
            },
            'by_payment_mode': list(by_payment),
            'daily_data': list(daily),
        })


class ProfitReportView(APIView):
    """Profit report with expense deductions"""
    permission_classes = [CanViewReports]
    
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date:
            start_date = (timezone.now().date() - timedelta(days=30)).isoformat()
        if not end_date:
            end_date = timezone.now().date().isoformat()
        
        # Sales profit
        sales_profit = Sale.objects.filter(
            sale_date__date__gte=start_date,
            sale_date__date__lte=end_date
        ).aggregate(
            gross_profit=Sum('profit'),
            total_sales=Sum('total_amount')
        )
        
        # Repair income
        repair_income = Repair.objects.filter(
            delivered_date__date__gte=start_date,
            delivered_date__date__lte=end_date,
            status='delivered'
        ).aggregate(total=Sum('repair_charge'))['total'] or 0
        
        # Expenses
        expenses = Expense.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Expenses by category
        expenses_by_cat = Expense.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        ).values('category').annotate(total=Sum('amount'))
        
        gross_profit = (sales_profit['gross_profit'] or 0) + repair_income
        net_profit = gross_profit - expenses
        
        return Response({
            'period': {'start': start_date, 'end': end_date},
            'revenue': {
                'sales': sales_profit['total_sales'] or 0,
                'sales_profit': sales_profit['gross_profit'] or 0,
                'repair_income': repair_income,
                'gross_profit': gross_profit,
            },
            'expenses': {
                'total': expenses,
                'by_category': list(expenses_by_cat),
            },
            'net_profit': net_profit,
        })


class ProductPerformanceView(APIView):
    """Product performance report"""
    
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        category = request.query_params.get('category')
        
        data = ProductReport.generate(start_date, end_date, category)
        return Response(data)


class RepairIncomeView(APIView):
    """Repair income report"""
    
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        data = RepairReport.generate(start_date, end_date)
        return Response(data)


class ExpenseReportView(APIView):
    """Expense report"""
    permission_classes = [CanViewReports]
    
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        category = request.query_params.get('category')
        
        data = ExpenseReport.generate(start_date, end_date, category)
        return Response(data)


class CustomerLoyaltyView(APIView):
    """Customer loyalty report"""
    
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        data = CustomerReport.generate(start_date, end_date)
        return Response(data)


class InventoryReportView(APIView):
    """Inventory status report"""
    
    def get(self, request):
        data = InventoryReport.generate()
        return Response(data)


class ReportExportView(APIView):
    """Export reports to different formats"""
    permission_classes = [CanViewReports]
    
    def get(self, request, report_type, format_type):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Generate report data
        if report_type == 'sales':
            data = SalesReport.generate(start_date, end_date)
            headers = ['Date', 'Sales', 'Profit', 'Transactions']
            rows = [(d['date'], d['sales'], d['profit'], d['count']) for d in data['daily_data']]
            title = 'Sales Summary Report'
        elif report_type == 'products':
            data = ProductReport.generate(start_date, end_date)
            headers = ['Product', 'Brand', 'Sold', 'Revenue']
            rows = [(p['product__name'], p['product__brand'], p['sold'], p['revenue']) for p in data['top_sellers']]
            title = 'Product Performance Report'
        elif report_type == 'repairs':
            data = RepairReport.generate(start_date, end_date)
            headers = ['Item Type', 'Count', 'Revenue']
            rows = [(i['item_type'], i['count'], i['revenue'] or 0) for i in data['by_item_type']]
            title = 'Repair Income Report'
        elif report_type == 'expenses':
            data = ExpenseReport.generate(start_date, end_date)
            headers = ['Date', 'Amount']
            rows = [(d['date'], d['total']) for d in data['daily_data']]
            title = 'Expense Report'
        elif report_type == 'inventory':
            data = InventoryReport.generate()
            headers = ['Product', 'Brand', 'Stock', 'Category']
            rows = [(p['name'], p['brand'], p['stock'], p['category']) for p in data['low_stock_items']]
            title = 'Inventory Report'
        else:
            return Response({'error': 'Invalid report type'}, status=400)
        
        # Generate export
        if format_type == 'csv':
            output = export_to_csv(rows, headers, f'{report_type}_report.csv')
            response = HttpResponse(output.getvalue(), content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{report_type}_report.csv"'
        elif format_type == 'excel':
            output = export_to_excel(rows, headers, title)
            response = HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = f'attachment; filename="{report_type}_report.xlsx"'
        elif format_type == 'pdf':
            output = export_to_pdf(title, rows, headers)
            response = HttpResponse(output.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{report_type}_report.pdf"'
        else:
            return Response({'error': 'Invalid format'}, status=400)
        
        return response


# ===================== AI / ML VIEWS =====================

class SalesForecastView(APIView):
    """Sales forecasting using Prophet or simple moving average"""
    
    def get(self, request):
        periods = int(request.query_params.get('days', 30))
        forecast_service = SalesForecast()
        
        forecast = forecast_service.get_monthly_forecast()
        comparison = forecast_service.get_comparison_with_last_month()
        
        return Response({
            'forecast': forecast,
            'comparison': comparison,
            'method': 'prophet' if forecast_service.use_prophet else 'moving_average'
        })


class StockPredictionView(APIView):
    """Stock prediction and reorder suggestions"""
    
    def get(self, request):
        predictor = StockPredictor()
        
        return Response({
            'reorder_suggestions': predictor.get_reorder_suggestions(),
            'fast_movers': predictor.get_fast_movers(),
            'slow_movers': predictor.get_slow_movers(),
            'inventory_health': predictor.get_inventory_health()
        })


class StockoutPredictionView(APIView):
    """Predict stockout date for a specific product"""
    
    def get(self, request, product_id):
        predictor = StockPredictor()
        prediction = predictor.predict_stockout_date(product_id)
        
        if prediction is None:
            return Response({'error': 'Product not found or no sales history'}, status=404)
        
        return Response(prediction)


class SmartAlertsView(APIView):
    """Smart alerts and notifications"""
    
    def get(self, request):
        alerts = AlertService()
        
        alert_type = request.query_params.get('type')
        
        if alert_type == 'low_stock':
            return Response(alerts.get_low_stock_alerts())
        elif alert_type == 'out_of_stock':
            return Response(alerts.get_out_of_stock_alerts())
        elif alert_type == 'overdue_repairs':
            return Response(alerts.get_overdue_repairs())
        elif alert_type == 'warranty':
            return Response(alerts.get_warranty_expiring())
        elif alert_type == 'birthdays':
            return Response(alerts.get_birthday_customers())
        elif alert_type == 'inactive_customers':
            return Response(alerts.get_inactive_customers())
        elif alert_type == 'today':
            return Response(alerts.get_today_summary())
        elif alert_type == 'counts':
            return Response(alerts.get_alert_counts())
        else:
            return Response(alerts.get_all_alerts())


class ProfitPredictionView(APIView):
    """Profit prediction and trend analysis"""
    permission_classes = [CanViewReports]
    
    def get(self, request):
        predictor = ProfitPredictor()
        
        return Response({
            'prediction': predictor.predict_monthly_profit(),
            'trend': predictor.get_profit_trend(),
            'insights': predictor.get_profit_insights()
        })


class AIInsightsView(APIView):
    """AI-powered insights for dashboard"""
    
    def get(self, request):
        insights_service = AIInsightsService()
        
        view_type = request.query_params.get('type', 'all')
        limit = int(request.query_params.get('limit', 10))
        
        if view_type == 'sales':
            return Response(insights_service.get_sales_insights())
        elif view_type == 'inventory':
            return Response(insights_service.get_inventory_insights())
        elif view_type == 'repairs':
            return Response(insights_service.get_repair_insights())
        elif view_type == 'customers':
            return Response(insights_service.get_customer_insights())
        elif view_type == 'profit':
            return Response(insights_service.get_profit_insights())
        elif view_type == 'widget':
            return Response(insights_service.get_dashboard_ai_widget())
        elif view_type == 'stats':
            return Response(insights_service.get_quick_stats())
        else:
            return Response({
                'insights': insights_service.get_all_insights(limit),
                'quick_stats': insights_service.get_quick_stats()
            })
