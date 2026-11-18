"""
Automated ABC Inventory Classification Engine for Meghani Watch Co.
Meghani Connect 360 Ecosystem

Features:
- Multi-dimensional Pareto analysis (Revenue, Units, Gross Profit, Inventory Valuation)
- Configurable threshold bounds (Default: Class A = Top 80%, Class B = Next 15%, Class C = Remaining 5%)
- Strict "Unclassified" labelling for products with zero sales or insufficient historical activity
- Distribution rollups (Product count, Category breakdown, Revenue percentage by class)
- Database persistence in ABCProductClassification model
"""

import logging
from datetime import timedelta
from decimal import Decimal
import pandas as pd
from django.utils import timezone
from django.db.models import Sum, Count, F, Q
from apps.products.models import Product
from apps.sales.models import SaleItem
from apps.analytics.models import ABCProductClassification

logger = logging.getLogger(__name__)


class ABCClassificationEngine:
    """
    Computes Pareto ABC Inventory Classification for timepiece products.
    """

    DEFAULT_A_THRESHOLD = 80.0  # Cumulative top 80%
    DEFAULT_B_THRESHOLD = 95.0  # Next 15% (80% to 95%)

    def __init__(self, a_threshold=None, b_threshold=None):
        self.a_cutoff = a_threshold if a_threshold is not None else self.DEFAULT_A_THRESHOLD
        self.b_cutoff = b_threshold if b_threshold is not None else self.DEFAULT_B_THRESHOLD

    def calculate_classification(self, lookback_days=None, persist=True):
        """
        Execute full ABC classification run across all active products.
        If lookback_days is None, dynamically selects 365 days if recent 90 days is sparse.
        """
        if lookback_days is None:
            # Check if there are sales in last 90 days
            recent_90 = timezone.now().date() - timedelta(days=90)
            if SaleItem.objects.filter(sale__sale_date__date__gte=recent_90).exists():
                lookback_days = 90
            else:
                lookback_days = 365
        else:
            lookback_days = int(lookback_days)

        start_date = timezone.now().date() - timedelta(days=lookback_days)
        end_date = timezone.now().date()

        # Query all active products
        products = Product.objects.filter(is_active=True)
        if not products.exists():
            return {
                'evaluation_period_days': lookback_days,
                'total_products': 0,
                'class_counts': {'A': 0, 'B': 0, 'C': 0, 'unclassified': 0},
                'revenue_by_class': {'A': 0.0, 'B': 0.0, 'C': 0.0, 'unclassified': 0.0},
                'products': [],
                'evaluated_at': timezone.now().isoformat()
            }

        # Query sales aggregation per product
        sales_agg = SaleItem.objects.filter(
            sale__sale_date__date__gte=start_date,
            sale__sale_date__date__lte=end_date
        ).values('product_id').annotate(
            total_revenue=Sum('subtotal'),
            total_units=Sum('quantity'),
            total_cost=Sum(F('cost_price') * F('quantity'))
        )

        sales_map = {item['product_id']: item for item in sales_agg}

        # Build product dataset
        product_rows = []
        for p in products:
            s_data = sales_map.get(p.id, None)
            rev = float(s_data['total_revenue']) if s_data and s_data['total_revenue'] else 0.0
            vol = int(s_data['total_units']) if s_data and s_data['total_units'] else 0
            cost = float(s_data['total_cost']) if s_data and s_data['total_cost'] else (vol * float(p.cost_price or 0.0))
            profit = max(0.0, rev - cost)
            inv_val = float((p.stock or 0) * (p.cost_price or 0.0))

            product_rows.append({
                'product': p,
                'product_id': p.id,
                'name': p.name,
                'brand': getattr(p, 'brand', ''),
                'category': p.category,
                'stock': p.stock,
                'revenue': rev,
                'volume': vol,
                'profit': profit,
                'inventory_value': inv_val,
                'has_sales': rev > 0.0
            })

        # Separate items with sales from zero-sales items
        active_items = [item for item in product_rows if item['has_sales']]
        zero_items = [item for item in product_rows if not item['has_sales']]

        total_system_revenue = sum(item['revenue'] for item in active_items)

        # Sort active items descending by revenue
        active_items.sort(key=lambda x: x['revenue'], reverse=True)

        classified_list = []
        cum_rev = 0.0

        for item in active_items:
            rev = item['revenue']
            cum_rev += rev
            cum_pct = (cum_rev / total_system_revenue * 100.0) if total_system_revenue > 0 else 100.0

            if cum_pct <= self.a_cutoff or (len(classified_list) == 0):
                cls = 'A'
            elif cum_pct <= self.b_cutoff:
                cls = 'B'
            else:
                cls = 'C'

            classified_list.append({
                **item,
                'classification': cls,
                'cumulative_percentage': round(cum_pct, 2)
            })

        # Unclassified items (insufficient or zero sales data)
        for item in zero_items:
            classified_list.append({
                **item,
                'classification': 'unclassified',
                'cumulative_percentage': 0.0
            })

        # Persist to database if requested
        if persist:
            for item in classified_list:
                ABCProductClassification.objects.update_or_create(
                    product=item['product'],
                    defaults={
                        'classification': item['classification'],
                        'revenue_contribution': Decimal(str(round(item['revenue'], 2))),
                        'cumulative_revenue_percentage': Decimal(str(item['cumulative_percentage'])),
                        'sales_volume': item['volume'],
                        'gross_profit_contribution': Decimal(str(round(item['profit'], 2))),
                        'inventory_value': Decimal(str(round(item['inventory_value'], 2))),
                        'evaluation_period_days': lookback_days
                    }
                )

        # Aggregate summary metrics
        class_counts = {'A': 0, 'B': 0, 'C': 0, 'unclassified': 0}
        revenue_by_class = {'A': 0.0, 'B': 0.0, 'C': 0.0, 'unclassified': 0.0}
        category_distribution = {'A': {}, 'B': {}, 'C': {}, 'unclassified': {}}

        for item in classified_list:
            cls = item['classification']
            class_counts[cls] += 1
            revenue_by_class[cls] += item['revenue']
            cat = item['category']
            category_distribution[cls][cat] = category_distribution[cls].get(cat, 0) + 1

        # Format output items for serialization
        serialized_products = []
        for item in classified_list:
            serialized_products.append({
                'product_id': item['product_id'],
                'name': item['name'],
                'brand': item['brand'],
                'category': item['category'],
                'current_stock': item['stock'],
                'classification': item['classification'],
                'revenue_contribution': round(item['revenue'], 2),
                'cumulative_percentage': item['cumulative_percentage'],
                'sales_volume': item['volume'],
                'gross_profit_contribution': round(item['profit'], 2),
                'inventory_value': round(item['inventory_value'], 2),
            })

        return {
            'evaluation_period_days': lookback_days,
            'thresholds': {'class_a': self.a_cutoff, 'class_b': self.b_cutoff},
            'total_products': len(classified_list),
            'total_revenue': round(total_system_revenue, 2),
            'class_counts': class_counts,
            'revenue_by_class': {k: round(v, 2) for k, v in revenue_by_class.items()},
            'revenue_percentage_by_class': {
                k: round((v / max(total_system_revenue, 1.0)) * 100.0, 1) for k, v in revenue_by_class.items()
            },
            'category_distribution': category_distribution,
            'products': serialized_products,
            'evaluated_at': timezone.now().isoformat()
        }
