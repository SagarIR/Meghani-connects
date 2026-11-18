from rest_framework.views import APIView
from rest_framework.response import Response
from apps.users.permissions import CanViewReports
from django.db.models import Sum, Count, Avg
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from django.http import HttpResponse
from django.conf import settings
from datetime import timedelta
from decimal import Decimal
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
    permission_classes = [CanViewReports]
    
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

        # Tender breakdown resolving mixed tenders
        tender_breakdown = {'cash': Decimal('0.00'), 'upi': Decimal('0.00'), 'card': Decimal('0.00')}
        for sale in sales.only('payment_mode', 'total_amount', 'payment_details'):
            if sale.payment_mode in tender_breakdown:
                tender_breakdown[sale.payment_mode] += Decimal(str(sale.total_amount))
            elif sale.payment_mode == 'mixed' and isinstance(sale.payment_details, dict):
                for method, amt in sale.payment_details.items():
                    m = method.lower()
                    if m in tender_breakdown:
                        try:
                            tender_breakdown[m] += Decimal(str(amt or 0))
                        except Exception:
                            pass
        
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
            'tender_breakdown': {k: float(v) for k, v in tender_breakdown.items()},
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
    permission_classes = [CanViewReports]
    
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        category = request.query_params.get('category')
        
        data = ProductReport.generate(start_date, end_date, category)
        return Response(data)


class RepairIncomeView(APIView):
    """Repair income report"""
    permission_classes = [CanViewReports]
    
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
    permission_classes = [CanViewReports]
    
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        data = CustomerReport.generate(start_date, end_date)
        return Response(data)


class InventoryReportView(APIView):
    """Inventory status report"""
    permission_classes = [CanViewReports]
    
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



# --- ADVANCED INTELLIGENCE & AI VIEWS (MASTER ORDER 6) ---

from apps.users.permissions import IsManagerOrAbove, IsStaffOrAbove
from apps.analytics.models import ReorderRecommendation, ABCProductClassification, BusinessAnomaly
from apps.core.models import AuditLog
from apps.analytics.services.reorder_engine import SmartReorderEngine
from apps.analytics.services.abc_classification import ABCClassificationEngine
from apps.analytics.services.anomaly_detector import AnomalyDetector
from apps.analytics.services.ai_assistant import ControlledAIAssistant
from apps.crm.services.crm_analytics import CRMAnalyticsService


class AdvancedSalesForecastView(APIView):
    """
    Enterprise Sales Forecasting Engine.
    Provides 30, 60, and 90-day predictive horizons with Prophet/statistical fallback,
    holdout evaluation (MAE, RMSE, WAPE), seasonal patterns, and uncertainty intervals.
    """
    permission_classes = [CanViewReports]

    def get(self, request):
        horizon = request.query_params.get('horizon', 30)
        product_id = request.query_params.get('product_id')
        lookback = int(request.query_params.get('lookback_days', 365))

        engine = SalesForecast()
        result = engine.generate_forecast(
            horizon=horizon,
            product_id=product_id,
            lookback_days=lookback
        )
        return Response(result)


