import Image from 'next/image';
import Link from 'next/link';
import { Watch, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PUBLIC_CATEGORIES } from '@/services/publicCatalogue';
import Breadcrumbs from '@/components/public/Breadcrumbs';

export const metadata = {
  title: 'Horological Categories — Meghani Watch Co. Ahmedabad',
  description:
    'Explore timepieces by horological category: classical analog automatics, durable Japanese digitals, premium smartwatches, fine pendulum wall clocks, and handcrafted Italian leather straps.',
};

export default function CategoriesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <Breadcrumbs items={[{ label: 'Categories' }]} />

      {/* Header */}
      <div className="py-8 border-b border-[#221F18] max-w-3xl">
        <span className="text-xs text-[#C9A04F] font-semibold uppercase tracking-[0.2em] block mb-2">
          Horology Across Form & Function
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#F5F0E6] leading-tight">
          Timepiece Categories
        </h1>
        <p className="text-xs sm:text-sm text-[#9E9789] mt-3 leading-relaxed">
          Whether seeking an automatic dress watch for black-tie gatherings, a high-impact digital tool watch, an intelligent health tracker, or a heritage pendulum clock for your estate, our curations embody precision and enduring beauty.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="py-12 space-y-12">
        {PUBLIC_CATEGORIES.map((category) => (
          <div
            key={category.id}
            className="p-6 sm:p-10 rounded-2xl bg-[#141414] border border-[#221F18] hover:border-[#C9A04F]/40 transition-all shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
          >
            {/* Visual Media */}
            <div className="lg:col-span-5 relative aspect-[4/3] rounded-xl overflow-hidden border border-[#26221A] bg-[#0A0A0A]">
              <Image
                src={category.imageUrl}
                alt={category.name}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#101010]/90 text-[#C9A04F] border border-[#C9A04F]/30 backdrop-blur-md">
                  {category.count}+ Curated Models
                </span>
              </div>
            </div>

            {/* Narrative & Details */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <span className="text-xs text-[#C9A04F] font-semibold uppercase tracking-[0.2em] block mb-1">
                  {category.tagline}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F0E6]">
                  {category.name}
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-[#B0A99C] leading-relaxed">
                {category.description}
              </p>

              {/* Distinctive Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {category.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#D0C8B8]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A04F] shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3">
                <Link
                  href={`/shop?category=${category.id}`}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#C9A04F] to-[#DFC17B] text-[#101010] font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-opacity inline-flex items-center gap-2"
                >
                  <span>Browse {category.name}</span>
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

