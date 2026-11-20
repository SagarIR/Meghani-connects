import random
from decimal import Decimal
from django.db import models, transaction
from django.utils import timezone
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db.models import Q, Max


class Supplier(models.Model):
    name = models.CharField(max_length=200, unique=True)
    contact_person = models.CharField(max_length=100, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    address = models.TextField(blank=True, default='')
    gstin = models.CharField(max_length=15, blank=True, default='')
    payment_terms = models.CharField(max_length=100, blank=True, default='Net 30')
    opening_balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    notes = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'suppliers'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name

    def clean(self):
        super().clean()
        if self.gstin:
            gstin_clean = self.gstin.strip().upper()
            if len(gstin_clean) != 15:
                raise ValidationError({'gstin': 'GSTIN must be exactly 15 alphanumeric characters.'})
            self.gstin = gstin_clean


class ProductSupplier(models.Model):
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='supplier_links')
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='product_links')
    supplier_sku = models.CharField(max_length=100, blank=True, default='')
    last_cost_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    lead_time_days = models.PositiveIntegerField(default=7)
    is_preferred = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'product_suppliers'
        ordering = ['-is_preferred', 'supplier__name']
        constraints = [
            models.UniqueConstraint(fields=['product', 'supplier'], name='unique_product_supplier'),
        ]

    def __str__(self):
        return f"{self.product.name} <- {self.supplier.name}"


class PurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('ordered', 'Ordered / Pending Delivery'),
        ('partially_received', 'Partially Received'),
        ('completed', 'Completed / Received'),
        ('cancelled', 'Cancelled'),
    ]

    order_number = models.CharField(max_length=50, unique=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='purchase_orders')
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='draft')
    order_date = models.DateTimeField(default=timezone.now)
    expected_delivery_date = models.DateField(null=True, blank=True)
    supplier_invoice_number = models.CharField(max_length=100, blank=True, default='')
    supplier_invoice_date = models.DateField(null=True, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='created_purchase_orders',
        null=True, blank=True
    )
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'purchase_orders'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['order_date']),
        ]

    def __str__(self):
        return f"{self.order_number} ({self.supplier.name}) - {self.get_status_display()}"

    @classmethod
    def generate_order_number(cls):
        """
        Concurrency-safe sequence generator for purchase order numbers.
        Format: PO-YYYYMMDD-XXXX
        """
        today_str = timezone.now().strftime('%Y%m%d')
        prefix = f"PO-{today_str}-"
        
        with transaction.atomic():
            last_po = cls.objects.select_for_update().filter(
                order_number__startswith=prefix
            ).order_by('-order_number').first()
            
            if last_po and last_po.order_number:
                try:
                    last_seq = int(last_po.order_number.split('-')[-1])
                    seq = last_seq + 1
                except (ValueError, IndexError):
                    seq = 1
            else:
                seq = 1
            
            while True:
                candidate = f"{prefix}{seq:04d}"
                if not cls.objects.filter(order_number=candidate).exists():
                    return candidate
                seq += 1

    def recalculate_totals(self):
        """Recalculates subtotal, tax, and total from associated line items."""
        total_subtotal = Decimal('0.00')
        total_tax = Decimal('0.00')
        total_discount = Decimal('0.00')

        for item in self.items.all():
            line_cost = (Decimal(str(item.unit_cost)) * item.ordered_quantity)
            discount = line_cost * (Decimal(str(item.discount_percent)) / Decimal('100.00'))
            after_discount = line_cost - discount
            tax = after_discount * (Decimal(str(item.tax_rate)) / Decimal('100.00'))
            
            total_subtotal += line_cost
            total_discount += discount
            total_tax += tax

        self.subtotal = total_subtotal
        self.discount_amount = total_discount
        self.tax_amount = total_tax
        self.total_amount = (total_subtotal - total_discount) + total_tax
        self.save(update_fields=['subtotal', 'discount_amount', 'tax_amount', 'total_amount', 'updated_at'])

    def update_status_from_receipts(self):
        """Updates status to completed or partially_received based on received quantities."""
        if self.status == 'cancelled':
            return
        
        items = list(self.items.all())
        if not items:
            return

        all_received = all(item.received_quantity >= item.ordered_quantity for item in items)
        any_received = any(item.received_quantity > 0 for item in items)

        new_status = self.status
        if all_received:
            new_status = 'completed'
        elif any_received:
            new_status = 'partially_received'

        if new_status != self.status:
            self.status = new_status
            self.save(update_fields=['status', 'updated_at'])

    def save(self, *args, **kwargs):
        if not self.order_number:
            max_retries = 5
            for attempt in range(max_retries):
                try:
                    self.order_number = self.generate_order_number()
                    super().save(*args, **kwargs)
                    return
                except Exception as e:
                    if 'unique' in str(e).lower() and attempt < max_retries - 1:
                        self.order_number = ''
                        continue
                    raise
        super().save(*args, **kwargs)


