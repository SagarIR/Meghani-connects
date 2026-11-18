'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Calendar,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  RotateCcw,
  MessageCircle,
  ArrowRight,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { BrandItem, PublicProduct, ProductCategory } from '@/types/public';
import ProductCard from '@/components/public/ProductCard';
import Breadcrumbs from '@/components/public/Breadcrumbs';

interface BrandDetailClientProps {
  brand: BrandItem;
  products: PublicProduct[];
  whatsappNumber: string;
}

const luxuryEase = [0.16, 1, 0.3, 1] as const;

export default function BrandDetailClient({
  brand,
  products,
  whatsappNumber
}: BrandDetailClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'newest'>('featured');

  // Available categories within this brand's product catalog
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => cats.add(p.category));
    return Array.from(cats);
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchDesc = p.description?.toLowerCase().includes(q);
          const matchBarcode = p.barcode?.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchBarcode) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') {
          return (a.price ?? 999999) - (b.price ?? 999999);
        }
        if (sortBy === 'price_desc') {
          return (b.price ?? 0) - (a.price ?? 0);
        }
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const generalBrandWhatsAppUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hello Meghani Watch Co., I am inquiring about your ${brand.name} collection at your Vadodara showroom. Please share details on available models and pricing.`
  )}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Watch Brands', href: '/brands' },
          { label: brand.name }
        ]}
      />

      {/* Brand Editorial Hero Banner */}
      <section className="relative my-8 rounded-3xl overflow-hidden border border-[#2A261F] bg-[#171613] shadow-2xl">
        <div className="relative aspect-[21/9] min-h-[340px] sm:min-h-[420px] w-full">
          <Image
            src={brand.heroImage}
            alt={`${brand.name} Watches Collection — Meghani Watch Co.`}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-30 brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0A] via-[#0B0B0A]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0A] via-[#0B0B0A]/70 to-transparent" />

          {/* Hero Content Overlay */}
          <div className="absolute inset-0 p-6 sm:p-12 lg:p-16 flex flex-col justify-end max-w-4xl">
            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: luxuryEase }}
              className="flex flex-wrap items-center gap-3 mb-4"
            >
              <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-[0.2em] bg-[#0B0B0A]/90 text-[#C9A45C] border border-[#C9A45C]/40 backdrop-blur-md inline-flex items-center gap-1.5 shadow-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C9A45C]" />
                Official Authorized Retailer
              </span>
              {brand.country && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#1F1E1A]/80 text-[#E8D5A7] border border-[#2A261F] backdrop-blur-md inline-flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-[#C9A45C]" />
                  {brand.country}
                </span>
              )}
              {brand.established && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#1F1E1A]/80 text-[#8D8980] border border-[#2A261F] backdrop-blur-md inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#C9A45C]" />
                  Est. {brand.established}
                </span>
              )}
            </motion.div>

            {/* Brand Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: luxuryEase }}
              className="font-serif text-4xl sm:text-6xl font-normal text-[#F3EFE6] tracking-tight leading-none"
            >
              {brand.name}
            </motion.h1>

            {/* Tagline */}
            {brand.tagline && (
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: luxuryEase }}
                className="text-sm sm:text-base text-[#C9A45C] font-medium tracking-wide mt-2"
              >
                {brand.tagline}
              </motion.p>
            )}

            {/* Narrative Description */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: luxuryEase }}
              className="text-xs sm:text-sm text-[#8D8980] mt-3 leading-relaxed max-w-2xl line-clamp-3 sm:line-clamp-none"
            >
              {brand.description}
            </motion.p>
          </div>
        </div>
      </section>

      {/* Brand Portfolio Control Bar: Filters, Search & Sort */}
      <div className="py-6 border-b border-[#2A261F] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
              selectedCategory === 'all'
                ? 'bg-[#C9A45C] text-[#0B0B0A] shadow-md shadow-[#C9A45C]/20'
                : 'bg-[#171613] text-[#8D8980] hover:text-[#F3EFE6] border border-[#2A261F]'
            }`}
          >
            All {brand.name} ({products.length})
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-[#C9A45C] text-[#0B0B0A] shadow-md shadow-[#C9A45C]/20'
                  : 'bg-[#171613] text-[#8D8980] hover:text-[#F3EFE6] border border-[#2A261F]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#8D8980] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${brand.name}...`}
              className="pl-9 pr-4 py-2 bg-[#12110F] border border-[#2A261F] rounded-xl text-xs text-[#F3EFE6] placeholder-[#8D8980] focus:outline-none focus:border-[#C9A45C] focus:ring-1 focus:ring-[#C9A45C] transition-all w-full sm:w-56"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8D8980] hover:text-[#F3EFE6]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3.5 py-2 bg-[#12110F] border border-[#2A261F] rounded-xl text-xs text-[#F3EFE6] focus:outline-none focus:border-[#C9A45C] cursor-pointer"
          >
            <option value="featured">Featured First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Latest Arrivals</option>
          </select>
        </div>
      </div>

      {/* Product Results Counter */}
      <div className="py-4 flex items-center justify-between text-xs text-[#8D8980]">
        <span>
          Showing {filteredProducts.length} of {products.length} {brand.name} timepieces
        </span>
        {(selectedCategory !== 'all' || searchQuery) && (
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="inline-flex items-center gap-1 text-[#C9A45C] hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Filters
          </button>
        )}
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center rounded-2xl bg-[#171613] border border-[#2A261F] my-8 p-8 space-y-4">
          <p className="text-base text-[#F3EFE6] font-serif">
            No {brand.name} watches matched your current filters.
          </p>
          <p className="text-xs text-[#8D8980] max-w-md mx-auto">
            Try adjusting your search query or view all available timepieces from {brand.name}.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-5 py-2.5 rounded-xl bg-[#C9A45C] text-[#0B0B0A] font-semibold text-xs uppercase tracking-wider hover:brightness-105 transition-all"
            >
              View All {brand.name}
            </button>
            <a
              href={generalBrandWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-[#1F1E1A] text-[#E8D5A7] border border-[#2A261F] font-semibold text-xs uppercase tracking-wider hover:border-[#C9A45C]/40 inline-flex items-center gap-2 transition-all"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              Inquire on WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Brand Heritage & Guarantee Callout */}
      <section className="mt-20 p-8 sm:p-12 rounded-3xl bg-[#171613] border border-[#2A261F] relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <span className="text-xs text-[#C9A45C] font-semibold uppercase tracking-[0.25em] block">
            The Meghani Guarantee
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#F3EFE6]">
            Every {brand.name} Watch is 100% Genuine & Covered by Official Warranty
          </h2>
          <p className="text-xs sm:text-sm text-[#8D8980] leading-relaxed">
            As an authorized retail partner in Vadodara, every {brand.name} watch purchased at Meghani Watch Co. comes with an official stamped warranty card, authentic brand presentation box, original tax invoice, and lifetime after-sales sizing and maintenance support at our workshop.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-6">
            <a
              href={generalBrandWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <MessageCircle className="w-4 h-4 text-[#0B0B0A]" />
              <span>Inquire About {brand.name} Models</span>
            </a>
            <Link
              href="/brands"
              className="text-xs font-semibold text-[#8D8980] hover:text-[#C9A45C] uppercase tracking-[0.15em] inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Explore All Authorized Brands</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
