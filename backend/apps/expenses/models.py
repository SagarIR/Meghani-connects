from decimal import Decimal
from django.db import models, transaction
from django.utils import timezone
from apps.users.models import User


class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('rent', 'Showroom Rent & Lease'),
        ('salary', 'Staff Salaries & Wages'),
        ('utilities', 'Electricity & Water Utilities'),
        ('maintenance', 'Store Maintenance & Workshop Spares'),
        ('purchase', 'Procurement & Freight'),
        ('marketing', 'Advertising & Gifting Catalogs'),
        ('transport', 'Logistics & Secure Courier'),
        ('security', 'Boutique Security & CCTV'),
        ('tea_pantry', 'Pantry & Hospitality'),
        ('other', 'General & Administrative'),
    ]

    PAYMENT_MODE_CHOICES = [
        ('cash', 'Cash / Petty Cash'),
        ('upi', 'UPI / QR Payment'),
        ('card', 'Debit / Credit Card'),
        ('bank_transfer', 'Net Banking / NEFT'),
        ('cheque', 'Bank Cheque'),
    ]

    voucher_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    payment_mode = models.CharField(max_length=20, choices=PAYMENT_MODE_CHOICES, default='cash')
    date = models.DateField(default=timezone.localdate)
    description = models.TextField(blank=True)
    vendor_name = models.CharField(max_length=100, blank=True)
    gstin = models.CharField(max_length=20, blank=True, default='')
    receipt = models.ImageField(upload_to='receipts/', blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='expenses')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'expenses'
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['category']),
            models.Index(fields=['payment_mode']),
        ]

    def __str__(self):
        return f"Voucher {self.voucher_number or self.id}: {self.get_category_display()} - ₹{self.amount} ({self.date})"

    def save(self, *args, **kwargs):
        if hasattr(self.date, 'date'):
            self.date = self.date.date()
        if not self.voucher_number:
            self.voucher_number = self.generate_voucher_number()
        super().save(*args, **kwargs)

    @classmethod
    def generate_voucher_number(cls):
        """Generate unique voucher reference: EXP-YYYYMMDD-XXXX"""
        today = timezone.now().strftime('%Y%m%d')
        prefix = f"EXP-{today}-"
        
        with transaction.atomic():
            last_e = cls.objects.select_for_update().filter(
                voucher_number__startswith=prefix
            ).order_by('-voucher_number').first()
            
            if last_e and last_e.voucher_number:
                try:
                    last_num = int(last_e.voucher_number.split('-')[-1])
                    new_num = last_num + 1
                except (ValueError, IndexError):
                    new_num = cls.objects.filter(voucher_number__startswith=prefix).count() + 1
            else:
                new_num = cls.objects.filter(voucher_number__startswith=prefix).count() + 1
            
            while True:
                candidate = f"{prefix}{new_num:04d}"
                if not cls.objects.filter(voucher_number=candidate).exists():
                    return candidate
                new_num += 1


class CashRegister(models.Model):
    """
    Daily POS physical cash drawer & till reconciliation.
    Reconciles cash sales, cash repairs, petty cash expenses, and variance.
    """
    register_date = models.DateField(unique=True, default=timezone.now)
    opening_cash = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    cash_sales = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    cash_repairs = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    cash_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    expected_closing_cash = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    actual_closing_cash = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    variance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    is_closed = models.BooleanField(default=False)
    closed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='closed_registers')
    closed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cash_registers'
        ordering = ['-register_date']

    def __str__(self):
        status_txt = "CLOSED" if self.is_closed else "OPEN"
        return f"Till {self.register_date} [{status_txt}] Expected: ₹{self.expected_closing_cash}"

    def recalculate(self):
        """
        Calculates expected cash balance from the day's transactions:
        Opening Cash + Cash Sales + Cash Repairs - Cash Expenses.
        """
        from apps.sales.models import Sale
        from apps.repairs.models import Repair

        # 1. Cash Sales (Single tender cash or mixed tender cash amount)
        sales_today = Sale.objects.filter(sale_date__date=self.register_date)
        total_cash_sales = Decimal('0.00')
        for s in sales_today:
            if s.payment_mode == 'cash':
                total_cash_sales += s.total_amount
            elif s.payment_mode == 'mixed' and isinstance(s.payment_details, dict):
                total_cash_sales += Decimal(str(s.payment_details.get('cash', 0)))

        # 2. Cash Repairs (Advance paid in cash today or completed repairs delivered today)
        repairs_today = Repair.objects.filter(received_date__date=self.register_date)
        total_cash_repairs = sum(r.advance_paid for r in repairs_today if r.advance_paid > 0)

        # 3. Cash Expenses
        expenses_today = Expense.objects.filter(date=self.register_date, payment_mode='cash')
        total_cash_expenses = sum(e.amount for e in expenses_today)

        self.cash_sales = total_cash_sales
        self.cash_repairs = total_cash_repairs
        self.cash_expenses = total_cash_expenses
        self.expected_closing_cash = (self.opening_cash + total_cash_sales + total_cash_repairs) - total_cash_expenses

        if self.actual_closing_cash is not None:
            self.variance = self.actual_closing_cash - self.expected_closing_cash
        else:
            self.variance = Decimal('0.00')

        self.save(update_fields=[
            'cash_sales', 'cash_repairs', 'cash_expenses',
            'expected_closing_cash', 'variance', 'updated_at'
        ])
