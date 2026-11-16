'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const luxuryEase = [0.16, 1, 0.3, 1] as const;

export default function ContactClient() {
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
      <div className="py-8 border-b border-[#2A261F] max-w-3xl">
        <span className="text-xs text-[#C9A45C] font-semibold uppercase tracking-[0.25em] block mb-2">
          Concierge & Boutique Information
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#F3EFE6] leading-tight">
          Connect with Meghani Watch Co.
        </h1>
        <p className="text-xs sm:text-sm text-[#8D8980] mt-3 leading-relaxed">
          We welcome you to visit our boutique salon on New Sama Road, Vadodara or connect with our horological concierge for personal recommendations, private viewings, or service inquiries.
        </p>
      </div>

      <div className="py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Contact Cards & Hours */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: luxuryEase }}
          className="lg:col-span-5 space-y-6"
        >
          {/* Boutique Salon Location */}
          <div className="p-6 rounded-2xl bg-[#171613] border border-[#2A261F] space-y-3">
            <div className="flex items-center gap-3 text-[#C9A45C]">
              <MapPin className="w-5 h-5 shrink-0" />
              <h3 className="font-serif text-base font-medium text-[#F3EFE6] uppercase tracking-wider">
                Boutique Address
              </h3>
            </div>
            <p className="text-xs text-[#8D8980] leading-relaxed pl-8">
              {MEGHANI_STORE_INFO.address.line1}<br />
              {MEGHANI_STORE_INFO.address.line2}<br />
              {MEGHANI_STORE_INFO.address.city}, {MEGHANI_STORE_INFO.address.state} – {MEGHANI_STORE_INFO.address.pincode}<br />
              <span className="text-[#8D8980]/80 mt-1 block">Landmark: {MEGHANI_STORE_INFO.address.landmark}</span>
            </p>

            <div className="pl-8 pt-2">
              <a
                href={MEGHANI_STORE_INFO.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#C9A45C] hover:text-[#E8D5A7] font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Get Driving Directions on Google Maps</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="p-6 rounded-2xl bg-[#171613] border border-[#2A261F] space-y-3">
            <div className="flex items-center gap-3 text-[#C9A45C]">
              <Clock className="w-5 h-5 shrink-0" />
              <h3 className="font-serif text-base font-medium text-[#F3EFE6] uppercase tracking-wider">
                Salon Timings
              </h3>
            </div>
            <div className="text-xs text-[#8D8980] space-y-1.5 pl-8">
              <p>
                <strong className="text-[#F3EFE6]">Monday through Saturday:</strong> {MEGHANI_STORE_INFO.hours.weekdays}
              </p>
              <p>
                <strong className="text-[#F3EFE6]">Sunday:</strong> {MEGHANI_STORE_INFO.hours.sunday}
              </p>
            </div>
          </div>

          {/* Telephonic & WhatsApp Contact */}
          <div className="p-6 rounded-2xl bg-[#171613] border border-[#2A261F] space-y-3">
            <div className="flex items-center gap-3 text-[#C9A45C]">
              <Phone className="w-5 h-5 shrink-0" />
              <h3 className="font-serif text-base font-medium text-[#F3EFE6] uppercase tracking-wider">
                Direct Telephony & WhatsApp
              </h3>
            </div>
            <div className="text-xs text-[#8D8980] space-y-2 pl-8">
              <p>
                Telephone: <a href={`tel:${MEGHANI_STORE_INFO.phone}`} className="text-[#F3EFE6] hover:text-[#C9A45C] font-semibold transition-colors">{MEGHANI_STORE_INFO.phone}</a>
              </p>
              <p>
                Email: <a href={`mailto:${MEGHANI_STORE_INFO.email}`} className="text-[#F3EFE6] hover:text-[#C9A45C] font-semibold transition-colors">{MEGHANI_STORE_INFO.email}</a>
              </p>
            </div>

            <div className="pl-8 pt-2">
              <a
                href={`https://wa.me/${MEGHANI_STORE_INFO.whatsapp}?text=${encodeURIComponent(
                  'Hello Meghani Watch Co., I am inquiring from your contact page.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#0B0B0A] border border-[#C9A45C]/40 text-[#E8D5A7] hover:bg-[#C9A45C] hover:text-[#0B0B0A] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Instant WhatsApp Concierge</span>
              </a>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Interactive Consultation & Viewing Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: luxuryEase }}
          className="lg:col-span-7"
        >
          <div className="p-8 sm:p-10 rounded-2xl bg-[#171613] border border-[#2A261F] shadow-2xl">
            <span className="text-xs text-[#C9A45C] font-semibold uppercase tracking-[0.25em] block mb-2">
              Personalized Consultation
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#F3EFE6]">
              Schedule Viewing or Inquire
            </h2>
            <p className="text-xs sm:text-sm text-[#8D8980] mt-2 mb-8 leading-relaxed">
              Fill in your details below. Our horological concierge will prepare your request and connect with you on WhatsApp or phone immediately.
            </p>

            {submitted ? (
              <div className="py-12 text-center space-y-4 bg-[#0B0B0A] rounded-xl border border-emerald-500/30 p-6">
                <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
                <h3 className="font-serif text-xl font-normal text-[#F3EFE6]">
                  Consultation Request Dispatched
                </h3>
                <p className="text-xs sm:text-sm text-[#8D8980] max-w-md mx-auto leading-relaxed">
                  Thank you, <strong className="text-[#F3EFE6]">{name}</strong>. Your consultation details have been transmitted to our Vadodara boutique concierge. WhatsApp has opened to assist you immediately.
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
                    className="px-6 py-2.5 rounded-xl bg-[#171613] border border-[#2A261F] text-xs font-semibold text-[#8D8980] hover:text-[#F3EFE6] transition-colors"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                {/* Purpose Selector */}
                <div>
                  <label className="block text-[#F3EFE6] font-semibold uppercase tracking-wider mb-2">
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
                            ? 'bg-[#C9A45C] text-[#0B0B0A] font-bold shadow-md'
                            : 'bg-[#0B0B0A] border border-[#2A261F] text-[#8D8980] hover:text-[#F3EFE6]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#F3EFE6] font-medium mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Vikram Patel"
                      className="w-full bg-[#0B0B0A] border border-[#2A261F] focus:border-[#C9A45C] rounded-xl px-4 py-3 text-[#F3EFE6] focus:outline-none transition-colors placeholder-[#8D8980]/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[#F3EFE6] font-medium mb-1.5">
                      Phone / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 91066 XXXXX"
                      className="w-full bg-[#0B0B0A] border border-[#2A261F] focus:border-[#C9A45C] rounded-xl px-4 py-3 text-[#F3EFE6] focus:outline-none transition-colors placeholder-[#8D8980]/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#F3EFE6] font-medium mb-1.5">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vikram@example.com"
                      className="w-full bg-[#0B0B0A] border border-[#2A261F] focus:border-[#C9A45C] rounded-xl px-4 py-3 text-[#F3EFE6] focus:outline-none transition-colors placeholder-[#8D8980]/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[#F3EFE6] font-medium mb-1.5">
                      Preferred Date / Time (Optional)
                    </label>
                    <input
                      type="text"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      placeholder="e.g. Saturday afternoon"
                      className="w-full bg-[#0B0B0A] border border-[#2A261F] focus:border-[#C9A45C] rounded-xl px-4 py-3 text-[#F3EFE6] focus:outline-none transition-colors placeholder-[#8D8980]/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#F3EFE6] font-medium mb-1.5">
                    Your Message / Specific Timepiece of Interest
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe any particular model, budget, wedding date, or servicing questions..."
                    className="w-full bg-[#0B0B0A] border border-[#2A261F] focus:border-[#C9A45C] rounded-xl px-4 py-3 text-[#F3EFE6] focus:outline-none transition-colors resize-none placeholder-[#8D8980]/50"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-xl bg-[#C9A45C] hover:bg-[#E8D5A7] text-[#0B0B0A] font-bold text-xs uppercase tracking-[0.18em] transition-colors flex items-center justify-center gap-2 shadow-xl shadow-[#C9A45C]/10 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Preparing Request...' : 'Send Request & Open WhatsApp'}</span>
                </motion.button>
              </form>
            )}
          </div>
        </motion.div>
      </div>

      {/* Embedded Google Maps Section */}
      <div className="py-8">
        <div className="text-center mb-6">
          <span className="text-xs text-[#C9A45C] font-semibold uppercase tracking-[0.25em] block mb-1">
            Boutique Map Location
          </span>
          <h3 className="font-serif text-2xl font-normal text-[#F3EFE6]">
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

