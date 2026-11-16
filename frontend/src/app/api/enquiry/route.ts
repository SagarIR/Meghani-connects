import { NextRequest, NextResponse } from 'next/server';
import { EnquirySubmission } from '@/types/public';
import { buildWhatsAppEnquiryUrl, MEGHANI_STORE_INFO } from '@/services/publicCatalogue';

export async function POST(request: NextRequest) {
  try {
    const body: EnquirySubmission = await request.json();

    if (!body.name || !body.phone) {
      return NextResponse.json(
        { error: 'Name and Phone number are required' },
        { status: 400 }
      );
    }

    // Format WhatsApp prefilled message
    let customText = `*New Customer Consultation Request*\n\n• Name: ${body.name}\n• Phone: ${body.phone}\n${body.email ? `• Email: ${body.email}\n` : ''}• Purpose: ${body.enquiryType.toUpperCase()}\n${body.preferredDate ? `• Preferred Date/Time: ${body.preferredDate}\n` : ''}${body.productName ? `• Watch of Interest: ${body.productName} (${body.productBrand || 'Catalogue'})\n` : ''}• Message: ${body.message || 'I would like more information and boutique assistance.'}`;

    const whatsappUrl = `https://wa.me/${MEGHANI_STORE_INFO.whatsapp}?text=${encodeURIComponent(customText)}`;

    return NextResponse.json({
      success: true,
      message: 'Enquiry prepared successfully',
      whatsappUrl,
      submission: {
        ...body,
        receivedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Could not process enquiry' },
      { status: 500 }
    );
  }
}

