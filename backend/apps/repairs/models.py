from django.db import models
from django.utils import timezone
from apps.users.models import User
from apps.crm.models import Customer


class Repair(models.Model):
    STATUS_CHOICES = [
        ('received', 'Received'),
        ('in_repair', 'In Repair'),
        ('ready', 'Ready for Pickup'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    ticket_number = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='repairs')
    item_type = models.CharField(max_length=50)
    brand = models.CharField(max_length=50, blank=True)
    model_number = models.CharField(max_length=50, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    issue_description = models.TextField()
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    repair_charge = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    advance_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='received')
    received_date = models.DateTimeField(default=timezone.now)
    expected_delivery = models.DateField(blank=True, null=True)
    delivered_date = models.DateTimeField(blank=True, null=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='repairs_created')

    class Meta:
        db_table = 'repairs'
        ordering = ['-received_date']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['ticket_number']),
        ]

    def __str__(self):
        return f"Ticket {self.ticket_number} - {self.item_type}"

    def save(self, *args, **kwargs):
        if not self.ticket_number:
            self.ticket_number = self.generate_ticket_number()
        super().save(*args, **kwargs)

    @staticmethod
    def generate_ticket_number():
        """Generate unique ticket number: REP-YYYYMMDD-XXXX"""
        today = timezone.now().strftime('%Y%m%d')
        prefix = f"REP-{today}-"
        
        last_repair = Repair.objects.filter(
            ticket_number__startswith=prefix
        ).order_by('-ticket_number').first()
        
        if last_repair:
            last_num = int(last_repair.ticket_number.split('-')[-1])
            new_num = last_num + 1
        else:
            new_num = 1
        
        return f"{prefix}{new_num:04d}"

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
