"""
Controlled AI Business Assistant for Meghani Watch Co.
Meghani Connect 360 Ecosystem

Features:
- Controlled, intent-based natural language execution
- Deterministic intent classification with entity extraction
- Strict Role-Based Access Control (RBAC):
  - Admin/Manager: Full access to financial metrics, gross/net profits, wholesale margins
  - Staff: Financial figures and wholesale costs masked with authorization notice
- Clear categorization of responses:
  - [ACTUAL HISTORICAL] for verified past transactions
  - [CURRENT OPERATIONAL] for live register / today stats
  - [PREDICTIVE FORECAST] for statistical / Prophet estimates
  - [INVENTORY RECOMMENDATION] for replenishment advice
- Zero raw SQL execution or unrestricted DB privileges
- Zero exposure of Django secrets or internal architecture
- Comprehensive AuditLog recording of assistant interactions
"""

import re
import logging
from datetime import timedelta, date
from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum, Count, Avg, F
from django.conf import settings
from apps.sales.models import Sale, SaleItem
from apps.products.models import Product
from apps.expenses.models import Expense
from apps.core.models import AuditLog
from apps.analytics.services.forecasting import SalesForecast
from apps.analytics.services.reorder_engine import SmartReorderEngine
from apps.analytics.services.stock_predictor import StockPredictor
from apps.analytics.services.profit_predictor import ProfitPredictor

logger = logging.getLogger(__name__)


