"""
Sales Forecasting using Prophet or fallback to simple moving average
"""
import pandas as pd
import numpy as np
from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum
from django.db.models.functions import TruncDate
from apps.sales.models import Sale


class SalesForecast:
    """Sales forecasting service"""
    
    def __init__(self):
        self.use_prophet = False
        try:
            from prophet import Prophet
            self.Prophet = Prophet
            self.use_prophet = True
        except ImportError:
            # Prophet not installed, use simple forecasting
            pass
    
    def prepare_data(self, days=365):
        """Get historical sales data"""
        start_date = timezone.now().date() - timedelta(days=days)
        
        sales = Sale.objects.filter(
            sale_date__date__gte=start_date
        ).annotate(
            date=TruncDate('sale_date')
        ).values('date').annotate(
            total=Sum('total_amount')
        ).order_by('date')
        
        if not sales:
            return None
        
        df = pd.DataFrame(list(sales))
        df.columns = ['ds', 'y']
        df['ds'] = pd.to_datetime(df['ds'])
        return df
    
    def train_and_predict_prophet(self, periods=30):
        """Train Prophet model and predict"""
        df = self.prepare_data()
        if df is None or len(df) < 7:
            return None
        
        model = self.Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False
        )
        model.fit(df)
        
        future = model.make_future_dataframe(periods=periods)
        forecast = model.predict(future)
        
        return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(periods)
    
    def train_and_predict_simple(self, periods=30):
        """Simple moving average forecast as fallback"""
        df = self.prepare_data()
        if df is None or len(df) < 7:
            return self._empty_forecast(periods)
        
        # Calculate 7-day moving average
        avg_daily = df['y'].tail(30).mean()
        
        # Add some variance based on historical data
        std = df['y'].std() if len(df) > 1 else avg_daily * 0.1
        
        predictions = []
        for i in range(periods):
            date = timezone.now().date() + timedelta(days=i+1)
            predictions.append({
                'ds': date,
                'yhat': round(avg_daily, 2),
                'yhat_lower': round(max(0, avg_daily - std), 2),
                'yhat_upper': round(avg_daily + std, 2)
            })
        
        return pd.DataFrame(predictions)
    
    def _empty_forecast(self, periods):
        """Return empty forecast when no data"""
        predictions = []
        for i in range(periods):
            date = timezone.now().date() + timedelta(days=i+1)
            predictions.append({
                'ds': date,
                'yhat': 0,
                'yhat_lower': 0,
                'yhat_upper': 0
            })
        return pd.DataFrame(predictions)
    
    def train_and_predict(self, periods=30):
        """Train and predict using best available method"""
        if self.use_prophet:
            try:
                result = self.train_and_predict_prophet(periods)
                if result is not None:
                    return result
            except Exception:
                pass
        
        return self.train_and_predict_simple(periods)
    
    def get_monthly_forecast(self):
        """Get next month's predicted sales"""
        forecast = self.train_and_predict(30)
        
        if forecast is None or forecast.empty:
            return {
                'predicted_total': 0,
                'lower_bound': 0,
                'upper_bound': 0,
                'average_daily': 0,
                'daily_predictions': []
            }
        
        return {
            'predicted_total': round(forecast['yhat'].sum(), 2),
            'lower_bound': round(forecast['yhat_lower'].sum(), 2),
            'upper_bound': round(forecast['yhat_upper'].sum(), 2),
            'average_daily': round(forecast['yhat'].mean(), 2),
            'daily_predictions': forecast.to_dict('records')
        }
    
    def get_comparison_with_last_month(self):
        """Compare forecast with last month's actual sales"""
        last_month_start = (timezone.now().date().replace(day=1) - timedelta(days=1)).replace(day=1)
        last_month_end = timezone.now().date().replace(day=1) - timedelta(days=1)
        
        last_month_sales = Sale.objects.filter(
            sale_date__date__gte=last_month_start,
            sale_date__date__lte=last_month_end
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        forecast = self.get_monthly_forecast()
        predicted = forecast['predicted_total']
        
        if last_month_sales > 0:
            change_percent = ((predicted - last_month_sales) / last_month_sales) * 100
        else:
            change_percent = 0
        
        return {
            'last_month_actual': last_month_sales,
            'next_month_predicted': predicted,
            'change_percent': round(change_percent, 1),
            'trend': 'up' if change_percent > 0 else 'down' if change_percent < 0 else 'stable'
        }
