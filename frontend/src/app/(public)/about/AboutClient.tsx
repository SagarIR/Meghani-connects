'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Award,
  ShieldCheck,
  Wrench,
  Sparkles,
  HeartHandshake,
  ArrowRight
} from 'lucide-react';
import Breadcrumbs from '@/components/public/Breadcrumbs';

const luxuryEase = [0.16, 1, 0.3, 1] as const;

interface Milestone {
  year: string;
  title: string;
  description: string;
}

interface Pillar {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const milestones: Milestone[] = [
  {
    year: '1984',
    title: 'The Foundation in Vadodara',
    description: 'Meghani Watch Co. opens its doors in Vadodara with a dedicated bench for classical mechanical pocket watches and early quartz calibres.',
  },
  {
    year: '1995',
    title: 'Authorized Titan & Japanese Partnerships',
    description: 'Awarded premier authorized dealership rights for Titan, Citizen, and Casio, establishing our reputation as the trusted source for genuine timepieces.',
  },
  {
    year: '2010',
    title: 'Master Atelier Expansion',
    description: 'Equipped our in-house workshop with Swiss precision timegraphers, ultrasonic sanitization vats, and automated water-resistance testing chambers.',
  },
  {
    year: '2026',
    title: 'Four Decades of Horological Excellence',
    description: 'Celebrating 40+ years serving multi-generational families with over 50,000 timepieces purveyed and restored.',
  },
];

const pillars: Pillar[] = [
  {
    icon: <ShieldCheck className="w-6 h-6 text-[#C9A45C]" />,
    title: 'Certified Authenticity Only',
    description: 'Every wristwatch in our salon is sourced exclusively through verified brand channels, accompanied by original manufacturer papers and factory-sealed serial numbers.',
  },
  {
    icon: <Wrench className="w-6 h-6 text-[#C9A45C]" />,
    title: 'Master Horologist Atelier',
    description: 'Our watchmakers are seasoned artisans trained in mechanical escapements, automatic rotor balancing, and high-precision electronic quartz diagnostics.',
  },
  {
    icon: <Sparkles className="w-6 h-6 text-[#C9A45C]" />,
    title: 'Curated Horological Taste',
    description: 'We do not stock indiscriminately. Every model on our floor is chosen for enduring design, finishing quality, and long-term mechanical reliability.',
  },
  {
    icon: <HeartHandshake className="w-6 h-6 text-[#C9A45C]" />,
    title: 'Generational Client Relationships',
    description: 'We treat watch acquisition as the start of a lifelong partnership, offering complimentary strap sizing, demagnetizing, and inspection for every piece we purvey.',
  },
];

export default function AboutClient() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: timelineProgress } = useScroll({
    target: timelineRef,
    offset: ['start center', 'end center']
  });

  const timelineFill = useTransform(timelineProgress, [0, 1], ['0%', '100%']);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <Breadcrumbs items={[{ label: 'Our Story & Heritage' }]} />

      {/* Hero Header */}
      <div className="py-12 border-b border-[#2A261F] grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: luxuryEase }}
          className="lg:col-span-7 space-y-4"
        >
          <div className="inline-flex items-center gap-2 text-xs text-[#C9A45C] font-semibold uppercase tracking-[0.25em]">
            <Award className="w-4 h-4" />
            Heritage Since 1984
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal text-[#F3EFE6] leading-tight">
            Four Decades of <br className="hidden sm:inline" />
            <span className="italic text-[#C9A45C]">
              Timeless Trust & Precision.
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8D8980] leading-relaxed pt-2 max-w-xl font-normal">
            In an era of fleeting trends and impersonal mass manufacturing, a fine timepiece remains an intimate testament to human patience, engineering triumph, and precious memory. For over forty years, Meghani Watch Co. has stood as Vadodara&apos;s proud guardian of this art.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.85, delay: 0.2, ease: luxuryEase }}
          className="lg:col-span-5 relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#2A261F] shadow-2xl group"
        >
          <Image
            src="https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=80"
            alt="Meghani Watch Co. Master Watchmaker Atelier in Vadodara"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out will-change-transform"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 p-3 rounded-lg bg-[#0B0B0A]/90 backdrop-blur-md border border-[#C9A45C]/30 text-xs">
            <span className="text-[#C9A45C] font-semibold block">Horological Atelier & Salon</span>
            <span className="text-[#8D8980]">Serving three generations of timepiece enthusiasts</span>
          </div>
        </motion.div>
      </div>

      {/* Values & Pillars */}
      <div className="py-16 border-b border-[#2A261F]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.7, ease: luxuryEase }}
          className="max-w-2xl mb-12"
        >
          <span className="text-xs text-[#C9A45C] font-semibold uppercase tracking-[0.25em] block mb-2">
            The Meghani Creed
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#F3EFE6]">
            Principles That Direct Our Atelier
          </h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: luxuryEase }}
            className="h-0.5 w-20 bg-[#C9A45C] origin-left mt-3"
          />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: idx * 0.1, ease: luxuryEase }}
              whileHover={{ y: -6, transition: { duration: 0.3, ease: luxuryEase } }}
              className="p-6 rounded-2xl bg-[#171613] border border-[#2A261F] hover:border-[#C9A45C]/50 transition-colors duration-500 space-y-3 shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-[#201D17] border border-[#C9A45C]/30 flex items-center justify-center">
                {pillar.icon}
              </div>
              <h3 className="font-serif text-lg font-normal text-[#F3EFE6]">
                {pillar.title}
              </h3>
              <p className="text-xs text-[#8D8980] leading-relaxed">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Milestones Animated Timeline */}
      <div ref={timelineRef} className="py-16 border-b border-[#2A261F]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.7, ease: luxuryEase }}
          className="max-w-2xl mb-12"
        >
          <span className="text-xs text-[#C9A45C] font-semibold uppercase tracking-[0.25em] block mb-2">
            Historical Progression
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#F3EFE6]">
            40 Years of Horological Milestones
          </h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: luxuryEase }}
            className="h-0.5 w-20 bg-[#C9A45C] origin-left mt-3"
          />
        </motion.div>

        <div className="relative ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-12">
          {/* Timeline Background Track */}
          <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-[#2A261F]" />

          {/* Timeline Gold Fill Bar */}
          <motion.div
            style={{ height: timelineFill }}
            className="absolute left-0 top-2 w-[2px] bg-gradient-to-b from-[#C9A45C] via-[#E8D5A7] to-[#C9A45C] origin-top shadow-[0_0_8px_rgba(201,164,92,0.4)]"
          />

          {milestones.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: idx * 0.12, ease: luxuryEase }}
              className="relative group"
            >
              {/* Timeline Node Dot */}
              <div className="absolute -left-[31px] sm:-left-[47px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#C9A45C] border-4 border-[#0B0B0A] group-hover:scale-125 transition-transform shadow-[0_0_10px_rgba(201,164,92,0.5)]" />

              <div className="text-xs font-mono font-bold text-[#C9A45C] mb-1">
                {m.year}
              </div>
              <h3 className="font-serif text-xl font-normal text-[#F3EFE6] mb-2 group-hover:text-[#E8D5A7] transition-colors">
                {m.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#8D8980] max-w-2xl leading-relaxed">
                {m.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.8, ease: luxuryEase }}
        className="py-16 text-center max-w-2xl mx-auto space-y-6"
      >
        <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#F3EFE6]">
          Experience Our Horological Atelier
        </h2>
        <p className="text-xs sm:text-sm text-[#8D8980] leading-relaxed">
          Whether you are seeking your next milestone luxury watch, looking to have a cherished vintage mechanical movement restored, or simply seeking horological conversation, our concierge is at your service.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/shop"
              className="px-8 py-3.5 rounded-xl bg-[#C9A45C] hover:bg-[#E8D5A7] text-[#0B0B0A] font-bold text-xs uppercase tracking-[0.2em] transition-colors inline-flex items-center gap-2 shadow-lg shadow-[#C9A45C]/15"
            >
              <span>Explore Timepiece Catalogue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/contact"
              className="px-8 py-3.5 rounded-xl bg-[#171613] hover:bg-[#201D17] border border-[#2A261F] hover:border-[#C9A45C]/50 text-xs font-semibold text-[#F3EFE6] inline-flex items-center gap-2 transition-colors"
            >
              <span>Visit Vadodara Boutique</span>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}