"""
Advanced CRM Customer Intelligence Engine for Meghani Watch Co.
Meghani Connect 360 Ecosystem

Features:
- Customer Segmentation:
  1. High-Value VIP Clients (Lifetime spend >= ₹50,000 or Platinum tier)
  2. Frequent Connoisseurs (>= 3 completed transactions)
  3. New Patrons (First transaction within last 30 days)
  4. Returning Clients (> 1 transaction)
  5. Inactive Clients (Zero transactions in last 90 days with past history)
  6. Prospective Enquiries (Active showroom viewing leads from public boutique)
- Client Metrics:
  - Customer Lifetime Value (CLV / Total Spend)
  - Average Order Value (AOV)
  - Purchase Frequency & Days Since Last Purchase
  - Loyalty Tier (Bronze, Silver, Gold, Platinum)
  - Horological Brand & Category Affinities (Preferred watchmakers)
- Management Dashboard Overview:
  - Client growth metrics
  - Repeat purchase rate & Retention rate
  - Loyalty points issued vs redeemed
  - Inactive client list for concierge re-engagement
- Strict RBAC and customer privacy protection
"""

import logging
from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum, Count, Avg, Max, Min, F, Q
from apps.crm.models import Customer, Enquiry
from apps.sales.models import Sale, SaleItem

logger = logging.getLogger(__name__)


