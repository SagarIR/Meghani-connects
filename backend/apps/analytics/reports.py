"""
Report Generation Module
"""
from django.db.models import Sum, Count, Avg, F, Q
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from datetime import timedelta, datetime
from io import BytesIO
import csv
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER

from apps.sales.models import Sale, SaleItem
from apps.repairs.models import Repair
from apps.expenses.models import Expense
from apps.products.models import Product
from apps.crm.models import Customer


class ReportGenerator:
    """Base class for generating reports"""
    
    @staticmethod
    def get_date_range(start_date_str=None, end_date_str=None, days=30):
        """Parse date range or default to last N days"""
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            start_date = timezone.now().date() - timedelta(days=days)
        
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = timezone.now().date()
        
        return start_date, end_date


class SalesReport(ReportGenerator):
    """Sales Summary Report"""
    
    @classmethod
    def generate(cls, start_date=None, end_date=None, payment_mode=None):
        start, end = cls.get_date_range(start_date, end_date)
        
        sales = Sale.objects.filter(sale_date__date__gte=start, sale_date__date__lte=end)
        
        if payment_mode and payment_mode != 'all':
            sales = sales.filter(payment_mode=payment_mode)
        
        # Overall summary
        summary = sales.aggregate(
            total_sales=Sum('total_amount'),
            total_profit=Sum('profit'),
            total_discount=Sum('discount'),
            transaction_count=Count('id'),
            avg_sale=Avg('total_amount')
        )
        
        # Daily breakdown
        daily = sales.annotate(
            date=TruncDate('sale_date')
        ).values('date').annotate(
            sales=Sum('total_amount'),
            profit=Sum('profit'),
            count=Count('id')
        ).order_by('date')
        
        # By payment mode
        by_payment = sales.values('payment_mode').annotate(
            total=Sum('total_amount'),
            count=Count('id')
        )

        # Authoritative tender reconciliation resolving mixed split tenders
        tender_breakdown = {'cash': Decimal('0.00'), 'upi': Decimal('0.00'), 'card': Decimal('0.00')}
        for sale in sales.only('payment_mode', 'total_amount', 'payment_details'):
            if sale.payment_mode in tender_breakdown:
                tender_breakdown[sale.payment_mode] += Decimal(str(sale.total_amount))
            elif sale.payment_mode == 'mixed' and isinstance(sale.payment_details, dict):
                for method, amt in sale.payment_details.items():
                    m = method.lower()
                    if m in tender_breakdown:
                        try:
                            tender_breakdown[m] += Decimal(str(amt or 0))
                        except Exception:
                            pass
        
        return {
            'period': {'start': str(start), 'end': str(end)},
            'summary': {
                'total_sales': summary['total_sales'] or 0,
                'total_profit': summary['total_profit'] or 0,
                'total_discount': summary['total_discount'] or 0,
                'transaction_count': summary['transaction_count'] or 0,
                'average_sale': round(summary['avg_sale'] or 0, 2)
            },
            'daily_data': list(daily),
            'by_payment_mode': {item['payment_mode']: item['total'] for item in by_payment},
            'tender_breakdown': {k: float(v) for k, v in tender_breakdown.items()}
        }


class ProductReport(ReportGenerator):
    """Product Performance Report"""
    
    @classmethod
    def generate(cls, start_date=None, end_date=None, category=None):
        start, end = cls.get_date_range(start_date, end_date)
        
        # Top sellers
        top_sellers = SaleItem.objects.filter(
            sale__sale_date__date__gte=start,
            sale__sale_date__date__lte=end
        ).values(
            'product__id', 'product__name', 'product__brand', 'product__category'
        ).annotate(
            sold=Sum('quantity'),
            revenue=Sum('subtotal')
        ).order_by('-sold')[:10]
        
        # Slow movers (products with no sales in period)
        sold_product_ids = SaleItem.objects.filter(
            sale__sale_date__date__gte=start,
            sale__sale_date__date__lte=end
        ).values_list('product_id', flat=True)
        
        slow_movers = Product.objects.filter(
            is_active=True
        ).exclude(
            id__in=sold_product_ids
        ).values('id', 'name', 'brand', 'stock', 'category')[:10]
        
        # By category
        by_category = SaleItem.objects.filter(
            sale__sale_date__date__gte=start,
            sale__sale_date__date__lte=end
        ).values('product__category').annotate(
            sold=Sum('quantity'),
            revenue=Sum('subtotal')
        )
        
        return {
            'period': {'start': str(start), 'end': str(end)},
            'top_sellers': list(top_sellers),
            'slow_movers': list(slow_movers),
            'by_category': {item['product__category']: {'sold': item['sold'], 'revenue': item['revenue']} for item in by_category}
        }


