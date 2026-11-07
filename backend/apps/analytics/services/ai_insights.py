"""
AI Insights Service - Generates actionable insights for dashboard
"""
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Count, Avg
from apps.sales.models import Sale
from apps.repairs.models import Repair
from apps.products.models import Product
from apps.crm.models import Customer
from apps.expenses.models import Expense
from .forecasting import SalesForecast
from .stock_predictor import StockPredictor
from .alerts import AlertService
from .profit_predictor import ProfitPredictor


class AIInsightsService:
    """Generates AI-powered insights for dashboard"""
    
    def __init__(self):
        self.forecast = SalesForecast()
        self.stock_predictor = StockPredictor()
        self.alerts = AlertService()
        self.profit = ProfitPredictor()
    
    def get_sales_insights(self):
        """Sales-related insights"""
        insights = []
        
        # Compare today vs yesterday
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        today_sales = Sale.objects.filter(sale_date__date=today).aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        yesterday_sales = Sale.objects.filter(sale_date__date=yesterday).aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        if yesterday_sales > 0:
            change = ((today_sales - yesterday_sales) / yesterday_sales) * 100
            if change > 20:
                insights.append({
                    'type': 'positive',
                    'category': 'sales',
                    'title': 'Sales Surge!',
                    'message': f"Today's sales are up {change:.0f}% compared to yesterday.",
                    'metric': f'₹{today_sales:,.0f}'
                })
            elif change < -20:
                insights.append({
                    'type': 'warning',
                    'category': 'sales',
                    'title': 'Sales Dip',
                    'message': f"Today's sales are down {abs(change):.0f}% compared to yesterday.",
                    'metric': f'₹{today_sales:,.0f}'
                })
        
        # Forecast comparison
        comparison = self.forecast.get_comparison_with_last_month()
        if comparison['trend'] == 'up' and comparison['change_percent'] > 10:
            insights.append({
                'type': 'positive',
                'category': 'forecast',
                'title': 'Growth Predicted',
                'message': f"Next month is forecasted to grow {comparison['change_percent']:.0f}% vs last month.",
                'metric': f'₹{comparison["next_month_predicted"]:,.0f}'
            })
        
        return insights
    
    def get_inventory_insights(self):
        """Inventory-related insights"""
        insights = []
        
        health = self.stock_predictor.get_inventory_health()
        
        if health['out_of_stock'] > 0:
            insights.append({
                'type': 'critical',
                'category': 'inventory',
                'title': 'Out of Stock Alert',
                'message': f"{health['out_of_stock']} products are out of stock. Customers may be lost!",
                'metric': str(health['out_of_stock'])
            })
        
        if health['low_stock'] > 3:
            insights.append({
                'type': 'warning',
                'category': 'inventory',
                'title': 'Low Stock Warning',
                'message': f"{health['low_stock']} products are running low. Consider reordering.",
                'metric': str(health['low_stock'])
            })
        
        reorder = self.stock_predictor.get_reorder_suggestions()
        critical_reorder = [r for r in reorder if r['urgency'] == 'critical']
        if critical_reorder:
            insights.append({
                'type': 'critical',
                'category': 'inventory',
                'title': 'Urgent Reorder Needed',
                'message': f"{len(critical_reorder)} products need immediate reordering.",
                'metric': str(len(critical_reorder))
            })
        
        if health['slow_movers'] > 5:
            insights.append({
                'type': 'info',
                'category': 'inventory',
                'title': 'Slow Moving Stock',
                'message': f"{health['slow_movers']} products haven't sold in 30 days. Consider discounts.",
                'metric': str(health['slow_movers'])
            })
        
        if health['health_score'] >= 80:
            insights.append({
                'type': 'positive',
                'category': 'inventory',
                'title': 'Healthy Inventory',
                'message': f"Inventory health score is {health['health_score']}%. Well managed!",
                'metric': f"{health['health_score']}%"
            })
        
        return insights
    
    def get_repair_insights(self):
        """Repair-related insights"""
        insights = []
        
        overdue = self.alerts.get_overdue_repairs()
        if overdue:
            insights.append({
                'type': 'critical',
                'category': 'repairs',
                'title': 'Overdue Repairs',
                'message': f"{len(overdue)} repairs are past their expected delivery date.",
                'metric': str(len(overdue))
            })
        
        pending = self.alerts.get_pending_repairs_summary()
        total_pending = sum(pending.values())
        if total_pending > 10:
            insights.append({
                'type': 'warning',
                'category': 'repairs',
                'title': 'Repair Backlog',
                'message': f"{total_pending} repairs are pending. Consider prioritizing.",
                'metric': str(total_pending)
            })
        
        return insights
    
    def get_customer_insights(self):
        """Customer-related insights"""
        insights = []
        
        # Birthdays today
        birthdays = self.alerts.get_birthday_customers()
        if birthdays:
            insights.append({
                'type': 'info',
                'category': 'customer',
                'title': 'Customer Birthdays',
                'message': f"{len(birthdays)} customers have birthday today. Send wishes!",
                'metric': str(len(birthdays))
            })
        
        # Warranty expiring
        expiring = self.alerts.get_warranty_expiring()
        if expiring:
            insights.append({
                'type': 'info',
                'category': 'customer',
                'title': 'Warranties Expiring',
                'message': f"{len(expiring)} warranties expiring this week. Good upsell opportunity!",
                'metric': str(len(expiring))
            })
        
        # New customers trend
        last_7_days = Customer.objects.filter(
            created_at__date__gte=timezone.now().date() - timedelta(days=7)
        ).count()
        
        prev_7_days = Customer.objects.filter(
            created_at__date__gte=timezone.now().date() - timedelta(days=14),
            created_at__date__lt=timezone.now().date() - timedelta(days=7)
        ).count()
        
        if last_7_days > prev_7_days and last_7_days > 0:
            insights.append({
                'type': 'positive',
                'category': 'customer',
                'title': 'Growing Customer Base',
                'message': f"{last_7_days} new customers this week, up from {prev_7_days}!",
                'metric': str(last_7_days)
            })
        
        return insights
    
    def get_profit_insights(self):
        """Profit-related insights"""
        return self.profit.get_profit_insights().get('insights', [])
    
    def get_all_insights(self, limit=10):
        """Get all insights sorted by priority"""
        all_insights = []
        
        all_insights.extend(self.get_sales_insights())
        all_insights.extend(self.get_inventory_insights())
        all_insights.extend(self.get_repair_insights())
        all_insights.extend(self.get_customer_insights())
        all_insights.extend(self.get_profit_insights())
        
        # Priority order
        priority = {'critical': 0, 'warning': 1, 'info': 2, 'positive': 3}
        all_insights.sort(key=lambda x: priority.get(x['type'], 99))
        
        return all_insights[:limit]
    
    def get_quick_stats(self):
        """Quick stats for AI widget"""
        today = timezone.now().date()
        week_start = today - timedelta(days=7)
        
        return {
            'todays_sales': Sale.objects.filter(
                sale_date__date=today
            ).aggregate(total=Sum('total_amount'))['total'] or 0,
            
            'todays_profit': Sale.objects.filter(
                sale_date__date=today
            ).aggregate(total=Sum('profit'))['total'] or 0,
            
            'pending_repairs': Repair.objects.exclude(
                status__in=['delivered', 'cancelled']
            ).count(),
            
            'new_customers_week': Customer.objects.filter(
                created_at__date__gte=week_start
            ).count(),
            
            'inventory_health': self.stock_predictor.get_inventory_health()['health_score'],
            
            'alerts_count': sum(self.alerts.get_alert_counts().values())
        }
    
    def get_dashboard_ai_widget(self):
        """Complete AI widget data for dashboard"""
        return {
            'insights': self.get_all_insights(5),
            'quick_stats': self.get_quick_stats(),
            'forecast': self.forecast.get_monthly_forecast(),
            'inventory_health': self.stock_predictor.get_inventory_health(),
            'profit_prediction': self.profit.predict_monthly_profit()
        }