class SmartReorderView(APIView):
    """
    Smart Inventory Reorder Engine.
    Exposes ROP, safety stock, daily demand velocity, and manager approval lifecycle.
    """
    permission_classes = [CanViewReports]

    def get(self, request):
        status_filter = request.query_params.get('status', 'pending')
        urgency_filter = request.query_params.get('urgency')

        # Auto-generate if table empty
        if not ReorderRecommendation.objects.exists():
            engine = SmartReorderEngine()
            engine.generate_recommendations()

        qs = ReorderRecommendation.objects.select_related('product', 'approved_by')
        if status_filter != 'all':
            qs = qs.filter(status=status_filter)
        if urgency_filter:
            qs = qs.filter(urgency=urgency_filter)

        results = []
        for r in qs[:50]:
            results.append({
                'id': r.id,
                'product_id': r.product.id,
                'product_name': r.product.name,
                'brand': getattr(r.product, 'brand', ''),
                'category': r.product.category,
                'current_stock': r.current_stock,
                'daily_velocity': float(r.daily_velocity),
                'lead_time_days': r.lead_time_days,
                'safety_stock': r.safety_stock,
                'reorder_point': r.reorder_point,
                'suggested_quantity': r.suggested_quantity,
                'days_of_stock': float(r.days_of_stock),
                'estimated_stockout_date': r.estimated_stockout_date.strftime('%Y-%m-%d') if r.estimated_stockout_date else None,
                'urgency': r.urgency,
                'estimated_cost': float(r.estimated_cost),
                'reason': r.reason,
                'status': r.status,
                'approved_by': r.approved_by.username if r.approved_by else None,
                'approved_at': r.approved_at.strftime('%Y-%m-%d %H:%M') if r.approved_at else None,
                'action_notes': r.action_notes,
                'created_at': r.created_at.strftime('%Y-%m-%d %H:%M')
            })

        return Response({
            'total_count': qs.count(),
            'recommendations': results,
            'summary': {
                'critical': ReorderRecommendation.objects.filter(urgency='critical', status='pending').count(),
                'high': ReorderRecommendation.objects.filter(urgency='high', status='pending').count(),
                'medium': ReorderRecommendation.objects.filter(urgency='medium', status='pending').count(),
                'approved': ReorderRecommendation.objects.filter(status='approved').count(),
            }
        })

    def post(self, request):
        """Manager actions: approve, reject, snooze"""
        if not IsManagerOrAbove().has_permission(request, self):
            return Response({'error': 'Manager authorization required for reorder approvals.'}, status=403)

        rec_id = request.data.get('recommendation_id')
        action = request.data.get('action')
        notes = request.data.get('notes', '')
        snooze_days = int(request.data.get('days', 7))

        if not rec_id or not action:
            return Response({'error': 'recommendation_id and action are required.'}, status=400)

        engine = SmartReorderEngine()
        try:
            if action == 'approve':
                rec = engine.approve_recommendation(rec_id, request.user, notes=notes)
            elif action == 'reject':
                rec = engine.reject_recommendation(rec_id, request.user, reason=notes)
            elif action == 'snooze':
                rec = engine.snooze_recommendation(rec_id, request.user, days=snooze_days)
            else:
                return Response({'error': f"Invalid action '{action}'. Must be approve, reject, or snooze."}, status=400)

            return Response({
                'success': True,
                'message': f"Recommendation #{rec.id} marked as {rec.status}.",
                'recommendation_id': rec.id,
                'status': rec.status
            })
        except ReorderRecommendation.DoesNotExist:
            return Response({'error': 'Recommendation not found.'}, status=404)


class ABCClassificationView(APIView):
    """
    Automated ABC Inventory Classification based on cumulative Pareto contribution.
    """
    permission_classes = [CanViewReports]

    def get(self, request):
        lookback = request.query_params.get('lookback_days')
        engine = ABCClassificationEngine()
        result = engine.calculate_classification(
            lookback_days=int(lookback) if lookback else None,
            persist=False
        )
        return Response(result)

    def post(self, request):
        """Recalculate and persist ABC snapshot"""
        if not IsManagerOrAbove().has_permission(request, self):
            return Response({'error': 'Manager authorization required to recalculate ABC inventory classification.'}, status=403)

        a_cut = float(request.data.get('class_a_threshold', 80.0))
        b_cut = float(request.data.get('class_b_threshold', 95.0))
        lookback = request.data.get('lookback_days')

        engine = ABCClassificationEngine(a_threshold=a_cut, b_threshold=b_cut)
        result = engine.calculate_classification(
            lookback_days=int(lookback) if lookback else None,
            persist=True
        )
        return Response({
            'success': True,
            'message': 'ABC classification refreshed and persisted.',
            'data': result
        })


