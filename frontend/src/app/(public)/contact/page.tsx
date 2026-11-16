'use client';

import { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Calendar,
  Send,
  CheckCircle2,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { MEGHANI_STORE_INFO } from '@/services/publicCatalogue';
import Breadcrumbs from '@/components/public/Breadcrumbs';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [enquiryType, setEnquiryType] = useState<'viewing' | 'product' | 'service' | 'general'>('viewing');
  const [preferredDate, setPreferredDate] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setSubmitting(true);

    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          enquiryType,
          preferredDate: preferredDate.trim() || undefined,
          message: message.trim() || 'I would like to inquire with your concierge.',
        }),
      });

      const data = await res.json();
      if (data.whatsappUrl) {
        // Open WhatsApp in new window with the prefilled request
        window.open(data.whatsappUrl, '_blank');
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Enquiry error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <Breadcrumbs items={[{ label: 'Boutique Visit & Contact' }]} />

      {/* Header */}
      <div className="py-8 border-b border-[#221F18] max-w-3xl">
        <span className="text-xs text-[#C9A04F] font-semibold uppercase tracking-[0.2em] block mb-2">
          Concierge & Boutique Information
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#F5F0E6] leading-tight">
          Connect with Meghani Watch Co.
        </h1>
        <p className="text-xs sm:text-sm text-[#9E9789] mt-3 leading-relaxed">
          We welcome you to visit our boutique salon on New Sama Road, Vadodara or connect with our horological concierge for personal recommendations, private viewings, or service inquiries.
        </p>
      </div>

      <div className="py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Contact Cards & Hours */}
        <div className="lg:col-span-5 space-y-6">
          {/* Boutique Salon Location */}
          <div className="p-6 rounded-2xl bg-[#141414] border border-[#26221A] space-y-3">
            <div className="flex items-center gap-3 text-[#C9A04F]">
              <MapPin className="w-5 h-5 shrink-0" />
              <h3 className="font-serif text-base font-bold text-[#F5F0E6] uppercase tracking-wider">
                Boutique Address
              </h3>
            </div>
            <p className="text-xs text-[#B0A99C] leading-relaxed pl-8">
              {MEGHANI_STORE_INFO.address.line1}<br />
              {MEGHANI_STORE_INFO.address.line2}<br />
              {MEGHANI_STORE_INFO.address.city}, {MEGHANI_STORE_INFO.address.state} – {MEGHANI_STORE_INFO.address.pincode}<br />
              <span className="text-[#7A7469] mt-1 block">Landmark: {MEGHANI_STORE_INFO.address.landmark}</span>
            </p>

            <div className="pl-8 pt-2">
              <a
                href={MEGHANI_STORE_INFO.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#C9A04F] hover:text-[#DFC17B] font-semibold flex items-center gap-1.5"
              >
                <span>Get Driving Directions on Google Maps</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="p-6 rounded-2xl bg-[#141414] border border-[#26221A] space-y-3">
            <div className="flex items-center gap-3 text-[#C9A04F]">
              <Clock className="w-5 h-5 shrink-0" />
              <h3 className="font-serif text-base font-bold text-[#F5F0E6] uppercase tracking-wider">
                Salon Timings
              </h3>
            </div>
            <div className="text-xs text-[#B0A99C] space-y-1.5 pl-8">
              <p>
                <strong className="text-[#F5F0E6]">Monday through Saturday:</strong> {MEGHANI_STORE_INFO.hours.weekdays}
              </p>
              <p>
                <strong className="text-[#F5F0E6]">Sunday:</strong> {MEGHANI_STORE_INFO.hours.sunday}
              </p>
            </div>
          </div>

          {/* Telephonic & WhatsApp Contact */}
          <div className="p-6 rounded-2xl bg-[#141414] border border-[#26221A] space-y-3">
            <div className="flex items-center gap-3 text-[#C9A04F]">
              <Phone className="w-5 h-5 shrink-0" />
              <h3 className="font-serif text-base font-bold text-[#F5F0E6] uppercase tracking-wider">
                Direct Telephony & WhatsApp
              </h3>
            </div>
            <div className="text-xs text-[#B0A99C] space-y-2 pl-8">
              <p>
                Telephone: <a href={`tel:${MEGHANI_STORE_INFO.phone}`} className="text-[#F5F0E6] hover:text-[#C9A04F] font-semibold">{MEGHANI_STORE_INFO.phone}</a>
              </p>
              <p>
                Email: <a href={`mailto:${MEGHANI_STORE_INFO.email}`} className="text-[#F5F0E6] hover:text-[#C9A04F] font-semibold">{MEGHANI_STORE_INFO.email}</a>
              </p>
            </div>

            <div className="pl-8 pt-2">
              <a
                href={`https://wa.me/${MEGHANI_STORE_INFO.whatsapp}?text=${encodeURIComponent(
                  'Hello Meghani Watch Co., I am inquiring from your contact page.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#1C1A14] border border-[#C9A04F]/40 text-[#DFC17B] hover:bg-[#C9A04F] hover:text-[#101010] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Instant WhatsApp Concierge</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Consultation & Viewing Form */}
        <div className="lg:col-span-7">
          <div className="p-8 sm:p-10 rounded-2xl bg-[#141414] border border-[#2A261F] shadow-2xl">
            <span className="text-xs text-[#C9A04F] font-semibold uppercase tracking-[0.2em] block mb-2">
              Personalized Consultation
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F0E6]">
              Schedule Viewing or Inquire
            </h2>
            <p className="text-xs sm:text-sm text-[#8E877A] mt-2 mb-8 leading-relaxed">
              Fill in your details below. Our horological concierge will prepare your request and connect with you on WhatsApp or phone immediately.
            </p>

            {submitted ? (
              <div className="py-12 text-center space-y-4 bg-[#181818] rounded-xl border border-emerald-500/30 p-6">
                <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
                <h3 className="font-serif text-xl font-bold text-[#F5F0E6]">
                  Consultation Request Dispatched
                </h3>
                <p className="text-xs sm:text-sm text-[#A8A194] max-w-md mx-auto leading-relaxed">
                  Thank you, <strong className="text-[#F5F0E6]">{name}</strong>. Your consultation details have been transmitted to our Ahmedabad boutique concierge. WhatsApp has opened to assist you immediately.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setName('');
                      setPhone('');
                      setEmail('');
                      setPreferredDate('');
                      setMessage('');
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#221F18] text-xs font-semibold text-[#D0C8B8] hover:text-white"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                {/* Purpose Selector */}
                <div>
                  <label className="block text-[#D0C8B8] font-semibold uppercase tracking-wider mb-2">
                    Nature of Consultation *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'viewing', label: 'Private Viewing' },
                      { id: 'product', label: 'Watch Enquiry' },
                      { id: 'service', label: 'Service / Repair' },
                      { id: 'general', label: 'General Concierge' },
                    ].map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setEnquiryType(t.id as any)}
                        className={`py-2 px-3 rounded-lg font-medium text-center transition-all ${
                          enquiryType === t.id
                            ? 'bg-[#C9A04F] text-[#101010] font-bold shadow-md'
                            : 'bg-[#1C1C1C] border border-[#2E2A22] text-[#8E877A] hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#D0C8B8] font-semibold mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Vikram Patel"
                      className="w-full bg-[#1C1C1C] border border-[#2E2A22] focus:border-[#C9A04F] rounded-xl px-4 py-3 text-[#F5F0E6] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[#D0C8B8] font-semibold mb-1.5">
                      Phone / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 91066 XXXXX"
                      className="w-full bg-[#1C1C1C] border border-[#2E2A22] focus:border-[#C9A04F] rounded-xl px-4 py-3 text-[#F5F0E6] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#D0C8B8] font-semibold mb-1.5">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vikram@example.com"
                      className="w-full bg-[#1C1C1C] border border-[#2E2A22] focus:border-[#C9A04F] rounded-xl px-4 py-3 text-[#F5F0E6] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[#D0C8B8] font-semibold mb-1.5">
                      Preferred Date / Time (Optional)
                    </label>
                    <input
                      type="text"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      placeholder="e.g. Saturday afternoon"
                      className="w-full bg-[#1C1C1C] border border-[#2E2A22] focus:border-[#C9A04F] rounded-xl px-4 py-3 text-[#F5F0E6] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#D0C8B8] font-semibold mb-1.5">
                    Your Message / Specific Timepiece of Interest
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe any particular model, budget, wedding date, or servicing questions..."
                    className="w-full bg-[#1C1C1C] border border-[#2E2A22] focus:border-[#C9A04F] rounded-xl px-4 py-3 text-[#F5F0E6] focus:outline-none transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#C9A04F] to-[#DFC17B] text-[#101010] font-bold text-xs uppercase tracking-widest hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-xl shadow-[#C9A04F]/20 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Preparing Request...' : 'Send Request & Open WhatsApp'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Google Maps Section */}
      <div className="py-8">
        <div className="text-center mb-6">
          <span className="text-xs text-[#C9A04F] font-semibold uppercase tracking-[0.2em] block mb-1">
            Boutique Map Location
          </span>
          <h3 className="font-serif text-2xl font-bold text-[#F5F0E6]">
            Vadodara Boutique Salon
          </h3>
        </div>

        <div className="aspect-[16/9] sm:aspect-[21/9] w-full rounded-2xl overflow-hidden border border-[#2A261F] shadow-2xl">
          <iframe
            src={MEGHANI_STORE_INFO.googleMapsEmbedSrc}
            width="100%"
            height="100%"
            style={{ border: 0, filter: 'grayscale(0.6) invert(0.9) contrast(1.2)' }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Meghani Watch Co. Store Location"
          />
        </div>
      </div>
    </div>
  );
}

