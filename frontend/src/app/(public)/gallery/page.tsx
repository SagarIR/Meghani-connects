'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Sparkles, X, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { PUBLIC_GALLERY } from '@/services/publicCatalogue';
import { GalleryItem } from '@/types/public';
import Breadcrumbs from '@/components/public/Breadcrumbs';

export default function GalleryPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [activeLightboxItem, setActiveLightboxItem] = useState<GalleryItem | null>(null);

  const filters = [
    { label: 'All Visuals', value: 'all' },
    { label: 'Craftsmanship & Movements', value: 'craftsmanship' },
    { label: 'Iconic Timepieces', value: 'timepieces' },
    { label: 'Horological Heritage', value: 'heritage' },
    { label: 'The Ahmedabad Boutique', value: 'boutique' },
  ];

  const filteredItems = selectedFilter === 'all'
    ? PUBLIC_GALLERY
    : PUBLIC_GALLERY.filter((item) => item.category === selectedFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <Breadcrumbs items={[{ label: 'Horology Gallery' }]} />

      {/* Header */}
      <div className="py-8 border-b border-[#221F18] max-w-3xl">
        <span className="text-xs text-[#C9A04F] font-semibold uppercase tracking-[0.2em] block mb-2">
          Visual Heritage & Atelier Moments
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#F5F0E6] leading-tight">
          Horological Gallery
        </h1>
        <p className="text-xs sm:text-sm text-[#9E9789] mt-3 leading-relaxed">
          Glimpse into the world of Meghani Watch Co. From microscopic escapement regulation and hand-burnished leatherwork to our historic Ahmedabad boutique salon.
        </p>

        {/* Filter Tabs */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setSelectedFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                selectedFilter === f.value
                  ? 'bg-[#C9A04F] text-[#101010] shadow-md shadow-[#C9A04F]/20 font-bold'
                  : 'bg-[#151515] border border-[#2A261F] text-[#8E877A] hover:text-white hover:border-[#C9A04F]/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Masonry-Style Gallery Grid */}
      <div className="py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveLightboxItem(item)}
            className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#141414] border border-[#26221A] hover:border-[#C9A04F]/60 transition-all cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-[#C9A04F]/10"
          >
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
              <span className="text-[10px] text-[#C9A04F] font-bold uppercase tracking-widest block mb-1">
                {item.category}
              </span>
              <h3 className="font-serif text-lg font-bold text-[#F5F0E6] leading-tight">
                {item.title}
              </h3>
              <p className="text-xs text-[#B0A99C] mt-1 line-clamp-2">
                {item.caption}
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#DFC17B] font-semibold">
                <Eye className="w-3.5 h-3.5" />
                <span>Inspect Visual</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Lightbox Modal */}
      {activeLightboxItem && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn">
          <button
            onClick={() => setActiveLightboxItem(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            aria-label="Close Lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-[#2E2A22]">
              <Image
                src={activeLightboxItem.imageUrl}
                alt={activeLightboxItem.title}
                fill
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>

            <div className="w-full mt-4 p-4 rounded-xl bg-[#141414] border border-[#2A261F] text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-[#C9A04F] font-bold uppercase tracking-widest block">
                  {activeLightboxItem.category}
                </span>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#F5F0E6]">
                  {activeLightboxItem.title}
                </h3>
                <p className="text-xs text-[#8E877A] mt-1 max-w-xl">
                  {activeLightboxItem.details || activeLightboxItem.caption}
                </p>
              </div>

              <button
                onClick={() => setActiveLightboxItem(null)}
                className="px-5 py-2 rounded-lg bg-[#221F18] text-xs font-semibold text-[#D0C8B8] hover:text-white"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
