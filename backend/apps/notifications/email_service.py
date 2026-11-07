"""
Email notification service for sending transactional emails.
"""
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """
    Service class for sending various email notifications.
    """
    
    DEFAULT_FROM_EMAIL = settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@meghaniwatch.com'
    
    @classmethod
    def send_email(cls, to_email, subject, html_content, text_content=None, from_email=None):
        """
        Send an email with both HTML and plain text content.
        """
        if text_content is None:
            text_content = strip_tags(html_content)
        
        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email or cls.DEFAULT_FROM_EMAIL,
                to=[to_email] if isinstance(to_email, str) else to_email,
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    @classmethod
    def send_order_confirmation(cls, sale, customer_email):
        """
        Send order confirmation email after a sale.
        """
        subject = f"Order Confirmation - {sale.invoice_number}"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; padding: 20px; background: #1e40af; color: white;">
                    <h1 style="margin: 0;">Meghani Watch Co.</h1>
                </div>
                
                <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb;">
                    <h2 style="color: #1e40af;">Thank you for your purchase!</h2>
                    
                    <p>Your order has been confirmed. Here are the details:</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr style="background: #e5e7eb;">
                            <th style="padding: 10px; text-align: left;">Invoice Number</th>
                            <td style="padding: 10px;">{sale.invoice_number}</td>
                        </tr>
                        <tr>
                            <th style="padding: 10px; text-align: left;">Date</th>
                            <td style="padding: 10px;">{sale.sale_date.strftime('%d %b %Y')}</td>
                        </tr>
                        <tr style="background: #e5e7eb;">
                            <th style="padding: 10px; text-align: left;">Total Amount</th>
                            <td style="padding: 10px; font-weight: bold;">Rs. {sale.total_amount:,.0f}</td>
                        </tr>
                        <tr>
                            <th style="padding: 10px; text-align: left;">Payment Mode</th>
                            <td style="padding: 10px;">{sale.payment_mode.upper()}</td>
                        </tr>
                    </table>
                    
                    <p style="margin-top: 20px;">If you have any questions, please don't hesitate to contact us.</p>
                    
                    <p style="margin-top: 30px;">
                        Best regards,<br>
                        <strong>Meghani Watch Co.</strong>
                    </p>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
                    <p>This is an automated email. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return cls.send_email(customer_email, subject, html_content)
    
    @classmethod
    def send_repair_status_update(cls, repair, customer_email):
        """
        Send repair status update email.
        """
        status_messages = {
            'received': 'We have received your item for repair.',
            'in_repair': 'Your item is currently being repaired by our technicians.',
            'ready': 'Great news! Your repair is complete and ready for pickup.',
            'delivered': 'Your item has been delivered. Thank you for choosing us!',
            'cancelled': 'Your repair order has been cancelled.',
        }
        
        subject = f"Repair Update - {repair.ticket_number}"
        status_message = status_messages.get(repair.status, 'Your repair status has been updated.')
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; padding: 20px; background: #1e40af; color: white;">
                    <h1 style="margin: 0;">Meghani Watch Co.</h1>
                </div>
                
                <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb;">
                    <h2 style="color: #1e40af;">Repair Status Update</h2>
                    
                    <p>{status_message}</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr style="background: #e5e7eb;">
                            <th style="padding: 10px; text-align: left;">Ticket Number</th>
                            <td style="padding: 10px;">{repair.ticket_number}</td>
                        </tr>
                        <tr>
                            <th style="padding: 10px; text-align: left;">Item</th>
                            <td style="padding: 10px;">{repair.item_type} - {repair.brand or 'N/A'}</td>
                        </tr>
                        <tr style="background: #e5e7eb;">
                            <th style="padding: 10px; text-align: left;">Status</th>
                            <td style="padding: 10px; font-weight: bold;">{repair.get_status_display()}</td>
                        </tr>
                        {'<tr><th style="padding: 10px; text-align: left;">Final Charge</th><td style="padding: 10px;">Rs. {:,.0f}</td></tr>'.format(repair.repair_charge) if repair.repair_charge else ''}
                    </table>
                    
                    {'<div style="background: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0;"><strong>Your item is ready!</strong> Please visit our store to pick it up.</div>' if repair.status == 'ready' else ''}
                    
                    <p style="margin-top: 30px;">
                        Best regards,<br>
                        <strong>Meghani Watch Co.</strong>
                    </p>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
                    <p>This is an automated email. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return cls.send_email(customer_email, subject, html_content)
    
    @classmethod
    def send_warranty_expiry_reminder(cls, customer_email, customer_name, product_name, expiry_date):
        """
        Send warranty expiry reminder email.
        """
        subject = f"Warranty Expiry Reminder - {product_name}"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; padding: 20px; background: #1e40af; color: white;">
                    <h1 style="margin: 0;">Meghani Watch Co.</h1>
                </div>
                
                <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb;">
                    <h2 style="color: #1e40af;">Warranty Expiry Reminder</h2>
                    
                    <p>Dear {customer_name},</p>
                    
                    <p>This is a friendly reminder that the warranty for your <strong>{product_name}</strong> will expire on <strong>{expiry_date.strftime('%d %b %Y')}</strong>.</p>
                    
                    <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                        <strong>Tip:</strong> Consider getting an extended warranty or a service check-up before the warranty expires.
                    </div>
                    
                    <p>Visit our store or contact us for:</p>
                    <ul>
                        <li>Extended warranty options</li>
                        <li>Service and maintenance</li>
                        <li>Battery replacement</li>
                    </ul>
                    
                    <p style="margin-top: 30px;">
                        Best regards,<br>
                        <strong>Meghani Watch Co.</strong>
                    </p>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
                    <p>This is an automated email. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return cls.send_email(customer_email, subject, html_content)
    
    @classmethod
    def send_birthday_wishes(cls, customer_email, customer_name, discount_code=None):
        """
        Send birthday wishes email with optional discount.
        """
        subject = f"Happy Birthday, {customer_name}! - Meghani Watch Co."
        
        discount_section = ''
        if discount_code:
            discount_section = f"""
            <div style="background: #d1fae5; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
                <p style="font-size: 18px; margin: 0;">Your Birthday Gift!</p>
                <p style="font-size: 24px; font-weight: bold; color: #059669; margin: 10px 0;">10% OFF</p>
                <p style="margin: 0;">Use code: <strong style="font-size: 20px;">{discount_code}</strong></p>
                <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">Valid for 7 days</p>
            </div>
            """
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #1e40af, #7c3aed); color: white;">
                    <h1 style="margin: 0; font-size: 32px;">Happy Birthday!</h1>
                </div>
                
                <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb;">
                    <p style="font-size: 18px;">Dear {customer_name},</p>
                    
                    <p>Wishing you a wonderful birthday filled with joy and happiness!</p>
                    
                    <p>As a valued customer of Meghani Watch Co., we want to make your special day even more memorable.</p>
                    
                    {discount_section}
                    
                    <p>Thank you for being part of our family!</p>
                    
                    <p style="margin-top: 30px;">
                        Warm wishes,<br>
                        <strong>Meghani Watch Co.</strong>
                    </p>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
                    <p>This is an automated email. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return cls.send_email(customer_email, subject, html_content)
    
    @classmethod
    def send_low_stock_alert(cls, admin_emails, products):
        """
        Send low stock alert to admin/managers.
        """
        subject = f"Low Stock Alert - {len(products)} Products"
        
        products_html = ''.join([
            f"<tr><td style='padding: 8px; border-bottom: 1px solid #e5e7eb;'>{p.name}</td>"
            f"<td style='padding: 8px; border-bottom: 1px solid #e5e7eb;'>{p.brand}</td>"
            f"<td style='padding: 8px; border-bottom: 1px solid #e5e7eb; color: {'#dc2626' if p.stock < p.minimum_stock else '#f59e0b'}; font-weight: bold;'>{p.stock}</td>"
            f"<td style='padding: 8px; border-bottom: 1px solid #e5e7eb;'>{p.minimum_stock}</td></tr>"
            for p in products
        ])
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; padding: 20px; background: #dc2626; color: white;">
                    <h1 style="margin: 0;">Low Stock Alert</h1>
                </div>
                
                <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb;">
                    <p>The following products need to be restocked:</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <thead>
                            <tr style="background: #1e40af; color: white;">
                                <th style="padding: 10px; text-align: left;">Product</th>
                                <th style="padding: 10px; text-align: left;">Brand</th>
                                <th style="padding: 10px; text-align: left;">Current Stock</th>
                                <th style="padding: 10px; text-align: left;">Min Stock</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products_html}
                        </tbody>
                    </table>
                    
                    <p>Please take action to restock these items.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return cls.send_email(admin_emails, subject, html_content)
