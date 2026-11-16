'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  MessageCircle,
  Calendar,
  ShieldCheck,
  Award,
  Truck,
  RotateCcw,
  CheckCircle2,
  Clock,
  Share2,
  Check,
  X,
  Phone
} from 'lucide-react';
import { PublicProduct } from '@/types/public';
import { buildWhatsAppEnquiryUrl, MEGHANI_STORE_INFO } from '@/services/publicCatalogue';

interface ProductDetailClientProps {
  product: PublicProduct;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const images = product.galleryImages && product.galleryImages.length > 0
    ? product.galleryImages
    : [product.image || 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80'];

  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [activeTab, setActiveTab] = useState<'specs' | 'care' | 'delivery'>('specs');
  const [showViewingModal, setShowViewingModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form state for in-store viewing request
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  // CRITICAL: Price Visibility Enforcement
  const isPriceHidden =
    !product.price_visible ||
    product.availability === 'on_request' ||
    product.price === null;

  const whatsappUrl = buildWhatsAppEnquiryUrl(product);

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleViewingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) return;

    // Launch WhatsApp with prefilled viewing appointment
    const appointmentText = `Hello Meghani Watch Co.,\n\nI would like to request an in-store private viewing at your Ahmedabad boutique for:\n\n*${product.name}* (Ref: ${product.barcode || product.id})\n• Name: ${clientName}\n• Phone: ${clientPhone}\n• Preferred Date/Time: ${preferredDate || 'Earliest Available'}\n\nPlease let me know when your horological advisor can receive me.`;

    const customWhatsAppUrl = `https://wa.me/${MEGHANI_STORE_INFO.whatsapp}?text=${encodeURIComponent(appointmentText)}`;
    window.open(customWhatsAppUrl, '_blank');

    setFormSubmitted(true);
    setTimeout(() => {
      setShowViewingModal(false);
      setFormSubmitted(false);
      setClientName('');
      setClientPhone('');
      setPreferredDate('');
    }, 2000);
  };

