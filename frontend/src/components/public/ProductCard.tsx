'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { PublicProduct } from '@/types/public';
import { buildWhatsAppEnquiryUrl } from '@/services/publicCatalogue';

interface ProductCardProps {
  product: PublicProduct;
  featured?: boolean;
}

export default function ProductCard({ product, featured = false }: ProductCardProps) {
  const isPriceHidden = !product.price_visible || product.availability === 'on_request' || product.price === null;
  const whatsappUrl = buildWhatsAppEnquiryUrl(product);

  const getAvailabilityBadge = () => {
    switch (product.availability) {
      case 'in_stock':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            In Stock
          </span>
        );
      case 'on_request':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#241E12] text-[#DFC17B] border border-[#C9A04F]/40">
            <Clock className="w-2.5 h-2.5" />
            Price on Request
          </span>
        );
      case 'out_of_stock':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-rose-950/70 text-rose-300 border border-rose-500/20">
            Awaiting Allocation
          </span>
        );
      case 'discontinued':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-zinc-900 text-zinc-400 border border-zinc-700">
            Archived Piece
          </span>
        );
    }
  };

  return (
    <div
      className={`group relative flex flex-col justify-between bg-[#151515] rounded-xl border border-[#26221A] hover:border-[#C9A04F]/60 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-[#C9A04F]/10 ${
        featured ? 'ring-1 ring-[#C9A04F]/30' : ''
      }`}
    >
      {/* Top Media Area */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0D0D0D]">
        <Link href={`/shop/${product.id}`} className="block w-full h-full">
          <Image
            src={product.image || 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80'}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        </Link>

        {/* Badges in Media Corner */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {getAvailabilityBadge()}
          {product.is_new_arrival && (
            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-[#C9A04F] text-[#101010]">
              New Arrival
            </span>
          )}
        </div>

        {/* Brand Label pill */}
        <div className="absolute top-3 right-3 z-10">
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#101010]/80 backdrop-blur-md text-[#D0C8B8] border border-[#332E24]">
            {product.brand}
          </span>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#151515] to-[#121212]">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-[#8E877A] uppercase tracking-wider mb-1.5">
            <span>{product.category} Timepiece</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-[#C9A04F]">
              <ShieldCheck className="w-3 h-3" />
              {product.warranty_months}M Warranty
            </span>
          </div>

          <h3 className="font-serif text-base sm:text-lg font-bold text-[#F5F0E6] group-hover:text-[#DFC17B] transition-colors line-clamp-1">
            <Link href={`/shop/${product.id}`}>{product.name}</Link>
          </h3>

          <p className="text-xs text-[#8E877A] mt-2 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & CTA Section */}
        <div className="pt-5 mt-4 border-t border-[#221F18] flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-[#7A7469] uppercase tracking-wider block">
              Investment
            </span>
            {isPriceHidden ? (
              <span className="font-serif text-sm sm:text-base font-bold text-[#C9A04F] tracking-wide block">
                Price on Request
              </span>
            ) : (
              <span className="font-serif text-lg sm:text-xl font-bold text-[#F5F0E6] tracking-tight block">
                ₹{product.price!.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Enquire about ${product.name} on WhatsApp`}
              className="p-2 sm:px-3 sm:py-2 rounded-lg bg-[#201D17] text-[#C9A04F] hover:bg-[#C9A04F] hover:text-[#101010] border border-[#C9A04F]/30 transition-all text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
              title="Enquire on WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Enquire</span>
            </a>

            <Link
              href={`/shop/${product.id}`}
              className="p-2 rounded-lg bg-white/[0.03] text-[#D0C8B8] hover:text-[#F5F0E6] hover:bg-white/[0.08] transition-colors"
              title="View Complete Specifications"
            >
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

