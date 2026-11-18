'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Search,
  RotateCcw,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Layers
} from 'lucide-react';
import { CategoryItem, PublicProduct } from '@/types/public';
import ProductCard from '@/components/public/ProductCard';
import Breadcrumbs from '@/components/public/Breadcrumbs';

interface CategoryDetailClientProps {
  category: CategoryItem;
  products: PublicProduct[];
  whatsappNumber: string;
}

const luxuryEase = [0.16, 1, 0.3, 1] as const;

export default function CategoryDetailClient({
  category,
  products,
  whatsappNumber
}: CategoryDetailClientProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'newest'>('featured');

  // Available brands within this category
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach((p) => {
      if (p.brand) brands.add(p.brand);
    });
    return Array.from(brands);
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (selectedBrand !== 'all' && p.brand !== selectedBrand) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchBrand = p.brand.toLowerCase().includes(q);
          const matchDesc = p.description?.toLowerCase().includes(q);
          if (!matchName && !matchBrand && !matchDesc) return false;
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
  }, [products, selectedBrand, searchQuery, sortBy]);

  const categoryWhatsAppUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hello Meghani Watch Co., I am inquiring about your ${category.name} collection at your Vadodara showroom. Please guide me on available options.`
  )}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Watch Categories', href: '/categories' },
          { label: category.name }
        ]}
      />

      {/* Category Editorial Hero Banner */}
      <section className="relative my-8 rounded-3xl overflow-hidden border border-[#2A261F] bg-[#171613] shadow-2xl">
        <div className="relative aspect-[21/9] min-h-[340px] sm:min-h-[420px] w-full">
          <Image
            src={category.imageUrl}
            alt={`${category.name} Collection — Meghani Watch Co.`}
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
                <Layers className="w-3.5 h-3.5 text-[#C9A45C]" />
                Curated Collection
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#1F1E1A]/80 text-[#E8D5A7] border border-[#2A261F] backdrop-blur-md">
                {products.length} Timepieces Available
              </span>
            </motion.div>

            {/* Category Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: luxuryEase }}
              className="font-serif text-4xl sm:text-6xl font-normal text-[#F3EFE6] tracking-tight leading-none"
            >
              {category.name}
            </motion.h1>

            {/* Tagline */}
            {category.tagline && (
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: luxuryEase }}
                className="text-sm sm:text-base text-[#C9A45C] font-medium tracking-wide mt-2"
              >
                {category.tagline}
              </motion.p>
            )}

            {/* Narrative Description */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: luxuryEase }}
              className="text-xs sm:text-sm text-[#8D8980] mt-3 leading-relaxed max-w-2xl line-clamp-3 sm:line-clamp-none"
            >
              {category.description}
            </motion.p>

            {/* Feature Highlights */}
            {category.features && category.features.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4, ease: luxuryEase }}
                className="flex flex-wrap items-center gap-3 mt-4 pt-2 border-t border-[#2A261F]/60"
              >
                {category.features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="text-xs text-[#E8D5A7] inline-flex items-center gap-1.5 bg-[#1F1E1A]/60 px-3 py-1 rounded-lg border border-[#2A261F]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A45C]" />
                    {feat}
                  </span>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Control Bar: Brand Pills, Search & Sort */}
      <div className="py-6 border-b border-[#2A261F] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedBrand('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
              selectedBrand === 'all'
                ? 'bg-[#C9A45C] text-[#0B0B0A] shadow-md shadow-[#C9A45C]/20'
                : 'bg-[#171613] text-[#8D8980] hover:text-[#F3EFE6] border border-[#2A261F]'
            }`}
          >
            All Brands ({products.length})
          </button>
          {availableBrands.map((brandName) => (
            <button
              key={brandName}
              onClick={() => setSelectedBrand(brandName)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                selectedBrand === brandName
                  ? 'bg-[#C9A45C] text-[#0B0B0A] shadow-md shadow-[#C9A45C]/20'
                  : 'bg-[#171613] text-[#8D8980] hover:text-[#F3EFE6] border border-[#2A261F]'
              }`}
            >
              {brandName}
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
              placeholder={`Search ${category.name}...`}
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

      {/* Results Counter */}
      <div className="py-4 flex items-center justify-between text-xs text-[#8D8980]">
        <span>
          Showing {filteredProducts.length} of {products.length} {category.name}
        </span>
        {(selectedBrand !== 'all' || searchQuery) && (
          <button
            onClick={() => {
              setSelectedBrand('all');
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
            No {category.name} matched your selected brand or search criteria.
          </p>
          <p className="text-xs text-[#8D8980] max-w-md mx-auto">
            Try resetting your filters or chat directly with our boutique watch concierge.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => {
                setSelectedBrand('all');
                setSearchQuery('');
              }}
              className="px-5 py-2.5 rounded-xl bg-[#C9A45C] text-[#0B0B0A] font-semibold text-xs uppercase tracking-wider hover:brightness-105 transition-all"
            >
              View All {category.name}
            </button>
            <a
              href={categoryWhatsAppUrl}
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

      {/* Boutique Advice & Guarantee Callout */}
      <section className="mt-20 p-8 sm:p-12 rounded-3xl bg-[#171613] border border-[#2A261F] relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <span className="text-xs text-[#C9A45C] font-semibold uppercase tracking-[0.25em] block">
            Boutique Services & Guarantee
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#F3EFE6]">
            Expert Watchmaker Consultation & Sizing in Vadodara
          </h2>
          <p className="text-xs sm:text-sm text-[#8D8980] leading-relaxed">
            Need guidance choosing between quartz precision, automatic mechanical movements, or light-powered solar watches? Visit our boutique on New Sama Road, Vadodara, or contact our horological advisors for personalized assistance and free strap adjustment.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-6">
            <a
              href={categoryWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <MessageCircle className="w-4 h-4 text-[#0B0B0A]" />
              <span>Ask Our Watchmaker on WhatsApp</span>
            </a>
            <Link
              href="/categories"
              className="text-xs font-semibold text-[#8D8980] hover:text-[#C9A45C] uppercase tracking-[0.15em] inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Explore All Watch Categories</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
