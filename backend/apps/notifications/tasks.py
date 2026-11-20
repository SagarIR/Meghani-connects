import logging
from datetime import timedelta
from celery import shared_task
from django.utils import timezone
from apps.notifications.models import Notification
from apps.core.settings_models import BusinessSettings
from apps.notifications.services.whatsapp import send_whatsapp_message
from apps.notifications.services.sms import send_sms_message

logger = logging.getLogger(__name__)


@shared_task
def send_repair_notification_task(repair_id: int, status_event: str):
    """
    Asynchronous Celery task to dispatch repair workflow notifications to customers.
    
    Stages:
    - received: Timepiece logged in atelier
    - in_repair: Master watchmaker servicing timepiece
    - ready: Service complete, ready for collection
    - delivered: Delivered to client
    - cancelled: Service cancelled
    
    Reliability features:
    - Checks BusinessSettings (enable_whatsapp, enable_sms)
    - Suppresses duplicate dispatches within 60 minutes
    - Records every attempt in the Notification model
    - Dispatches via Twilio WhatsApp with automatic Twilio SMS fallback
    - Non-blocking and exception-isolated
    """
    from apps.repairs.models import Repair

    try:
        repair = Repair.objects.select_related('customer').get(id=repair_id)
    except Repair.DoesNotExist:
        logger.error(f"Repair {repair_id} not found for notification dispatch")
        return {"status": "error", "message": "Repair not found"}

    customer = repair.customer
    if not customer or not customer.phone:
        logger.warning(f"Repair {repair.ticket_number} has no customer phone attached")
        return {"status": "skipped", "message": "No customer phone attached"}

    # Fetch settings
    try:
        biz_settings = BusinessSettings.get_settings()
        enable_whatsapp = biz_settings.enable_whatsapp
        enable_sms = biz_settings.enable_sms
    except Exception as e:
        logger.warning(f"Failed to fetch BusinessSettings for notification: {e}")
        enable_whatsapp = False
        enable_sms = False

    if not enable_whatsapp and not enable_sms:
        logger.info(f"Notifications disabled in settings for repair {repair.ticket_number}")
        return {"status": "skipped", "message": "Notifications disabled in settings"}

    item_desc = f"{repair.brand} {repair.item_type}".strip() if repair.brand else repair.item_type
    balance_val = repair.balance_due
    balance_text = f" Outstanding balance: ₹{balance_val:,.2f}." if balance_val > 0 else ""

    # Message templates for each stage
    messages = {
        'received': (
            f"Dear {customer.name}, your {item_desc} (Ref: {repair.ticket_number}) "
            f"has been safely received by the Meghani Watch Co. atelier for diagnostic evaluation. "
            f"We will update you once assessment is complete."
        ),
        'diagnosing': (
            f"Dear {customer.name}, your {item_desc} (Ticket: {repair.ticket_number}) "
            f"is currently undergoing diagnostic inspection by our watchmaker. Meghani Watch Co."
        ),
        'awaiting_approval': (
            f"Dear {customer.name}, diagnostic assessment for {item_desc} (Ticket: {repair.ticket_number}) "
            f"is complete. Estimated service cost: ₹{repair.estimated_cost or repair.repair_charge or 0:,.2f}. "
            f"Please contact us to confirm. Meghani Watch Co."
        ),
        'in_repair': (
            f"Dear {customer.name}, your {item_desc} (Ticket: {repair.ticket_number}) "
            f"is currently undergoing precision servicing by our master watchmakers. "
            f"Meghani Watch Co."
        ),
        'testing': (
            f"Dear {customer.name}, servicing on your {item_desc} (Ticket: {repair.ticket_number}) "
            f"is complete. It is now undergoing timing accuracy & water resistance testing. Meghani Watch Co."
        ),
        'ready': (
            f"Dear {customer.name}, your {item_desc} (Ticket: {repair.ticket_number}) "
            f"is fully serviced and ready for pickup at our showroom.{balance_text} "
            f"Meghani Watch Co."
        ),
        'delivered': (
            f"Dear {customer.name}, your {item_desc} (Ticket: {repair.ticket_number}) "
            f"has been collected. Thank you for entrusting Meghani Watch Co. with your watchmaking care."
        ),
        'cancelled': (
            f"Dear {customer.name}, repair ticket {repair.ticket_number} has been cancelled. "
            f"Please visit our showroom to collect your timepiece. Meghani Watch Co."
        ),
    }

    message = messages.get(status_event)
    if not message:
        logger.warning(f"Unknown status event '{status_event}' for repair {repair.ticket_number}")
        return {"status": "skipped", "message": f"Unknown status event: {status_event}"}

    # Duplicate suppression: check if an identical notification was dispatched within 60 minutes
    recent_cutoff = timezone.now() - timedelta(minutes=60)
    duplicate_exists = Notification.objects.filter(
        customer=customer,
        message=message,
        created_at__gte=recent_cutoff,
        status__in=['sent', 'pending']
    ).exists()

    if duplicate_exists:
        logger.info(f"Duplicate notification suppressed for repair {repair.ticket_number} [{status_event}]")
        return {"status": "suppressed", "message": "Duplicate notification suppressed within 60m"}

    # Create audit notification record
    preferred_type = 'whatsapp' if enable_whatsapp else 'sms'
    notification = Notification.objects.create(
        customer=customer,
        message=message,
        type=preferred_type,
        status='pending'
    )

    dispatched = False
    delivery_channel = preferred_type
    error_summary = []

    # 1. Attempt WhatsApp if enabled
    if enable_whatsapp:
        try:
            wa_res = send_whatsapp_message(customer.phone, message)
            if wa_res.get('status') == 'sent':
                dispatched = True
                delivery_channel = 'whatsapp'
            else:
                error_summary.append(f"WhatsApp: {wa_res.get('error', 'Unknown error')}")
        except Exception as wa_err:
            error_summary.append(f"WhatsApp exception: {str(wa_err)}")

    # 2. Fall back to SMS if WhatsApp failed or wasn't enabled
    if not dispatched and enable_sms:
        try:
            sms_res = send_sms_message(customer.phone, message)
            if sms_res.get('status') == 'sent':
                dispatched = True
                delivery_channel = 'sms'
            else:
                error_summary.append(f"SMS: {sms_res.get('error', 'Unknown error')}")
        except Exception as sms_err:
            error_summary.append(f"SMS exception: {str(sms_err)}")

    # Update notification record
    notification.type = delivery_channel
    if dispatched:
        notification.status = 'sent'
        notification.sent_on = timezone.now()
        notification.error_message = ''
    else:
        notification.status = 'failed'
        notification.error_message = ' | '.join(error_summary) or 'Delivery failed on all enabled channels'

    notification.save()
    return {
        "status": "sent" if dispatched else "failed",
        "channel": delivery_channel,
        "notification_id": notification.id,
        "errors": error_summary if not dispatched else []
    }
