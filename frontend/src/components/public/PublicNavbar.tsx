'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MessageCircle,
  Menu,
  X,
  Phone,
  Clock,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  UserCheck,
  Sparkles,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { MEGHANI_STORE_INFO, PUBLIC_BRANDS, PUBLIC_CATEGORIES } from '@/services/publicCatalogue';
import { BusinessStoreInfo, BrandItem, CategoryItem } from '@/types/public';

interface PublicNavbarProps {
  storeInfo?: BusinessStoreInfo;
  brands?: BrandItem[];
  categories?: CategoryItem[];
}

export default function PublicNavbar({
  storeInfo = MEGHANI_STORE_INFO,
  brands = PUBLIC_BRANDS,
  categories = PUBLIC_CATEGORIES,
}: PublicNavbarProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<'brands' | 'categories' | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // High-performance scroll listener throttled with requestAnimationFrame & passive flag
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  const handleMouseEnter = (type: 'brands' | 'categories') => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveDropdown(type);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const quickSearchTags = [
    'Titan Edge',
    'Citizen Eco-Drive',
    'G-Shock',
    'Timex Automatic',
    'Chronograph',
    'Wall Clocks'
  ];

  return (
    <>
      {/* Top Pre-Header Bar */}
      <div className="bg-[#080807] border-b border-[#1C1A15] text-[11px] text-[#8D8980] py-2 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Credibility & Boutique Hours */}
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="flex items-center gap-1.5 text-[#C9A45C] font-medium tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C9A45C]" />
              <span>100% Original Watches • Titan, Casio, Citizen, Timex & More</span>
            </span>
            <span className="hidden lg:inline-block text-[#2A261F]">|</span>
            <span className="hidden lg:flex items-center gap-1.5 text-[#8D8980]">
              <Clock className="w-3.5 h-3.5 text-[#C9A45C]" />
              <span>{storeInfo.hours.weekdays}</span>
            </span>
          </div>

          {/* Right: Hotline & Staff Link */}
          <div className="flex items-center gap-3 sm:gap-4 ml-auto sm:ml-0">
            <a
              href={`tel:${storeInfo.phone}`}
              className="flex items-center gap-1.5 text-[#A8A194] hover:text-[#E8D5A7] transition-colors"
            >
              <Phone className="w-3 h-3 text-[#C9A45C]" />
              <span className="tracking-wide">
                <span className="hidden sm:inline text-[#6E6960]">Call Us: </span>
                {storeInfo.phone}
              </span>
            </a>
            <span className="text-[#2A261F]">|</span>
            <Link
              href="/login"
              className="flex items-center gap-1 text-[#8D8980] hover:text-[#C9A45C] transition-colors tracking-wider uppercase font-semibold text-[10px]"
              title="Staff Portal (Meghani Connect 360 ERP)"
            >
              <UserCheck className="w-3 h-3 text-[#C9A45C]" />
              <span>Staff Portal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Luxury Navigation Bar */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0B0B0A]/95 backdrop-blur-xl shadow-2xl border-b border-[#2A261F] py-3.5'
            : 'bg-[#0B0B0A] border-b border-[#1C1A15] py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
          {/* Brand Logo & Identity */}
          <Link href="/" className="flex items-center gap-3.5 group shrink-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#201C14] via-[#14130F] to-[#0B0B0A] border border-[#C9A45C]/40 flex items-center justify-center shadow-lg shadow-[#C9A45C]/10 group-hover:border-[#C9A45C] group-hover:shadow-[#C9A45C]/20 transition-all overflow-hidden p-0.5">
              <Image
                src="/images/gold-m-emblem.png"
                alt="Meghani Watch Co."
                width={48}
                height={48}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl sm:text-2xl font-medium tracking-[0.2em] text-[#F3EFE6] uppercase leading-none group-hover:text-[#E8D5A7] transition-colors">
                MEGHANI
              </span>
              <span className="text-[9px] sm:text-[10px] font-sans tracking-[0.3em] text-[#C9A45C] uppercase font-semibold mt-1">
                WATCH CO. • EST. 1984
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links (Single line, no wrap, luxury micro-typography) */}
          <nav className="hidden xl:flex items-center gap-1 2xl:gap-2">
            {/* 1. Home */}
            <Link
              href="/"
              className={`px-3 py-2 text-xs font-medium tracking-[0.12em] uppercase whitespace-nowrap transition-all rounded-md relative ${
                pathname === '/'
                  ? 'text-[#C9A45C] font-semibold'
                  : 'text-[#8D8980] hover:text-[#E8D5A7] hover:bg-white/[0.03]'
              }`}
            >
              Home
              {pathname === '/' && (
                <motion.span
                  layoutId="publicActiveNav"
                  className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#C9A45C] rounded-full"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                />
              )}
            </Link>

            {/* 2. Catalogue */}
            <Link
              href="/shop"
              className={`px-3 py-2 text-xs font-medium tracking-[0.12em] uppercase whitespace-nowrap transition-all rounded-md relative ${
                pathname.startsWith('/shop')
                  ? 'text-[#C9A45C] font-semibold'
                  : 'text-[#8D8980] hover:text-[#E8D5A7] hover:bg-white/[0.03]'
              }`}
            >
              Shop Watches
              {pathname.startsWith('/shop') && (
                <motion.span
                  layoutId="publicActiveNav"
                  className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#C9A45C] rounded-full"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                />
              )}
            </Link>

            {/* 3. Brands (With Luxury Mega Dropdown) */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('brands')}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                href="/brands"
                className={`px-3 py-2 text-xs font-medium tracking-[0.12em] uppercase whitespace-nowrap transition-all rounded-md inline-flex items-center gap-1 relative ${
                  pathname.startsWith('/brands')
                    ? 'text-[#C9A45C] font-semibold'
                    : 'text-[#8D8980] hover:text-[#E8D5A7] hover:bg-white/[0.03]'
                }`}
              >
                <span>Brands</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === 'brands' ? 'rotate-180 text-[#C9A45C]' : 'text-[#8D8980]'
                  }`}
                />
                {pathname.startsWith('/brands') && (
                  <motion.span
                    layoutId="publicActiveNav"
                    className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#C9A45C] rounded-full"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                  />
                )}
              </Link>

              {/* Brands Mega Flyout with Framer Motion AnimatePresence */}
              <AnimatePresence>
                {activeDropdown === 'brands' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-full left-1/2 -translate-x-1/4 w-[600px] pt-3 z-[100]"
                  >
                    {/* Invisible Bridge to prevent mouseleave jitter */}
                    <div className="absolute top-0 left-0 right-0 h-3" />
                    
                    <div className="bg-[#141310] border border-[#2A261F] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.98)] overflow-hidden">
                      {/* Top Gold Accent Line */}
                      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#C9A45C] to-transparent" />

                      <div className="p-5">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#221E17]">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#C9A45C]" />
                            <span className="text-[11px] font-bold text-[#F3EFE6] uppercase tracking-[0.15em]">
                              Our Watch Brands
                            </span>
                          </div>
                          <span className="text-[10px] text-[#8D8980] tracking-wider uppercase font-medium">
                            Vadodara • Est. 1984
                          </span>
                        </div>

                        {/* Content Grid: Brands List (Left) + Atelier Spotlight (Right) */}
                        <div className="grid grid-cols-12 gap-5">
                          {/* Brands Grid (7 cols) */}
                          <div className="col-span-7 grid grid-cols-2 gap-2">
                            {brands.slice(0, 6).map((brand) => (
                              <Link
                                key={brand.slug}
                                href={`/shop?brand=${brand.slug}`}
                                className="p-2.5 rounded-xl bg-[#171613] hover:bg-[#1E1C17] border border-[#2A261F] hover:border-[#C9A45C]/40 transition-all group"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-serif text-sm font-medium text-[#F3EFE6] group-hover:text-[#E8D5A7] transition-colors">
                                    {brand.name}
                                  </span>
                                  <ChevronRight className="w-3 h-3 text-[#5A5448] group-hover:text-[#C9A45C] group-hover:translate-x-0.5 transition-all" />
                                </div>
                                <span className="text-[10px] text-[#8D8980] block mt-0.5 font-sans">
                                  {brand.country} • Est. {brand.established}
                                </span>
                              </Link>
                            ))}
                          </div>

                          {/* Atelier Spotlight Card (5 cols) */}
                          <div className="col-span-5 bg-gradient-to-br from-[#171613] to-[#0F0E0C] border border-[#2A261F] rounded-xl p-4 flex flex-col justify-between">
                            <div>
                              <span className="text-[9px] font-semibold tracking-[0.2em] text-[#C9A45C] uppercase block mb-1.5 font-sans">
                                Vadodara Showroom
                              </span>
                              <h4 className="font-serif text-sm font-medium text-[#F3EFE6] leading-snug">
                                Meghani Watch Co. Showroom
                              </h4>
                              <p className="text-[11px] text-[#8D8980] leading-relaxed mt-1.5 font-sans">
                                Authorized retail partner for Titan, Casio, Citizen, Timex and more with official manufacturer warranty.
                              </p>
                            </div>

                            <Link
                              href="/brands"
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#C9A45C] hover:text-[#E8D5A7] uppercase tracking-wider mt-3 transition-colors"
                            >
                              <span>Explore All Brands</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Strip */}
                      <div className="bg-[#0C0B0A] px-5 py-2.5 border-t border-[#221E17] flex items-center justify-between text-[11px]">
                        <span className="text-[#8D8980]">100% original watches with official brand warranty</span>
                        <Link
                          href="/shop"
                          className="text-[#C9A45C] hover:text-[#E8D5A7] font-semibold tracking-wider uppercase transition-colors"
                        >
                          Explore All Watches →
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 4. Collections (With Luxury Mega Dropdown) */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('categories')}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                href="/categories"
                className={`px-3 py-2 text-xs font-medium tracking-[0.12em] uppercase whitespace-nowrap transition-all rounded-md inline-flex items-center gap-1 relative ${
                  pathname.startsWith('/categories')
                    ? 'text-[#C9A45C] font-semibold'
                    : 'text-[#8D8980] hover:text-[#E8D5A7] hover:bg-white/[0.03]'
                }`}
              >
                <span>Categories</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === 'categories' ? 'rotate-180 text-[#C9A45C]' : 'text-[#8D8980]'
                  }`}
                />
                {pathname.startsWith('/categories') && (
                  <motion.span
                    layoutId="publicActiveNav"
                    className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#C9A45C] rounded-full"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                  />
                )}
              </Link>

              {/* Collections Mega Flyout with Framer Motion AnimatePresence */}
              <AnimatePresence>
                {activeDropdown === 'categories' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-full left-1/2 -translate-x-1/2 w-[620px] pt-3 z-[100]"
                  >
                    {/* Invisible Bridge */}
                    <div className="absolute top-0 left-0 right-0 h-3" />

                    <div className="bg-[#141310] border border-[#2A261F] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.98)] overflow-hidden">
                      {/* Top Gold Accent Line */}
                      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#C9A45C] to-transparent" />

                      <div className="p-5">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#221E17]">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#C9A45C]" />
                            <span className="text-[11px] font-bold text-[#F3EFE6] uppercase tracking-[0.15em]">
                              Watch Categories
                            </span>
                          </div>
                          <span className="text-[10px] text-[#8D8980] tracking-wider uppercase font-medium">
                            Analog • Digital • Smart • Clocks
                          </span>
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-12 gap-5">
                          {/* Categories List (7 cols) */}
                          <div className="col-span-7 grid grid-cols-2 gap-2">
                            {categories.map((cat) => (
                              <Link
                                key={cat.id}
                                href={`/shop?category=${cat.id}`}
                                className="p-2.5 rounded-xl bg-[#171613] hover:bg-[#1E1C17] border border-[#2A261F] hover:border-[#C9A45C]/40 transition-all group"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-serif text-sm font-medium text-[#F3EFE6] group-hover:text-[#E8D5A7] transition-colors">
                                    {cat.name.replace(' Timepieces', '').replace(' Watches', '')}
                                  </span>
                                  <ChevronRight className="w-3 h-3 text-[#5A5448] group-hover:text-[#C9A45C] group-hover:translate-x-0.5 transition-all" />
                                </div>
                                <span className="text-[10px] text-[#8D8980] block mt-0.5 truncate font-sans">
                                  {cat.tagline}
                                </span>
                              </Link>
                            ))}
                          </div>

                          {/* Watchmaker Guarantee Spotlight Card (5 cols) */}
                          <div className="col-span-5 bg-gradient-to-br from-[#171613] to-[#0F0E0C] border border-[#2A261F] rounded-xl p-4 flex flex-col justify-between">
                            <div>
                              <span className="text-[9px] font-semibold tracking-[0.2em] text-[#C9A45C] uppercase block mb-1.5 font-sans">
                                Watch Service & Repair
                              </span>
                              <h4 className="font-serif text-sm font-medium text-[#F3EFE6] leading-snug">
                                Expert Watch Repair Workshop
                              </h4>
                              <p className="text-[11px] text-[#8D8980] leading-relaxed mt-1.5 font-sans">
                                Complete watch servicing, battery replacement, movement inspection, and water resistance testing by experienced technicians.
                              </p>
                            </div>

                            <Link
                              href="/categories"
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#C9A45C] hover:text-[#E8D5A7] uppercase tracking-wider mt-3 transition-colors"
                            >
                              <span>View All Categories</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Strip */}
                      <div className="bg-[#0C0B0A] px-5 py-2.5 border-t border-[#221E17] flex items-center justify-between text-[11px]">
                        <span className="text-[#8D8980]">Free watch strap sizing and battery replacement service</span>
                        <Link
                          href="/categories"
                          className="text-[#C9A45C] hover:text-[#E8D5A7] font-semibold tracking-wider uppercase transition-colors"
                        >
                          Explore All Categories →
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 5. Offers */}
            <Link
              href="/offers"
              className={`px-3 py-2 text-xs font-medium tracking-[0.12em] uppercase whitespace-nowrap transition-all rounded-md relative ${
                pathname === '/offers'
                  ? 'text-[#C9A45C] font-semibold'
                  : 'text-[#8D8980] hover:text-[#E8D5A7] hover:bg-white/[0.03]'
              }`}
            >
              Offers
              {pathname === '/offers' && (
                <motion.span
                  layoutId="publicActiveNav"
                  className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#C9A45C] rounded-full"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                />
              )}
            </Link>

            {/* 6. Gallery */}
            <Link
              href="/gallery"
              className={`px-3 py-2 text-xs font-medium tracking-[0.12em] uppercase whitespace-nowrap transition-all rounded-md relative ${
                pathname === '/gallery'
                  ? 'text-[#C9A45C] font-semibold'
                  : 'text-[#8D8980] hover:text-[#E8D5A7] hover:bg-white/[0.03]'
              }`}
            >
              Gallery
              {pathname === '/gallery' && (
                <motion.span
                  layoutId="publicActiveNav"
                  className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#C9A45C] rounded-full"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                />
              )}
            </Link>

            {/* 7. Heritage / Our Story */}
            <Link
              href="/about"
              className={`px-3 py-2 text-xs font-medium tracking-[0.12em] uppercase whitespace-nowrap transition-all rounded-md relative ${
                pathname === '/about'
                  ? 'text-[#C9A45C] font-semibold'
                  : 'text-[#8D8980] hover:text-[#E8D5A7] hover:bg-white/[0.03]'
              }`}
            >
              About Us
              {pathname === '/about' && (
                <motion.span
                  layoutId="publicActiveNav"
                  className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#C9A45C] rounded-full"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                />
              )}
            </Link>

            {/* 8. Boutique */}
            <Link
              href="/contact"
              className={`px-3 py-2 text-xs font-medium tracking-[0.12em] uppercase whitespace-nowrap transition-all rounded-md relative ${
                pathname === '/contact'
                  ? 'text-[#C9A45C] font-semibold'
                  : 'text-[#8D8980] hover:text-[#E8D5A7] hover:bg-white/[0.03]'
              }`}
            >
              Showroom & Contact
              {pathname === '/contact' && (
                <motion.span
                  layoutId="publicActiveNav"
                  className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#C9A45C] rounded-full"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                />
              )}
            </Link>
          </nav>

          {/* Right Action Cluster: Search & Mobile Toggle */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[#8D8980] hover:text-[#C9A45C] hover:bg-white/[0.04] border border-[#2A261F] hover:border-[#C9A45C]/50 transition-all active:scale-95"
              aria-label="Search Watches"
              title="Search Watches"
            >
              <Search className="w-4 h-4 text-[#C9A45C]" />
              <span className="text-xs font-medium tracking-[0.1em] uppercase text-[#F3EFE6]">
                Search
              </span>
            </button>

            {/* Mobile Hamburger Toggle (Visible below xl) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg text-[#F3EFE6] hover:bg-white/[0.05] border border-[#2A261F] transition-colors active:scale-95"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Expandable Luxury Search Drawer with Framer Motion AnimatePresence */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#141310] border-t border-b border-[#2A261F] py-4 px-4 sm:px-8 shadow-2xl overflow-hidden"
            >
              <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 bg-[#171613] border border-[#2A261F] rounded-xl px-4 py-2.5 shadow-inner focus-within:border-[#C9A45C] transition-all">
                  <Search className="w-5 h-5 text-[#C9A45C] shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search watches by brand (Titan, Casio, Citizen...), category, or model..."
                    className="w-full bg-transparent border-none text-[#F3EFE6] placeholder-[#8D8980] text-xs sm:text-sm focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#C9A45C] hover:bg-[#E8D5A7] text-[#0B0B0A] text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors shrink-0 active:scale-95"
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="p-1 text-[#8D8980] hover:text-white transition-colors"
                    aria-label="Close search"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </form>

                {/* Quick Suggestion Pills */}
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 text-xs">
                  <span className="text-[10px] text-[#8D8980] uppercase font-semibold tracking-wider">
                    Popular Searches:
                  </span>
                  {quickSearchTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSearchQuery(tag);
                        window.location.href = `/shop?search=${encodeURIComponent(tag)}`;
                      }}
                      className="px-2.5 py-1 rounded-full bg-[#171613] border border-[#2A261F] text-[#8D8980] hover:text-[#E8D5A7] hover:border-[#C9A45C]/50 text-[11px] transition-colors active:scale-95"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Drawer Menu with Framer Motion AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 xl:hidden">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Sliding Drawer Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm bg-[#111111] h-full border-l border-[#2E281E] p-6 flex flex-col justify-between overflow-y-auto z-10 shadow-2xl"
            >
              <div>
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-6 border-b border-[#242018]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1C1811] border border-[#C9A04F]/40 flex items-center justify-center p-0.5">
                      <Image
                        src="/images/gold-m-emblem.png"
                        alt="Meghani Watch Co."
                        width={40}
                        height={40}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <span className="font-serif text-lg font-bold tracking-[0.15em] text-[#F5F0E6] block">
                        MEGHANI
                      </span>
                      <span className="text-[8px] text-[#C9A04F] tracking-[0.25em] uppercase font-semibold">
                        Watch Co. • 1984
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-[#8E877A] hover:text-white"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Links with Staggered Entrance */}
                <div className="py-6 space-y-1.5">
                  {[
                    { label: 'Home', href: '/' },
                    { label: 'Shop All Watches', href: '/shop' },
                    { label: 'Our Watch Brands', href: '/brands' },
                    { label: 'Watch Categories', href: '/categories' },
                    { label: 'Special Offers', href: '/offers' },
                    { label: 'Watch Gallery', href: '/gallery' },
                    { label: 'About Us', href: '/about' },
                    { label: 'Showroom & Contact', href: '/contact' },
                  ].map((item, idx) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + idx * 0.03, duration: 0.25 }}
                    >
                      <Link
                        href={item.href}
                        className={`flex items-center justify-between py-2.5 px-3 rounded-lg text-xs font-medium tracking-wider uppercase ${
                          pathname === item.href
                            ? 'bg-[#1C1811] text-[#C9A04F] border border-[#C9A04F]/40 font-semibold'
                            : 'text-[#D0C8B8] hover:bg-white/[0.04]'
                        }`}
                      >
                        <span>{item.label}</span>
                        <ChevronRight className="w-4 h-4 text-[#6A6354]" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Mobile Drawer Footer */}
              <div className="pt-6 border-t border-[#242018] space-y-3.5 text-xs">
                <div className="flex items-center gap-2 text-[#9A9180] text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-[#C9A04F] shrink-0" />
                  <span>New Sama Rd, Vadodara, Gujarat</span>
                </div>

                <a
                  href={`https://wa.me/${storeInfo.whatsapp}?text=${encodeURIComponent(
                    'Hello Meghani Watch Co., I am inquiring from your website about watches.'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl flex items-center justify-center gap-2 bg-[#C9A04F] hover:bg-[#DFC17B] text-[#101010] font-bold uppercase tracking-wider shadow-lg transition-colors active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 text-[#101010]" />
                  <span>Enquire on WhatsApp</span>
                </a>

                <Link
                  href="/login"
                  className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 bg-[#181818] text-[#8E877A] border border-[#2B271F] hover:text-[#C9A04F] transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#C9A04F]" />
                  <span>Staff Portal (Connect 360)</span>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
