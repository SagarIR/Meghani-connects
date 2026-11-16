import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  Tag,
  ArrowRight,
  MessageCircle,
  Clock,
  ShieldCheck,
  Check
} from 'lucide-react';
import { PUBLIC_OFFERS, MEGHANI_STORE_INFO } from '@/services/publicCatalogue';
import Breadcrumbs from '@/components/public/Breadcrumbs';

export const metadata = {
  title: 'Exclusive Offers & Seasonal Privileges — Meghani Watch Co.',
  description:
    'Discover seasonal promotions, festive wedding suites, and complimentary watchmaker inspection privileges at Meghani Watch Co. Ahmedabad.',
};

export default function OffersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <Breadcrumbs items={[{ label: 'Exclusive Offers' }]} />

      {/* Header */}
      <div className="py-8 border-b border-[#221F18] max-w-3xl">
        <span className="text-xs text-[#C9A04F] font-semibold uppercase tracking-[0.2em] block mb-2">
          Curated Privileges
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#F5F0E6] leading-tight">
          Boutique Offers & Privileges
        </h1>
        <p className="text-xs sm:text-sm text-[#9E9789] mt-3 leading-relaxed">
          In honor of festive milestones, weddings, and generational patronage, Meghani Watch Co. presents exclusive seasonal advantages on select luxury timepieces and atelier servicing.
        </p>
      </div>

      {/* Offers Cards */}
      <div className="py-12 space-y-8">
        {PUBLIC_OFFERS.map((offer) => {
          const whatsappClaimUrl = `https://wa.me/${MEGHANI_STORE_INFO.whatsapp}?text=${encodeURIComponent(
            `Hello Meghani Watch Co., I would like to inquire about and claim the "${offer.title}" offer${
              offer.code ? ` (Code: ${offer.code})` : ''
            }. Please assist me.`
          )}`;

          return (
            <div
              key={offer.id}
              className="p-6 sm:p-10 rounded-2xl bg-[#141414] border border-[#26221A] hover:border-[#C9A04F]/50 transition-all shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Visual Media */}
              <div className="lg:col-span-5 relative aspect-[16/10] rounded-xl overflow-hidden border border-[#2E2A22] bg-[#0A0A0A]">
                <Image
                  src={offer.bannerImage}
                  alt={offer.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#C9A04F] text-[#101010]">
                    {offer.badge}
                  </span>
                </div>
              </div>

              {/* Offer Details */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-[#DFC17B] block">
                    {offer.discount}
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#F5F0E6] mt-1">
                    {offer.title}
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-[#B0A99C] leading-relaxed">
                  {offer.description}
                </p>

                {offer.code && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#1D1A14] border border-[#C9A04F]/40 text-xs font-mono text-[#DFC17B]">
                    <Tag className="w-3.5 h-3.5 text-[#C9A04F]" />
                    <span>Privilege Code: <strong>{offer.code}</strong></span>
                  </div>
                )}

                <div className="text-xs text-[#8E877A] space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#C9A04F]" />
                    <span>Validity: {offer.validity}</span>
                  </div>
                  <p className="text-[11px] text-[#7A7469]">
                    * {offer.terms}
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <a
                    href={whatsappClaimUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#C9A04F] to-[#DFC17B] text-[#101010] font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-opacity inline-flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Claim on WhatsApp</span>
                  </a>

                  {offer.targetCategory ? (
                    <Link
                      href={`/shop?category=${offer.targetCategory}`}
                      className="px-6 py-3 rounded-xl bg-[#1C1C1C] text-[#F5F0E6] border border-[#332E24] hover:border-[#C9A04F] text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-2"
                    >
                      <span>Browse Applicable Watches</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <Link
                      href="/shop"
                      className="px-6 py-3 rounded-xl bg-[#1C1C1C] text-[#F5F0E6] border border-[#332E24] hover:border-[#C9A04F] text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-2"
                    >
                      <span>Explore Catalogue</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

