from django.conf import settings
from django.utils import timezone
import re


def parse_template_variables(message: str, variables: dict) -> str:
    """
    Replace template variables in message with actual values.
    
    Variables format: {{variable_name}}
    Example: "Hello {{customer_name}}, your order {{order_id}} is ready!"
    """
    def replace_var(match):
        var_name = match.group(1).strip()
        return str(variables.get(var_name, f'{{{{{var_name}}}}}'))
    
    return re.sub(r'\{\{(\w+)\}\}', replace_var, message)


def verify_twilio_config() -> dict:
    """
    Verify Twilio credentials and configuration.
    
    Returns:
        dict with status and configuration details
    """
    account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None)
    auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', None)
    whatsapp_number = getattr(settings, 'TWILIO_WHATSAPP_NUMBER', None)
    sms_number = getattr(settings, 'TWILIO_SMS_NUMBER', None)
    
    config_status = {
        'account_sid': bool(account_sid),
        'auth_token': bool(auth_token),
        'whatsapp_number': bool(whatsapp_number),
        'sms_number': bool(sms_number),
    }
    
    if not all([account_sid, auth_token]):
        return {
            'status': 'not_configured',
            'config': config_status,
            'message': 'Twilio credentials not configured'
        }
    
    try:
        from twilio.rest import Client
        client = Client(account_sid, auth_token)
        
        # Verify account
        account = client.api.account.fetch()
        
        return {
            'status': 'connected',
            'config': config_status,
            'account_name': account.friendly_name,
            'account_status': account.status,
            'message': 'Twilio connection verified'
        }
    except ImportError:
        return {
            'status': 'error',
            'config': config_status,
            'message': 'Twilio library not installed'
        }
    except Exception as e:
        return {
            'status': 'error',
            'config': config_status,
            'message': str(e)
        }


def send_whatsapp_message(phone: str, message: str, variables: dict = None) -> dict:
    """
    Send WhatsApp message via Twilio API
    
    Args:
        phone: Customer phone number (format: +91XXXXXXXXXX)
        message: Message text to send
        variables: Optional dict of template variables to replace
    
    Returns:
        dict with status and message_sid or error
    """
    # Replace template variables if provided
    if variables:
        message = parse_template_variables(message, variables)
    account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None)
    auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', None)
    from_number = getattr(settings, 'TWILIO_WHATSAPP_NUMBER', None)
    
    if not all([account_sid, auth_token, from_number]):
        return {'status': 'error', 'error': 'Twilio credentials not configured'}
    
    try:
        from twilio.rest import Client
        
        client = Client(account_sid, auth_token)
        
        # Format phone number for WhatsApp
        if not phone.startswith('+'):
            phone = f'+91{phone}'
        
        whatsapp_to = f'whatsapp:{phone}'
        whatsapp_from = from_number if from_number.startswith('whatsapp:') else f'whatsapp:{from_number}'
        
        message_obj = client.messages.create(
            body=message,
            from_=whatsapp_from,
            to=whatsapp_to
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
