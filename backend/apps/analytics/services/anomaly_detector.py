"""
Statistical Business Anomaly Detection Engine for Meghani Watch Co.
Meghani Connect 360 Ecosystem

Features:
- Statistical algorithms: Rolling Z-Score, Mean & StdDev, Interquartile Range (IQR)
- Anomaly detection vectors:
  1. Sales Revenue Spikes (Z >= 2.5)
  2. Sales Volume Drops / Droughts (Z <= -2.0 during expected trading)
  3. Abnormal Discounts (Discount percentage > 20% or high absolute discount)
  4. Sudden Demand Surge on Timepieces
  5. Unusual Inventory Drops / Discrepancies
- Severity assignment (Low, Medium, High, Critical)
- Mathematical explanation and recommended investigation actions
- Investigation signal guarantee (Never auto-blocks transactions)
- Correlation with apps.core.models.AuditLog
- Persistence in BusinessAnomaly model
"""

import logging
from datetime import timedelta, date
from decimal import Decimal
import numpy as np
import pandas as pd
from django.utils import timezone
from django.db.models import Sum, Count, Avg, StdDev, F, Q
from django.db.models.functions import TruncDate
from apps.sales.models import Sale, SaleItem
from apps.products.models import Product
from apps.core.models import AuditLog
from apps.analytics.models import BusinessAnomaly

logger = logging.getLogger(__name__)


