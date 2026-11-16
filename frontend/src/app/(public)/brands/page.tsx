import Image from 'next/image';
import Link from 'next/link';
import { Watch, ArrowRight, ShieldCheck, Globe, Calendar } from 'lucide-react';
import { PUBLIC_BRANDS } from '@/services/publicCatalogue';
import Breadcrumbs from '@/components/public/Breadcrumbs';

export const metadata = {
  title: 'Authorized Watch Brands — Meghani Watch Co. Ahmedabad',
  description:
    'Discover world-renowned horology brands purveyed by Meghani Watch Co., including Titan, Casio, Timex, Citizen, Fastrack, Sonata, and Ajanta. 100% Genuine with official warranty.',
};

export default function BrandsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <Breadcrumbs items={[{ label: 'Authorized Brands' }]} />

      {/* Header */}
      <div className="py-8 border-b border-[#221F18] max-w-3xl">
        <span className="text-xs text-[#C9A04F] font-semibold uppercase tracking-[0.2em] block mb-2">
          Purveyors of Horological Excellence
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#F5F0E6] leading-tight">
          Authorized Brand Portfolio
        </h1>
        <p className="text-xs sm:text-sm text-[#9E9789] mt-3 leading-relaxed">
          For four decades, Meghani Watch Co. has nurtured direct, official partnerships with the world&apos;s most respected watchmakers. Each timepiece is backed by authentic manufacturer credentials, international warranty cards, and atelier servicing support.
        </p>
      </div>

      {/* Brands Directory Grid */}
      <div className="py-12 space-y-12">
        {PUBLIC_BRANDS.map((brand, idx) => (
          <div
            key={brand.slug}
            className={`p-6 sm:p-10 rounded-2xl bg-[#141414] border border-[#221F18] hover:border-[#C9A04F]/40 transition-all shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${
              idx % 2 === 1 ? 'lg:flex-row-reverse' : ''
            }`}
          >
            {/* Visual Media */}
            <div className="lg:col-span-5 relative aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden border border-[#26221A] bg-[#0A0A0A]">
              <Image
                src={brand.heroImage}
                alt={`${brand.name} horology`}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#101010]/90 text-[#C9A04F] border border-[#C9A04F]/30 backdrop-blur-md">
                  Authorized Purveyor
                </span>
                <span className="text-xs text-white font-medium">
                  {brand.count}+ Models Available
                </span>
              </div>
            </div>

            {/* Narrative & Details */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#8E877A]">
                <span className="flex items-center gap-1.5 text-[#C9A04F] font-semibold">
                  <Globe className="w-3.5 h-3.5" />
                  {brand.country}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Est. {brand.established}
                </span>
              </div>

              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F0E6]">
                  {brand.name}
                </h2>
                <p className="text-xs text-[#C9A04F] font-semibold tracking-wider uppercase mt-1">
                  {brand.tagline}
                </p>
              </div>

              <p className="text-xs sm:text-sm text-[#B0A99C] leading-relaxed">
                {brand.description}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  href={`/shop?brand=${brand.name}`}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#C9A04F] to-[#DFC17B] text-[#101010] font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-opacity inline-flex items-center gap-2"
                >
                  <span>Explore {brand.name} Catalogue</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <span className="text-xs text-[#8E877A] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#C9A04F]" />
                  Full Brand Warranty Included
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

