'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { PUBLIC_GALLERY } from '@/services/publicCatalogue';
import { GalleryItem } from '@/types/public';
import Breadcrumbs from '@/components/public/Breadcrumbs';

const luxuryEase = [0.16, 1, 0.3, 1] as const;

interface GalleryClientProps {
  initialItems?: GalleryItem[];
}

export default function GalleryClient({ initialItems = PUBLIC_GALLERY }: GalleryClientProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [activeLightboxItem, setActiveLightboxItem] = useState<GalleryItem | null>(null);

  const filters = [
    { label: 'All Photos', value: 'all' },
    { label: 'Watch Repair & Workshop', value: 'craftsmanship' },
    { label: 'Watches', value: 'timepieces' },
    { label: 'Our Heritage', value: 'heritage' },
    { label: 'Vadodara Showroom', value: 'boutique' },
  ];

  const filteredItems = selectedFilter === 'all'
    ? initialItems
    : initialItems.filter((item) => item.category === selectedFilter);

  // Lightbox keyboard navigation
  const currentIndex = activeLightboxItem
    ? filteredItems.findIndex((it) => it.id === activeLightboxItem.id)
    : -1;

  const handleNext = useCallback(() => {
    if (currentIndex < 0) return;
    const nextIdx = (currentIndex + 1) % filteredItems.length;
    setActiveLightboxItem(filteredItems[nextIdx]);
  }, [currentIndex, filteredItems]);

  const handlePrev = useCallback(() => {
    if (currentIndex < 0) return;
    const prevIdx = (currentIndex - 1 + filteredItems.length) % filteredItems.length;
    setActiveLightboxItem(filteredItems[prevIdx]);
  }, [currentIndex, filteredItems]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeLightboxItem) return;
      if (e.key === 'Escape') setActiveLightboxItem(null);
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxItem, handleNext, handlePrev]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <Breadcrumbs items={[{ label: 'Watch Gallery' }]} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: luxuryEase }}
        className="py-8 border-b border-[#2A261F] max-w-3xl"
      >
        <span className="text-xs text-[#C9A45C] font-semibold uppercase tracking-[0.25em] block mb-2">
          Our Showroom & Workshop in Photos
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#F3EFE6] leading-tight">
          Watch Gallery
        </h1>
        <p className="text-xs sm:text-sm text-[#8D8980] mt-3 leading-relaxed">
          Take a look inside Meghani Watch Co. in Vadodara: see our watch showroom, expert repair workshop, and popular watch models.
        </p>

        {/* Filter Tabs with Gliding Active Pill */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {filters.map((f) => {
            const isSelected = selectedFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setSelectedFilter(f.value)}
                className={`relative px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors ${
                  isSelected
                    ? 'text-[#0B0B0A] font-bold'
                    : 'text-[#8D8980] hover:text-[#F3EFE6] bg-[#171613] border border-[#2A261F] hover:border-[#C9A45C]/50'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeGalleryFilter"
                    className="absolute inset-0 rounded-xl bg-[#C9A45C] shadow-md shadow-[#C9A45C]/20 -z-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{f.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Masonry-Style Gallery Grid with Layout Animation */}
      <motion.div
        layout
        className="py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, idx) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.45, delay: idx * 0.05, ease: luxuryEase }}
              whileHover={{ y: -6, transition: { duration: 0.3, ease: luxuryEase } }}
              onClick={() => setActiveLightboxItem(item)}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#171613] border border-[#2A261F] hover:border-[#C9A45C]/60 transition-colors cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-[#C9A45C]/10"
            >
              <Image
                src={item.imageUrl}
                alt={`${item.title} - Meghani Watch Co. Horological Gallery`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out will-change-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <span className="text-[10px] text-[#C9A45C] font-bold uppercase tracking-widest block mb-1">
                  {item.category}
                </span>
                <h3 className="font-serif text-lg font-normal text-[#F3EFE6] leading-tight">
                  {item.title}
                </h3>
                <p className="text-xs text-[#8D8980] mt-1 line-clamp-2">
                  {item.caption}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#E8D5A7] font-semibold">
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Full Photo</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Interactive Lightbox Modal with AnimatePresence */}
      <AnimatePresence>
        {activeLightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
          >
            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveLightboxItem(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-20"
              aria-label="Close Lightbox"
            >
              <X className="w-6 h-6" />
            </motion.button>

            {/* Prev Image Button */}
            {filteredItems.length > 1 && (
              <motion.button
                whileHover={{ scale: 1.1, x: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/85 border border-[#2A261F] text-white hover:text-[#C9A45C] transition-colors z-20 backdrop-blur-sm"
                aria-label="Previous Image"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
            )}

            {/* Next Image Button */}
            {filteredItems.length > 1 && (
              <motion.button
                whileHover={{ scale: 1.1, x: 2 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/85 border border-[#2A261F] text-white hover:text-[#C9A45C] transition-colors z-20 backdrop-blur-sm"
                aria-label="Next Image"
              >
                <ChevronRight className="w-6 h-6" />
              </motion.button>
            )}

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.35, ease: luxuryEase }}
              className="max-w-4xl w-full max-h-[90vh] flex flex-col items-center z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-[#2A261F] shadow-2xl bg-[#0B0B0A]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeLightboxItem.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="w-full h-full relative"
                  >
                    <Image
                      src={activeLightboxItem.imageUrl}
                      alt={`${activeLightboxItem.title} - Meghani Watch Co. Horological Gallery`}
                      fill
                      priority
                      sizes="100vw"
                      className="object-cover object-center"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="w-full mt-4 p-5 rounded-xl bg-[#171613] border border-[#2A261F] text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                <div>
                  <span className="text-[10px] text-[#C9A45C] font-bold uppercase tracking-widest block">
                    {activeLightboxItem.category} • {currentIndex + 1} of {filteredItems.length}
                  </span>
                  <h3 className="font-serif text-lg sm:text-xl font-normal text-[#F3EFE6]">
                    {activeLightboxItem.title}
                  </h3>
                  <p className="text-xs text-[#8D8980] mt-1 max-w-xl">
                    {activeLightboxItem.details || activeLightboxItem.caption}
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveLightboxItem(null)}
                  className="px-5 py-2 rounded-lg bg-[#0B0B0A] border border-[#2A261F] hover:border-[#C9A45C]/50 text-xs font-semibold text-[#8D8980] hover:text-[#F3EFE6] transition-colors"
                >
                  Close View
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}