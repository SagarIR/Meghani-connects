# Phase 7 – AI Automation Features

> **Current Status:** PARTIALLY COMPLETED  
> **Progress:** 6 / 8 verified tasks (75.0%)  
> **Last Updated:** 2026-11-19  
> **Next Action:** Determine Razorpay checkout necessity and evaluate whether transactional email dispatch is required.  
> **Master Tracker Reference:** [PROJECT_EXECUTION_TRACKER.md](./PROJECT_EXECUTION_TRACKER.md)

---

## Phase Progress Summary

| Task | Status | Evidence | Remaining Work |
|:---|:---:|:---|:---|
| Facebook Prophet Sales Forecasting (30/60/90 Days) | **COMPLETED** | `apps/analytics/services/forecasting.py` (`SalesForecast`). Implements Prophet 1.3 with weekly/yearly seasonality and statistical seasonal moving average fallback. | None. (Windows hosts fallback to seasonal MA due to cmdstan DLL relocation). |
| Smart Inventory Reorder Engine & Dynamic ROP | **COMPLETED** | `apps/analytics/services/reorder_engine.py` (`SmartReorderEngine`). Mathematical formulas for ADD, Safety Stock ($SS$), and Reorder Point ($ROP$). | None. |
| Automated ABC Inventory Classification | **COMPLETED** | `apps/analytics/services/abc_classification.py`. Pareto cumulative revenue analysis segmenting stock into Class A, B, C, and Unclassified. | None. |
| Statistical Business Anomaly Radar | **COMPLETED** | `apps/analytics/services/anomaly_detector.py`. Rolling Z-score anomaly detection ($Z \ge 2.5$) for sales spikes, drops, and abnormal discounts >20%. | None. |
| Controlled AI Business Assistant | **COMPLETED** | `apps/analytics/services/ai_assistant.py`. Deterministic intent routing, prompt injection defense, and RBAC wholesale margin masking for staff. | None. |
| Celery & Redis Background Worker Infrastructure | **COMPLETED** | `backend/core/celery.py`, Redis broker, Celery Beat with 7 scheduled daily/weekly tasks. | None. |
| Outbound WhatsApp & SMS Alerts (Twilio) | **COMPLETED** | `apps/notifications/services/whatsapp.py`, `sms.py`, and `tasks.py`. Hooked to repair status changes with automatic SMS fallback. | Requires production Twilio credentials for end-to-end device delivery. |
| Transactional Email & Razorpay Gateways | **PENDING / NOT STARTED** | Razorpay declared in settings but 0 code exists. `email_service.py` is absent from filesystem. | Author order creation endpoint if online payments required; wire email if needed. |

---

## Completed Tasks
- [x] Machine learning sales forecasting engine utilizing Facebook Prophet with multi-horizon projections (30, 60, 90 days) and robust seasonal statistical fallback.
- [x] Predictive inventory reorder engine computing product sales velocity, dynamic safety stock, ROP, and manager review lifecycle.
- [x] Automated ABC inventory classification following Pareto distribution.
- [x] Statistical anomaly radar detecting abnormal sales volumes, discounts, and inventory drops.
- [x] Controlled AI store assistant with prompt injection protection and RBAC margin shielding.
- [x] Celery worker and Redis broker infrastructure with 7 scheduled Celery Beat crons.
- [x] Twilio WhatsApp messaging client with automatic SMS fallback for repair pickup alerts.

## Pending Tasks
- [ ] Determine whether Razorpay is required for online deposit booking; author order creation endpoint if needed.
- [ ] Implement transactional email service if customer email notifications are desired.

## Blocked Tasks
*None. Zero active blockers in AI/analytics code.*

## Completion Criteria
1. Prophet forecasting model generates 30/60/90-day projections with fallback resilience. *(PASSED)*
2. Celery Beat executes scheduled morning and evening tasks without raising exceptions. *(PASSED)*
3. Twilio SMS client loads configured sender number from Django settings. *(PASSED)*

## Next Action
Evaluate whether online customer deposit checkout (Razorpay) or email notifications are required prior to production deployment.

