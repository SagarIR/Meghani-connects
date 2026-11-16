'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { PublicProduct } from '@/types/public';
import { buildWhatsAppEnquiryUrl } from '@/services/publicCatalogue';

interface ProductCardProps {
  product: PublicProduct;
  featured?: boolean;
  priority?: boolean;
}

const luxuryEase = [0.16, 1, 0.3, 1] as const;

export default function ProductCard({ product, featured = false, priority = false }: ProductCardProps) {
  const isPriceHidden = !product.price_visible || product.availability === 'on_request' || product.price === null;
  const whatsappUrl = buildWhatsAppEnquiryUrl(product);

  const getAvailabilityBadge = () => {
    switch (product.availability) {
      case 'in_stock':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            In Stock
          </span>
        );
      case 'on_request':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-[#1B1914]/90 text-[#E8D5A7] border border-[#C9A45C]/40 backdrop-blur-sm">
            <Clock className="w-2.5 h-2.5 text-[#C9A45C]" />
            Price on Request
          </span>
        );
      case 'out_of_stock':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-[#1A1816]/80 text-[#8D8980] border border-[#2E2A22]">
            Out of Stock
          </span>
        );
      case 'discontinued':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-[#12110F] text-[#6A665E] border border-[#24211A]">
            Discontinued
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, ease: luxuryEase }}
      whileHover={{ y: -4, transition: { duration: 0.3, ease: luxuryEase } }}
      className={`group relative flex flex-col justify-between bg-[#171613] rounded-xl border border-[#2A261F] hover:border-[#C9A45C]/50 transition-colors duration-500 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-[#C9A45C]/5 ${
        featured ? 'ring-1 ring-[#C9A45C]/40' : ''
      }`}
    >
      {/* Top Media Area (4:5 editorial portrait horological framing) */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#0B0B0A]">
        <Link href={`/shop/${product.id}`} className="block w-full h-full">
          <Image
            src={product.image || 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80'}
            alt={`${product.brand} ${product.name} - ${product.category} Watch | Meghani Watch Co.`}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out will-change-transform"
          />
        </Link>

        {/* Subtle Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#171613] via-transparent to-black/20 pointer-events-none" />

        {/* Availability Badge */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {getAvailabilityBadge()}
          {product.is_new_arrival && (
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-widest bg-[#C9A45C] text-[#0B0B0A]">
              New Arrival
            </span>
          )}
        </div>

        {/* Brand Label pill */}
        <div className="absolute top-3 right-3 z-10">
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-widest bg-[#0B0B0A]/85 backdrop-blur-md text-[#E8D5A7] border border-[#2A261F]">
            {product.brand}
          </span>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between bg-[#171613]">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-[#8D8980] uppercase tracking-[0.1em] mb-2 font-medium">
            <span>{product.category} Watch</span>
            <span className="text-[#3D382E]">•</span>
            <span className="flex items-center gap-1 text-[#C9A45C]">
              <ShieldCheck className="w-3 h-3" />
              {product.warranty_months}M Warranty
            </span>
          </div>

          <h3 className="font-serif text-lg font-medium text-[#F3EFE6] group-hover:text-[#E8D5A7] transition-colors line-clamp-1 leading-snug">
            <Link href={`/shop/${product.id}`}>{product.name}</Link>
          </h3>

          <p className="text-xs text-[#8D8980] mt-2 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Action Section */}
        <div className="pt-4 mt-4 border-t border-[#23201A] flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-[#8D8980] uppercase tracking-widest block font-medium">
              Price
            </span>
            {isPriceHidden ? (
              <span className="font-serif text-sm sm:text-base text-[#C9A45C] tracking-wide block font-medium mt-0.5">
                Price on Request
              </span>
            ) : (
              <span className="font-serif text-lg sm:text-xl text-[#F3EFE6] tracking-tight block font-normal mt-0.5">
                ₹{product.price!.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Enquire about ${product.name} on WhatsApp`}
              className="px-3 py-2 rounded-lg bg-[#1E1B15] text-[#C9A45C] hover:bg-[#C9A45C] hover:text-[#0B0B0A] border border-[#C9A45C]/35 transition-colors text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
              title="Enquire on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Enquire</span>
            </motion.a>

            <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.94 }}>
              <Link
                href={`/shop/${product.id}`}
                className="p-2 rounded-lg bg-white/[0.03] text-[#8D8980] hover:text-[#F3EFE6] hover:bg-white/[0.08] transition-colors block"
                title="View Watch Details"
                aria-label={`View details of ${product.name}`}
              >
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

