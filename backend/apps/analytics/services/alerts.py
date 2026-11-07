"""
Smart Alerts System
"""
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Count
from apps.products.models import Product
from apps.repairs.models import Repair
from apps.crm.models import Customer
from apps.sales.models import Sale, SaleItem, Warranty


class AlertService:
    """Smart alerts and notifications service"""
    
    def get_low_stock_alerts(self, threshold=5):
        """Products below stock threshold"""
        return list(Product.objects.filter(
            stock__lte=threshold,
            stock__gt=0,
            is_active=True
        ).values('id', 'name', 'stock', 'brand', 'category'))
    
    def get_out_of_stock_alerts(self):
        """Products with zero stock"""
        return list(Product.objects.filter(
            stock=0,
            is_active=True
        ).values('id', 'name', 'brand', 'category'))
    
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
        ).exclude(id__in=sold_ids).values('id', 'name', 'stock', 'selling_price', 'brand'))
    
    def get_overdue_repairs(self):
        """Repairs past expected delivery date"""
        today = timezone.now().date()
        return list(Repair.objects.filter(
            expected_delivery__lt=today
        ).exclude(
            status__in=['delivered', 'cancelled']
        ).values(
            'id', 'ticket_number', 'customer__name', 'customer__phone',
            'item_type', 'expected_delivery', 'status'
        ))
    
    def get_pending_repairs_summary(self):
        """Summary of pending repairs by status"""
        pending = Repair.objects.exclude(
            status__in=['delivered', 'cancelled']
        ).values('status').annotate(count=Count('id'))
        
        return {item['status']: item['count'] for item in pending}
    
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
        ).values('id', 'name', 'phone', 'loyalty_points'))
    
    def get_inactive_customers(self, days=90):
        """Customers with no purchases in N days"""
        cutoff = timezone.now() - timedelta(days=days)
        
        # Customers who purchased recently
        active_ids = Sale.objects.filter(
            sale_date__gte=cutoff,
            customer__isnull=False
        ).values_list('customer_id', flat=True).distinct()
        
        # Customers NOT in active list but have made purchases before
        inactive = Customer.objects.filter(
            sales__isnull=False
        ).exclude(
            id__in=active_ids
        ).distinct().values('id', 'name', 'phone', 'loyalty_points')[:20]
        
        return list(inactive)
    
    def get_today_summary(self):
        """Today's business summary"""
        today = timezone.now().date()
        
        sales_today = Sale.objects.filter(sale_date__date=today)
        sales_summary = sales_today.aggregate(
            total=Sum('total_amount'),
            profit=Sum('profit'),
            count=Count('id')
        )
        
        repairs_received = Repair.objects.filter(received_date__date=today).count()
        repairs_delivered = Repair.objects.filter(delivered_date__date=today).count()
        
        new_customers = Customer.objects.filter(created_at__date=today).count()
        
        return {
            'sales_total': sales_summary['total'] or 0,
            'sales_profit': sales_summary['profit'] or 0,
            'sales_count': sales_summary['count'] or 0,
            'repairs_received': repairs_received,
            'repairs_delivered': repairs_delivered,
            'new_customers': new_customers
        }
    
    def get_all_alerts(self):
        """Consolidated alerts for dashboard"""
        return {
            'low_stock': self.get_low_stock_alerts(),
            'out_of_stock': self.get_out_of_stock_alerts(),
            'slow_movers': self.get_slow_movers()[:10],
            'overdue_repairs': self.get_overdue_repairs(),
            'warranty_expiring': self.get_warranty_expiring(),
            'birthdays': self.get_birthday_customers(),
            'pending_repairs': self.get_pending_repairs_summary()
        }
    
    def get_alert_counts(self):
        """Get counts for quick display"""
        return {
            'low_stock': len(self.get_low_stock_alerts()),
            'out_of_stock': len(self.get_out_of_stock_alerts()),
            'overdue_repairs': len(self.get_overdue_repairs()),
            'warranty_expiring': len(self.get_warranty_expiring()),
            'birthdays': len(self.get_birthday_customers())
        }
