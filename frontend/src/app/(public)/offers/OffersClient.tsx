'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Tag,
  ArrowRight,
  MessageCircle,
  Clock
} from 'lucide-react';
import { PUBLIC_OFFERS, MEGHANI_STORE_INFO } from '@/services/publicCatalogue';
import Breadcrumbs from '@/components/public/Breadcrumbs';

const luxuryEase = [0.16, 1, 0.3, 1] as const;

export default function OffersClient() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <Breadcrumbs items={[{ label: 'Exclusive Offers' }]} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: luxuryEase }}
        className="py-8 border-b border-[#2A261F] max-w-3xl"
      >
        <span className="text-xs text-[#C9A45C] font-semibold uppercase tracking-[0.25em] block mb-2">
          Curated Privileges
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#F3EFE6] leading-tight">
          Boutique Offers & Privileges
        </h1>
        <p className="text-xs sm:text-sm text-[#8D8980] mt-3 leading-relaxed">
          In honor of festive milestones, weddings, and generational patronage, Meghani Watch Co. presents exclusive seasonal advantages on select luxury timepieces and atelier servicing.
        </p>
      </motion.div>

      {/* Offers Cards */}
      <div className="py-12 space-y-8">
        {PUBLIC_OFFERS.map((offer, idx) => {
          const whatsappClaimUrl = `https://wa.me/${MEGHANI_STORE_INFO.whatsapp}?text=${encodeURIComponent(
            `Hello Meghani Watch Co., I would like to inquire about and claim the "${offer.title}" offer${
              offer.code ? ` (Code: ${offer.code})` : ''
            }. Please assist me.`
          )}`;

          return (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.75, delay: idx * 0.1, ease: luxuryEase }}
              className="p-6 sm:p-10 rounded-2xl bg-[#171613] border border-[#2A261F] hover:border-[#C9A45C]/40 transition-colors shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center group"
            >
              <div className="lg:col-span-4 relative aspect-[16/10] rounded-xl overflow-hidden border border-[#2A261F]">
                <Image
                  src={offer.bannerImage}
                  alt={`${offer.title} - Meghani Watch Co. Boutique Privilege`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out will-change-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#C9A45C] text-[#0B0B0A] shadow-md">
                    {offer.badge}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-4">
                <div>
                  <span className="text-xs text-[#C9A45C] font-semibold tracking-wider uppercase block mb-1">
                    {offer.discount}
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#F3EFE6]">
                    {offer.title}
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-[#8D8980] leading-relaxed">
                  {offer.description}
                </p>

                {offer.code && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B0B0A] border border-[#C9A45C]/40 text-xs text-[#E8D5A7] font-mono">
                    <Tag className="w-3.5 h-3.5 text-[#C9A45C]" />
                    <span>Promo Code: <strong>{offer.code}</strong></span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#8D8980] pt-2">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#C9A45C]" />
                    {offer.validity}
                  </span>
                  <span>•</span>
                  <span>{offer.terms}</span>
                </div>

                <div className="pt-3 flex flex-wrap items-center gap-4">
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={whatsappClaimUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 shadow-lg shadow-[#25D366]/20"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Claim via Boutique WhatsApp</span>
                  </motion.a>

                  {offer.targetCategory && (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link
                        href={`/shop?category=${offer.targetCategory}`}
                        className="px-5 py-3 rounded-xl bg-[#0B0B0A] border border-[#2A261F] hover:border-[#C9A45C]/50 text-xs font-semibold text-[#F3EFE6] inline-flex items-center gap-2 transition-colors"
                      >
                        <span>Explore Applicable Timepieces</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}