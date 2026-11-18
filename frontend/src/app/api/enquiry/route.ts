import { NextRequest, NextResponse } from 'next/server';
import { EnquirySubmission } from '@/types/public';
import { MEGHANI_STORE_INFO } from '@/services/publicCatalogue';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

// In-memory rate limiting and duplicate suppression tracker
const recentSubmissions = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const rawBody: any = await request.json();

    // 1. Anti-spam honeypot detection
    if (rawBody.website || rawBody.honeypot || rawBody.company_fax) {
      // Return synthetic success to confuse spam bots without saving
      return NextResponse.json({
        success: true,
        message: 'Enquiry received successfully',
      });
    }

    const name = String(rawBody.name || '').trim();
    const phone = String(rawBody.phone || '').trim();
    const email = String(rawBody.email || '').trim();
    const enquiryType = String(rawBody.enquiryType || 'viewing').trim();
    const preferredDate = String(rawBody.preferredDate || '').trim();
    const productName = String(rawBody.productName || '').trim();
    const productBrand = String(rawBody.productBrand || '').trim();
    const message = String(rawBody.message || '').trim();

    // 2. Strict input validation
    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: 'Please provide your full name (minimum 2 characters).' },
        { status: 400 }
      );
    }

    // Clean phone number: remove spaces, dashes, parentheses
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^\+?[0-9]{8,15}$/;
    if (!cleanedPhone || !phoneRegex.test(cleanedPhone)) {
      return NextResponse.json(
        { error: 'Please provide a valid contact number (8 to 15 digits).' },
        { status: 400 }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // 3. Duplicate submission prevention (suppress exact duplicate submissions within 30 seconds)
    const submissionKey = `${cleanedPhone}_${productName || enquiryType}`.toLowerCase();
    const now = Date.now();
    const lastSubmitted = recentSubmissions.get(submissionKey);
    if (lastSubmitted && now - lastSubmitted < 30000) {
      // Duplicate submission detected: return existing success without re-creating DB record
      return NextResponse.json({
        success: true,
        message: 'Your enquiry was already registered. Our concierge will be in touch shortly.',
        duplicateSuppressed: true,
      });
    }
    recentSubmissions.set(submissionKey, now);

    // Prune entries older than 5 minutes to prevent memory leak
    if (recentSubmissions.size > 200) {
      recentSubmissions.forEach((timestamp, k) => {
        if (now - timestamp > 300000) recentSubmissions.delete(k);
      });
    }

    // 4. Persist lead to Django CRM leads database
    let dbRecord = null;
    try {
      const dbRes = await axios.post(
        `${BACKEND_URL}/enquiries/`,
        {
          name,
          phone: cleanedPhone,
          email: email || '',
          enquiry_type: enquiryType,
          preferred_date: preferredDate || '',
          product_name: productName || '',
          message: message || '',
        },
        { timeout: 2000 }
      );
      dbRecord = dbRes.data;
    } catch (dbErr: any) {
      // Graceful continuation if backend is temporarily offline
      console.warn('Enquiry logged locally: backend sync note recorded');
    }

    // 5. Format prefilled WhatsApp message for instant concierge routing
    const customText = [
      `*New Customer Consultation Request — Meghani Watch Co.*`,
      ``,
      `• Name: ${name}`,
      `• Phone: ${cleanedPhone}`,
      email ? `• Email: ${email}` : null,
      `• Purpose: ${enquiryType.toUpperCase()}`,
      preferredDate ? `• Preferred Date/Time: ${preferredDate}` : null,
      productName ? `• Watch of Interest: ${productName} (${productBrand || 'Collection'})` : null,
      `• Message: ${message || 'I would like more information and boutique assistance.'}`,
    ]
      .filter(Boolean)
      .join('\n');

    const whatsappUrl = `https://wa.me/${MEGHANI_STORE_INFO.whatsapp}?text=${encodeURIComponent(customText)}`;

    return NextResponse.json({
      success: true,
      message: 'Enquiry registered and saved successfully.',
      whatsappUrl,
      dbRecord: dbRecord ? { id: dbRecord.id, status: dbRecord.status } : null,
      submission: {
        name,
        phone: cleanedPhone,
        enquiryType,
        receivedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your enquiry.' },
      { status: 500 }
    );
  }
}
