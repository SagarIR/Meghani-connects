from decimal import Decimal
from django.db import models, transaction, IntegrityError
from django.utils import timezone
from apps.users.models import User
from apps.crm.models import Customer


class Repair(models.Model):
    STATUS_CHOICES = [
        ('received', 'Received & Logged'),
        ('diagnosing', 'Under Diagnosis & Inspection'),
        ('awaiting_approval', 'Awaiting Customer Approval'),
        ('in_repair', 'In Repair & Servicing'),
        ('testing', 'QC & Accuracy Testing'),
        ('ready', 'Ready for Pickup'),
        ('delivered', 'Delivered & Closed'),
        ('cancelled', 'Cancelled & Returned'),
    ]

    SERVICE_TYPE_CHOICES = [
        ('battery_replacement', 'Battery & Pressure Testing'),
        ('movement_overhaul', 'Full Movement Overhaul / Service'),
        ('crystal_replacement', 'Crystal / Sapphire Glass Replacement'),
        ('polishing_refurbishment', 'Case & Bracelet Polishing'),
        ('strap_customization', 'Strap Replacement / Resizing'),
        ('water_resistance', 'Water Resistance Gasket Service'),
        ('crown_stem_repair', 'Crown & Stem Repair'),
        ('general_repair', 'General Repair & Regulation'),
    ]

    ticket_number = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='repairs')
    item_type = models.CharField(max_length=50)
    brand = models.CharField(max_length=50, blank=True)
    model_number = models.CharField(max_length=50, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    service_type = models.CharField(max_length=50, choices=SERVICE_TYPE_CHOICES, default='general_repair')
    issue_description = models.TextField()
    diagnosis_notes = models.TextField(blank=True, default='')
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    repair_charge = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    advance_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='received')
    assigned_technician = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_repairs')
    qc_passed = models.BooleanField(default=False)
    received_date = models.DateTimeField(default=timezone.now)
    expected_delivery = models.DateField(blank=True, null=True)
    delivered_date = models.DateTimeField(blank=True, null=True)
    warranty = models.ForeignKey('sales.Warranty', on_delete=models.SET_NULL, null=True, blank=True, related_name='repairs')
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='repairs_created')

    class Meta:
        db_table = 'repairs'
        ordering = ['-received_date']
        indexes = [
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Ticket {self.ticket_number} - {self.item_type}"

    def save(self, *args, **kwargs):
        if not self.ticket_number:
            max_retries = 5
            for attempt in range(max_retries):
                self.ticket_number = self.generate_ticket_number()
                try:
                    with transaction.atomic():
                        super().save(*args, **kwargs)
                    return
                except IntegrityError as e:
                    if ('unique' in str(e).lower() or 'ticket_number' in str(e).lower()) and attempt < max_retries - 1:
                        self.ticket_number = None
                        continue
                    raise
        super().save(*args, **kwargs)

    @classmethod
    def generate_ticket_number(cls):
        """Generate unique ticket number: REP-YYYYMMDD-XXXX with concurrency protection"""
        today = timezone.now().strftime('%Y%m%d')
        prefix = f"REP-{today}-"
        
        try:
            last_repair = cls.objects.select_for_update().filter(
                ticket_number__startswith=prefix
            ).order_by('-ticket_number').first()
        except Exception:
            last_repair = cls.objects.filter(
                ticket_number__startswith=prefix
            ).order_by('-ticket_number').first()
        
        if last_repair:
            try:
                last_num = int(last_repair.ticket_number.split('-')[-1])
                new_num = last_num + 1
            except (ValueError, IndexError):
                new_num = cls.objects.filter(ticket_number__startswith=prefix).count() + 1
        else:
            new_num = cls.objects.filter(ticket_number__startswith=prefix).count() + 1
        
        candidate = f"{prefix}{new_num:04d}"
        while cls.objects.filter(ticket_number=candidate).exists():
            new_num += 1
            candidate = f"{prefix}{new_num:04d}"
        
        return candidate

    @property
    def is_warranty_repair(self):
        return bool(self.warranty and self.warranty.status in ['active', 'claimed'] and not self.warranty.is_expired)

    @property
    def balance_due(self):
        charge = self.repair_charge if self.repair_charge is not None else self.estimated_cost
        if charge is not None:
            return charge - self.advance_paid
        return 0

    @property
    def days_in_repair(self):
        if self.delivered_date:
            return (self.delivered_date.date() - self.received_date.date()).days
        return (timezone.now().date() - self.received_date.date()).days

    @property
    def total_parts_charge(self):
        return sum((p.total_charge for p in self.parts_used.all()), Decimal('0.00'))


class RepairPart(models.Model):
    """
    Spare parts and consumables consumed in watch repair workshop jobs.
    Directly integrated with the central inventory stock movement ledger.
    """
    repair = models.ForeignKey(Repair, on_delete=models.CASCADE, related_name='parts_used')
    product = models.ForeignKey('products.Product', on_delete=models.PROTECT, related_name='repair_consumptions')
    quantity = models.PositiveIntegerField(default=1)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    charge_to_customer = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    notes = models.CharField(max_length=200, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'repair_parts'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.quantity}x {self.product.name} on {self.repair.ticket_number}"

    @property
    def total_cost(self):
        return self.unit_cost * self.quantity

    @property
    def total_charge(self):
        return self.charge_to_customer * self.quantity
