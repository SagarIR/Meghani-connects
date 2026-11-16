import Image from 'next/image';
import Link from 'next/link';
import { Watch, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PUBLIC_CATEGORIES } from '@/services/publicCatalogue';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import { buildPageMetadata, getItemListSchema } from '@/utils/seo';

export const metadata = buildPageMetadata({
  title: 'Horological Categories — Analogs, Automatics, Digitals & Clocks',
  description:
    'Explore timepieces by horological category at Meghani Watch Co. in Vadodara: classical analog automatics, durable Japanese digitals, premium smartwatches, fine pendulum wall clocks, and handcrafted straps.',
  path: '/categories',
  keywords: [
    'watch categories Vadodara',
    'automatic watches Vadodara',
    'analog quartz watches',
    'digital watches Gujarat',
    'luxury smartwatches',
    'pendulum wall clocks Vadodara',
    'leather watch straps'
  ],
  ogImage: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80',
});

export default function CategoriesPage() {
  const categoriesSchema = getItemListSchema(
    'Meghani Watch Co. Horological Categories',
    'Explore curated timepiece categories spanning mechanical automatics, high-impact digital tools, smartwatches, and wall clocks.',
    PUBLIC_CATEGORIES.map((category, idx) => ({
      name: category.name,
      url: `/shop?category=${encodeURIComponent(category.id)}`,
      image: category.imageUrl,
      position: idx + 1,
    }))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoriesSchema) }}
      />
      <Breadcrumbs items={[{ label: 'Categories' }]} />

      {/* Header */}
      <div className="py-8 border-b border-[#2A261F] max-w-3xl">
        <span className="text-xs text-[#C9A45C] font-semibold uppercase tracking-[0.25em] block mb-2">
          Horology Across Form & Function
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#F3EFE6] leading-tight">
          Timepiece Categories
        </h1>
        <p className="text-xs sm:text-sm text-[#8D8980] mt-3 leading-relaxed">
          Whether seeking an automatic dress watch for black-tie gatherings, a high-impact digital tool watch, an intelligent health tracker, or a heritage pendulum clock for your estate, our curations embody precision and enduring beauty.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="py-12 space-y-12">
        {PUBLIC_CATEGORIES.map((category) => (
          <div
            key={category.id}
            className="p-6 sm:p-10 rounded-2xl bg-[#171613] border border-[#2A261F] hover:border-[#C9A45C]/40 transition-all shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
          >
            {/* Visual Media */}
            <div className="lg:col-span-5 relative aspect-[4/3] rounded-xl overflow-hidden border border-[#2A261F] bg-[#0B0B0A]">
              <Image
                src={category.imageUrl}
                alt={`${category.name} - Luxury Horological Category | Meghani Watch Co.`}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#0B0B0A]/90 text-[#C9A45C] border border-[#C9A45C]/30 backdrop-blur-md">
                  {category.count}+ Curated Models
                </span>
              </div>
            </div>

            {/* Narrative & Details */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#F3EFE6]">
                  {category.name}
                </h2>
                <p className="text-xs text-[#C9A45C] font-semibold tracking-wider uppercase mt-1">
                  {category.tagline}
                </p>
              </div>

              <p className="text-xs sm:text-sm text-[#8D8980] leading-relaxed">
                {category.description}
              </p>

              {/* Notable Attributes */}
              <div className="pt-2">
                <h3 className="text-[11px] uppercase tracking-wider text-[#F3EFE6] font-semibold mb-2">
                  Category Hallmarks
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {category.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs text-[#8D8980]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A45C] shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Link
                  href={`/shop?category=${category.id}`}
                  className="px-6 py-3 rounded-xl bg-[#C9A45C] hover:bg-[#E8D5A7] text-[#0B0B0A] font-bold text-xs uppercase tracking-[0.18em] transition-colors inline-flex items-center gap-2"
                >
                  <span>Explore {category.name} Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