class RepairReport(ReportGenerator):
    """Repair Income Report"""
    
    @classmethod
    def generate(cls, start_date=None, end_date=None):
        start, end = cls.get_date_range(start_date, end_date)
        
        repairs = Repair.objects.filter(received_date__date__gte=start, received_date__date__lte=end)
        
        summary = repairs.aggregate(
            total_repairs=Count('id'),
            total_revenue=Sum('repair_charge'),
            total_advance=Sum('advance_paid'),
            avg_repair_value=Avg('repair_charge')
        )
        
        by_status = repairs.values('status').annotate(count=Count('id'))
        
        by_item_type = repairs.values('item_type').annotate(
            count=Count('id'),
            revenue=Sum('repair_charge')
        )
        
        completed = repairs.filter(status='delivered')
        pending = repairs.exclude(status__in=['delivered', 'cancelled'])
        
        return {
            'period': {'start': str(start), 'end': str(end)},
            'summary': {
                'total_repairs': summary['total_repairs'] or 0,
                'total_revenue': summary['total_revenue'] or 0,
                'total_advance': summary['total_advance'] or 0,
                'average_value': round(summary['avg_repair_value'] or 0, 2),
                'completed': completed.count(),
                'pending': pending.count()
            },
            'by_status': {item['status']: item['count'] for item in by_status},
            'by_item_type': list(by_item_type)
        }


class ExpenseReport(ReportGenerator):
    """Expense Report"""
    
    @classmethod
    def generate(cls, start_date=None, end_date=None, category=None):
        start, end = cls.get_date_range(start_date, end_date)
        
        expenses = Expense.objects.filter(date__gte=start, date__lte=end)
        
        if category:
            expenses = expenses.filter(category=category)
        
        total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or 0
        
        # Get sales profit for same period
        sales_profit = Sale.objects.filter(
            sale_date__date__gte=start,
            sale_date__date__lte=end
        ).aggregate(total=Sum('profit'))['total'] or 0
        
        by_category = expenses.values('category').annotate(
            total=Sum('amount'),
            count=Count('id')
        )
        
        daily = expenses.values('date').annotate(
            total=Sum('amount')
        ).order_by('date')
        
        return {
            'period': {'start': str(start), 'end': str(end)},
            'summary': {
                'total_expenses': total_expenses,
                'sales_profit': sales_profit,
                'net_profit': sales_profit - total_expenses
            },
            'by_category': {item['category']: {'total': item['total'], 'count': item['count']} for item in by_category},
            'daily_data': list(daily)
        }


class CustomerReport(ReportGenerator):
    """Customer Loyalty Report"""
    
    @classmethod
    def generate(cls, start_date=None, end_date=None):
        start, end = cls.get_date_range(start_date, end_date)
        
        total_customers = Customer.objects.count()
        new_customers = Customer.objects.filter(created_at__date__gte=start, created_at__date__lte=end).count()
        
        # Top customers by spending in period
        top_customers = Customer.objects.annotate(
            period_spent=Sum('sales__total_amount', filter=Q(
                sales__sale_date__date__gte=start,
                sales__sale_date__date__lte=end
            ))
        ).filter(period_spent__isnull=False).order_by('-period_spent')[:10]
        
        # Loyalty points stats
        loyalty_stats = Customer.objects.aggregate(
            total_points=Sum('loyalty_points'),
            avg_points=Avg('loyalty_points')
        )
        
        # Repeat customers
        repeat_customers = Customer.objects.annotate(
            purchase_count=Count('sales', filter=Q(
                sales__sale_date__date__gte=start,
                sales__sale_date__date__lte=end
            ))
        ).filter(purchase_count__gt=1).count()
        
        customers_with_purchases = Customer.objects.annotate(
            purchase_count=Count('sales', filter=Q(
                sales__sale_date__date__gte=start,
                sales__sale_date__date__lte=end
            ))
        ).filter(purchase_count__gt=0).count()
        
        return {
            'period': {'start': str(start), 'end': str(end)},
            'summary': {
                'total_customers': total_customers,
                'new_customers': new_customers,
                'repeat_customers': repeat_customers,
                'repeat_rate': round((repeat_customers / max(customers_with_purchases, 1)) * 100, 1),
                'total_loyalty_points': loyalty_stats['total_points'] or 0,
                'avg_loyalty_points': round(loyalty_stats['avg_points'] or 0, 1)
            },
            'top_customers': [
                {'id': c.id, 'name': c.name, 'phone': c.phone, 'spent': c.period_spent, 'points': c.loyalty_points}
                for c in top_customers
            ]
        }