  const getStatusBadge = () => {
    switch (product.availability) {
      case 'in_stock':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            In Stock — Available at Boutique
          </span>
        );
      case 'on_request':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#241E12] text-[#DFC17B] border border-[#C9A04F]/40">
            <Clock className="w-3.5 h-3.5" />
            Bespoke Order / Price on Request
          </span>
        );
      case 'out_of_stock':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-rose-950/70 text-rose-300 border border-rose-500/30">
            Awaiting Next Allocation
          </span>
        );
      case 'discontinued':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-zinc-900 text-zinc-400 border border-zinc-700">
            Archived Historic Piece
          </span>
        );
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Visual Display */}
          <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#0D0D0D] border border-[#2A261F] shadow-2xl">
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover object-center transition-all duration-500"
            />
            <div className="absolute top-4 left-4 z-10">
              {getStatusBadge()}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    selectedImage === img
                      ? 'border-[#C9A04F] ring-2 ring-[#C9A04F]/20'
                      : 'border-[#26221A] opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} view ${index + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover object-center"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Authenticity Guarantee Callout */}
          <div className="p-4 rounded-xl bg-[#141414] border border-[#221F18] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#8E877A]">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#C9A04F] shrink-0" />
              <span>100% Genuine Authenticated</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-[#C9A04F] shrink-0" />
              <span>{product.warranty_months} Months Official Warranty</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-[#C9A04F] shrink-0" />
              <span>Insured Transit & In-Store Pickup</span>
            </div>
          </div>
        </div>

        {/* Right Column: Information, Pricing & Enquiry CTAs */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center justify-between gap-4 mb-2">
              <Link
                href={`/shop?brand=${product.brand}`}
                className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-[#1A1813] text-[#C9A04F] border border-[#C9A04F]/30 hover:bg-[#C9A04F] hover:text-[#101010] transition-colors"
              >
                {product.brand}
              </Link>

              <button
                onClick={handleShare}
                className="p-2 rounded-lg bg-[#161616] border border-[#2A261F] text-[#8E877A] hover:text-white transition-colors flex items-center gap-1.5 text-xs"
                title="Share Timepiece"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F0E6] leading-tight">
              {product.name}
            </h1>

            {product.barcode && (
              <span className="text-[11px] text-[#787265] uppercase tracking-wider block mt-1 font-mono">
                Ref Code: {product.barcode}
              </span>
            )}
          </div>

          {/* Pricing Box — Respects price_visible strictly */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#161616] to-[#121212] border border-[#2A261F]">
            <span className="text-[11px] text-[#8E877A] uppercase tracking-wider block">
              Investment / Price
            </span>

            {isPriceHidden ? (
              <div className="mt-1">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#C9A04F] tracking-wide block">
                  Price Available on Request
                </span>
                <p className="text-xs text-[#9E9789] mt-1.5 leading-relaxed">
                  Due to brand discretion and exclusive allocation, pricing for this timepiece is provided directly via our concierge.
                </p>
              </div>
            ) : (
              <div className="mt-1">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F0E6] tracking-tight block">
                  ₹{product.price!.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-[#7A7469] block mt-1">
                  Inclusive of all applicable taxes & official manufacturer warranty
                </span>
              </div>
            )}

            {/* Main Action CTAs */}
            <div className="mt-6 flex flex-col gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#C9A04F] to-[#DFC17B] text-[#101010] font-bold text-xs uppercase tracking-widest shadow-xl shadow-[#C9A04F]/20 hover:from-[#DFC17B] hover:to-[#C9A04F] transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>
                  {isPriceHidden ? 'Enquire Price on WhatsApp' : 'Enquire on WhatsApp'}
                </span>
              </a>

              <button
                onClick={() => setShowViewingModal(true)}
                className="w-full py-3.5 rounded-xl bg-[#1C1C1C] text-[#F5F0E6] border border-[#332E24] hover:border-[#C9A04F] hover:text-[#C9A04F] font-semibold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4 text-[#C9A04F]" />
                <span>Book In-Store Viewing</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#F5F0E6] uppercase tracking-wider">
              Horological Overview
            </h3>
            <p className="text-xs sm:text-sm text-[#B0A99C] leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Tabbed Specs & Care */}
          <div className="pt-4 border-t border-[#221F18]">
            <div className="flex items-center gap-4 border-b border-[#221F18] pb-2 text-xs">
              <button
                onClick={() => setActiveTab('specs')}
                className={`pb-2 font-semibold uppercase tracking-wider transition-colors relative ${
                  activeTab === 'specs'
                    ? 'text-[#C9A04F]'
                    : 'text-[#8E877A] hover:text-white'
                }`}
              >
                Specifications
                {activeTab === 'specs' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A04F]" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('care')}
                className={`pb-2 font-semibold uppercase tracking-wider transition-colors relative ${
                  activeTab === 'care'
                    ? 'text-[#C9A04F]'
                    : 'text-[#8E877A] hover:text-white'
                }`}
              >
                Maintenance & Service
                {activeTab === 'care' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A04F]" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('delivery')}
                className={`pb-2 font-semibold uppercase tracking-wider transition-colors relative ${
                  activeTab === 'delivery'
                    ? 'text-[#C9A04F]'
                    : 'text-[#8E877A] hover:text-white'
                }`}
              >
                Delivery & Assurance
                {activeTab === 'delivery' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A04F]" />
                )}
              </button>
            </div>

            <div className="pt-4 text-xs">
              {activeTab === 'specs' && (
                <div className="divide-y divide-[#1F1D17]">
                  {product.specifications ? (
                    <>
                      {product.specifications.movement && (
                        <div className="py-2.5 flex justify-between">
                          <span className="text-[#8E877A]">Movement Calibre</span>
                          <span className="text-[#F5F0E6] font-medium text-right">{product.specifications.movement}</span>
                        </div>
                      )}
                      {product.specifications.caseDiameter && (
                        <div className="py-2.5 flex justify-between">
                          <span className="text-[#8E877A]">Case Diameter</span>
                          <span className="text-[#F5F0E6] font-medium text-right">{product.specifications.caseDiameter}</span>
                        </div>
                      )}
                      {product.specifications.caseMaterial && (
                        <div className="py-2.5 flex justify-between">
                          <span className="text-[#8E877A]">Case Material</span>
                          <span className="text-[#F5F0E6] font-medium text-right">{product.specifications.caseMaterial}</span>
                        </div>
                      )}
                      {product.specifications.dialColor && (
                        <div className="py-2.5 flex justify-between">
                          <span className="text-[#8E877A]">Dial Aesthetics</span>
                          <span className="text-[#F5F0E6] font-medium text-right">{product.specifications.dialColor}</span>
                        </div>
                      )}
                      {product.specifications.glass && (
                        <div className="py-2.5 flex justify-between">
                          <span className="text-[#8E877A]">Crystal Glass</span>
                          <span className="text-[#F5F0E6] font-medium text-right">{product.specifications.glass}</span>
                        </div>
                      )}
                      {product.specifications.waterResistance && (
                        <div className="py-2.5 flex justify-between">
                          <span className="text-[#8E877A]">Water Resistance</span>
                          <span className="text-[#F5F0E6] font-medium text-right">{product.specifications.waterResistance}</span>
                        </div>
                      )}
                      {product.specifications.strapMaterial && (
                        <div className="py-2.5 flex justify-between">
                          <span className="text-[#8E877A]">Band / Strap</span>
                          <span className="text-[#F5F0E6] font-medium text-right">{product.specifications.strapMaterial}</span>
                        </div>
                      )}
                      {product.specifications.claspType && (
                        <div className="py-2.5 flex justify-between">
                          <span className="text-[#8E877A]">Clasp Type</span>
                          <span className="text-[#F5F0E6] font-medium text-right">{product.specifications.claspType}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-2.5 flex justify-between">
                      <span className="text-[#8E877A]">Warranty Coverage</span>
                      <span className="text-[#F5F0E6] font-medium">{product.warranty_months} Months Official</span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'care' && (
                <div className="space-y-3 text-[#A8A194] leading-relaxed">
                  <p>
                    Every timepiece acquired through Meghani Watch Co. includes complimentary lifetime strap sizing and annual demagnetization testing in our Ahmedabad atelier.
                  </p>
                  <p>
                    For automatic models, we recommend a movement service every 3 to 5 years. For quartz models, battery replacements include complete gasket re-sealing and 5-bar pressure testing.
                  </p>
                </div>
              )}

              {activeTab === 'delivery' && (
                <div className="space-y-3 text-[#A8A194] leading-relaxed">
                  <p>
                    <strong>Boutique Collection:</strong> Reserve online and experience private fitting at our Vadodara salon.
                  </p>
                  <p>
                    <strong>Insured Shipping:</strong> Dispatched via temperature-controlled, insured couriers with tamper-evident security seals across India within 2-4 business days.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Book Private In-Store Viewing Modal */}
      {showViewingModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#141414] rounded-2xl border border-[#2A261F] p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowViewingModal(false)}
              className="absolute top-5 right-5 text-[#8E877A] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <span className="text-[10px] text-[#C9A04F] font-bold uppercase tracking-widest block mb-1">
                Ahmedabad Boutique
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#F5F0E6]">
                Schedule In-Store Viewing
              </h3>
              <p className="text-xs text-[#8E877A] mt-1">
                Reserve a private viewing for: <br />
                <strong className="text-[#DFC17B]">{product.name}</strong>
              </p>
            </div>

            {formSubmitted ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-[#F5F0E6]">Viewing Request Prepared</h4>
                <p className="text-xs text-[#8E877A]">Opening WhatsApp concierge to confirm your appointment...</p>
              </div>
            ) : (
              <form onSubmit={handleViewingSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#D0C8B8] font-semibold mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Rajesh Meghani"
                    className="w-full bg-[#1C1C1C] border border-[#2E2A22] rounded-xl px-4 py-2.5 text-[#F5F0E6] focus:border-[#C9A04F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#D0C8B8] font-semibold mb-1">
                    Mobile / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+91 91066 XXXXX"
                    className="w-full bg-[#1C1C1C] border border-[#2E2A22] rounded-xl px-4 py-2.5 text-[#F5F0E6] focus:border-[#C9A04F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#D0C8B8] font-semibold mb-1">
                    Preferred Date & Time
                  </label>
                  <input
                    type="text"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    placeholder="e.g. Tomorrow at 4:00 PM"
                    className="w-full bg-[#1C1C1C] border border-[#2E2A22] rounded-xl px-4 py-2.5 text-[#F5F0E6] focus:border-[#C9A04F] focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C9A04F] to-[#DFC17B] text-[#101010] font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Confirm via WhatsApp Concierge</span>
                  </button>
                </div>

                <p className="text-[10px] text-[#7A7469] text-center">
                  Boutique hours: {MEGHANI_STORE_INFO.hours.weekdays}
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