---

## Original Technical Specifications & AI Features

### Objective

Implement AI-powered analytics, forecasting, and automation for intelligent business insights.

---

### AI Features Overview

| Feature | Purpose | Technology |
|---------|---------|------------|
| Sales Forecasting | Predict next month's sales | Prophet / ARIMA |
| Stock Predictions | Suggest reorder quantities | Scikit-learn |
| Smart Alerts | Low stock, slow movers | Rule-based + ML |
| Customer Insights | Purchase patterns | Clustering |
| Profit Prediction | Expected monthly gain | Regression |

---

### 1. Sales Forecasting

#### Technology: Facebook Prophet

Prophet is ideal for:
- Daily/weekly/monthly sales data
- Handling seasonality (festivals, weekends)
- Missing data tolerance

#### Implementation

```python
# apps/analytics/services/forecasting.py

from prophet import Prophet
import pandas as pd
from apps.sales.models import Sale
from django.db.models.functions import TruncDate
from django.db.models import Sum

class SalesForecast:
    def __init__(self):
        self.model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False
        )
    
    def prepare_data(self, days=365):
        """Get historical sales data"""
        sales = Sale.objects.annotate(
            date=TruncDate('sale_date')
        ).values('date').annotate(
            total=Sum('total_amount')
        ).order_by('date')
        
        df = pd.DataFrame(list(sales))
        df.columns = ['ds', 'y']  # Prophet format
        return df
    
    def train_and_predict(self, periods=30):
        """Train model and predict next N days"""
        df = self.prepare_data()
        self.model.fit(df)
        
        future = self.model.make_future_dataframe(periods=periods)
        forecast = self.model.predict(future)
        
        return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(periods)
    
    def get_monthly_forecast(self):
        """Get next month's predicted sales"""
        forecast = self.train_and_predict(30)
        return {
            'predicted_total': forecast['yhat'].sum(),
            'lower_bound': forecast['yhat_lower'].sum(),
            'upper_bound': forecast['yhat_upper'].sum(),
            'daily_predictions': forecast.to_dict('records')
        }
```

#### API Endpoint

```python
# apps/analytics/views.py

class SalesForecastView(APIView):
    def get(self, request):
        periods = int(request.query_params.get('days', 30))
        forecast = SalesForecast().train_and_predict(periods)
        return Response({
            'forecast': forecast.to_dict('records'),
            'summary': {
                'predicted_total': forecast['yhat'].sum(),
                'average_daily': forecast['yhat'].mean()
            }
        })
```

---

### 2. Stock Prediction & Reorder Suggestions

#### Technology: Scikit-learn (Linear Regression)

#### Implementation

```python
# apps/analytics/services/stock_predictor.py

from sklearn.linear_model import LinearRegression
import numpy as np
from apps.products.models import Product
from apps.sales.models import SaleItem
from django.db.models.functions import TruncWeek
from django.db.models import Sum

class StockPredictor:
    
    def calculate_sales_velocity(self, product_id, weeks=12):
        """Calculate average weekly sales for a product"""
        weekly_sales = SaleItem.objects.filter(
            product_id=product_id
        ).annotate(
            week=TruncWeek('sale__sale_date')
        ).values('week').annotate(
            total=Sum('quantity')
        ).order_by('week')
        
        if not weekly_sales:
            return 0
        
        return sum(s['total'] for s in weekly_sales) / len(weekly_sales)
    
    def predict_stockout_date(self, product_id):
        """Predict when product will run out"""
        product = Product.objects.get(id=product_id)
        velocity = self.calculate_sales_velocity(product_id)
        
        if velocity == 0:
            return None  # No sales history
        
        days_remaining = product.stock / (velocity / 7)
        return days_remaining
    
    def get_reorder_suggestions(self, lead_time_days=7, safety_stock_days=14):
        """Get products that need reordering"""
        suggestions = []
        products = Product.objects.filter(is_active=True)
        
        for product in products:
            velocity = self.calculate_sales_velocity(product.id)
            if velocity == 0:
                continue
            
            daily_velocity = velocity / 7
            reorder_point = daily_velocity * (lead_time_days + safety_stock_days)
            
            if product.stock <= reorder_point:
                suggested_quantity = daily_velocity * 30  # 1 month supply
                suggestions.append({
                    'product_id': product.id,
                    'product_name': product.name,
                    'current_stock': product.stock,
                    'daily_velocity': round(daily_velocity, 2),
                    'reorder_point': round(reorder_point),
                    'suggested_quantity': round(suggested_quantity),
                    'urgency': 'high' if product.stock <= daily_velocity * 3 else 'medium'
                })
        
        return sorted(suggestions, key=lambda x: x['urgency'] == 'high', reverse=True)
```

