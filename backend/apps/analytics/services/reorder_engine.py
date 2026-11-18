"""
Smart Inventory Reorder Engine for Meghani Watch Co.
Meghani Connect 360 Ecosystem

Features:
- Mathematical calculations:
  - Average Daily Demand (ADD)
  - Demand variance & standard deviation (sigma_d)
  - Dynamic Safety Stock (SS = Z * sigma_d * sqrt(LT))
  - Reorder Point (ROP = (ADD * LT) + SS)
  - Recommended Order Quantity (ROQ)
  - Stockout date and days-of-stock remaining
- Urgency classification (Critical, High, Medium)
- Mathematical explanation generation for auditability
- Manager review and approval lifecycle (Approve, Reject, Snooze)
- Zero automatic stock modification or PO creation without explicit authorization
"""

import math
import logging
from datetime import timedelta, date
from decimal import Decimal
import numpy as np
from django.utils import timezone
from django.db.models import Sum, Count, F, Q
from django.db.models.functions import TruncDate
from apps.products.models import Product
from apps.sales.models import SaleItem
from apps.analytics.models import ReorderRecommendation

logger = logging.getLogger(__name__)


class SmartReorderEngine:
    """
    Intelligent inventory replenishment recommendation engine.
    Computes explainable ROP, SS, and ROQ based on actual transaction velocity.
    """

    DEFAULT_LEAD_TIME_DAYS = 7
    DEFAULT_CYCLE_DAYS = 30  # Standard monthly replenishment cycle
    DEFAULT_SERVICE_LEVEL_Z = 1.65  # 95% service level factor

    def calculate_product_metrics(self, product, lookback_days=None, lead_time_days=None, z_factor=None):
        """
        Calculate mathematical demand metrics for a single product over a lookback window.
        """
        if lookback_days is None:
            recent_90 = timezone.now().date() - timedelta(days=90)
            if SaleItem.objects.filter(sale__sale_date__date__gte=recent_90).exists():
                lookback_days = 90
            else:
                lookback_days = 365
        else:
            lookback_days = int(lookback_days)

        lead_time = lead_time_days if lead_time_days is not None else self.DEFAULT_LEAD_TIME_DAYS
        z = z_factor if z_factor is not None else self.DEFAULT_SERVICE_LEVEL_Z

        start_date = timezone.now().date() - timedelta(days=lookback_days)
        end_date = timezone.now().date()

        # Query daily sales quantities
        daily_sales = SaleItem.objects.filter(
            product=product,
            sale__sale_date__date__gte=start_date,
            sale__sale_date__date__lte=end_date
        ).annotate(
            day=TruncDate('sale__sale_date')
        ).values('day').annotate(
            qty=Sum('quantity')
        )

        daily_map = {item['day']: item['qty'] for item in daily_sales}
        total_units_sold = sum(daily_map.values())
        
        # Build continuous daily array over lookback period
        daily_series = []
        curr = start_date
        while curr <= end_date:
            daily_series.append(daily_map.get(curr, 0))
            curr += timedelta(days=1)

        daily_array = np.array(daily_series, dtype=float)
        active_days_count = len(daily_array)

        # Average Daily Demand (ADD)
        add = float(np.mean(daily_array)) if active_days_count > 0 else 0.0

        # Demand standard deviation (sigma_d)
        sigma_d = float(np.std(daily_array)) if active_days_count > 1 else (add * 0.2)

        # Safety Stock: SS = Z * sigma_d * sqrt(LeadTime)
        safety_stock = int(math.ceil(z * sigma_d * math.sqrt(lead_time))) if add > 0 else 2

        # Reorder Point: ROP = (ADD * LeadTime) + SafetyStock
        lead_time_demand = add * lead_time
        reorder_point = int(math.ceil(lead_time_demand + safety_stock))

        current_stock = product.stock
        cost_price = float(product.cost_price or 0.0)

        # Days of stock remaining
        if add > 0.001:
            days_of_stock = round(current_stock / add, 1)
            days_to_stockout = max(0, int(math.floor(current_stock / add)))
            estimated_stockout_date = timezone.now().date() + timedelta(days=days_to_stockout)
        else:
            days_of_stock = 999.0
            days_to_stockout = 999
            estimated_stockout_date = None

        # Determine Urgency
        if current_stock == 0 or days_of_stock <= 3.0:
            urgency = 'critical'
        elif days_of_stock <= 7.0 or current_stock <= (reorder_point // 2):
            urgency = 'high'
        elif current_stock <= reorder_point or days_of_stock <= 14.0:
            urgency = 'medium'
        else:
            urgency = 'normal'

        # Recommended Order Quantity:
        # ROQ = max(1, ROP - current_stock + (ADD * cycle_days))
        cycle_demand = add * self.DEFAULT_CYCLE_DAYS
        raw_roq = reorder_point - current_stock + cycle_demand
        suggested_quantity = max(1, int(math.ceil(raw_roq))) if current_stock <= reorder_point else 0

        estimated_cost = round(suggested_quantity * cost_price, 2)

        # Formulate mathematical explanation
        explanation = (
            f"Product '{product.name}' has current stock of {current_stock} units. "
            f"Over the last {lookback_days} days, total demand was {total_units_sold} units, "
            f"yielding an Average Daily Demand (ADD) of {add:.2f} units/day (std dev: {sigma_d:.2f}). "
            f"With supplier lead time of {lead_time} days and service factor Z={z:.2f}, "
            f"calculated Safety Stock is {safety_stock} units and Reorder Point (ROP) is {reorder_point} units. "
            f"Estimated stockout in {days_of_stock:.1f} days "
            f"({estimated_stockout_date.strftime('%d-%b-%Y') if estimated_stockout_date else 'N/A'}). "
            f"Recommended replenishment of {suggested_quantity} units covers {self.DEFAULT_CYCLE_DAYS} days of cycle demand."
        )

        return {
            'product': product,
            'current_stock': current_stock,
            'total_units_sold': total_units_sold,
            'daily_velocity': round(add, 2),
            'sigma_d': round(sigma_d, 2),
            'lead_time_days': lead_time,
            'safety_stock': safety_stock,
            'reorder_point': reorder_point,
            'suggested_quantity': suggested_quantity,
            'days_of_stock': days_of_stock,
            'estimated_stockout_date': estimated_stockout_date,
            'urgency': urgency,
            'estimated_cost': estimated_cost,
            'requires_reorder': bool(current_stock <= reorder_point or urgency in ['critical', 'high']),
            'explanation': explanation
        }

    def generate_recommendations(self, lookback_days=None):
        """
        Scan active products and generate or update pending ReorderRecommendation records.
        Preserves existing approved/rejected decisions unless product requires fresh evaluation.
        """
        products = Product.objects.filter(is_active=True).select_related('brand_ref' if hasattr(Product, 'brand_ref') else None)
        today = timezone.now().date()
        generated_list = []

        for p in products:
            m = self.calculate_product_metrics(p, lookback_days=lookback_days)

            if not m['requires_reorder']:
                continue

            # Check if there is an active snoozed recommendation
            snoozed_rec = ReorderRecommendation.objects.filter(
                product=p,
                status='snoozed',
                snooze_until__gt=today
            ).first()
            if snoozed_rec:
                continue

            # Update or create pending recommendation
            rec, created = ReorderRecommendation.objects.update_or_create(
                product=p,
                status='pending',
                defaults={
                    'current_stock': m['current_stock'],
                    'daily_velocity': Decimal(str(m['daily_velocity'])),
                    'lead_time_days': m['lead_time_days'],
                    'safety_stock': m['safety_stock'],
                    'reorder_point': m['reorder_point'],
                    'suggested_quantity': m['suggested_quantity'],
                    'estimated_stockout_date': m['estimated_stockout_date'],
                    'days_of_stock': Decimal(str(m['days_of_stock'])),
                    'urgency': m['urgency'],
                    'estimated_cost': Decimal(str(m['estimated_cost'])),
                    'reason': m['explanation']
                }
            )
            generated_list.append(rec)

        return generated_list

    def approve_recommendation(self, recommendation_id, user, notes=''):
        """
        Manager approval action. Marks recommendation approved with audit stamp.
        Does NOT alter stock directly.
        """
        rec = ReorderRecommendation.objects.get(id=recommendation_id)
        rec.status = 'approved'
        rec.approved_by = user
        rec.approved_at = timezone.now()
        rec.action_notes = notes
        rec.save()

        # Log to AuditLog
        try:
            from apps.core.models import AuditLog
            AuditLog.log(
                user=user,
                action='update',
                obj=rec,
                message=f"Manager approved reorder recommendation #{rec.id} for {rec.product.name} ({rec.suggested_quantity} units)",
                severity='info'
            )
        except Exception as e:
            logger.warning(f"Failed to write reorder approval audit log: {e}")

        return rec

    def reject_recommendation(self, recommendation_id, user, reason=''):
        """
        Manager rejection action.
        """
        rec = ReorderRecommendation.objects.get(id=recommendation_id)
        rec.status = 'rejected'
        rec.approved_by = user
        rec.approved_at = timezone.now()
        rec.action_notes = reason
        rec.save()

        try:
            from apps.core.models import AuditLog
            AuditLog.log(
                user=user,
                action='update',
                obj=rec,
                message=f"Manager rejected reorder recommendation #{rec.id} for {rec.product.name}. Reason: {reason}",
                severity='info'
            )
        except Exception as e:
            logger.warning(f"Failed to write reorder rejection audit log: {e}")

        return rec

    def snooze_recommendation(self, recommendation_id, user, days=7):
        """
        Snooze recommendation for N days.
        """
        rec = ReorderRecommendation.objects.get(id=recommendation_id)
        rec.status = 'snoozed'
        rec.snooze_until = timezone.now().date() + timedelta(days=days)
        rec.approved_by = user
        rec.save()
        return rec