class ControlledAIAssistant:
    """
    Secure business assistant providing explainable answers to management and staff queries.
    """

    SUPPORTED_INTENTS = [
        'today_sales',
        'top_products',
        'reorder_needed',
        'expenses_summary',
        'profit_and_margins',
        'slow_movers',
        'sales_comparison',
        'brand_performance',
        'sales_forecast',
        'inventory_health',
        'help_menu'
    ]

    def __init__(self, user):
        self.user = user
        self.is_management = getattr(user, 'role', '') in ['admin', 'manager'] or getattr(user, 'is_staff', False)

    def parse_intent(self, query: str):
        """
        Classifies user natural language query into a supported business intent.
        Immune to prompt injection as it executes only mapped deterministic handler methods.
        """
        q = (query or '').strip().lower()

        # Check for prompt injection or system interrogation patterns
        if any(term in q for term in ['ignore previous', 'system prompt', 'select *', 'drop table', 'delete from', 'dump database', 'api_key', 'secret_key']):
            return 'security_violation', {}

        # 1. Today's sales & live register
        if any(kw in q for kw in ["today's sale", "today sales", "sales today", "how much sold today", "today total", "daily sale"]):
            return 'today_sales', {}

        # 2. Sales forecast & next month predictions
        if any(kw in q for kw in ['forecast', 'predict', 'next month', 'expected sales', 'future sales', 'upcoming sales', 'trend for next']):
            horizon = 30
            if '60' in q:
                horizon = 60
            elif '90' in q:
                horizon = 90
            return 'sales_forecast', {'horizon': horizon}

        # 3. Restock / Reorder requirements
        if any(kw in q for kw in ['restock', 'reorder', 'replenish', 'stockout', 'running out', 'need stock', 'low stock']):
            return 'reorder_needed', {}

        # 4. Top selling products
        if any(kw in q for kw in ['top product', 'best seller', 'sold the most', 'highest selling', 'popular product', 'most sold']):
            return 'top_products', {}

        # 5. Slow moving products
        if any(kw in q for kw in ['slow move', 'not selling', 'dead stock', 'no sales', 'slowest']):
            return 'slow_movers', {}

        # 6. Expenses
        if any(kw in q for kw in ['expense', 'overhead', 'spending', 'cost of running', 'how much spent']):
            return 'expenses_summary', {}

        # 7. Profit & Gross margins
        if any(kw in q for kw in ['profit', 'margin', 'gross profit', 'net profit', 'earnings']):
            return 'profit_and_margins', {}

        # 8. Brand performance
        if any(kw in q for kw in ['brand', 'which brand', 'rolex', 'omega', 'tissot', 'seiko', 'casio', 'brand revenue']):
            return 'brand_performance', {}

        # 9. Month-over-month sales comparison
        if any(kw in q for kw in ['compare', 'comparison', 'vs last month', 'growth', 'performing compared']):
            return 'sales_comparison', {}

        # 10. Overall inventory health
        if any(kw in q for kw in ['inventory health', 'stock summary', 'total stock', 'stock valuation']):
            return 'inventory_health', {}

        # 11. General greeting or help
        if any(kw in q for kw in ['help', 'what can you do', 'menu', 'commands', 'hi', 'hello']):
            return 'help_menu', {}

        return 'unsupported_intent', {'raw_query': query}

    def process_query(self, query: str):
        """
        Main query processing pipeline:
        1. Parse intent & extract entities
        2. Execute permission-gated analytics tool
        3. Format response distinguishing Actual vs Forecast
        4. Log interaction in AuditLog
        """
        intent, params = self.parse_intent(query)
        timestamp = timezone.now().strftime('%d-%b-%Y %H:%M')

        if intent == 'security_violation':
            response_data = {
                'intent': 'security_violation',
                'badge': 'SECURITY RESTRICTION',
                'title': 'Security Policy Enforced',
                'message': (
                    'Meghani Connect 360 AI Assistant operates in a strictly sandboxed, permission-isolated environment. '
                    'Raw system commands, database inspection, and prompt-override instructions are automatically prohibited. '
                    'This event has been recorded in the security audit register.'
                ),
                'figures': {},
                'data_classification': 'SECURITY_ALERT',
                'reporting_date': timestamp
            }
            self._log_audit(query, response_data, severity='warning')
            return response_data

        if intent == 'unsupported_intent':
            response_data = {
                'intent': 'unsupported_intent',
                'badge': 'GUIDANCE',
                'title': 'Question Not Recognized',
                'message': (
                    f"I couldn't identify a supported business analytics intent for: \"{query}\". "
                    "Try asking about: today's sales, top selling timepieces, restock recommendations, "
                    "monthly expenses, gross profit, sales forecast for the next 30/60/90 days, "
                    "or brand performance."
                ),
                'figures': {},
                'data_classification': 'GUIDANCE',
                'reporting_date': timestamp
            }
            self._log_audit(query, response_data, severity='info')
            return response_data

        # Dispatch to dedicated handler
        handler_map = {
            'today_sales': self._handle_today_sales,
            'sales_forecast': lambda: self._handle_sales_forecast(params.get('horizon', 30)),
            'reorder_needed': self._handle_reorder_needed,
            'top_products': self._handle_top_products,
            'slow_movers': self._handle_slow_movers,
            'expenses_summary': self._handle_expenses_summary,
            'profit_and_margins': self._handle_profit_and_margins,
            'brand_performance': self._handle_brand_performance,
            'sales_comparison': self._handle_sales_comparison,
            'inventory_health': self._handle_inventory_health,
            'help_menu': self._handle_help_menu,
        }

        handler = handler_map.get(intent)
        if handler:
            response_data = handler()
        else:
            response_data = self._handle_help_menu()

        response_data['reporting_date'] = timestamp
        self._log_audit(query, response_data, severity='info')
        return response_data

    # --- INTENT HANDLERS ---

    def _handle_today_sales(self):
        today = timezone.now().date()
        sales_today = Sale.objects.filter(sale_date__date=today)
        summary = sales_today.aggregate(
            total=Sum('total_amount'),
            count=Count('id'),
            total_discount=Sum('discount')
        )
        total_rev = float(summary['total'] or 0.0)
        count = int(summary['count'] or 0)
        discount = float(summary['total_discount'] or 0.0)

        # Breakdowns
        tenders = {'cash': 0.0, 'upi': 0.0, 'card': 0.0}
        for s in sales_today:
            mode = s.payment_mode
            if mode in tenders:
                tenders[mode] += float(s.total_amount)
            elif mode == 'mixed' and isinstance(s.payment_details, dict):
                for m, val in s.payment_details.items():
                    k = m.lower()
                    if k in tenders:
                        try:
                            tenders[k] += float(val)
                        except Exception:
                            pass

        msg = (
            f"Today's total sales stand at ₹{total_rev:,.2f} across {count} transaction(s). "
            f"Tender breakdown: ₹{tenders['cash']:,.2f} Cash, ₹{tenders['upi']:,.2f} UPI, and ₹{tenders['card']:,.2f} Card. "
            f"Total customer discounts applied today: ₹{discount:,.2f}."
        )

        return {
            'intent': 'today_sales',
            'badge': 'CURRENT OPERATIONAL FIGURES',
            'title': "Today's Sales Summary",
            'message': msg,
            'figures': {
                'total_revenue': total_rev,
                'transaction_count': count,
                'total_discount': discount,
                'tenders': tenders
            },
            'data_classification': 'CURRENT_OPERATIONAL',
            'limitations_note': None
        }

    def _handle_sales_forecast(self, horizon=30):
        fc_engine = SalesForecast()
        fc = fc_engine.generate_forecast(horizon=horizon)

        pred_total = fc['predicted_total_revenue']
        pred_vol = fc['predicted_total_volume']
        daily_avg = fc['daily_average_revenue']
        model = fc['model_used']
        accuracy = fc.get('evaluation_metrics', {}).get('accuracy_score', 0)
        has_sufficient = fc['has_sufficient_data']

        if has_sufficient:
            msg = (
                f"Sales forecast for the next {horizon} days predicts total revenue of ₹{pred_total:,.2f} "
                f"(± confidence band: ₹{fc['predicted_lower_bound']:,.2f} to ₹{fc['predicted_upper_bound']:,.2f}) "
                f"and expected sales volume of {pred_vol} timepieces/accessories. "
                f"Average daily projected revenue is ₹{daily_avg:,.2f}. Model: {model} with holdout accuracy of {accuracy}%."
            )
        else:
            msg = (
                f"Based on baseline historical trends, projected next {horizon} days sales are estimated at "
                f"₹{pred_total:,.2f}. "
                f"Notice: Historical transaction density is currently limited ({fc['active_trading_days']} active trading days). "
                "Confidence intervals should be treated as indicative estimates rather than firm guarantees."
            )

        return {
            'intent': 'sales_forecast',
            'badge': 'PREDICTIVE MODEL FORECAST',
            'title': f"{horizon}-Day Sales Forecast",
            'message': msg,
            'figures': {
                'horizon_days': horizon,
                'predicted_total_revenue': pred_total,
                'predicted_total_volume': pred_vol,
                'predicted_lower_bound': fc['predicted_lower_bound'],
                'predicted_upper_bound': fc['predicted_upper_bound'],
                'daily_average_revenue': daily_avg,
                'model_used': model,
                'accuracy_score': accuracy
            },
            'data_classification': 'MODEL_FORECAST',
            'limitations_note': fc.get('data_limitation_notice')
        }

    def _handle_reorder_needed(self):
        engine = SmartReorderEngine()
        recs = engine.generate_recommendations()

        critical = [r for r in recs if r.urgency == 'critical']
        high = [r for r in recs if r.urgency == 'high']
        total_items = len(recs)

        if total_items == 0:
            msg = "Inventory levels are currently healthy! No active timepiece or accessory requires immediate restocking."
        else:
            msg = (
                f"There are currently {total_items} product(s) flagged for replenishment by the Smart Reorder Engine. "
                f"Critical urgency: {len(critical)} item(s) (≤ 3 days stock). High urgency: {len(high)} item(s). "
                "Recommendations require manager approval before generating supplier purchase orders."
            )

        top_recs = []
        for r in recs[:5]:
            top_recs.append({
                'product_name': r.product.name,
                'current_stock': r.current_stock,
                'suggested_quantity': r.suggested_quantity,
                'urgency': r.urgency,
                'days_of_stock': float(r.days_of_stock)
            })

        return {
            'intent': 'reorder_needed',
            'badge': 'INVENTORY RECOMMENDATIONS',
            'title': 'Replenishment & Reorder Radar',
            'message': msg,
            'figures': {
                'total_reorder_items': total_items,
                'critical_items_count': len(critical),
                'high_items_count': len(high),
                'top_recommendations': top_recs
            },
            'data_classification': 'RECOMMENDATION',
            'limitations_note': 'Calculations account for 90-day demand velocity and supplier lead times.'
        }

    def _handle_top_products(self):
        top_items = SaleItem.objects.values(
            'product__id', 'product__name', 'product__brand'
        ).annotate(
            total_sold=Sum('quantity'),
            total_revenue=Sum('subtotal')
        ).order_by('-total_revenue')[:5]

        items_list = []
        for idx, item in enumerate(top_items, 1):
            items_list.append(
                f"{idx}. {item['product__brand']} {item['product__name']} — {item['total_sold']} units (₹{float(item['total_revenue']):,.2f})"
            )

        msg = "Top revenue-generating timepieces:\n" + ("\n".join(items_list) if items_list else "No sales recorded yet.")

        return {
            'intent': 'top_products',
            'badge': 'ACTUAL HISTORICAL FIGURES',
            'title': 'Best Performing Timepieces',
            'message': msg,
            'figures': {'top_products': list(top_items)},
            'data_classification': 'ACTUAL_HISTORICAL',
            'limitations_note': None
        }

    def _handle_slow_movers(self):
        predictor = StockPredictor()
        slow_movers = predictor.get_slow_movers(days=30, limit=5)

        items_summary = []
        for sm in slow_movers:
            days_txt = f"{sm['days_since_last_sale']} days ago" if sm['days_since_last_sale'] else "Never sold"
            items_summary.append(f"• {sm['name']} ({sm['brand']}) — {sm['stock']} in stock (Last sale: {days_txt})")

        msg = (
            f"Found {len(slow_movers)} slow-moving product(s) with zero sales over the last 30 days:\n" +
            ("\n".join(items_summary) if items_summary else "All in-stock products have recorded recent sales.")
        )

        return {
            'intent': 'slow_movers',
            'badge': 'ACTUAL HISTORICAL FIGURES',
            'title': 'Slow-Moving Stock Warning',
            'message': msg,
            'figures': {'count': len(slow_movers), 'items': slow_movers},
            'data_classification': 'ACTUAL_HISTORICAL',
            'limitations_note': 'Evaluates active products with positive stock.'
        }

    def _handle_expenses_summary(self):
        if not self.is_management:
            return {
                'intent': 'expenses_summary',
                'badge': 'ACCESS RESTRICTED',
                'title': 'Manager Authorization Required',
                'message': 'Store operating overheads and expense ledgers are restricted to Manager and Administrator roles.',
                'figures': {},
                'data_classification': 'MASKED_RESTRICTED',
                'limitations_note': 'RBAC Security Policy Enforced'
            }

        start_date = timezone.now().date().replace(day=1)
        expenses_qs = Expense.objects.filter(date__gte=start_date)
        total_expenses = float(expenses_qs.aggregate(total=Sum('amount'))['total'] or 0.0)

        by_category = expenses_qs.values('category').annotate(total=Sum('amount')).order_by('-total')

        cat_breakdown = ", ".join([f"{c['category'].title()}: ₹{float(c['total']):,.2f}" for c in by_category])

        msg = (
            f"Month-to-date operating expenses total ₹{total_expenses:,.2f}. "
            f"Cost center breakdown: {cat_breakdown if cat_breakdown else 'No expenses logged this month.'}"
        )

        return {
            'intent': 'expenses_summary',
            'badge': 'ACTUAL HISTORICAL FIGURES',
            'title': "This Month's Operating Expenses",
            'message': msg,
            'figures': {
                'total_expenses': total_expenses,
                'categories': list(by_category)
            },
            'data_classification': 'ACTUAL_HISTORICAL',
            'limitations_note': None
        }

    def _handle_profit_and_margins(self):
        if not self.is_management:
            return {
                'intent': 'profit_and_margins',
                'badge': 'ACCESS RESTRICTED',
                'title': 'Wholesale Margin Access Restricted',
                'message': 'Gross profit margins, wholesale cost prices, and net earnings are restricted to authorized management personnel.',
                'figures': {},
                'data_classification': 'MASKED_RESTRICTED',
                'limitations_note': 'Wholesale cost privacy enforced under Store Policy.'
            }

        start_date = timezone.now().date().replace(day=1)
        sales_summary = Sale.objects.filter(sale_date__date__gte=start_date).aggregate(
            revenue=Sum('total_amount'),
            profit=Sum('profit')
        )
        rev = float(sales_summary['revenue'] or 0.0)
        gross_profit = float(sales_summary['profit'] or 0.0)
        margin_pct = round((gross_profit / max(rev, 1.0)) * 100.0, 1)

        exp = float(Expense.objects.filter(date__gte=start_date).aggregate(total=Sum('amount'))['total'] or 0.0)
        net_profit = round(gross_profit - exp, 2)

        msg = (
            f"Month-to-date financial performance: Revenue of ₹{rev:,.2f} yielded Gross Profit of ₹{gross_profit:,.2f} "
            f"(Margin: {margin_pct}%). Deducting store operating expenses of ₹{exp:,.2f} leaves Estimated Net Profit of ₹{net_profit:,.2f}."
        )

        return {
            'intent': 'profit_and_margins',
            'badge': 'ACTUAL FINANCIAL FIGURES',
            'title': 'Gross & Net Profit Intelligence',
            'message': msg,
            'figures': {
                'month_revenue': rev,
                'gross_profit': gross_profit,
                'gross_margin_percentage': margin_pct,
                'expenses': exp,
                'net_profit': net_profit
            },
            'data_classification': 'ACTUAL_FINANCIAL',
            'limitations_note': 'Calculated from completed in-store and online sales.'
        }

    def _handle_brand_performance(self):
        brands = SaleItem.objects.filter(
            product__brand__gt=''
        ).values('product__brand').annotate(
            total_revenue=Sum('subtotal'),
            units_sold=Sum('quantity')
        ).order_by('-total_revenue')[:5]

        items = []
        for idx, b in enumerate(brands, 1):
            items.append(f"{idx}. {b['product__brand']} — ₹{float(b['total_revenue']):,.2f} ({b['units_sold']} units)")

        msg = "Top watchmaking brands by revenue contribution:\n" + ("\n".join(items) if items else "No brand sales data available.")

        return {
            'intent': 'brand_performance',
            'badge': 'ACTUAL HISTORICAL FIGURES',
            'title': 'Brand Performance Ranking',
            'message': msg,
            'figures': {'brands': list(brands)},
            'data_classification': 'ACTUAL_HISTORICAL',
            'limitations_note': None
        }

    def _handle_sales_comparison(self):
        fc_engine = SalesForecast()
        comp = fc_engine.get_comparison_with_last_month()

        last_m = float(comp.get('last_month_actual', 0.0))
        next_m = float(comp.get('next_month_predicted', 0.0))
        pct = float(comp.get('change_percent', 0.0))
        trend = comp.get('trend', 'stable')

        direction = "increase" if pct > 0 else "decrease" if pct < 0 else "neutral"

        msg = (
            f"Last month actual sales were ₹{last_m:,.2f}. "
            f"Next month predicted sales stand at ₹{next_m:,.2f}, representing a projected {abs(pct):.1f}% {direction} "
            f"(Trend: {trend.upper()})."
        )

        return {
            'intent': 'sales_comparison',
            'badge': 'COMPARATIVE ESTIMATE',
            'title': 'Month-over-Month Sales Comparison',
            'message': msg,
            'figures': {
                'last_month_actual': last_m,
                'next_month_predicted': next_m,
                'growth_percentage': pct,
                'trend': trend
            },
            'data_classification': 'COMPARATIVE_ESTIMATE',
            'limitations_note': 'Compares previous 30-day verified actuals with next 30-day forecasted run rate.'
        }

    def _handle_inventory_health(self):
        predictor = StockPredictor()
        health = predictor.get_inventory_health()

        msg = (
            f"Overall Store Inventory Health Score: {health['health_score']}/100. "
            f"Total active products: {health['total_products']} ({health['total_stock_units']} units in stock). "
            f"Out-of-stock items: {health['out_of_stock']}, Low-stock items: {health['low_stock']}, "
            f"Slow-movers: {health['slow_movers']}, Items needing reorder: {health['reorder_needed']}."
        )

        return {
            'intent': 'inventory_health',
            'badge': 'CURRENT OPERATIONAL FIGURES',
            'title': 'Inventory Health & Stock Velocity',
            'message': msg,
            'figures': health,
            'data_classification': 'CURRENT_OPERATIONAL',
            'limitations_note': None
        }

    def _handle_help_menu(self):
        msg = (
            "I am the Meghani Connect 360 AI Business Assistant. You can ask me:\n"
            "• \"What were today's total sales?\"\n"
            "• \"Which products sold the most?\"\n"
            "• \"Which products need restocking?\"\n"
            "• \"What are expected sales next month?\" (or 60/90 days)\n"
            "• \"What were this month's expenses?\"\n"
            "• \"What is our gross profit and margin?\"\n"
            "• \"Which products are moving slowly?\"\n"
            "• \"Which watch brands generate the highest revenue?\"\n"
            "• \"How are sales performing compared with last month?\""
        )

        return {
            'intent': 'help_menu',
            'badge': 'ASSISTANT CAPABILITIES',
            'title': 'Supported Inquiries',
            'message': msg,
            'figures': {'supported_intents': self.SUPPORTED_INTENTS},
            'data_classification': 'SYSTEM_MENU',
            'limitations_note': None
        }

    def _log_audit(self, query: str, response: dict, severity='info'):
        """Log user interaction in AuditLog for operational security."""
        try:
            if getattr(self.user, 'pk', None):
                AuditLog.log(
                    user=self.user,
                    action='view',
                    message=f"AI Assistant query: '{query[:80]}' -> Intent: {response.get('intent')}",
                    severity=severity
                )
        except Exception as e:
            logger.warning(f"Failed to record AI assistant audit log: {e}")