class InventoryReport(ReportGenerator):
    """Inventory Status Report"""
    
    @classmethod
    def generate(cls):
        products = Product.objects.filter(is_active=True)
        
        total_products = products.count()
        total_stock = products.aggregate(total=Sum('stock'))['total'] or 0
        
        stock_value = products.aggregate(
            cost_value=Sum(F('stock') * F('cost_price')),
            selling_value=Sum(F('stock') * F('selling_price'))
        )
        
        low_stock = products.filter(stock__lte=5, stock__gt=0)
        out_of_stock = products.filter(stock=0)
        
        by_category = products.values('category').annotate(
            count=Count('id'),
            stock=Sum('stock'),
            value=Sum(F('stock') * F('cost_price'))
        )
        
        return {
            'summary': {
                'total_products': total_products,
                'total_stock_units': total_stock,
                'stock_cost_value': stock_value['cost_value'] or 0,
                'stock_selling_value': stock_value['selling_value'] or 0,
                'potential_profit': (stock_value['selling_value'] or 0) - (stock_value['cost_value'] or 0),
                'low_stock_count': low_stock.count(),
                'out_of_stock_count': out_of_stock.count()
            },
            'low_stock_items': list(low_stock.values('id', 'name', 'brand', 'stock', 'category')[:20]),
            'out_of_stock_items': list(out_of_stock.values('id', 'name', 'brand', 'category')[:20]),
            'by_category': {item['category']: {'count': item['count'], 'stock': item['stock'], 'value': item['value']} for item in by_category}
        }


# Export Functions
def export_to_csv(data, headers, filename):
    """Export data to CSV"""
    output = BytesIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    for row in data:
        writer.writerow(row)
    output.seek(0)
    return output


def export_to_excel(data, headers, sheet_name='Report'):
    """Export data to Excel"""
    wb = Workbook()
    ws = wb.active
    ws.title = sheet_name
    
    header_fill = PatternFill(start_color='1e40af', end_color='1e40af', fill_type='solid')
    header_font = Font(color='FFFFFF', bold=True)
    
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal='center')
    
    for row_num, row in enumerate(data, 2):
        for col_num, value in enumerate(row, 1):
            ws.cell(row=row_num, column=col_num, value=value)
    
    # Auto-width columns
    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        ws.column_dimensions[column].width = min(max_length + 2, 50)
    
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    return output


def export_to_pdf(title, data, headers):
    """Export data to PDF"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), rightMargin=15*mm, leftMargin=15*mm, topMargin=15*mm, bottomMargin=15*mm)
    
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='ReportTitle', parent=styles['Heading1'], fontSize=18, alignment=TA_CENTER, spaceAfter=10))
    styles.add(ParagraphStyle(name='ReportSubtitle', parent=styles['Normal'], fontSize=12, alignment=TA_CENTER, spaceAfter=15, textColor=colors.HexColor('#6b7280')))
    
    try:
        from apps.core.settings_models import BusinessSettings
        biz_name = BusinessSettings.get_settings().business_name or "Meghani Watch Co."
    except Exception:
        biz_name = "Meghani Watch Co."

    elements = []
    elements.append(Paragraph(f"<b>{biz_name.upper()}</b>", styles['ReportTitle']))
    elements.append(Paragraph(title, styles['ReportSubtitle']))
    elements.append(Paragraph(f"Generated on: {timezone.now().strftime('%d-%m-%Y %H:%M')}", styles['Normal']))
    elements.append(Spacer(1, 8*mm))
    
    table_data = [headers] + list(data)
    
    table = Table(table_data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(table)
    
    doc.build(elements)
    buffer.seek(0)
    return buffer
