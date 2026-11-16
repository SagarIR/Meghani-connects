import Image from 'next/image';
import Link from 'next/link';
import {
  Watch,
  Award,
  ShieldCheck,
  Clock,
  Wrench,
  CheckCircle2,
  ArrowRight,
  HeartHandshake,
  Sparkles
} from 'lucide-react';
import Breadcrumbs from '@/components/public/Breadcrumbs';

export const metadata = {
  title: 'Our Heritage & Story — Meghani Watch Co. Since 1984',
  description:
    'Learn about Meghani Watch Co., an authorized luxury watch retailer and master watchmaker atelier in Vadodara since 1984. 40 years of horological trust.',
};

export default function AboutPage() {
  const milestones = [
    {
      year: '1984',
      title: 'The Foundation on Relief Road',
      description: 'Meghani Watch Co. opens its doors in Ahmedabad with a dedicated bench for classical mechanical pocket watches and early quartz calibres.',
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

  const pillars = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#C9A04F]" />,
      title: 'Certified Authenticity Only',
      description: 'Every wristwatch in our salon is sourced exclusively through verified brand channels, accompanied by original manufacturer papers and factory-sealed serial numbers.',
    },
    {
      icon: <Wrench className="w-6 h-6 text-[#C9A04F]" />,
      title: 'Master Horologist Atelier',
      description: 'Our watchmakers are seasoned artisans trained in mechanical escapements, automatic rotor balancing, and high-precision electronic quartz diagnostics.',
    },
    {
      icon: <Sparkles className="w-6 h-6 text-[#C9A04F]" />,
      title: 'Curated Horological Taste',
      description: 'We do not stock indiscriminately. Every model on our floor is chosen for enduring design, finishing quality, and long-term mechanical reliability.',
    },
    {
      icon: <HeartHandshake className="w-6 h-6 text-[#C9A04F]" />,
      title: 'Generational Client Relationships',
      description: 'We treat watch acquisition as the start of a lifelong partnership, offering complimentary strap sizing, demagnetizing, and inspection for every piece we purvey.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <Breadcrumbs items={[{ label: 'Our Story & Heritage' }]} />

      {/* Hero Header */}
      <div className="py-12 border-b border-[#221F18] grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 text-xs text-[#C9A04F] font-semibold uppercase tracking-[0.2em]">
            <Award className="w-4 h-4" />
            Heritage Since 1984
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-[#F5F0E6] leading-tight">
            Four Decades of <br className="hidden sm:inline" />
            <span className="italic bg-gradient-to-r from-[#C9A04F] to-[#DFC17B] bg-clip-text text-transparent">
              Timeless Trust & Precision.
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#A8A194] leading-relaxed pt-2 max-w-xl">
            In an era of fleeting trends and impersonal mass manufacturing, a fine timepiece remains an intimate testament to human patience, engineering triumph, and precious memory. For over forty years, Meghani Watch Co. has stood as Ahmedabad&apos;s proud guardian of this art.
          </p>
        </div>

        <div className="lg:col-span-5 relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#2E2A22] shadow-2xl">
          <Image
            src="https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=80"
            alt="Meghani Watch Co. Atelier"
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 p-3 rounded-lg bg-[#101010]/90 backdrop-blur-md border border-[#C9A04F]/30 text-xs">
            <span className="text-[#C9A04F] font-bold block">The Master Workbench</span>
            <span className="text-[#8E877A]">Precision regulation under 10x binocular inspection</span>
          </div>
        </div>
      </div>

      {/* The Meghani Standard: 4 Pillars */}
      <div className="py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs text-[#C9A04F] font-semibold uppercase tracking-[0.2em] block mb-2">
            The Meghani Standard
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F0E6]">
            Our Four Pillars of Excellence
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#141414] border border-[#221F18] hover:border-[#C9A04F]/50 transition-all shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#1C1A14] border border-[#C9A04F]/30 flex items-center justify-center mb-4">
                  {pillar.icon}
                </div>
                <h3 className="font-serif text-lg font-bold text-[#F5F0E6] mb-2">
                  {pillar.title}
                </h3>
                <p className="text-xs text-[#8E877A] leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Milestones */}
      <div className="py-16 border-t border-[#221F18]">
        <div className="max-w-2xl mb-12">
          <span className="text-xs text-[#C9A04F] font-semibold uppercase tracking-[0.2em] block mb-2">
            Our Journey
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F0E6]">
            Four Decades of Horological Milestones
          </h2>
        </div>

        <div className="space-y-8 relative before:absolute before:inset-0 before:left-3.5 sm:before:left-4 before:w-0.5 before:bg-[#2A261F]">
          {milestones.map((m, idx) => (
            <div key={idx} className="relative flex items-start gap-6 sm:gap-8 pl-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#181818] border-2 border-[#C9A04F] flex items-center justify-center shrink-0 z-10 text-[10px] font-bold text-[#C9A04F]">
                {idx + 1}
              </div>
              <div className="p-6 rounded-2xl bg-[#141414] border border-[#221F18] flex-1">
                <span className="font-serif text-sm font-bold text-[#C9A04F] tracking-widest block mb-1">
                  YEAR {m.year}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#F5F0E6]">
                  {m.title}
                </h3>
                <p className="text-xs text-[#8E877A] mt-2 leading-relaxed">
                  {m.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action Banner */}
      <div className="my-12 p-8 sm:p-12 rounded-2xl bg-gradient-to-r from-[#181611] to-[#121212] border border-[#C9A04F]/40 text-center flex flex-col items-center">
        <span className="text-xs text-[#C9A04F] font-bold uppercase tracking-[0.2em] mb-2 block">
          Experience In Person
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F0E6] max-w-xl">
          Visit Our Boutique Salon in Vadodara
        </h2>
        <p className="text-xs sm:text-sm text-[#8E877A] max-w-lg mt-3">
          Our horological advisors welcome you for personal consultations, sizing, and authentic timepiece discovery.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/contact"
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#C9A04F] to-[#DFC17B] text-[#101010] font-bold text-xs uppercase tracking-widest hover:opacity-95 transition-opacity"
          >
            Plan Your Boutique Visit
          </Link>
          <Link
            href="/shop"
            className="px-8 py-3.5 rounded-xl bg-[#1C1C1C] text-[#F5F0E6] border border-[#332E24] hover:border-[#C9A04F] text-xs font-semibold uppercase tracking-widest transition-colors"
          >
            Browse Online Catalogue
          </Link>
        </div>
      </div>
    </div>
  );
}

