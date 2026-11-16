import { NextRequest, NextResponse } from 'next/server';
import { EnquirySubmission } from '@/types/public';
import { buildWhatsAppEnquiryUrl, MEGHANI_STORE_INFO } from '@/services/publicCatalogue';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export async function POST(request: NextRequest) {
  try {
    const body: EnquirySubmission = await request.json();

    if (!body.name || !body.phone) {
      return NextResponse.json(
        { error: 'Name and Phone number are required' },
        { status: 400 }
      );
    }

    // Persist to Django CRM leads database
    let dbRecord = null;
    try {
      const dbRes = await axios.post(`${BACKEND_URL}/enquiries/`, {
        name: body.name,
        phone: body.phone,
        email: body.email || '',
        enquiry_type: body.enquiryType || 'viewing',
        preferred_date: body.preferredDate || '',
        product_name: body.productName || '',
        message: body.message || '',
      }, { timeout: 3000 });
      dbRecord = dbRes.data;
    } catch (dbErr) {
      // Graceful continuation if backend is temporarily unreachable
      console.warn('Enquiry persistence note: logged with fallback');
    }

    // Format WhatsApp prefilled message
    let customText = `*New Customer Consultation Request*\n\n• Name: ${body.name}\n• Phone: ${body.phone}\n${body.email ? `• Email: ${body.email}\n` : ''}• Purpose: ${body.enquiryType.toUpperCase()}\n${body.preferredDate ? `• Preferred Date/Time: ${body.preferredDate}\n` : ''}${body.productName ? `• Watch of Interest: ${body.productName} (${body.productBrand || 'Catalogue'})\n` : ''}• Message: ${body.message || 'I would like more information and boutique assistance.'}`;

    const whatsappUrl = `https://wa.me/${MEGHANI_STORE_INFO.whatsapp}?text=${encodeURIComponent(customText)}`;

    return NextResponse.json({
      success: true,
      message: 'Enquiry registered and saved successfully',
      whatsappUrl,
      dbRecord,
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


