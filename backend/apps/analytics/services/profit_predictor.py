"""
Profit Prediction Service
"""
from django.db.models import Sum, Avg
from django.utils import timezone
from datetime import timedelta
from apps.sales.models import Sale
from apps.repairs.models import Repair
from apps.expenses.models import Expense
from .forecasting import SalesForecast


class ProfitPredictor:
    """Profit prediction and analysis service"""
    
    def get_historical_profit_margin(self):
        """Calculate average profit margin from historical data"""
        totals = Sale.objects.aggregate(
            total_sales=Sum('total_amount'),
            total_profit=Sum('profit')
        )
        
        total_sales = totals['total_sales'] or 0
        total_profit = totals['total_profit'] or 0
        
        if total_sales == 0:
            return 0.20  # Default 20%
        
        return total_profit / total_sales
    
    def get_average_monthly_expenses(self, months=3):
        """Get average monthly expenses"""
        start_date = timezone.now().date() - timedelta(days=months * 30)
        
        total_expenses = Expense.objects.filter(
            date__gte=start_date
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        return total_expenses / months
    
    def get_average_repair_income(self, months=3):
        """Get average monthly repair income"""
        start_date = timezone.now().date() - timedelta(days=months * 30)
        
        total_repair = Repair.objects.filter(
            status='delivered',
            delivered_date__date__gte=start_date
        ).aggregate(total=Sum('repair_charge'))['total'] or 0
        
        return total_repair / months
    
    def predict_monthly_profit(self):
        """Predict this month's expected profit"""
        # Get sales forecast
        forecast = SalesForecast().get_monthly_forecast()
        predicted_sales = forecast['predicted_total']
        
        # Calculate predicted profit from sales
        profit_margin = self.get_historical_profit_margin()
        predicted_sales_profit = predicted_sales * profit_margin
        
        # Estimate repair income
        avg_repair_income = self.get_average_repair_income()
        
        # Total gross profit
        predicted_gross_profit = predicted_sales_profit + avg_repair_income
        
        # Estimate expenses
        avg_expenses = self.get_average_monthly_expenses()
        
        # Net profit
        predicted_net_profit = predicted_gross_profit - avg_expenses
        
        return {
            'predicted_sales': round(predicted_sales, 2),
            'profit_margin_percent': round(profit_margin * 100, 1),
            'predicted_sales_profit': round(predicted_sales_profit, 2),
            'predicted_repair_income': round(avg_repair_income, 2),
            'predicted_gross_profit': round(predicted_gross_profit, 2),
            'estimated_expenses': round(avg_expenses, 2),
            'predicted_net_profit': round(predicted_net_profit, 2),
            'is_profitable': predicted_net_profit > 0
        }
    
    def get_profit_trend(self, months=6):
        """Get profit trend over past months"""
        trends = []
        
        for i in range(months, 0, -1):
            start = (timezone.now().date().replace(day=1) - timedelta(days=30 * i)).replace(day=1)
            if start.month == 12:
                end = start.replace(year=start.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                end = start.replace(month=start.month + 1, day=1) - timedelta(days=1)
            
            sales_profit = Sale.objects.filter(
                sale_date__date__gte=start,
                sale_date__date__lte=end
            ).aggregate(profit=Sum('profit'))['profit'] or 0
            
            repair_income = Repair.objects.filter(
                status='delivered',
                delivered_date__date__gte=start,
                delivered_date__date__lte=end
            ).aggregate(total=Sum('repair_charge'))['total'] or 0
            
            expenses = Expense.objects.filter(
                date__gte=start,
                date__lte=end
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            gross = sales_profit + repair_income
            net = gross - expenses
            
            trends.append({
                'month': start.strftime('%Y-%m'),
                'month_name': start.strftime('%b %Y'),
                'sales_profit': sales_profit,
                'repair_income': repair_income,
                'gross_profit': gross,
                'expenses': expenses,
                'net_profit': net
            })
        
        return trends
    
    def get_profit_insights(self):
        """Get actionable profit insights"""
        prediction = self.predict_monthly_profit()
        trend = self.get_profit_trend(3)
        
        insights = []
        
        # Profitability insight
        if prediction['is_profitable']:
            insights.append({
                'type': 'positive',
                'title': 'Profitable Month Ahead',
                'message': f"Expected net profit: ₹{prediction['predicted_net_profit']:,.0f}"
            })
        else:
            insights.append({
                'type': 'warning',
                'title': 'Loss Expected',
                'message': f"Expected loss: ₹{abs(prediction['predicted_net_profit']):,.0f}. Consider reducing expenses."
            })
        
        # Margin insight
        if prediction['profit_margin_percent'] < 15:
            insights.append({
                'type': 'warning',
                'title': 'Low Profit Margin',
                'message': f"Current margin is {prediction['profit_margin_percent']}%. Consider reviewing pricing."
            })
        elif prediction['profit_margin_percent'] > 25:
            insights.append({
                'type': 'positive',
                'title': 'Healthy Margin',
                'message': f"Profit margin at {prediction['profit_margin_percent']}% is excellent."
            })
        
        # Trend insight
        if len(trend) >= 2:
            last_month = trend[-1]['net_profit']
            prev_month = trend[-2]['net_profit']
            
            if prev_month > 0:
                change = ((last_month - prev_month) / prev_month) * 100
                if change > 10:
                    insights.append({
                        'type': 'positive',
                        'title': 'Profit Growing',
                        'message': f"Net profit increased {change:.0f}% vs previous month."
                    })
                elif change < -10:
                    insights.append({
                        'type': 'warning',
                        'title': 'Profit Declining',
                        'message': f"Net profit decreased {abs(change):.0f}% vs previous month."
                    })
        
        return {
            'prediction': prediction,
            'trend': trend,
            'insights': insights
        }