class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.PROTECT, related_name='purchase_items')
    ordered_quantity = models.PositiveIntegerField()
    received_quantity = models.PositiveIntegerField(default=0)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('18.00')) # Default 18% GST
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    class Meta:
        db_table = 'purchase_order_items'
        ordering = ['id']

    def __str__(self):
        return f"{self.product.name} (Qty: {self.ordered_quantity}) for {self.purchase_order.order_number}"

    @property
    def pending_quantity(self):
        return max(0, self.ordered_quantity - self.received_quantity)

    def save(self, *args, **kwargs):
        line_cost = (Decimal(str(self.unit_cost)) * self.ordered_quantity)
        discount = line_cost * (Decimal(str(self.discount_percent)) / Decimal('100.00'))
        after_discount = line_cost - discount
        tax = after_discount * (Decimal(str(self.tax_rate)) / Decimal('100.00'))
        self.subtotal = round(after_discount + tax, 2)
        super().save(*args, **kwargs)


class GoodsReceipt(models.Model):
    receipt_number = models.CharField(max_length=50, unique=True)
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.PROTECT, related_name='goods_receipts')
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='received_goods',
        null=True, blank=True
    )
    received_at = models.DateTimeField(default=timezone.now)
    supplier_delivery_note = models.CharField(max_length=100, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'goods_receipts'
        ordering = ['-received_at']

    def __str__(self):
        return f"{self.receipt_number} (PO: {self.purchase_order.order_number})"

    @classmethod
    def generate_receipt_number(cls):
        """
        Concurrency-safe sequence generator for Goods Receipt Notes (GRN).
        Format: GRN-YYYYMMDD-XXXX
        """
        today_str = timezone.now().strftime('%Y%m%d')
        prefix = f"GRN-{today_str}-"
        
        with transaction.atomic():
            last_grn = cls.objects.select_for_update().filter(
                receipt_number__startswith=prefix
            ).order_by('-receipt_number').first()
            
            if last_grn and last_grn.receipt_number:
                try:
                    last_seq = int(last_grn.receipt_number.split('-')[-1])
                    seq = last_seq + 1
                except (ValueError, IndexError):
                    seq = 1
            else:
                seq = 1
            
            while True:
                candidate = f"{prefix}{seq:04d}"
                if not cls.objects.filter(receipt_number=candidate).exists():
                    return candidate
                seq += 1

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            self.receipt_number = self.generate_receipt_number()
        super().save(*args, **kwargs)


class GoodsReceiptItem(models.Model):
    goods_receipt = models.ForeignKey(GoodsReceipt, on_delete=models.CASCADE, related_name='items')
    purchase_order_item = models.ForeignKey(PurchaseOrderItem, on_delete=models.PROTECT, related_name='receipt_items')
    product = models.ForeignKey('products.Product', on_delete=models.PROTECT, related_name='goods_receipt_items')
    quantity_received = models.PositiveIntegerField()
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    batch_number = models.CharField(max_length=50, blank=True, default='')
    notes = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'goods_receipt_items'
        ordering = ['id']

    def __str__(self):
        return f"{self.product.name} (Qty: {self.quantity_received}) in {self.goods_receipt.receipt_number}"


class StockMovement(models.Model):
    MOVEMENT_CHOICES = [
        ('opening_stock', 'Opening Stock'),
        ('purchase_receipt', 'Purchase Receipt'),
        ('sale', 'Sale'),
        ('customer_return', 'Customer Return'),
        ('supplier_return', 'Supplier Return'),
        ('damage', 'Damaged Goods Write-Off'),
        ('wastage', 'Wastage / Shrinkage'),
        ('manual_adjustment', 'Manual Inventory Adjustment'),
        ('repair_consumption', 'Watch Repair Part Consumption'),
        ('repair_return', 'Watch Repair Part Return'),
    ]

    product = models.ForeignKey('products.Product', on_delete=models.PROTECT, related_name='stock_movements')
    movement_type = models.CharField(max_length=30, choices=MOVEMENT_CHOICES)
    quantity_in = models.PositiveIntegerField(default=0)
    quantity_out = models.PositiveIntegerField(default=0)
    previous_balance = models.PositiveIntegerField()
    resulting_balance = models.PositiveIntegerField()
    reference_id = models.CharField(max_length=100, blank=True, default='')
    reason = models.CharField(max_length=255, blank=True, default='')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='recorded_stock_movements'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stock_movements'
        ordering = ['-created_at', '-id']
        indexes = [
            models.Index(fields=['product', '-created_at']),
            models.Index(fields=['movement_type']),
            models.Index(fields=['reference_id']),
        ]
        constraints = [
            models.CheckConstraint(check=Q(quantity_in__gte=0), name='stock_movement_qty_in_gte_0'),
            models.CheckConstraint(check=Q(quantity_out__gte=0), name='stock_movement_qty_out_gte_0'),
            models.CheckConstraint(check=Q(resulting_balance__gte=0), name='stock_movement_resulting_balance_gte_0'),
        ]

    def __str__(self):
        direction = f"+{self.quantity_in}" if self.quantity_in > 0 else f"-{self.quantity_out}"
        return f"[{self.movement_type}] {self.product.name} ({direction} -> Bal: {self.resulting_balance})"