#### API Endpoint

```python
class ReorderSuggestionsView(APIView):
    def get(self, request):
        predictor = StockPredictor()
        suggestions = predictor.get_reorder_suggestions()
        return Response({'suggestions': suggestions})
```

---

### 3. Smart Alerts System

#### Alert Types

| Alert | Trigger | Action |
|-------|---------|--------|
| Low Stock | stock <= threshold | Dashboard notification |
| Slow Mover | No sales in 30 days | Suggest discount |
| Repair Ready | Status → ready | WhatsApp to customer |
| Warranty Expiring | 7 days before expiry | SMS reminder |
| Birthday | Customer DOB = today | Send offer |

#### Implementation

```python
# apps/analytics/services/alerts.py

from django.utils import timezone
from datetime import timedelta
from apps.products.models import Product
from apps.repairs.models import Repair
from apps.crm.models import Customer
from apps.sales.models import Warranty

class AlertService:
    
    def get_low_stock_alerts(self, threshold=5):
        """Products below stock threshold"""
        return list(Product.objects.filter(
            stock__lte=threshold,
            is_active=True
        ).values('id', 'name', 'stock', 'brand'))
    
    def get_slow_movers(self, days=30):
        """Products with no sales in N days"""
        cutoff = timezone.now() - timedelta(days=days)
        
        # Products sold recently
        sold_ids = SaleItem.objects.filter(
            sale__sale_date__gte=cutoff
        ).values_list('product_id', flat=True).distinct()
        
        # Products NOT in sold list
        return list(Product.objects.filter(
            is_active=True,
            stock__gt=0
        ).exclude(id__in=sold_ids).values('id', 'name', 'stock', 'selling_price'))
    
    def get_warranty_expiring(self, days_ahead=7):
        """Warranties expiring soon"""
        cutoff = timezone.now().date() + timedelta(days=days_ahead)
        return list(Warranty.objects.filter(
            expiry_date__lte=cutoff,
            expiry_date__gte=timezone.now().date(),
            notified=False
        ).select_related('customer', 'product').values(
            'id', 'customer__name', 'customer__phone', 
            'product__name', 'expiry_date'
        ))
    
    def get_birthday_customers(self):
        """Customers with birthday today"""
        today = timezone.now().date()
        return list(Customer.objects.filter(
            date_of_birth__month=today.month,
            date_of_birth__day=today.day
        ).values('id', 'name', 'phone'))
    
    def get_all_alerts(self):
        """Consolidated alerts for dashboard"""
        return {
            'low_stock': self.get_low_stock_alerts(),
            'slow_movers': self.get_slow_movers(),
            'warranty_expiring': self.get_warranty_expiring(),
            'birthdays': self.get_birthday_customers()
        }
```

---

### 4. AI Notification Triggers

#### Celery Tasks for Automation

