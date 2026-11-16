'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  Phone,
  ZoomIn
} from 'lucide-react';
import { PublicProduct } from '@/types/public';
import { buildWhatsAppEnquiryUrl, MEGHANI_STORE_INFO } from '@/services/publicCatalogue';

interface ProductDetailClientProps {
  product: PublicProduct;
}

const luxuryEase = [0.16, 1, 0.3, 1] as const;

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const images = product.galleryImages && product.galleryImages.length > 0
    ? product.galleryImages
    : [product.image || 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80'];

  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [activeTab, setActiveTab] = useState<'specs' | 'care' | 'delivery'>('specs');
  const [showViewingModal, setShowViewingModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Loupe Zoom interaction state
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x, y });
  };

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
    const appointmentText = `Hello Meghani Watch Co.,\n\nI would like to request an in-store private viewing at your Vadodara boutique for:\n\n*${product.name}* (Ref: ${product.barcode || product.id})\n• Name: ${clientName}\n• Phone: ${clientPhone}\n• Preferred Date/Time: ${preferredDate || 'Earliest Available'}\n\nPlease let me know when your horological advisor can receive me.`;

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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#171613] text-[#E8D5A7] border border-[#C9A45C]/40">
            <Clock className="w-3.5 h-3.5 text-[#C9A45C]" />
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
        {/* Left Column: Image Gallery with Crossfade & Loupe Zoom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: luxuryEase }}
          className="lg:col-span-7 space-y-4"
        >
          {/* Main Visual Display */}
          <div
            ref={imageContainerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#0B0B0A] border border-[#2A261F] shadow-2xl cursor-crosshair group select-none"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{
                  opacity: 1,
                  scale: isZoomed ? 1.45 : 1,
                  transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`
                }}
                exit={{ opacity: 0 }}
                transition={{
                  opacity: { duration: 0.35, ease: luxuryEase },
                  scale: { duration: 0.2, ease: 'easeOut' }
                }}
                className="w-full h-full relative will-change-transform"
              >
                <Image
                  src={selectedImage}
                  alt={`${product.brand} ${product.name} - Official Timepiece | Meghani Watch Co.`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover object-center"
                />
              </motion.div>
            </AnimatePresence>

            {/* Status Badge */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
              {getStatusBadge()}
            </div>

            {/* Loupe Hint Indicator */}
            <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
              <div className="px-2.5 py-1 rounded-full bg-[#0B0B0A]/80 backdrop-blur-md border border-[#2A261F] text-[10px] text-[#8D8980] flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-3 h-3 text-[#C9A45C]" />
                <span>{isZoomed ? 'Loupe 1.45x Active' : 'Hover to Inspect Dial'}</span>
              </div>
            </div>
          </div>

          {/* Thumbnail Strip with Animated Selection Ring */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, index) => {
                const isSelected = selectedImage === img;
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(img)}
                    className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-[#2A261F] transition-all"
                  >
                    <Image
                      src={img}
                      alt={`${product.brand} ${product.name} - Detailed View ${index + 1}`}
                      fill
                      sizes="80px"
                      className={`object-cover object-center transition-opacity duration-300 ${
                        isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-90'
                      }`}
                    />
                    {isSelected && (
                      <motion.div
                        layoutId="activeProductThumb"
                        className="absolute inset-0 rounded-xl border-2 border-[#C9A45C] ring-2 ring-[#C9A45C]/25"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Authenticity Guarantee Callout */}
          <div className="p-4 rounded-xl bg-[#171613] border border-[#2A261F] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#8D8980]">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#C9A45C] shrink-0" />
              <span className="text-[#F3EFE6]/90">100% Genuine Authenticated</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-[#C9A45C] shrink-0" />
              <span className="text-[#F3EFE6]/90">{product.warranty_months} Months Official Warranty</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-[#C9A45C] shrink-0" />
              <span className="text-[#F3EFE6]/90">Insured Transit & Boutique Pickup</span>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Information, Pricing & Enquiry CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: luxuryEase }}
          className="lg:col-span-5 space-y-6"
        >
          <div>
            <div className="flex items-center justify-between gap-4 mb-2">
              <Link
                href={`/shop?brand=${product.brand}`}
                className="px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-[0.15em] bg-[#171613] text-[#C9A45C] border border-[#C9A45C]/30 hover:bg-[#C9A45C] hover:text-[#0B0B0A] transition-colors"
              >
                {product.brand}
              </Link>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                className="p-2 rounded-lg bg-[#171613] border border-[#2A261F] text-[#8D8980] hover:text-[#F3EFE6] transition-colors flex items-center gap-1.5 text-xs"
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
              </motion.button>
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl font-normal text-[#F3EFE6] leading-tight">
              {product.name}
            </h1>

            {product.barcode && (
              <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block mt-1.5 font-mono">
                Ref: {product.barcode}
              </span>
            )}
          </div>

          {/* Pricing Box — Respects price_visible strictly */}
          <div className="p-6 rounded-2xl bg-[#171613] border border-[#2A261F]">
            <span className="text-[11px] text-[#8D8980] uppercase tracking-widest block font-medium">
              Investment / Acquisition
            </span>

            {isPriceHidden ? (
              <div className="mt-1">
                <span className="font-serif text-2xl sm:text-3xl font-medium text-[#C9A45C] tracking-wide block">
                  Price Available on Request
                </span>
                <p className="text-xs text-[#8D8980] mt-1.5 leading-relaxed">
                  Due to brand discretion and exclusive allocation, pricing for this timepiece is provided directly via our concierge.
                </p>
              </div>
            ) : (
              <div className="mt-1">
                <span className="font-serif text-3xl sm:text-4xl font-normal text-[#F3EFE6] tracking-tight block">
                  ₹{product.price!.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-[#8D8980] block mt-1">
                  Inclusive of all taxes & official manufacturer warranty
                </span>
              </div>
            )}

            {/* Main Action CTAs with Hover / Tap Motion */}
            <div className="mt-6 flex flex-col gap-3">
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-xl bg-[#C9A45C] hover:bg-[#E8D5A7] text-[#0B0B0A] font-bold text-xs uppercase tracking-[0.18em] shadow-lg shadow-[#C9A45C]/10 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>
                  {isPriceHidden ? 'Enquire Price on WhatsApp' : 'Enquire on WhatsApp'}
                </span>
              </motion.a>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowViewingModal(true)}
                className="w-full py-3.5 rounded-xl bg-[#0B0B0A] text-[#F3EFE6] border border-[#2A261F] hover:border-[#C9A45C] hover:text-[#C9A45C] font-semibold text-xs uppercase tracking-[0.18em] transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4 text-[#C9A45C]" />
                <span>Book In-Store Viewing</span>
              </motion.button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#F3EFE6] uppercase tracking-[0.15em]">
              Horological Overview
            </h3>
            <p className="text-xs sm:text-sm text-[#8D8980] leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Tabbed Specs & Care with Gliding Tab Indicator */}
          <div className="pt-4 border-t border-[#2A261F]">
            <div className="flex items-center gap-6 border-b border-[#2A261F] pb-2 text-xs relative">
              <button
                onClick={() => setActiveTab('specs')}
                className={`pb-2 font-semibold uppercase tracking-wider transition-colors relative ${
                  activeTab === 'specs'
                    ? 'text-[#C9A45C]'
                    : 'text-[#8D8980] hover:text-[#F3EFE6]'
                }`}
              >
                Specifications
                {activeTab === 'specs' && (
                  <motion.span
                    layoutId="productDetailActiveTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A45C]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>

              <button
                onClick={() => setActiveTab('care')}
                className={`pb-2 font-semibold uppercase tracking-wider transition-colors relative ${
                  activeTab === 'care'
                    ? 'text-[#C9A45C]'
                    : 'text-[#8D8980] hover:text-[#F3EFE6]'
                }`}
              >
                Maintenance & Service
                {activeTab === 'care' && (
                  <motion.span
                    layoutId="productDetailActiveTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A45C]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>

              <button
                onClick={() => setActiveTab('delivery')}
                className={`pb-2 font-semibold uppercase tracking-wider transition-colors relative ${
                  activeTab === 'delivery'
                    ? 'text-[#C9A45C]'
                    : 'text-[#8D8980] hover:text-[#F3EFE6]'
                }`}
              >
                Delivery & Assurance
                {activeTab === 'delivery' && (
                  <motion.span
                    layoutId="productDetailActiveTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A45C]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: luxuryEase }}
                className="pt-4 text-xs"
              >
                {activeTab === 'specs' && (
                  <div className="divide-y divide-[#2A261F]/60">
                    {product.specifications ? (
                      <>
                        {product.specifications.movement && (
                          <div className="py-2.5 flex justify-between">
                            <span className="text-[#8D8980]">Movement Calibre</span>
                            <span className="text-[#F3EFE6] font-medium text-right">{product.specifications.movement}</span>
                          </div>
                        )}
                        {product.specifications.caseDiameter && (
                          <div className="py-2.5 flex justify-between">
                            <span className="text-[#8D8980]">Case Diameter</span>
                            <span className="text-[#F3EFE6] font-medium text-right">{product.specifications.caseDiameter}</span>
                          </div>
                        )}
                        {product.specifications.caseMaterial && (
                          <div className="py-2.5 flex justify-between">
                            <span className="text-[#8D8980]">Case Material</span>
                            <span className="text-[#F3EFE6] font-medium text-right">{product.specifications.caseMaterial}</span>
                          </div>
                        )}
                        {product.specifications.dialColor && (
                          <div className="py-2.5 flex justify-between">
                            <span className="text-[#8D8980]">Dial Aesthetics</span>
                            <span className="text-[#F3EFE6] font-medium text-right">{product.specifications.dialColor}</span>
                          </div>
                        )}
                        {product.specifications.glass && (
                          <div className="py-2.5 flex justify-between">
                            <span className="text-[#8D8980]">Crystal Glass</span>
                            <span className="text-[#F3EFE6] font-medium text-right">{product.specifications.glass}</span>
                          </div>
                        )}
                        {product.specifications.waterResistance && (
                          <div className="py-2.5 flex justify-between">
                            <span className="text-[#8D8980]">Water Resistance</span>
                            <span className="text-[#F3EFE6] font-medium text-right">{product.specifications.waterResistance}</span>
                          </div>
                        )}
                        {product.specifications.strapMaterial && (
                          <div className="py-2.5 flex justify-between">
                            <span className="text-[#8D8980]">Band / Strap</span>
                            <span className="text-[#F3EFE6] font-medium text-right">{product.specifications.strapMaterial}</span>
                          </div>
                        )}
                        {product.specifications.claspType && (
                          <div className="py-2.5 flex justify-between">
                            <span className="text-[#8D8980]">Clasp Type</span>
                            <span className="text-[#F3EFE6] font-medium text-right">{product.specifications.claspType}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="py-2.5 flex justify-between">
                        <span className="text-[#8D8980]">Warranty Coverage</span>
                        <span className="text-[#F3EFE6] font-medium">{product.warranty_months} Months Official</span>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'care' && (
                  <div className="space-y-3 text-[#8D8980] leading-relaxed">
                    <p>
                      Every timepiece acquired through Meghani Watch Co. includes complimentary lifetime strap sizing and annual demagnetization testing in our Vadodara atelier.
                    </p>
                    <p>
                      For automatic models, we recommend a movement service every 3 to 5 years. For quartz models, battery replacements include complete gasket re-sealing and 5-bar pressure testing.
                    </p>
                  </div>
                )}

                {activeTab === 'delivery' && (
                  <div className="space-y-3 text-[#8D8980] leading-relaxed">
                    <p>
                      <strong className="text-[#F3EFE6]">Boutique Collection:</strong> Reserve online and experience private fitting at our Vadodara salon.
                    </p>
                    <p>
                      <strong className="text-[#F3EFE6]">Insured Shipping:</strong> Dispatched via temperature-controlled, insured couriers with tamper-evident security seals across India within 2-4 business days.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Book Private In-Store Viewing Modal with Framer Motion AnimatePresence */}
      <AnimatePresence>
        {showViewingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.35, ease: luxuryEase }}
              className="w-full max-w-md bg-[#171613] rounded-2xl border border-[#2A261F] p-6 sm:p-8 shadow-2xl relative"
            >
              <button
                onClick={() => setShowViewingModal(false)}
                className="absolute top-5 right-5 text-[#8D8980] hover:text-[#F3EFE6] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <span className="text-[10px] text-[#C9A45C] font-bold uppercase tracking-[0.25em] block mb-1">
                  Vadodara Boutique
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#F3EFE6]">
                  Schedule In-Store Viewing
                </h3>
                <p className="text-xs text-[#8D8980] mt-1">
                  Reserve a private viewing for: <br />
                  <strong className="text-[#E8D5A7] font-medium">{product.name}</strong>
                </p>
              </div>

              {formSubmitted ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-semibold text-[#F3EFE6]">Viewing Request Prepared</h4>
                  <p className="text-xs text-[#8D8980]">Opening WhatsApp concierge to confirm your appointment...</p>
                </div>
              ) : (
                <form onSubmit={handleViewingSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[#F3EFE6] font-medium mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Rajesh Meghani"
                      className="w-full bg-[#0B0B0A] border border-[#2A261F] rounded-xl px-4 py-2.5 text-[#F3EFE6] focus:border-[#C9A45C] focus:outline-none placeholder-[#8D8980]/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[#F3EFE6] font-medium mb-1">
                      Mobile / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+91 91066 XXXXX"
                      className="w-full bg-[#0B0B0A] border border-[#2A261F] rounded-xl px-4 py-2.5 text-[#F3EFE6] focus:border-[#C9A45C] focus:outline-none placeholder-[#8D8980]/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[#F3EFE6] font-medium mb-1">
                      Preferred Date & Time
                    </label>
                    <input
                      type="text"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      placeholder="e.g. Tomorrow at 4:00 PM"
                      className="w-full bg-[#0B0B0A] border border-[#2A261F] rounded-xl px-4 py-2.5 text-[#F3EFE6] focus:border-[#C9A45C] focus:outline-none placeholder-[#8D8980]/50"
                    />
                  </div>

                  <div className="pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-[#C9A45C] hover:bg-[#E8D5A7] text-[#0B0B0A] font-bold text-xs uppercase tracking-[0.18em] transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Confirm via WhatsApp Concierge</span>
                    </motion.button>
                  </div>

                  <p className="text-[10px] text-[#8D8980] text-center">
                    Boutique hours: {MEGHANI_STORE_INFO.hours.weekdays}
                  </p>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}