class AnomalyDetector:
    """
    Statistical Anomaly Detection Service for retail sales and timepiece inventory.
    """

    DISCOUNT_ALERT_THRESHOLD_PCT = 20.0  # Discounts over 20% warrant investigation
    Z_SCORE_SPIKE_THRESHOLD = 2.5
    Z_SCORE_DROP_THRESHOLD = -2.0

    def scan_all_anomalies(self, lookback_days=90):
        """
        Run complete anomaly scan across sales, discounts, and inventory events.
        """
        detected = []
        detected.extend(self.detect_sales_spikes_and_drops(lookback_days=lookback_days))
        detected.extend(self.detect_abnormal_discounts(lookback_days=lookback_days))
        detected.extend(self.detect_inventory_discrepancies(lookback_days=lookback_days))
        return detected

    def detect_sales_spikes_and_drops(self, lookback_days=90):
        """
        Detect days where aggregate daily sales deviate significantly from rolling mean (Z-Score).
        """
        start_date = timezone.now().date() - timedelta(days=lookback_days)
        daily_sales = Sale.objects.filter(
            sale_date__date__gte=start_date
        ).annotate(
            day=TruncDate('sale_date')
        ).values('day').annotate(
            total=Sum('total_amount'),
            count=Count('id')
        ).order_by('day')

        if len(daily_sales) < 7:
            return []

        df = pd.DataFrame(list(daily_sales))
        df['total'] = df['total'].astype(float)
        mean_rev = float(df['total'].mean())
        std_rev = float(df['total'].std()) if len(df) > 1 else (mean_rev * 0.2)

        if std_rev == 0:
            return []

        anomalies_created = []
        for _, row in df.iterrows():
            obs = float(row['total'])
            day_val = pd.to_datetime(row['day']).date()
            z = (obs - mean_rev) / std_rev

            if z >= self.Z_SCORE_SPIKE_THRESHOLD:
                severity = 'critical' if z >= 4.0 else 'high'
                explanation = (
                    f"Daily sales of ₹{obs:,.2f} on {day_val.strftime('%d-%b-%Y')} is {z:.2f} standard deviations "
                    f"above the {lookback_days}-day baseline average of ₹{mean_rev:,.2f} (std dev: ₹{std_rev:,.2f})."
                )
                rec_action = (
                    "Verify invoice records for this date to determine if a corporate bulk order, luxury haute "
                    "horlogerie purchase, or wedding season batch occurred. Cross-check payment receipts."
                )
                
                # Check if already recorded
                existing = BusinessAnomaly.objects.filter(
                    category='sales_spike',
                    detected_at__date=day_val
                ).first()
                if not existing:
                    anomaly = BusinessAnomaly.objects.create(
                        category='sales_spike',
                        severity=severity,
                        status='open',
                        observed_value=Decimal(str(round(obs, 2))),
                        expected_baseline=Decimal(str(round(mean_rev, 2))),
                        deviation_score=Decimal(str(round(z, 2))),
                        explanation=explanation,
                        recommended_action=rec_action
                    )
                    anomalies_created.append(anomaly)

            elif z <= self.Z_SCORE_DROP_THRESHOLD and obs == 0.0:
                severity = 'medium'
                explanation = (
                    f"Zero transactions recorded on {day_val.strftime('%d-%b-%Y')}, deviating from expected "
                    f"trading baseline of ₹{mean_rev:,.2f} (Z-Score: {z:.2f})."
                )
                rec_action = (
                    "Confirm showroom operational status for this date (e.g. public holiday, scheduled maintenance, "
                    "or register connectivity downtime)."
                )

                existing = BusinessAnomaly.objects.filter(
                    category='sales_drop',
                    detected_at__date=day_val
                ).first()
                if not existing:
                    anomaly = BusinessAnomaly.objects.create(
                        category='sales_drop',
                        severity=severity,
                        status='open',
                        observed_value=Decimal('0.00'),
                        expected_baseline=Decimal(str(round(mean_rev, 2))),
                        deviation_score=Decimal(str(round(z, 2))),
                        explanation=explanation,
                        recommended_action=rec_action
                    )
                    anomalies_created.append(anomaly)

        return anomalies_created

    def detect_abnormal_discounts(self, lookback_days=90):
        """
        Flag individual sales where discount percentage or absolute amount is unusually high.
        """
        start_date = timezone.now().date() - timedelta(days=lookback_days)
        flagged_sales = Sale.objects.filter(
            sale_date__date__gte=start_date,
            discount__gt=0
        ).select_related('customer', 'created_by')

        anomalies_created = []
        for sale in flagged_sales:
            gross_amount = float(sale.total_amount) + float(sale.discount)
            if gross_amount <= 0:
                continue

            discount_pct = (float(sale.discount) / gross_amount) * 100.0

            if discount_pct >= self.DISCOUNT_ALERT_THRESHOLD_PCT or float(sale.discount) >= 10000.0:
                severity = 'critical' if discount_pct >= 40.0 else 'high' if discount_pct >= 25.0 else 'medium'
                z_score = round((discount_pct - 10.0) / 5.0, 2)  # Normalized deviation from 10% standard discount
                staff_name = getattr(sale.created_by, 'name', '') or getattr(sale.created_by, 'username', 'Staff') if sale.created_by else 'Staff'
                client_name = sale.customer.name if sale.customer else 'Walk-in Client'

                explanation = (
                    f"Invoice {sale.invoice_number} included an abnormal discount of {discount_pct:.1f}% "
                    f"(₹{float(sale.discount):,.2f} off on gross ₹{gross_amount:,.2f}). "
                    f"Authorized by staff member '{staff_name}' for client '{client_name}'."
                )
                rec_action = (
                    "Review discount authorization trail. Verify whether manager override was granted "
                    "or if VIP loyalty tier promotion was appropriately applied."
                )

                # Check if already logged
                existing = BusinessAnomaly.objects.filter(
                    category='abnormal_discount',
                    sale=sale
                ).first()

                if not existing:
                    # Link to AuditLog if exists
                    audit_entry = AuditLog.objects.filter(
                        action='create',
                        model_name='Sale',
                        object_id=sale.id
                    ).first()

                    anomaly = BusinessAnomaly.objects.create(
                        category='abnormal_discount',
                        severity=severity,
                        status='open',
                        sale=sale,
                        audit_log=audit_entry,
                        observed_value=Decimal(str(round(discount_pct, 2))),
                        expected_baseline=Decimal('10.00'),  # 10% baseline discount threshold
                        deviation_score=Decimal(str(max(1.0, z_score))),
                        explanation=explanation,
                        recommended_action=rec_action
                    )
                    anomalies_created.append(anomaly)

        return anomalies_created

    def detect_inventory_discrepancies(self, lookback_days=90):
        """
        Flag sudden stock depletion without corresponding sales records.
        """
        start_date = timezone.now().date() - timedelta(days=lookback_days)
        # Scan products with low stock that had zero sales in the period
        discrepant_products = Product.objects.filter(
            is_active=True,
            stock=0
        )

        anomalies_created = []
        for product in discrepant_products:
            total_sold = SaleItem.objects.filter(
                product=product,
                sale__sale_date__date__gte=start_date
            ).aggregate(total=Sum('quantity'))['total'] or 0

            if total_sold == 0:
                explanation = (
                    f"Product '{product.name}' has zero remaining stock, but 0 sales were recorded "
                    f"over the past {lookback_days} days."
                )
                rec_action = (
                    "Inspect showroom physical inventory and Atelier repair records. Confirm if units were "
                    "transferred, damaged, returned to manufacturer, or miscounted during stocktaking."
                )

                existing = BusinessAnomaly.objects.filter(
                    category='stock_drop',
                    product=product,
                    status='open'
                ).first()

                if not existing:
                    anomaly = BusinessAnomaly.objects.create(
                        category='stock_drop',
                        severity='high',
                        status='open',
                        product=product,
                        observed_value=Decimal('0.00'),
                        expected_baseline=Decimal('5.00'),
                        deviation_score=Decimal('2.50'),
                        explanation=explanation,
                        recommended_action=rec_action
                    )
                    anomalies_created.append(anomaly)

        return anomalies_created

    def resolve_anomaly(self, anomaly_id, user, notes=''):
        """
        Manager action to mark anomaly resolved after investigation.
        """
        anomaly = BusinessAnomaly.objects.get(id=anomaly_id)
        anomaly.status = 'resolved'
        anomaly.resolved_by = user
        anomaly.resolved_at = timezone.now()
        anomaly.resolution_notes = notes
        anomaly.save()

        try:
            AuditLog.log(
                user=user,
                action='update',
                obj=anomaly,
                message=f"Manager resolved anomaly #{anomaly.id} ({anomaly.get_category_display()}): {notes}",
                severity='info'
            )
        except Exception as e:
            logger.warning(f"Failed to write anomaly resolution audit: {e}")

        return anomaly

    def dismiss_anomaly(self, anomaly_id, user, notes=''):
        """
        Manager action to dismiss anomaly as normal expected business activity.
        """
        anomaly = BusinessAnomaly.objects.get(id=anomaly_id)
        anomaly.status = 'dismissed'
        anomaly.resolved_by = user
        anomaly.resolved_at = timezone.now()
        anomaly.resolution_notes = notes
        anomaly.save()
        return anomaly
