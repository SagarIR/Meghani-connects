from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task
def check_and_send_birthday_wishes():
    '''Daily task to send birthday wishes'''
    from apps.crm.models import Customer
    from apps.notifications.models import Notification
    
    today = timezone.now().date()
    customers = Customer.objects.filter(
        date_of_birth__month=today.month,
        date_of_birth__day=today.day
    )
    
    sent_count = 0
    for customer in customers:
        message = f"Happy Birthday {customer.name}! Visit Meghani Watch Co. for a special 10% discount today."
        
        Notification.objects.create(
            customer=customer,
            notification_type='whatsapp',
            template_name='birthday_wish',
            message=message,
            status='pending'
        )
        
        try:
            from apps.notifications.services.whatsapp import send_whatsapp_message
            send_whatsapp_message(customer.phone, message)
            sent_count += 1
        except Exception as e:
            logger.error(f"Failed to send birthday wish to {customer.phone}: {e}")
    
    return f"Sent {sent_count} birthday wishes"


@shared_task
def check_warranty_expiry_notifications():
    '''Daily task to notify warranty expiring in 7 days'''
    from apps.sales.models import Warranty
    from apps.notifications.models import Notification
    
    cutoff = timezone.now().date() + timedelta(days=7)
    warranties = Warranty.objects.filter(
        expiry_date__lte=cutoff,
        expiry_date__gte=timezone.now().date(),
        notified=False
    ).select_related('product', 'customer')
    
    notified_count = 0
    for warranty in warranties:
        message = f"Reminder: Your warranty for {warranty.product.name} expires on {warranty.expiry_date}. Visit Meghani Watch Co. for service."
        
        Notification.objects.create(
            customer=warranty.customer,
            notification_type='whatsapp',
            template_name='warranty_expiry',
            message=message,
            status='pending'
        )
        
        try:
            from apps.notifications.services.whatsapp import send_whatsapp_message
            send_whatsapp_message(warranty.customer.phone, message)
            warranty.notified = True
            warranty.save()
            notified_count += 1
        except Exception as e:
            logger.error(f"Failed to send warranty notification: {e}")
    
    return f"Sent {notified_count} warranty expiry notifications"


@shared_task
def generate_daily_forecast():
    '''Generate and cache daily sales forecast using AI service'''
    from .models import AnalyticsCache
    from .services.forecasting import SalesForecast
    
    forecast_service = SalesForecast()
    
    monthly_forecast = forecast_service.get_monthly_forecast()
    comparison = forecast_service.get_comparison_with_last_month()
    
    AnalyticsCache.objects.update_or_create(
        metric_name='monthly_forecast',
        defaults={
            'metric_value': {
                **monthly_forecast,
                'comparison': comparison,
                'method': 'prophet' if forecast_service.use_prophet else 'moving_average',
                'generated_at': timezone.now().isoformat(),
            },
            'period': 'monthly'
        }
    )
    
    return f"Generated forecast: predicted total {monthly_forecast['predicted_total']}"


@shared_task
def check_low_stock_alerts():
    '''Check low stock and send alerts'''
    from .models import AnalyticsCache
    from .services.stock_predictor import StockPredictor
    
    predictor = StockPredictor()
    reorder_suggestions = predictor.get_reorder_suggestions()
    
    critical_items = [s for s in reorder_suggestions if s['urgency'] == 'critical']
    
    if critical_items:
        AnalyticsCache.objects.update_or_create(
            metric_name='stock_alerts',
            defaults={
                'metric_value': {
                    'critical_count': len(critical_items),
                    'items': critical_items[:10],
                    'generated_at': timezone.now().isoformat(),
                },
                'period': 'daily'
            }
        )
        
        logger.warning(f"STOCK ALERT: {len(critical_items)} products need urgent reordering")
    
    return f"Found {len(critical_items)} critical stock items"


@shared_task
def check_overdue_repairs():
    '''Check for overdue repairs and send notifications'''
    from apps.repairs.models import Repair
    from .models import AnalyticsCache
    
    today = timezone.now().date()
    overdue = Repair.objects.filter(
        expected_delivery__lt=today
    ).exclude(
        status__in=['delivered', 'cancelled']
    )
    
    overdue_count = overdue.count()
    
    AnalyticsCache.objects.update_or_create(
        metric_name='overdue_repairs',
        defaults={
            'metric_value': {
                'count': overdue_count,
                'generated_at': timezone.now().isoformat(),
            },
            'period': 'daily'
        }
    )
    
    if overdue_count > 0:
        logger.warning(f"REPAIR ALERT: {overdue_count} repairs are overdue")
    
    return f"Found {overdue_count} overdue repairs"


@shared_task
def generate_ai_insights():
    '''Generate and cache AI insights for dashboard'''
    from .models import AnalyticsCache
    from .services.ai_insights import AIInsightsService
    
    insights_service = AIInsightsService()
    widget_data = insights_service.get_dashboard_ai_widget()
    
    AnalyticsCache.objects.update_or_create(
        metric_name='ai_insights',
        defaults={
            'metric_value': {
                **widget_data,
                'generated_at': timezone.now().isoformat(),
            },
            'period': 'daily'
        }
    )
    
    return f"Generated {len(widget_data['insights'])} AI insights"


@shared_task
def daily_profit_analysis():
    '''Generate daily profit analysis and trend'''
    from .models import AnalyticsCache
    from .services.profit_predictor import ProfitPredictor
    
    predictor = ProfitPredictor()
    insights = predictor.get_profit_insights()
    
    AnalyticsCache.objects.update_or_create(
        metric_name='profit_insights',
        defaults={
            'metric_value': {
                **insights,
                'generated_at': timezone.now().isoformat(),
            },
            'period': 'daily'
        }
    )
    
    prediction = insights['prediction']
    return f"Profit analysis: Predicted net profit {prediction['predicted_net_profit']}"


@shared_task
def generate_inventory_health_report():
    '''Generate inventory health metrics'''
    from .models import AnalyticsCache
    from .services.stock_predictor import StockPredictor
    
    predictor = StockPredictor()
    health = predictor.get_inventory_health()
    
    AnalyticsCache.objects.update_or_create(
        metric_name='inventory_health',
        defaults={
            'metric_value': {
                **health,
                'generated_at': timezone.now().isoformat(),
            },
            'period': 'daily'
        }
    )
    
    return f"Inventory health score: {health['health_score']}%"