class AnomalyRadarView(APIView):
    """
    Statistical Business Anomaly Detection.
    Provides signals on sales spikes, drops, abnormal discounts, and inventory drops.
    """
    permission_classes = [CanViewReports]

    def get(self, request):
        cat_filter = request.query_params.get('category')
        sev_filter = request.query_params.get('severity')
        stat_filter = request.query_params.get('status', 'open')

        # Auto-scan if table empty
        if not BusinessAnomaly.objects.exists():
            detector = AnomalyDetector()
            detector.scan_all_anomalies(lookback_days=365)

        qs = BusinessAnomaly.objects.select_related('product', 'sale', 'audit_log', 'resolved_by')
        if stat_filter != 'all':
            qs = qs.filter(status=stat_filter)
        if cat_filter:
            qs = qs.filter(category=cat_filter)
        if sev_filter:
            qs = qs.filter(severity=sev_filter)

        results = []
        for a in qs[:50]:
            results.append({
                'id': a.id,
                'category': a.category,
                'category_display': a.get_category_display(),
                'severity': a.severity,
                'status': a.status,
                'product_name': a.product.name if a.product else None,
                'invoice_number': a.sale.invoice_number if a.sale else None,
                'observed_value': float(a.observed_value),
                'expected_baseline': float(a.expected_baseline),
                'deviation_score': float(a.deviation_score),
                'explanation': a.explanation,
                'recommended_action': a.recommended_action,
                'detected_at': a.detected_at.strftime('%Y-%m-%d %H:%M'),
                'resolved_by': a.resolved_by.username if a.resolved_by else None,
                'resolved_at': a.resolved_at.strftime('%Y-%m-%d %H:%M') if a.resolved_at else None,
                'resolution_notes': a.resolution_notes
            })

        return Response({
            'total_count': qs.count(),
            'anomalies': results,
            'counts_by_severity': {
                'critical': BusinessAnomaly.objects.filter(severity='critical', status='open').count(),
                'high': BusinessAnomaly.objects.filter(severity='high', status='open').count(),
                'medium': BusinessAnomaly.objects.filter(severity='medium', status='open').count(),
                'low': BusinessAnomaly.objects.filter(severity='low', status='open').count(),
            }
        })

    def post(self, request):
        """Manager action: resolve or dismiss anomaly"""
        if not IsManagerOrAbove().has_permission(request, self):
            return Response({'error': 'Manager authorization required to manage anomalies.'}, status=403)

        anom_id = request.data.get('anomaly_id')
        action = request.data.get('action')
        notes = request.data.get('notes', '')

        if not anom_id or not action:
            return Response({'error': 'anomaly_id and action are required.'}, status=400)

        detector = AnomalyDetector()
        try:
            if action == 'resolve':
                anom = detector.resolve_anomaly(anom_id, request.user, notes=notes)
            elif action == 'dismiss':
                anom = detector.dismiss_anomaly(anom_id, request.user, notes=notes)
            else:
                return Response({'error': f"Invalid action '{action}'. Must be resolve or dismiss."}, status=400)

            return Response({
                'success': True,
                'message': f"Anomaly #{anom.id} marked as {anom.status}.",
                'anomaly_id': anom.id,
                'status': anom.status
            })
        except BusinessAnomaly.DoesNotExist:
            return Response({'error': 'Anomaly record not found.'}, status=404)


class AIAssistantView(APIView):
    """
    Secure, Permission-Enforced AI Business Assistant.
    Evaluates questions via controlled intents with strict RBAC financial masking.
    Available to authenticated staff and management.
    """
    permission_classes = [IsStaffOrAbove]

    def post(self, request):
        query = request.data.get('query', '')
        if not query or not query.strip():
            return Response({'error': 'Query text is required.'}, status=400)

        assistant = ControlledAIAssistant(request.user)
        response_payload = assistant.process_query(query)
        return Response(response_payload)


class CRMIntelligenceView(APIView):
    """
    Advanced CRM Customer Intelligence.
    Customer segmentation (VIP, Frequent, New, Inactive), CLV, AOV, brand preferences.
    """
    permission_classes = [CanViewReports]

    def get(self, request):
        customer_id = request.query_params.get('customer_id')
        service = CRMAnalyticsService()

        if customer_id:
            dossier = service.get_customer_dossier(customer_id)
            if not dossier:
                return Response({'error': 'Customer not found.'}, status=404)
            return Response(dossier)

        overview = service.get_crm_overview()
        return Response(overview)


class OperationalAuditTimelineView(APIView):
    """
    Operational Audit Log Timeline with Anomaly Linkage.
    """
    permission_classes = [IsManagerOrAbove]

    def get(self, request):
        action_filter = request.query_params.get('action')
        severity_filter = request.query_params.get('severity')
        limit = min(int(request.query_params.get('limit', 50)), 100)

        qs = AuditLog.objects.select_related('user').all()
        if action_filter:
            qs = qs.filter(action=action_filter)
        if severity_filter:
            qs = qs.filter(severity=severity_filter)

        results = []
        for log in qs[:limit]:
            # Check for linked anomaly
            anom = log.anomalies.first() if hasattr(log, 'anomalies') else None
            results.append({
                'id': log.id,
                'user': getattr(log.user, 'name', '') or getattr(log.user, 'username', 'System') if log.user else 'System',
                'action': log.action,
                'action_display': log.get_action_display(),
                'severity': log.severity,
                'model_name': log.model_name,
                'object_id': log.object_id,
                'message': log.message,
                'changes': log.changes,
                'ip_address': log.ip_address,
                'timestamp': log.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                'linked_anomaly_id': anom.id if anom else None
            })

        return Response({
            'total_count': qs.count(),
            'timeline': results
        })
