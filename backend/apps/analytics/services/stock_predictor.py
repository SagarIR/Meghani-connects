"""
Stock Prediction & Reorder Suggestions
Meghani Connect 360 Ecosystem
"""
from django.db.models import Sum
from django.db.models.functions import TruncWeek
from django.utils import timezone
from datetime import timedelta
from apps.products.models import Product
from apps.sales.models import SaleItem


class StockPredictor:
    """Stock prediction and reorder suggestion service"""
    
    def calculate_sales_velocity(self, product_id, weeks=12):
        """Calculate average weekly sales for a product"""
        start_date = timezone.now().date() - timedelta(weeks=weeks)
        
        weekly_sales = SaleItem.objects.filter(
            product_id=product_id,
            sale__sale_date__date__gte=start_date
        ).annotate(
            week=TruncWeek('sale__sale_date')
        ).values('week').annotate(
            total=Sum('quantity')
        ).order_by('week')
        
        if not weekly_sales:
            return 0
        
        total_sold = sum(s['total'] for s in weekly_sales)
        weeks_with_sales = len(weekly_sales)
        
        # Use actual weeks count for more accurate velocity
        return total_sold / max(weeks_with_sales, 1)
    
    def predict_stockout_date(self, product_id):
        """Predict when product will run out"""
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return None
        
        velocity = self.calculate_sales_velocity(product_id)
        
        if velocity == 0:
            return None  # No sales history
        
        daily_velocity = velocity / 7
        if daily_velocity == 0:
            return None
        
        days_remaining = product.stock / daily_velocity
        stockout_date = timezone.now().date() + timedelta(days=int(days_remaining))
        
        return {
            'product_id': product.id,
            'product_name': product.name,
            'current_stock': product.stock,
            'daily_velocity': round(daily_velocity, 2),
            'days_remaining': int(days_remaining),
            'stockout_date': stockout_date
        }
    
    def get_reorder_suggestions(self, lead_time_days=7, safety_stock_days=14):
        """Get products that need reordering using SmartReorderEngine"""
        from .reorder_engine import SmartReorderEngine
        engine = SmartReorderEngine()
        recs = engine.generate_recommendations(lookback_days=90)
        
        results = []
        for r in recs:
            results.append({
                'id': r.id,
                'product_id': r.product.id,
                'product_name': r.product.name,
                'brand': getattr(r.product, 'brand', ''),
                'current_stock': r.current_stock,
                'daily_velocity': float(r.daily_velocity),
                'weekly_velocity': round(float(r.daily_velocity) * 7, 2),
                'reorder_point': r.reorder_point,
                'suggested_quantity': r.suggested_quantity,
                'days_of_stock': float(r.days_of_stock),
                'urgency': r.urgency,
                'estimated_cost': float(r.estimated_cost),
                'status': r.status,
                'reason': r.reason,
                'estimated_stockout_date': r.estimated_stockout_date.strftime('%Y-%m-%d') if r.estimated_stockout_date else None
            })
            
        urgency_order = {'critical': 0, 'high': 1, 'medium': 2, 'normal': 3}
        return sorted(results, key=lambda x: urgency_order.get(x['urgency'], 9))
    
    def get_fast_movers(self, days=30, limit=10):
        """Get fastest selling products"""
        start_date = timezone.now().date() - timedelta(days=days)
        
        fast_movers = SaleItem.objects.filter(
            sale__sale_date__date__gte=start_date
        ).values(
            'product__id', 'product__name', 'product__brand', 'product__stock'
        ).annotate(
            total_sold=Sum('quantity')
        ).order_by('-total_sold')[:limit]
        
        return list(fast_movers)
    
    def get_slow_movers(self, days=30, limit=10):
        """Get products with no sales in N days"""
        start_date = timezone.now().date() - timedelta(days=days)
        
        sold_product_ids = SaleItem.objects.filter(
            sale__sale_date__date__gte=start_date
        ).values_list('product_id', flat=True).distinct()
        
        slow_movers = Product.objects.filter(
            is_active=True,
            stock__gt=0
        ).exclude(
            id__in=sold_product_ids
        ).values('id', 'name', 'brand', 'stock', 'selling_price', 'cost_price')[:limit]
        
        result = []
        for product in slow_movers:
            last_sale = SaleItem.objects.filter(
                product_id=product['id']
            ).order_by('-sale__sale_date').first()
            
            if last_sale:
                days_since_sale = (timezone.now().date() - last_sale.sale.sale_date.date()).days
            else:
                days_since_sale = None  # Never sold
            
            result.append({
                **product,
                'days_since_last_sale': days_since_sale,
                'stock_value': float(product['stock'] * product['cost_price'])
            })
        
        return result
    
    def get_inventory_health(self):
        """Get overall inventory health metrics"""
        products = Product.objects.filter(is_active=True)
        
        total_products = products.count()
        total_stock = products.aggregate(total=Sum('stock'))['total'] or 0
        
        out_of_stock = products.filter(stock=0).count()
        low_stock = products.filter(stock__gt=0, stock__lte=5).count()
        healthy_stock = products.filter(stock__gt=5, stock__lte=50).count()
        overstocked = products.filter(stock__gt=50).count()
        
        slow_movers = len(self.get_slow_movers(30, 100))
        reorder_needed = len(self.get_reorder_suggestions())
        
        score = 100
        score -= (out_of_stock / max(total_products, 1)) * 30
        score -= (low_stock / max(total_products, 1)) * 20
        score -= (slow_movers / max(total_products, 1)) * 15
        
        return {
            'health_score': max(0, round(score)),
            'total_products': total_products,
            'total_stock_units': total_stock,
            'out_of_stock': out_of_stock,
            'low_stock': low_stock,
            'healthy_stock': healthy_stock,
            'overstocked': overstocked,
            'slow_movers': slow_movers,
            'reorder_needed': reorder_needed
        }
