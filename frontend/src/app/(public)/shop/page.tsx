import { Suspense } from 'react';
import { Metadata } from 'next';
import ShopClient from './ShopClient';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import { buildPageMetadata, getItemListSchema } from '@/utils/seo';
import { SEED_PUBLIC_PRODUCTS } from '@/services/publicCatalogue';

export const metadata: Metadata = buildPageMetadata({
  title: 'Curated Luxury Watch Catalogue & Timepiece Collections',
  description:
    'Explore authentic wristwatches, automatics, chronographs, and precision wall clocks from Titan, Casio, Citizen, and Timex at Meghani Watch Co. Vadodara. 100% genuine with official warranty.',
  path: '/shop',
  keywords: [
    'luxury watch catalogue Vadodara',
    'buy watches Vadodara',
    'Titan watch showroom Vadodara',
    'Casio G-Shock dealer Gujarat',
    'Citizen Eco Drive watches',
    'Timex mechanical automatic',
    'branded wall clocks Vadodara',
    'genuine watch warranty'
  ],
  ogImage: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80',
});

export default function ShopPage() {
  const catalogueSchema = getItemListSchema(
    'Meghani Watch Co. Timepiece Collection',
    'Curated collection of authentic luxury wristwatches and wall clocks in Vadodara.',
    SEED_PUBLIC_PRODUCTS.map((product, idx) => ({
      name: `${product.brand} ${product.name}`,
      url: `/shop/${product.id}`,
      image: product.image || undefined,
      position: idx + 1,
    }))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogueSchema) }}
      />
      {/* Breadcrumbs Trail — Emits BreadcrumbList JSON-LD Schema */}
      <Breadcrumbs items={[{ label: 'Catalogue' }]} />

      {/* Catalogue Header — Rendered on Server for Instant H1 SEO Indexation */}
      <div className="py-6 border-b border-[#2A261F]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs text-[#C9A45C] font-semibold uppercase tracking-[0.25em] block mb-2">
              The Curated Collection
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#F3EFE6] tracking-tight">
              Timepiece Catalogue
            </h1>
            <p className="text-xs sm:text-sm text-[#8D8980] mt-2 max-w-xl font-normal">
              Explore authentic luxury wristwatches, automatic movements, and wall clocks purveyed by Meghani Watch Co.
            </p>
          </div>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#C9A45C] border-t-transparent animate-spin" />
          </div>
        }
      >
        <ShopClient />
      </Suspense>
    </div>
  );
}
