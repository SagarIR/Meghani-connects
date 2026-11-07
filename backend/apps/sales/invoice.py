"""
Invoice PDF Generation using ReportLab
"""
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from django.conf import settings


def generate_invoice_pdf(sale):
    """Generate PDF invoice for a sale"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm
    )
    
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name='InvoiceTitle',
        parent=styles['Heading1'],
        fontSize=24,
        alignment=TA_CENTER,
        spaceAfter=10
    ))
    styles.add(ParagraphStyle(
        name='RightAlign',
        parent=styles['Normal'],
        alignment=TA_RIGHT
    ))
    styles.add(ParagraphStyle(
        name='Center',
        parent=styles['Normal'],
        alignment=TA_CENTER
    ))
    
    elements = []
    
    # Header - Business Info
    business_name = Paragraph("<b>MEGHANI WATCH CO.</b>", styles['InvoiceTitle'])
    elements.append(business_name)
    
    address = Paragraph(
        "Your Business Address, City - 000000<br/>"
        "Phone: +91 XXXXXXXXXX | GST: XXXXXXXXXXXXXXX",
        styles['Center']
    )
    elements.append(address)
    elements.append(Spacer(1, 10*mm))
    
    # Invoice Info
    invoice_info = [
        ['Invoice Number:', sale.invoice_number, 'Date:', sale.sale_date.strftime('%d-%m-%Y')],
        ['Customer:', sale.customer.name if sale.customer else 'Walk-in', 'Phone:', sale.customer.phone if sale.customer else '-'],
    ]
    
    info_table = Table(invoice_info, colWidths=[30*mm, 55*mm, 25*mm, 50*mm])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 8*mm))
    
    # Items Table
    items_data = [['#', 'Product', 'Qty', 'Price', 'Total']]
    
    for idx, item in enumerate(sale.items.all(), 1):
        items_data.append([
            str(idx),
            f"{item.product.name}\n{item.product.brand or ''}",
            str(item.quantity),
            f"Rs. {item.unit_price:,.0f}",
            f"Rs. {item.subtotal:,.0f}"
        ])
    
    items_table = Table(items_data, colWidths=[10*mm, 80*mm, 15*mm, 30*mm, 35*mm])
    items_table.setStyle(TableStyle([
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        
        # Body
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ALIGN', (2, 1), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        
        # Grid
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
        
        # Padding
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 5*mm))
    
    # Totals
    subtotal = sum(item.subtotal for item in sale.items.all())
    totals_data = []
    
    if sale.discount > 0:
        totals_data.append(['Subtotal:', f"Rs. {subtotal:,.0f}"])
        totals_data.append(['Discount:', f"- Rs. {sale.discount:,.0f}"])
    
    totals_data.append(['TOTAL:', f"Rs. {sale.total_amount:,.0f}"])
    
    totals_table = Table(totals_data, colWidths=[130*mm, 40*mm])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 5*mm))
    
    # Payment Mode
    payment_text = Paragraph(
        f"<b>Payment Mode:</b> {sale.payment_mode.upper()}",
        styles['Normal']
    )
    elements.append(payment_text)
    elements.append(Spacer(1, 10*mm))
    
    # Footer
    footer = Paragraph(
        "<b>Thank you for your purchase!</b><br/>"
        "For any queries, please contact us at +91 XXXXXXXXXX",
        styles['Center']
    )
    elements.append(footer)
    elements.append(Spacer(1, 5*mm))
    
    # Terms
    terms = Paragraph(
        "<font size='8'>Terms & Conditions: "
        "1. Goods once sold will not be taken back. "
        "2. Warranty as per company policy. "
        "3. Please retain this invoice for warranty claims.</font>",
        styles['Center']
    )
    elements.append(terms)
    
    doc.build(elements)
    buffer.seek(0)
    return buffer


def generate_repair_invoice_pdf(repair):
    """Generate PDF invoice for a repair job"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm
    )
    
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name='InvoiceTitle',
        parent=styles['Heading1'],
        fontSize=24,
        alignment=TA_CENTER,
        spaceAfter=10
    ))
    styles.add(ParagraphStyle(
        name='Center',
        parent=styles['Normal'],
        alignment=TA_CENTER
    ))
    
    elements = []
    
    # Header
    elements.append(Paragraph("<b>MEGHANI WATCH CO.</b>", styles['InvoiceTitle']))
    elements.append(Paragraph(
        "Your Business Address, City - 000000<br/>"
        "Phone: +91 XXXXXXXXXX",
        styles['Center']
    ))
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph("<b>REPAIR RECEIPT</b>", styles['Center']))
    elements.append(Spacer(1, 10*mm))
    
    # Repair Info
    info_data = [
        ['Ticket Number:', repair.ticket_number],
        ['Date Received:', repair.received_date.strftime('%d-%m-%Y')],
        ['Customer Name:', repair.customer.name if repair.customer else repair.customer_name or '-'],
        ['Phone:', repair.customer.phone if repair.customer else repair.customer_phone or '-'],
        ['Item Type:', repair.item_type],
        ['Brand:', repair.brand or '-'],
        ['Model:', repair.model_number or '-'],
        ['Issue:', repair.issue_description],
    ]
    
    info_table = Table(info_data, colWidths=[40*mm, 130*mm])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 10*mm))
    
    # Charges
    charges_data = [
        ['Estimated Cost:', f"Rs. {repair.estimated_cost:,.0f}" if repair.estimated_cost else '-'],
        ['Advance Paid:', f"Rs. {repair.advance_paid:,.0f}"],
    ]
    
    if repair.repair_charge:
        charges_data.append(['Final Charge:', f"Rs. {repair.repair_charge:,.0f}"])
        balance = repair.repair_charge - repair.advance_paid
        charges_data.append(['Balance Due:', f"Rs. {balance:,.0f}"])
    
    charges_table = Table(charges_data, colWidths=[40*mm, 40*mm])
    charges_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('BOX', (0, 0), (-1, -1), 1, colors.black),
    ]))
    elements.append(charges_table)
    elements.append(Spacer(1, 10*mm))
    
    if repair.expected_delivery:
        elements.append(Paragraph(
            f"<b>Expected Delivery:</b> {repair.expected_delivery.strftime('%d-%m-%Y')}",
            styles['Normal']
        ))
        elements.append(Spacer(1, 5*mm))
    
    # Status
    elements.append(Paragraph(
        f"<b>Current Status:</b> {repair.status.upper().replace('_', ' ')}",
        styles['Normal']
    ))
    elements.append(Spacer(1, 15*mm))
    
    # Footer
    elements.append(Paragraph(
        "Please bring this receipt when collecting your item.",
        styles['Center']
    ))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer
