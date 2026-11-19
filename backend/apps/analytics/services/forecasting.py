"""
Enterprise AI Sales Forecasting Engine for Meghani Watch Co.
Meghani Connect 360 Ecosystem

Features:
- Multi-horizon forecasting (30, 60, 90 days)
- Revenue and unit sales volume predictions
- Daily, weekly, and monthly aggregation modes
- Facebook Prophet 1.3.0 modeling with robust statistical moving average fallback
- Historical holdout evaluation (MAE, RMSE, WAPE, Accuracy %)
- Day-of-week and seasonal pattern detection (Weekday vs Weekend multiplier)
- Product-level demand forecasting with data sufficiency validation
- Historical comparison and confidence uncertainty bounds
"""

import logging
from datetime import timedelta, date
from decimal import Decimal
import numpy as np
import pandas as pd
from django.utils import timezone
from django.db.models import Sum, Count, Avg, F
from django.db.models.functions import TruncDate, ExtractWeekDay
from apps.sales.models import Sale, SaleItem
from apps.products.models import Product

logger = logging.getLogger(__name__)


class SalesForecast:
    """
    Advanced Sales Forecasting Service combining Facebook Prophet
    and explainable statistical time-series methods.
    """

    def __init__(self):
        self.use_prophet = False
        try:
            from prophet import Prophet
            self.Prophet = Prophet
            self.use_prophet = True
        except ImportError:
            logger.info("Prophet not installed or unavailable; using statistical fallback.")

    def prepare_data(self, days=365, product_id=None):
        """
        Extract daily time-series data from sales history.
        Ensures continuous calendar index (fills 0 for zero-sale days).
        """
        start_date = timezone.now().date() - timedelta(days=days)
        end_date = timezone.now().date()

        if product_id:
            sales_qs = SaleItem.objects.filter(
                product_id=product_id,
                sale__sale_date__date__gte=start_date,
                sale__sale_date__date__lte=end_date
            ).annotate(
                date=TruncDate('sale__sale_date')
            ).values('date').annotate(
                total=Sum('subtotal'),
                volume=Sum('quantity')
            ).order_by('date')
        else:
            sales_qs = Sale.objects.filter(
                sale_date__date__gte=start_date,
                sale_date__date__lte=end_date
            ).annotate(
                date=TruncDate('sale_date')
            ).values('date').annotate(
                total=Sum('total_amount'),
                volume=Count('id')
            ).order_by('date')

        if not sales_qs.exists():
            return None

        # Build raw dataframe
        raw_df = pd.DataFrame(list(sales_qs))
        raw_df['date'] = pd.to_datetime(raw_df['date']).dt.tz_localize(None)
        raw_df.set_index('date', inplace=True)

        # Create continuous daily date range
        full_idx = pd.date_range(start=pd.to_datetime(start_date), end=pd.to_datetime(end_date), freq='D')
        df = raw_df.reindex(full_idx, fill_value=0.0).reset_index()
        df.rename(columns={'index': 'ds', 'total': 'y'}, inplace=True)
        df['y'] = df['y'].astype(float)
        if 'volume' not in df.columns:
            df['volume'] = 0
        df['volume'] = df['volume'].astype(int)

        return df

    def evaluate_holdout(self, df, holdout_days=14):
        """
        Backtest model against historical holdout data.
        Computes MAE, RMSE, WAPE, and Forecast Accuracy %.
        """
        if df is None or len(df) < (holdout_days + 14):
            return {
                'has_evaluation': False,
                'reason': 'Insufficient history for holdout validation (requires >= 28 days)',
                'mae': 0.0,
                'rmse': 0.0,
                'wape': 0.0,
                'accuracy_score': 0.0
            }

        train_df = df.iloc[:-holdout_days].copy()
        test_df = df.iloc[-holdout_days:].copy()

        y_test = test_df['y'].values

        # Predict holdout using available model
        if self.use_prophet and len(train_df[train_df['y'] > 0]) >= 7:
            try:
                import logging
                logging.getLogger('prophet').setLevel(logging.ERROR)
                logging.getLogger('cmdstanpy').setLevel(logging.ERROR)
                m = self.Prophet(
                    yearly_seasonality=False,
                    weekly_seasonality=True,
                    daily_seasonality=False,
                    interval_width=0.90
                )
                m.fit(train_df[['ds', 'y']])
                future = m.make_future_dataframe(periods=holdout_days)
                fc = m.predict(future)
                y_pred = fc.iloc[-holdout_days:]['yhat'].clip(lower=0).values
            except Exception as e:
                logger.warning(f"Prophet holdout backtest failed: {e}; falling back to statistical.")
                y_pred = self._statistical_predict(train_df, holdout_days)['yhat'].values
        else:
            y_pred = self._statistical_predict(train_df, holdout_days)['yhat'].values

        # Metrics calculation
        mae = float(np.mean(np.abs(y_test - y_pred)))
        rmse = float(np.sqrt(np.mean((y_test - y_pred) ** 2)))
        sum_actual = float(np.sum(y_test))
        wape = float(np.sum(np.abs(y_test - y_pred)) / max(sum_actual, 1.0))
        accuracy = max(0.0, min(100.0, (1.0 - wape) * 100.0))

        return {
            'has_evaluation': True,
            'holdout_days': holdout_days,
            'mae': round(mae, 2),
            'rmse': round(rmse, 2),
            'wape': round(wape, 4),
            'accuracy_score': round(accuracy, 1)
        }

    def _statistical_predict(self, df, periods=30):
        """
        Deterministic statistical forecast with day-of-week seasonality.
        Acts as reliable primary/fallback model when Prophet is unavailable or dataset is compact.
        """
        last_date = df['ds'].max()
        recent_window = df.tail(min(len(df), 60)).copy()
        baseline_daily = float(recent_window['y'].mean())
        std_daily = float(recent_window['y'].std()) if len(recent_window) > 1 else baseline_daily * 0.15

        # Compute day-of-week seasonal factors
        df['dow'] = df['ds'].dt.dayofweek
        dow_means = df.groupby('dow')['y'].mean()
        overall_mean = df['y'].mean()
        if overall_mean > 0:
            dow_factors = (dow_means / overall_mean).to_dict()
        else:
            dow_factors = {i: 1.0 for i in range(7)}

        predictions = []
        for i in range(1, periods + 1):
            next_date = last_date + pd.Timedelta(days=i)
            dow = next_date.dayofweek
            factor = dow_factors.get(dow, 1.0)
            yhat = max(0.0, baseline_daily * factor)
            yhat_lower = max(0.0, yhat - (1.65 * std_daily))
            yhat_upper = yhat + (1.65 * std_daily)

            predictions.append({
                'ds': next_date,
                'yhat': round(yhat, 2),
                'yhat_lower': round(yhat_lower, 2),
                'yhat_upper': round(yhat_upper, 2)
            })

        return pd.DataFrame(predictions)

    def analyze_patterns(self, df):
        """
        Analyze weekday vs weekend purchasing dynamics and seasonality.
        """
        if df is None or len(df) == 0:
            return {
                'weekday_avg_revenue': 0.0,
                'weekend_avg_revenue': 0.0,
                'weekend_multiplier': 1.0,
                'peak_day': 'Saturday',
                'peak_day_avg': 0.0,
                'day_of_week_distribution': {}
            }

        temp_df = df.copy()
        temp_df['day_name'] = temp_df['ds'].dt.day_name()
        temp_df['is_weekend'] = temp_df['ds'].dt.dayofweek >= 5

        dow_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        dow_avg = temp_df.groupby('day_name')['y'].mean().reindex(dow_order, fill_value=0.0)

        weekday_avg = float(temp_df[~temp_df['is_weekend']]['y'].mean() or 0.0)
        weekend_avg = float(temp_df[temp_df['is_weekend']]['y'].mean() or 0.0)
        multiplier = round(weekend_avg / max(weekday_avg, 1.0), 2)

        peak_day = str(dow_avg.idxmax()) if not dow_avg.empty else 'Saturday'
        peak_avg = float(dow_avg.max()) if not dow_avg.empty else 0.0

        distribution = {k: round(float(v), 2) for k, v in dow_avg.to_dict().items()}

        return {
            'weekday_avg_revenue': round(weekday_avg, 2),
            'weekend_avg_revenue': round(weekend_avg, 2),
            'weekend_multiplier': multiplier,
            'peak_day': peak_day,
            'peak_day_avg': round(peak_avg, 2),
            'day_of_week_distribution': distribution
        }

    def generate_forecast(self, horizon=30, product_id=None, lookback_days=365):
        """
        Generate complete forecast across requested horizon (30, 60, or 90 days).
        Returns daily projections, weekly & monthly rollups, metrics, and limitations.
        """
        horizon = int(horizon) if int(horizon) in [30, 60, 90] else 30
        df = self.prepare_data(days=lookback_days, product_id=product_id)

        # Assess data sufficiency
        active_days = len(df[df['y'] > 0]) if df is not None else 0
        total_days = len(df) if df is not None else 0
        has_sufficient_data = bool(df is not None and active_days >= 7 and total_days >= 14)

        patterns = self.analyze_patterns(df)
        eval_metrics = self.evaluate_holdout(df)

        if not has_sufficient_data:
            return {
                'horizon_days': horizon,
                'has_sufficient_data': False,
                'data_limitation_notice': (
                    'Insufficient historical transaction data to produce confident predictive models. '
                    f'Current records contain {active_days} active trading days (minimum 7 required over a 14-day span). '
                    'Predictions shown are baseline estimates.'
                ),
                'model_used': 'baseline_sparse_fallback',
                'training_sample_days': total_days,
                'active_trading_days': active_days,
                'predicted_total_revenue': 0.0,
                'predicted_lower_bound': 0.0,
                'predicted_upper_bound': 0.0,
                'predicted_total_volume': 0,
                'daily_average_revenue': 0.0,
                'daily_predictions': [],
                'weekly_summary': [],
                'monthly_summary': [],
                'patterns': patterns,
                'evaluation_metrics': eval_metrics,
                'generated_at': timezone.now().isoformat()
            }

        # Calculate average ticket price for volume derivation
        total_hist_rev = float(df['y'].sum())
        total_hist_vol = int(df['volume'].sum())
        avg_unit_value = (total_hist_rev / max(total_hist_vol, 1)) if total_hist_vol > 0 else 5000.0

        model_name = 'statistical_seasonal_moving_average'
        forecast_df = None

        if self.use_prophet and active_days >= 10:
            try:
                import logging
                logging.getLogger('prophet').setLevel(logging.ERROR)
                logging.getLogger('cmdstanpy').setLevel(logging.ERROR)
                m = self.Prophet(
                    yearly_seasonality=len(df) >= 180,
                    weekly_seasonality=True,
                    daily_seasonality=False,
                    interval_width=0.85
                )
                m.fit(df[['ds', 'y']])
                future = m.make_future_dataframe(periods=horizon)
                fc = m.predict(future)
                forecast_df = fc[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(horizon).copy()
                forecast_df['yhat'] = forecast_df['yhat'].clip(lower=0.0)
                forecast_df['yhat_lower'] = forecast_df['yhat_lower'].clip(lower=0.0)
                forecast_df['yhat_upper'] = forecast_df['yhat_upper'].clip(lower=0.0)
                model_name = 'facebook_prophet_v1.3'
            except Exception as e:
                logger.warning(f"Prophet fitting encountered: {e}. Executing statistical fallback.")
                forecast_df = None

        if forecast_df is None or (forecast_df['yhat'].sum() == 0 and has_sufficient_data):
            forecast_df = self._statistical_predict(df, periods=horizon)
            model_name = 'statistical_seasonal_moving_average'

        # Build daily records
        daily_records = []
        for _, row in forecast_df.iterrows():
            d_val = pd.to_datetime(row['ds']).strftime('%Y-%m-%d')
            rev = round(float(row['yhat']), 2)
            low = round(float(row['yhat_lower']), 2)
            high = round(float(row['yhat_upper']), 2)
            vol = max(1, int(round(rev / avg_unit_value))) if rev > 0 else 0
            daily_records.append({
                'date': d_val,
                'predicted_revenue': rev,
                'lower_bound': low,
                'upper_bound': high,
                'predicted_volume': vol
            })

        total_predicted_rev = round(sum(r['predicted_revenue'] for r in daily_records), 2)
        total_lower = round(sum(r['lower_bound'] for r in daily_records), 2)
        total_upper = round(sum(r['upper_bound'] for r in daily_records), 2)
        total_vol = sum(r['predicted_volume'] for r in daily_records)
        daily_avg = round(total_predicted_rev / max(horizon, 1), 2)

        # Weekly rollup
        weekly_summary = []
        for i in range(0, len(daily_records), 7):
            chunk = daily_records[i:i + 7]
            week_num = (i // 7) + 1
            w_rev = round(sum(c['predicted_revenue'] for c in chunk), 2)
            w_vol = sum(c['predicted_volume'] for c in chunk)
            weekly_summary.append({
                'week_number': f"Week {week_num}",
                'start_date': chunk[0]['date'],
                'end_date': chunk[-1]['date'],
                'predicted_revenue': w_rev,
                'predicted_volume': w_vol
            })

        # Monthly rollup
        monthly_summary = []
        for i in range(0, len(daily_records), 30):
            chunk = daily_records[i:i + 30]
            month_num = (i // 30) + 1
            m_rev = round(sum(c['predicted_revenue'] for c in chunk), 2)
            m_vol = sum(c['predicted_volume'] for c in chunk)
            monthly_summary.append({
                'month_period': f"Month {month_num}",
                'start_date': chunk[0]['date'],
                'end_date': chunk[-1]['date'],
                'predicted_revenue': m_rev,
                'predicted_volume': m_vol
            })

        # Historical comparison with past period of equal duration
        past_start = timezone.now().date() - timedelta(days=horizon)
        past_sales = Sale.objects.filter(
            sale_date__date__gte=past_start,
            sale_date__date__lt=timezone.now().date()
        ).aggregate(total=Sum('total_amount'), count=Count('id'))

        past_revenue = float(past_sales['total'] or 0.0)
        past_volume = int(past_sales['count'] or 0)

        if past_revenue > 0:
            growth_pct = round(((total_predicted_rev - past_revenue) / past_revenue) * 100.0, 1)
        else:
            growth_pct = 0.0

        comparison = {
            'past_period_revenue': past_revenue,
            'past_period_volume': past_volume,
            'growth_percentage': growth_pct,
            'trend_direction': 'up' if growth_pct > 1.5 else 'down' if growth_pct < -1.5 else 'stable'
        }

        return {
            'horizon_days': horizon,
            'has_sufficient_data': True,
            'data_limitation_notice': None,
            'model_used': model_name,
            'training_sample_days': total_days,
            'active_trading_days': active_days,
            'predicted_total_revenue': total_predicted_rev,
            'predicted_lower_bound': total_lower,
            'predicted_upper_bound': total_upper,
            'predicted_total_volume': total_vol,
            'daily_average_revenue': daily_avg,
            'comparison_with_past': comparison,
            'evaluation_metrics': eval_metrics,
            'patterns': patterns,
            'daily_predictions': daily_records,
            'weekly_summary': weekly_summary,
            'monthly_summary': monthly_summary,
            'generated_at': timezone.now().isoformat()
        }

    def get_monthly_forecast(self):
        """Backward-compatible helper for 30-day forecast"""
        fc = self.generate_forecast(horizon=30)
        return {
            'predicted_total': fc.get('predicted_total_revenue', 0),
            'lower_bound': fc.get('predicted_lower_bound', 0),
            'upper_bound': fc.get('predicted_upper_bound', 0),
            'average_daily': fc.get('daily_average_revenue', 0),
            'daily_predictions': fc.get('daily_predictions', []),
            'evaluation': fc.get('evaluation_metrics', {}),
            'model_used': fc.get('model_used', 'unknown'),
            'has_sufficient_data': fc.get('has_sufficient_data', False)
        }

    def get_comparison_with_last_month(self):
        """Backward-compatible helper for month-over-month comparison"""
        fc = self.generate_forecast(horizon=30)
        comp = fc.get('comparison_with_past', {})
        return {
            'last_month_actual': comp.get('past_period_revenue', 0),
            'next_month_predicted': fc.get('predicted_total_revenue', 0),
            'change_percent': comp.get('growth_percentage', 0),
            'trend': comp.get('trend_direction', 'stable')
        }
