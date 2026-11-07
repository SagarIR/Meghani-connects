from django.conf import settings
from django.utils import timezone


def send_sms_message(phone: str, message: str) -> dict:
    """
    Send SMS message via Twilio API
    
    Args:
        phone: Customer phone number (format: +91XXXXXXXXXX)
        message: Message text to send
    
    Returns:
        dict with status and message_sid or error
    """
    account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None)
    auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', None)
    
    if not all([account_sid, auth_token]):
        return {'status': 'error', 'error': 'Twilio credentials not configured'}
    
    try:
        from twilio.rest import Client
        
        client = Client(account_sid, auth_token)
        
        # Format phone number
        if not phone.startswith('+'):
            phone = f'+91{phone}'
        
        # Get sender number from settings or use Twilio trial number
        from_number = getattr(settings, 'TWILIO_SMS_NUMBER', None)
        if not from_number:
            return {'status': 'error', 'error': 'SMS sender number not configured'}
        
        message_obj = client.messages.create(
            body=message,
            from_=from_number,
            to=phone
        )
        
        return {
            'status': 'sent',
            'message_sid': message_obj.sid,
            'sent_at': timezone.now().isoformat()
        }
    
    except ImportError:
        return {'status': 'error', 'error': 'Twilio library not installed'}
    except Exception as e:
        return {'status': 'error', 'error': str(e)}