```python
# apps/analytics/tasks.py

from celery import shared_task
from .services.alerts import AlertService
from apps.notifications.services.whatsapp import send_whatsapp

@shared_task
def check_and_send_birthday_wishes():
    """Daily task to send birthday wishes"""
    service = AlertService()
    customers = service.get_birthday_customers()
    
    for customer in customers:
        message = f"Happy Birthday {customer['name']}! Visit Meghani Watch Co. for a special 10% discount today."
        send_whatsapp(customer['phone'], message)

@shared_task
def check_warranty_expiry_notifications():
    """Daily task to notify warranty expiring"""
    service = AlertService()
    warranties = service.get_warranty_expiring()
    
    for warranty in warranties:
        message = f"Reminder: Your warranty for {warranty['product__name']} expires on {warranty['expiry_date']}."
        send_whatsapp(warranty['customer__phone'], message)
        
        # Mark as notified
        Warranty.objects.filter(id=warranty['id']).update(notified=True)

@shared_task
def generate_daily_forecast():
    """Generate and cache daily forecast"""
    from .services.forecasting import SalesForecast
    from .models import AnalyticsCache
    
    forecast = SalesForecast().get_monthly_forecast()
    AnalyticsCache.objects.update_or_create(
        metric_name='monthly_forecast',
        defaults={'metric_value': forecast, 'updated_on': timezone.now()}
    )
```

#### Celery Beat Schedule

```python
# core/celery.py

from celery.schedules import crontab

app.conf.beat_schedule = {
    'birthday-wishes': {
        'task': 'apps.analytics.tasks.check_and_send_birthday_wishes',
        'schedule': crontab(hour=9, minute=0),  # Daily at 9 AM
    },
    'warranty-reminders': {
        'task': 'apps.analytics.tasks.check_warranty_expiry_notifications',
        'schedule': crontab(hour=10, minute=0),  # Daily at 10 AM
    },
    'daily-forecast': {
        'task': 'apps.analytics.tasks.generate_daily_forecast',
        'schedule': crontab(hour=0, minute=30),  # Daily at 12:30 AM
    },
}
```

---

### 5. Profit Prediction

#### Implementation

```python
# apps/analytics/services/profit_predictor.py

class ProfitPredictor:
    
    def predict_monthly_profit(self):
        """Predict this month's expected profit"""
        # Get sales forecast
        sales_forecast = SalesForecast().get_monthly_forecast()
        predicted_sales = sales_forecast['predicted_total']
        
        # Calculate average profit margin from historical data
        total_sales = Sale.objects.aggregate(total=Sum('total_amount'))['total'] or 0
        total_profit = Sale.objects.aggregate(total=Sum('profit'))['total'] or 0
        
        if total_sales == 0:
            profit_margin = 0.20  # Default 20%
        else:
            profit_margin = total_profit / total_sales
        
        # Predict profit
        predicted_profit = predicted_sales * profit_margin
        
        # Estimate expenses (average of last 3 months)
        from apps.expenses.models import Expense
        avg_expenses = Expense.objects.filter(
            date__gte=timezone.now() - timedelta(days=90)
        ).aggregate(avg=Avg('amount') * 30)['avg'] or 0
        
        return {
            'predicted_sales': round(predicted_sales, 2),
            'predicted_gross_profit': round(predicted_profit, 2),
            'estimated_expenses': round(avg_expenses, 2),
            'predicted_net_profit': round(predicted_profit - avg_expenses, 2),
            'profit_margin': round(profit_margin * 100, 1)
        }
```

---

### 6. Dashboard AI Insights Widget

#### API Response

```json
{
  "insights": [
    {
      "type": "forecast",
      "icon": "trending-up",
      "title": "Sales Forecast",
      "message": "Expected sales this month: ₹4,85,000 (+12% vs last month)",
      "priority": "info"
    },
    {
      "type": "alert",
      "icon": "alert-triangle",
      "title": "Low Stock Alert",
      "message": "5 products are running low. Titan Raga needs immediate restock.",
      "priority": "warning"
    },
    {
      "type": "suggestion",
      "icon": "lightbulb",
      "title": "Slow Mover",
      "message": "Casio G-Shock hasn't sold in 45 days. Consider a 15% discount.",
      "priority": "info"
    }
  ]
}
```

---

### Requirements

```txt
# AI/ML packages
pandas>=2.0
numpy>=1.24
scikit-learn>=1.3
prophet>=1.1

# Task queue
celery>=5.3
redis>=5.0
django-celery-beat>=2.5
```

---

## Next Phase

→ [Phase 8 - Deployment](./08-phase-8-deployment.md)
