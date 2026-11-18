import Image from 'next/image';
import Link from 'next/link';
import { Watch, ArrowRight, ShieldCheck, Globe, Calendar } from 'lucide-react';
import { PUBLIC_BRANDS, getPublicBrands } from '@/services/publicCatalogue';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import { buildPageMetadata, getItemListSchema } from '@/utils/seo';

export const metadata = buildPageMetadata({
  title: 'Authorized Watch Brands in Vadodara — Titan, Casio, Citizen & More | Meghani Watch Co.',
  description:
    'Explore official watch brands at Meghani Watch Co. in Vadodara: Titan, Casio, Timex, Citizen, Fastrack, Sonata, and Ajanta. 100% genuine watches with official manufacturer warranty.',
  path: '/brands',
  keywords: [
    'authorized watch brands Vadodara',
    'Titan watch showroom Vadodara',
    'Casio watch store Vadodara',
    'Citizen Eco Drive dealer Gujarat',
    'Timex watches Vadodara',
    'Fastrack watches shop',
    'Sonata watches Vadodara',
    'Ajanta wall clocks Vadodara'
  ],
  ogImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
});

export default async function BrandsPage() {
  const brands = await getPublicBrands();
  const brandsList = brands.length > 0 ? brands : PUBLIC_BRANDS;

  const brandsSchema = getItemListSchema(
    'Meghani Watch Co. Watch Brands',
    'Official watch brands available with manufacturer warranty at Meghani Watch Co. in Vadodara.',
    brandsList.map((brand, idx) => ({
      name: brand.name,
      url: `/brands/${brand.slug}`,
      image: brand.heroImage,
      position: idx + 1,
    }))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(brandsSchema) }}
      />
      <Breadcrumbs items={[{ label: 'Watch Brands' }]} />

      {/* Header */}
      <div className="py-8 border-b border-[#2A261F] max-w-3xl">
        <span className="text-xs text-[#C9A45C] font-semibold uppercase tracking-[0.25em] block mb-2">
          Official Retail Partnerships
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#F3EFE6] leading-tight">
          Our Watch Brands
        </h1>
        <p className="text-xs sm:text-sm text-[#8D8980] mt-3 leading-relaxed">
          For over 40 years, Meghani Watch Co. has been an authorized watch dealer in Vadodara. Every watch comes with the original brand box, bill, and official manufacturer warranty.
        </p>
      </div>

      {/* Brands Directory Grid */}
      <div className="py-12 space-y-12">
        {brandsList.map((brand, idx) => (
          <div
            key={brand.slug}
            className={`p-6 sm:p-10 rounded-2xl bg-[#171613] border border-[#2A261F] hover:border-[#C9A45C]/40 transition-all shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${
              idx % 2 === 1 ? 'lg:flex-row-reverse' : ''
            }`}
          >
            {/* Visual Media */}
            <div className="lg:col-span-5 relative aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden border border-[#2A261F] bg-[#0B0B0A]">
              <Image
                src={brand.heroImage}
                alt={`${brand.name} Watches & Collections - Meghani Watch Co.`}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#0B0B0A]/90 text-[#C9A45C] border border-[#C9A45C]/30 backdrop-blur-md">
                  Authorized Retailer
                </span>
                <span className="text-xs text-[#F3EFE6] font-medium">
                  {brand.count}+ Watches Available
                </span>
              </div>
            </div>

            {/* Narrative & Details */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#8D8980]">
                <span className="flex items-center gap-1.5 text-[#C9A45C] font-semibold">
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
                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#F3EFE6]">
                  {brand.name}
                </h2>
                <p className="text-xs text-[#C9A45C] font-semibold tracking-wider uppercase mt-1">
                  {brand.tagline}
                </p>
              </div>

              <p className="text-xs sm:text-sm text-[#8D8980] leading-relaxed">
                {brand.description}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  href={`/brands/${brand.slug}`}
                  className="px-6 py-3 rounded-xl bg-[#C9A45C] hover:bg-[#E8D5A7] text-[#0B0B0A] font-bold text-xs uppercase tracking-[0.18em] transition-colors inline-flex items-center gap-2"
                >
                  <span>Explore {brand.name} Watches</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <span className="text-xs text-[#8D8980] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#C9A45C]" />
                  Official Brand Warranty Included
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