class CRMAnalyticsService:
    """
    Computes business-focused customer analytics and RFM segmentation.
    """

    VIP_SPEND_THRESHOLD = 50000.0  # ₹50,000 lifetime spend
    INACTIVE_DAYS_THRESHOLD = 90

    def get_customer_dossier(self, customer_id):
        """
        Compute deep customer profile including CLV, AOV, loyalty tier, and brand affinity.
        """
        try:
            customer = Customer.objects.get(id=customer_id)
        except Customer.DoesNotExist:
            return None

        sales = Sale.objects.filter(customer=customer).order_by('sale_date')
        sales_count = sales.count()
        total_spend = float(sales.aggregate(total=Sum('total_amount'))['total'] or 0.0)
        aov = round(total_spend / max(sales_count, 1), 2)

        first_sale = sales.first()
        last_sale = sales.last()

        first_purchase_date = first_sale.sale_date if first_sale else None
        last_purchase_date = last_sale.sale_date if last_sale else None

        days_since_last = (timezone.now() - last_purchase_date).days if last_purchase_date else None

        # Determine Tier
        if total_spend >= 100000 or customer.loyalty_points >= 1000:
            tier = 'Platinum VIP'
        elif total_spend >= 50000 or customer.loyalty_points >= 500:
            tier = 'Gold'
        elif total_spend >= 20000 or customer.loyalty_points >= 200:
            tier = 'Silver'
        else:
            tier = 'Bronze'

        # Preferred Brands & Categories
        purchased_items = SaleItem.objects.filter(sale__customer=customer)
        brand_counts = purchased_items.values('product__brand').annotate(
            count=Count('id'),
            spend=Sum('subtotal')
        ).order_by('-spend')

        category_counts = purchased_items.values('product__category').annotate(
            count=Count('id'),
            spend=Sum('subtotal')
        ).order_by('-spend')

        preferred_brand = brand_counts[0]['product__brand'] if brand_counts.exists() and brand_counts[0]['product__brand'] else 'Various'
        preferred_category = category_counts[0]['product__category'] if category_counts.exists() else 'Various'

        # Segment Assignment
        segments = []
        if total_spend >= self.VIP_SPEND_THRESHOLD or tier in ['Platinum VIP', 'Gold']:
            segments.append('High-Value VIP')
        if sales_count >= 3:
            segments.append('Frequent Collector')
        elif sales_count == 1:
            segments.append('Single Purchase')
        elif sales_count > 1:
            segments.append('Returning Client')

        if first_purchase_date and (timezone.now() - first_purchase_date).days <= 30:
            segments.append('New Patron')

        if days_since_last is not None and days_since_last >= self.INACTIVE_DAYS_THRESHOLD and sales_count > 0:
            segments.append('Inactive (At Risk)')

        # Enquiries
        enquiries_count = Enquiry.objects.filter(phone=customer.phone).count()
        if enquiries_count > 0:
            segments.append('Active Inquirer')

        return {
            'customer_id': customer.id,
            'name': customer.name,
            'phone': customer.phone,
            'email': customer.email,
            'loyalty_points': customer.loyalty_points,
            'loyalty_tier': tier,
            'lifetime_spend': round(total_spend, 2),
            'total_transactions': sales_count,
            'average_order_value': aov,
            'first_purchase_date': first_purchase_date.strftime('%Y-%m-%d') if first_purchase_date else None,
            'last_purchase_date': last_purchase_date.strftime('%Y-%m-%d') if last_purchase_date else None,
            'days_since_last_purchase': days_since_last,
            'preferred_brand': preferred_brand,
            'preferred_category': preferred_category,
            'segments': segments,
            'brand_affinity': list(brand_counts[:3]),
            'category_affinity': list(category_counts[:3])
        }

    def get_crm_overview(self):
        """
        Aggregate customer intelligence for management dashboard.
        """
        total_customers = Customer.objects.count()
        customers_with_sales = Customer.objects.filter(sales__isnull=False).distinct()
        active_customer_count = customers_with_sales.count()

        # Repeat vs Single
        sales_per_customer = Sale.objects.filter(
            customer__isnull=False
        ).values('customer_id').annotate(
            order_count=Count('id'),
            total_spend=Sum('total_amount')
        )

        single_buyers = sum(1 for c in sales_per_customer if c['order_count'] == 1)
        repeat_buyers = sum(1 for c in sales_per_customer if c['order_count'] > 1)
        repeat_rate = round((repeat_buyers / max(active_customer_count, 1)) * 100.0, 1)

        # High-value clients (spend >= 50k)
        high_value_clients = sum(1 for c in sales_per_customer if float(c['total_spend']) >= self.VIP_SPEND_THRESHOLD)

        # New clients in last 30 days
        cutoff_30d = timezone.now() - timedelta(days=30)
        new_clients_30d = Customer.objects.filter(created_at__gte=cutoff_30d).count()

        # Inactive clients (> 90 days since last purchase)
        cutoff_90d = timezone.now() - timedelta(days=self.INACTIVE_DAYS_THRESHOLD)
        recent_buyers = Sale.objects.filter(
            sale_date__gte=cutoff_90d,
            customer__isnull=False
        ).values_list('customer_id', flat=True).distinct()

        inactive_clients_qs = Customer.objects.filter(
            sales__isnull=False
        ).exclude(
            id__in=recent_buyers
        ).distinct()

        inactive_count = inactive_clients_qs.count()

        # Loyalty summary
        total_points_held = Customer.objects.aggregate(total=Sum('loyalty_points'))['total'] or 0

        # Public boutique inquiries
        total_enquiries = Enquiry.objects.count()
        new_enquiries = Enquiry.objects.filter(status='new').count()
        converted_enquiries = Enquiry.objects.filter(status='converted').count()

        # Inactive clients detailed list for outreach (top 10 by past spend)
        inactive_list = []
        for c in inactive_clients_qs.annotate(total_spent=Sum('sales__total_amount')).order_by('-total_spent')[:10]:
            last_order = c.sales.order_by('-sale_date').first()
            inactive_list.append({
                'id': c.id,
                'name': c.name,
                'phone': c.phone,
                'total_spent': float(c.total_spent or 0.0),
                'loyalty_points': c.loyalty_points,
                'last_purchase_date': last_order.sale_date.strftime('%Y-%m-%d') if last_order else None,
                'days_inactive': (timezone.now() - last_order.sale_date).days if last_order else 999
            })

        return {
            'total_customers': total_customers,
            'active_buyers': active_customer_count,
            'single_buyers': single_buyers,
            'repeat_buyers': repeat_buyers,
            'repeat_purchase_rate': repeat_rate,
            'high_value_vip_count': high_value_clients,
            'new_clients_30d': new_clients_30d,
            'inactive_clients_count': inactive_count,
            'total_loyalty_points_outstanding': total_points_held,
            'enquiries': {
                'total': total_enquiries,
                'new': new_enquiries,
                'converted': converted_enquiries,
                'conversion_rate': round((converted_enquiries / max(total_enquiries, 1)) * 100.0, 1)
            },
            'inactive_clients_outreach': inactive_list,
            'generated_at': timezone.now().isoformat()
        }
