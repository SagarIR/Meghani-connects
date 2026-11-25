'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Watch,
  ArrowRight,
  ShieldCheck,
  Award,
  Sparkles,
  Clock,
  MapPin,
  MessageCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import {
  PUBLIC_BRANDS,
  PUBLIC_CATEGORIES,
  PUBLIC_OFFERS,
  PUBLIC_GALLERY,
  MEGHANI_STORE_INFO,
  getPublicProducts,
  getPublicBrands,
  getPublicCategories
} from '@/services/publicCatalogue';
import { PublicProduct, BrandItem, CategoryItem, BusinessStoreInfo } from '@/types/public';
import ProductCard from '@/components/public/ProductCard';

interface HomeClientProps {
  featuredProducts: PublicProduct[];
  generalWhatsAppUrl: string;
  brands?: BrandItem[];
  categories?: CategoryItem[];
  storeInfo?: BusinessStoreInfo;
}

const luxuryEase = [0.16, 1, 0.3, 1] as const;

export default function HomeClient({
  featuredProducts,
  generalWhatsAppUrl,
  brands = PUBLIC_BRANDS,
  categories = PUBLIC_CATEGORIES,
  storeInfo = MEGHANI_STORE_INFO
}: HomeClientProps) {
  const [displayProducts, setDisplayProducts] = useState<PublicProduct[]>(featuredProducts);
  const [displayBrands, setDisplayBrands] = useState<BrandItem[]>(brands);
  const [displayCategories, setDisplayCategories] = useState<CategoryItem[]>(categories);

  useEffect(() => {
    let isMounted = true;
    getPublicProducts({ featured: true, pageSize: 6 })
      .then((res) => {
        if (isMounted && res.results && res.results.length > 0) {
          setDisplayProducts(res.results);
        }
      })
      .catch(() => {});

    getPublicBrands()
      .then((b) => {
        if (isMounted && b && b.length > 0) setDisplayBrands(b);
      })
      .catch(() => {});

    getPublicCategories()
      .then((c) => {
        if (isMounted && c && c.length > 0) setDisplayCategories(c);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);
  return (
    <>
      {/* Hero Section */}
      <section
        className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#0B0B0A] border-b border-[#1C1A15]"
      >
        {/* Background Atmosphere */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=2000"
            alt="Meghani Watch Co. Watch Craftsmanship"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0A] via-[#0B0B0A]/85 to-[#0B0B0A]/70" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#C9A45C]/15 via-transparent to-transparent pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-24 sm:py-32 text-center flex flex-col items-center">
          {/* Heritage Tagline Pill */}
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: luxuryEase }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#171613] border border-[#2A261F] text-[#E8D5A7] text-xs font-medium uppercase tracking-[0.2em] mb-8 shadow-xl"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C9A45C]" />
            <span>Trusted Watch Store in Vadodara • Since 1984</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: luxuryEase }}
            className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-[#F3EFE6] max-w-4xl leading-[1.12]"
          >
            Where Time Meets <br className="hidden sm:inline" />
            <motion.span
              initial={{ backgroundPosition: '200% center' }}
              animate={{ backgroundPosition: '0% center' }}
              transition={{ duration: 1.8, delay: 0.4, ease: luxuryEase }}
              className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#C9A45C] via-[#F3EFE6] to-[#C9A45C] inline-block"
            >
              Timeless Style.
            </motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.3, ease: luxuryEase }}
            className="mt-6 text-sm sm:text-base lg:text-lg text-[#8D8980] max-w-2xl leading-relaxed font-sans"
          >
            Explore authentic watches from Titan, Casio, Timex, Citizen, and more. Visit our Vadodara showroom for men&apos;s watches, women&apos;s watches, smartwatches, and expert watch repair.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.45, ease: luxuryEase }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/shop"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#C9A45C] hover:bg-[#E8D5A7] text-[#0B0B0A] font-semibold text-xs uppercase tracking-widest shadow-xl shadow-[#C9A45C]/15 transition-colors flex items-center justify-center gap-2 font-sans"
              >
                <span>Explore Watches</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <a
                href={generalWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#171613] text-[#F3EFE6] border border-[#2A261F] hover:border-[#C9A45C] hover:text-[#C9A45C] font-medium text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-lg font-sans"
              >
                <MessageCircle className="w-4 h-4 text-[#C9A45C]" />
                <span>Enquire on WhatsApp</span>
              </a>
            </motion.div>
          </motion.div>

          {/* Heritage Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.6, ease: luxuryEase }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 pt-10 border-t border-[#1C1A15] max-w-4xl w-full text-center"
          >
            <div>
              <span className="font-serif text-2xl sm:text-3xl font-medium text-[#C9A45C] block">
                40+ Years
              </span>
              <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block mt-1 font-sans">
                Heritage & Trust
              </span>
            </div>
            <div>
              <span className="font-serif text-2xl sm:text-3xl font-medium text-[#C9A45C] block">
                100%
              </span>
              <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block mt-1 font-sans">
                Genuine Watches
              </span>
            </div>
            <div>
              <span className="font-serif text-2xl sm:text-3xl font-medium text-[#C9A45C] block">
                50,000+
              </span>
              <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block mt-1 font-sans">
                Happy Customers
              </span>
            </div>
            <div>
              <span className="font-serif text-2xl sm:text-3xl font-medium text-[#C9A45C] block">
                Official
              </span>
              <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block mt-1 font-sans">
                Brand Warranty
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Watches Section */}
      <section className="py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: luxuryEase }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12"
        >
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-[#C9A04F] font-semibold uppercase tracking-[0.2em] mb-2">
              <Watch className="w-4 h-4" />
              Handpicked Watches
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F0E6]">
              Featured Watches
            </h2>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: luxuryEase }}
              className="h-0.5 w-24 bg-gradient-to-r from-[#C9A45C] to-transparent origin-left mt-2.5"
            />
            <p className="text-xs sm:text-sm text-[#8E877A] mt-2 max-w-xl">
              Handpicked wristwatches with trusted accuracy, durable build, timeless design, and official manufacturer warranty.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#C9A04F] hover:text-[#DFC17B] uppercase tracking-wider group"
          >
            <span>Explore All Watches</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {displayProducts.map((product, idx) => (
            <ProductCard key={product.id} product={product} featured={product.is_featured} priority={idx < 3} />
          ))}
        </div>
      </section>

      {/* Category Discovery Banner */}
      <section className="py-20 bg-[#0E0E0E] border-y border-[#221F1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7, ease: luxuryEase }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <span className="text-xs text-[#C9A45C] font-medium uppercase tracking-[0.2em] block mb-2 font-sans">
              Popular Categories
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#F3EFE6]">
              Shop Watches by Category
            </h2>
            <div className="flex justify-center mt-2.5">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: luxuryEase }}
                className="h-0.5 w-16 bg-[#C9A45C]"
              />
            </div>
            <p className="text-xs sm:text-sm text-[#8D8980] mt-3 font-sans">
              Explore classic analog watches, sporty digitals, connected smartwatches, and decorative wall clocks.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {displayCategories.map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: idx * 0.08, ease: luxuryEase }}
                whileHover={{ y: -6, transition: { duration: 0.35, ease: luxuryEase } }}
              >
                <Link
                  href={`/shop?category=${cat.id}`}
                  className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-[#2A261F] hover:border-[#C9A45C]/50 transition-colors duration-500 flex flex-col justify-end p-5 shadow-lg bg-[#171613] block h-full"
                >
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    unoptimized={cat.imageUrl.endsWith('.svg')}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                    className={`object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out will-change-transform ${
                      cat.imageUrl.endsWith('.svg') ? 'opacity-80 group-hover:opacity-95' : 'opacity-40 group-hover:opacity-60'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0A] via-[#0B0B0A]/60 to-transparent" />

                  <div className="relative z-10">
                    <span className="text-[10px] text-[#C9A45C] uppercase tracking-widest font-medium block mb-1 font-sans">
                      {cat.count}+ Watches
                    </span>
                    <h3 className="font-serif text-lg font-medium text-[#F3EFE6] group-hover:text-[#E8D5A7] transition-colors leading-snug">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-[#8D8980] mt-1 line-clamp-2 font-sans leading-relaxed">
                      {cat.tagline}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#C9A45C] font-medium mt-3 group-hover:translate-x-1.5 transition-transform duration-300 font-sans">
                      <span>Explore Watches</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Showcase Section */}
      <section className="py-24 sm:py-32 px-4 sm:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: luxuryEase }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-xs text-[#C9A45C] font-medium uppercase tracking-[0.2em] block mb-2 font-sans">
            Trusted Brands
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#F3EFE6]">
            Our Watch Brands
          </h2>
          <div className="flex justify-center mt-2.5">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: luxuryEase }}
              className="h-0.5 w-16 bg-[#C9A45C]"
            />
          </div>
          <p className="text-xs sm:text-sm text-[#8D8980] mt-3 font-sans">
            Every watch in our collection is 100% original, backed by official brand warranty and manufacturer support.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {displayBrands.map((brand, idx) => (
            <motion.div
              key={brand.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: idx * 0.05, ease: luxuryEase }}
              whileHover={{ y: -4, transition: { duration: 0.25, ease: luxuryEase } }}
            >
              <Link
                href={`/shop?brand=${brand.name}`}
                className="group p-5 rounded-xl bg-[#171613] border border-[#2A261F] hover:border-[#C9A45C]/50 transition-colors flex flex-col items-center justify-center text-center shadow-md h-full block"
              >
                <div className="w-12 h-12 rounded-full bg-[#201D17] border border-[#2A261F] flex items-center justify-center text-[#C9A45C] mb-3 group-hover:border-[#C9A45C]/50 group-hover:bg-[#C9A45C]/10 transition-colors">
                  <Watch className="w-5 h-5" />
                </div>
                <h4 className="font-serif text-sm font-medium text-[#F3EFE6] group-hover:text-[#E8D5A7] transition-colors">
                  {brand.name}
                </h4>
                <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block mt-1 font-sans">
                  {brand.country} • Est. {brand.established}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Heritage & Watchmaker Commitment Spotlight */}
      <section className="py-24 sm:py-32 bg-[#171613] border-t border-[#1C1A15]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Visual Box with Reveal */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.85, ease: luxuryEase }}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#2A261F] shadow-2xl group"
            >
              <Image
                src="https://images.pexels.com/photos/277319/pexels-photo-277319.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Meghani Watch Co. Watchmaker Workshop in Vadodara"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out will-change-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0A]/85 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-[#141310]/95 backdrop-blur-md border border-[#2A261F]">
                <div className="flex items-center gap-3">
                  <Award className="w-6 h-6 text-[#C9A45C] shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-[#F3EFE6] block">
                      Expert Watch Repair Workshop
                    </span>
                    <span className="text-[11px] text-[#8D8980] block font-sans">
                      Complete diagnostic, battery replacement, and pressure testing equipment
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Narrative Box with Staggered Entrance */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.85, ease: luxuryEase }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[#C9A45C] uppercase tracking-[0.2em] font-sans">
                <Clock className="w-4 h-4" />
                Why Choose Us
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#F3EFE6] leading-tight">
                40+ Years of Quality & Trust in Vadodara
              </h2>

              <p className="text-xs sm:text-sm text-[#8D8980] leading-relaxed font-sans">
                Founded in 1984 in Vadodara, Gujarat, Meghani Watch Co. began with a clear purpose: to offer genuine brand watches with honest advice, fair prices, and reliable after-sales support.
              </p>

              <div className="space-y-3.5 pt-2 font-sans">
                {[
                  {
                    strong: '100% Genuine Brand Watches:',
                    text: 'All watches come with official company warranty cards, tax invoices, and manufacturer packaging.'
                  },
                  {
                    strong: 'Expert Watch Repair & Servicing:',
                    text: 'In-house battery changes, strap replacement, ultrasonic cleaning, and mechanical servicing.'
                  },
                  {
                    strong: 'Friendly Customer Support:',
                    text: 'Personal assistance on WhatsApp and in our showroom to help you choose the right watch.'
                  }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.15 * idx, ease: luxuryEase }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#C9A45C] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#8D8980]">
                      <strong className="text-[#F3EFE6] font-medium">{item.strong}</strong> {item.text}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="pt-4 flex items-center gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/about"
                    className="px-6 py-3 rounded-xl bg-[#201D17] border border-[#2A261F] hover:border-[#C9A45C]/40 text-[#E8D5A7] hover:bg-[#C9A45C] hover:text-[#0B0B0A] text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-2 font-sans"
                  >
                    <span>Read Our Story</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>

                <Link
                  href="/contact"
                  className="text-xs text-[#8D8980] hover:text-[#F3EFE6] transition-colors font-sans"
                >
                  Visit Vadodara Showroom →
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Special Offers Banner */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: luxuryEase }}
          className="p-8 sm:p-14 rounded-2xl bg-[#171613] border border-[#2A261F] shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A45C]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <span className="px-3.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-[#201D17] text-[#E8D5A7] border border-[#C9A45C]/30 inline-block mb-4 font-sans">
              Special Offers
            </span>

            <h3 className="font-serif text-2xl sm:text-4xl font-medium text-[#F3EFE6]">
              {PUBLIC_OFFERS[0].title}
            </h3>

            <p className="text-xs sm:text-sm text-[#8D8980] mt-3 leading-relaxed font-sans">
              {PUBLIC_OFFERS[0].description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/offers"
                  className="px-6 py-3.5 rounded-xl bg-[#C9A45C] hover:bg-[#E8D5A7] text-[#0B0B0A] font-semibold text-xs uppercase tracking-wider transition-colors font-sans shadow-lg shadow-[#C9A45C]/10 inline-block"
                >
                  View All Special Offers
                </Link>
              </motion.div>

              <span className="text-xs text-[#8D8980] font-sans">
                {PUBLIC_OFFERS[0].validity} • Terms apply
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Visual Gallery Showcase */}
      <section className="py-24 sm:py-32 bg-[#0B0B0A] border-t border-[#1C1A15]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7, ease: luxuryEase }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12"
          >
            <div>
              <span className="text-xs text-[#C9A45C] font-medium uppercase tracking-[0.2em] block mb-2 font-sans">
                Showroom & Workshop
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#F3EFE6]">
                Watch Gallery
              </h2>
            </div>
            <Link
              href="/gallery"
              className="text-xs font-semibold text-[#C9A45C] hover:text-[#E8D5A7] uppercase tracking-wider inline-flex items-center gap-1.5 font-sans group"
            >
              <span>Explore Full Gallery</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {PUBLIC_GALLERY.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: idx * 0.06, ease: luxuryEase }}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                className="group relative aspect-square rounded-xl overflow-hidden border border-[#2A261F] shadow-md bg-[#171613]"
              >
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out opacity-80 group-hover:opacity-100 will-change-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <span className="text-[10px] text-[#F3EFE6] font-medium leading-tight font-sans">
                    {item.title}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Visit the Vadodara Boutique Section */}
      <section className="py-24 sm:py-32 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, ease: luxuryEase }}
          >
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#C9A45C] uppercase tracking-[0.2em] mb-3 font-sans">
              <MapPin className="w-4 h-4" />
              Visit Our Showroom
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#F3EFE6] leading-tight">
              Visit Our Watch Showroom in Vadodara
            </h2>

            <p className="text-xs sm:text-sm text-[#8D8980] mt-4 leading-relaxed font-sans">
              Step into our showroom on New Sama Road for a friendly, unhurried watch shopping experience. Our team is here to help you select the ideal watch or service your existing timepieces.
            </p>

            <div className="mt-8 space-y-4 border-l-2 border-[#C9A45C]/40 pl-4 text-xs font-sans">
              <div>
                <span className="text-[#F3EFE6] font-medium block text-sm">Showroom Address</span>
                <p className="text-[#8D8980] mt-1 leading-relaxed">
                  {storeInfo.address.line1}<br />
                  {storeInfo.address.line2}, {storeInfo.address.city} – {storeInfo.address.pincode}
                </p>
              </div>

              <div>
                <span className="text-[#F3EFE6] font-medium block text-sm">Showroom Timings</span>
                <p className="text-[#8D8980] mt-1">
                  {storeInfo.hours.weekdays}<br />
                  {storeInfo.hours.sunday}
                </p>
              </div>

              <div>
                <span className="text-[#F3EFE6] font-medium block text-sm">Direct Contact</span>
                <p className="text-[#8D8980] mt-1">
                  Telephone: {storeInfo.phone}<br />
                  Email: {storeInfo.email}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/contact"
                  className="px-6 py-3.5 rounded-xl bg-[#C9A45C] hover:bg-[#E8D5A7] text-[#0B0B0A] font-semibold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-[#C9A45C]/20 font-sans inline-block"
                >
                  Contact Us & Visit Store
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <a
                  href={storeInfo.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-xl bg-[#171613] text-[#F3EFE6] border border-[#2A261F] hover:border-[#C9A45C] text-xs font-medium uppercase tracking-wider transition-colors font-sans inline-block"
                >
                  Get Directions on Google Maps
                </a>
              </motion.div>
            </div>
          </motion.div>

          {/* Interactive Google Map Embed */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, ease: luxuryEase }}
            className="aspect-[4/3] rounded-2xl overflow-hidden border border-[#2A261F] shadow-2xl relative bg-[#171613]"
          >
            <iframe
              src={storeInfo.googleMapsEmbedSrc}
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'grayscale(0.6) invert(0.9) contrast(1.2)' }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Meghani Watch Co. Store Location in Vadodara"
            />
          </motion.div>
        </div>
      </section>
    </>
  );
}