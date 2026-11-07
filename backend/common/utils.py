from django.utils import timezone
from decimal import Decimal
import random
import string


def generate_random_string(length=10):
    """Generate random alphanumeric string"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


def format_currency(amount):
    """Format amount as Indian Rupees"""
    if amount is None:
        return "₹0.00"
    return f"₹{Decimal(amount):,.2f}"


def format_phone(phone):
    """Format phone number for display"""
    if not phone:
        return ""
    # Remove any existing formatting
    phone = ''.join(filter(str.isdigit, phone))
    # Format as +91 XXXXX XXXXX
    if len(phone) == 10:
        return f"+91 {phone[:5]} {phone[5:]}"
    return phone


def get_date_range(period='week'):
    """Get start and end dates for common periods"""
    today = timezone.now().date()
    
    if period == 'today':
        return today, today
    elif period == 'week':
        start = today - timezone.timedelta(days=7)
        return start, today
    elif period == 'month':
        start = today.replace(day=1)
        return start, today
    elif period == 'year':
        start = today.replace(month=1, day=1)
        return start, today
    else:
        return today - timezone.timedelta(days=30), today


def calculate_percentage(part, whole):
    """Calculate percentage safely"""
    if whole == 0:
        return 0
    return round((part / whole) * 100, 2)
