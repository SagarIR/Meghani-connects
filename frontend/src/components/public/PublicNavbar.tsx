'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
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

export default function PublicNavbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<'brands' | 'categories' | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
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
      <div className="bg-[#080808] border-b border-[#1F1C16] text-[11px] text-[#A69E8F] py-1.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Credibility & Boutique Hours */}
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="flex items-center gap-1.5 text-[#C9A04F] font-medium tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C9A04F]" />
              <span>100% Authorized Purveyor • Titan, Casio, Citizen, Timex</span>
            </span>
            <span className="hidden lg:inline-block text-[#332E22]">|</span>
            <span className="hidden lg:flex items-center gap-1.5 text-[#938C7D]">
              <Clock className="w-3 h-3 text-[#C9A04F]" />
              <span>{MEGHANI_STORE_INFO.hours.weekdays}</span>
            </span>
          </div>

          {/* Right: Concierge Hotline & Staff Link */}
          <div className="flex items-center gap-3 sm:gap-4 ml-auto sm:ml-0">
            <a
              href={`tel:${MEGHANI_STORE_INFO.phone}`}
              className="flex items-center gap-1.5 text-[#C5BBA8] hover:text-[#DFC17B] transition-colors"
            >
              <Phone className="w-3 h-3 text-[#C9A04F]" />
              <span className="tracking-wide">
                <span className="hidden sm:inline text-[#787163]">Concierge: </span>
                {MEGHANI_STORE_INFO.phone}
              </span>
            </a>
            <span className="text-[#332E22]">|</span>
            <Link
              href="/login"
              className="flex items-center gap-1 text-[#8A8170] hover:text-[#C9A04F] transition-colors tracking-wider uppercase font-semibold text-[10px]"
              title="Staff Portal (Meghani Connect 360 ERP)"
            >
              <UserCheck className="w-3 h-3 text-[#C9A04F]" />
              <span>Staff Portal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Luxury Navigation Bar */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0E0E0E]/95 backdrop-blur-xl shadow-2xl border-b border-[#26221A] py-3'
            : 'bg-[#101010] border-b border-[#201C16] py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
          {/* Brand Logo & Identity */}
          <Link href="/" className="flex items-center gap-3.5 group shrink-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#282114] via-[#161410] to-[#0D0D0D] border border-[#C9A04F]/50 flex items-center justify-center shadow-lg shadow-[#C9A04F]/10 group-hover:border-[#C9A04F] group-hover:shadow-[#C9A04F]/25 transition-all overflow-hidden p-0.5">
              <Image
                src="/images/gold-m-emblem.png"
                alt="Meghani Watch Co."
                width={48}
                height={48}
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-[0.2em] text-[#F5F0E6] uppercase leading-none group-hover:text-[#DFC17B] transition-colors">
                MEGHANI
              </span>
              <span className="text-[9px] sm:text-[10px] font-sans tracking-[0.3em] text-[#C9A04F] uppercase font-semibold mt-1">
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
                  ? 'text-[#C9A04F] font-semibold'
                  : 'text-[#D0C8B8] hover:text-[#DFC17B] hover:bg-white/[0.03]'
              }`}
            >
              Home
              {pathname === '/' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-[#C9A04F] to-[#DFC17B] rounded-full" />
              )}
            </Link>

            {/* 2. Catalogue */}
            <Link
              href="/shop"
              className={`px-3 py-2 text-xs font-medium tracking-[0.12em] uppercase whitespace-nowrap transition-all rounded-md relative ${
                pathname.startsWith('/shop')
                  ? 'text-[#C9A04F] font-semibold'
                  : 'text-[#D0C8B8] hover:text-[#DFC17B] hover:bg-white/[0.03]'
              }`}
            >
              Catalogue
              {pathname.startsWith('/shop') && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-[#C9A04F] to-[#DFC17B] rounded-full" />
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
                    ? 'text-[#C9A04F] font-semibold'
                    : 'text-[#D0C8B8] hover:text-[#DFC17B] hover:bg-white/[0.03]'
                }`}
              >
                <span>Brands</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === 'brands' ? 'rotate-180 text-[#C9A04F]' : 'text-[#8E877A]'
                  }`}
                />
                {pathname.startsWith('/brands') && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-[#C9A04F] to-[#DFC17B] rounded-full" />
                )}
              </Link>

              {/* Brands Mega Flyout */}
              {activeDropdown === 'brands' && (
                <div className="absolute top-full left-1/2 -translate-x-1/4 w-[600px] pt-3 z-[100] animate-fadeIn">
                  {/* Invisible Bridge to prevent mouseleave jitter */}
                  <div className="absolute top-0 left-0 right-0 h-3" />
                  
                  <div className="bg-[#121212] border border-[#2E281E] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.98)] overflow-hidden">
                    {/* Top Gold Accent Line */}
                    <div className="h-[2px] bg-gradient-to-r from-transparent via-[#C9A04F] to-transparent" />

                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#221E17]">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#C9A04F]" />
                          <span className="text-[11px] font-bold text-[#F5F0E6] uppercase tracking-[0.15em]">
                            Authorized Purveyor Portfolio
                          </span>
                        </div>
                        <span className="text-[10px] text-[#A69E8F] tracking-wider uppercase font-medium">
                          Vadodara • Est. 1984
                        </span>
                      </div>

                      {/* Content Grid: Brands List (Left) + Atelier Spotlight (Right) */}
                      <div className="grid grid-cols-12 gap-5">
                        {/* Brands Grid (8 cols) */}
                        <div className="col-span-7 grid grid-cols-2 gap-2">
                          {PUBLIC_BRANDS.slice(0, 6).map((brand) => (
                            <Link
                              key={brand.slug}
                              href={`/shop?brand=${brand.slug}`}
                              className="p-2.5 rounded-xl bg-[#181818] hover:bg-[#221F17] border border-[#24211A] hover:border-[#C9A04F]/40 transition-all group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-serif text-sm font-bold text-[#F5F0E6] group-hover:text-[#DFC17B] transition-colors">
                                  {brand.name}
                                </span>
                                <ChevronRight className="w-3 h-3 text-[#6E6758] group-hover:text-[#C9A04F] group-hover:translate-x-0.5 transition-all" />
                              </div>
                              <span className="text-[10px] text-[#8E877A] block mt-0.5">
                                {brand.country} • Est. {brand.established}
                              </span>
                            </Link>
                          ))}
                        </div>

                        {/* Atelier Spotlight Card (5 cols) */}
                        <div className="col-span-5 bg-gradient-to-br from-[#1C1811] to-[#121212] border border-[#332A1C] rounded-xl p-3.5 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-bold tracking-[0.2em] text-[#C9A04F] uppercase block mb-1.5">
                              Heritage Salon
                            </span>
                            <h4 className="font-serif text-sm font-bold text-[#F5F0E6] leading-tight">
                              Meghani Atelier & Rare Pieces
                            </h4>
                            <p className="text-[11px] text-[#9A9180] leading-relaxed mt-1.5">
                              Curating certified automatic tourbillons, limited editions, and full manufacturer warranties.
                            </p>
                          </div>

                          <Link
                            href="/brands"
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#C9A04F] hover:text-[#DFC17B] uppercase tracking-wider mt-3 transition-colors"
                          >
                            <span>Explore All Brands</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Strip */}
                    <div className="bg-[#0C0C0C] px-5 py-2.5 border-t border-[#221E17] flex items-center justify-between text-[11px]">
                      <span className="text-[#7E7769]">All timepieces accompanied by official brand warranty</span>
                      <Link
                        href="/shop"
                        className="text-[#C9A04F] hover:text-[#DFC17B] font-semibold tracking-wider uppercase transition-colors"
                      >
                        Browse Full Catalogue →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
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
                    ? 'text-[#C9A04F] font-semibold'
                    : 'text-[#D0C8B8] hover:text-[#DFC17B] hover:bg-white/[0.03]'
                }`}
              >
                <span>Collections</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === 'categories' ? 'rotate-180 text-[#C9A04F]' : 'text-[#8E877A]'
                  }`}
                />
                {pathname.startsWith('/categories') && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-[#C9A04F] to-[#DFC17B] rounded-full" />
                )}
              </Link>

              {/* Collections Mega Flyout */}
              {activeDropdown === 'categories' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[620px] pt-3 z-[100] animate-fadeIn">
                  {/* Invisible Bridge */}
                  <div className="absolute top-0 left-0 right-0 h-3" />

                  <div className="bg-[#121212] border border-[#2E281E] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.98)] overflow-hidden">
                    {/* Top Gold Accent Line */}
                    <div className="h-[2px] bg-gradient-to-r from-transparent via-[#C9A04F] to-transparent" />

                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#221E17]">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#C9A04F]" />
                          <span className="text-[11px] font-bold text-[#F5F0E6] uppercase tracking-[0.15em]">
                            Curated Horological Categories
                          </span>
                        </div>
                        <span className="text-[10px] text-[#A69E8F] tracking-wider uppercase font-medium">
                          Mechanical • Quartz • Digital
                        </span>
                      </div>

                      {/* Content Grid */}
                      <div className="grid grid-cols-12 gap-5">
                        {/* Categories List (7 cols) */}
                        <div className="col-span-7 grid grid-cols-2 gap-2">
                          {PUBLIC_CATEGORIES.map((cat) => (
                            <Link
                              key={cat.id}
                              href={`/shop?category=${cat.id}`}
                              className="p-2.5 rounded-xl bg-[#181818] hover:bg-[#221F17] border border-[#24211A] hover:border-[#C9A04F]/40 transition-all group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-serif text-sm font-bold text-[#F5F0E6] group-hover:text-[#DFC17B] transition-colors">
                                  {cat.name.replace(' Timepieces', '').replace(' Watches', '')}
                                </span>
                                <ChevronRight className="w-3 h-3 text-[#6E6758] group-hover:text-[#C9A04F] group-hover:translate-x-0.5 transition-all" />
                              </div>
                              <span className="text-[10px] text-[#8E877A] block mt-0.5 truncate">
                                {cat.tagline}
                              </span>
                            </Link>
                          ))}
                        </div>

                        {/* Watchmaker Guarantee Spotlight Card (5 cols) */}
                        <div className="col-span-5 bg-gradient-to-br from-[#1C1811] to-[#121212] border border-[#332A1C] rounded-xl p-3.5 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-bold tracking-[0.2em] text-[#C9A04F] uppercase block mb-1.5">
                              Master Atelier
                            </span>
                            <h4 className="font-serif text-sm font-bold text-[#F5F0E6] leading-tight">
                              Mechanical Calibre Verification
                            </h4>
                            <p className="text-[11px] text-[#9A9180] leading-relaxed mt-1.5">
                              Every mechanical and automatic timepiece undergoes strict timegrapher rate and water-resistance testing.
                            </p>
                          </div>

                          <Link
                            href="/categories"
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#C9A04F] hover:text-[#DFC17B] uppercase tracking-wider mt-3 transition-colors"
                          >
                            <span>View All Categories</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Strip */}
                    <div className="bg-[#0C0C0C] px-5 py-2.5 border-t border-[#221E17] flex items-center justify-between text-[11px]">
                      <span className="text-[#7E7769]">Complimentary lifetime bracelet sizing & demagnetization</span>
                      <Link
                        href="/categories"
                        className="text-[#C9A04F] hover:text-[#DFC17B] font-semibold tracking-wider uppercase transition-colors"
                      >
                        Explore Horology Guide →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Offers */}
            <Link
              href="/offers"
              className={`px-3 py-2 text-xs font-medium tracking-[0.12em] uppercase whitespace-nowrap transition-all rounded-md relative ${
                pathname === '/offers'
                  ? 'text-[#C9A04F] font-semibold'
                  : 'text-[#D0C8B8] hover:text-[#DFC17B] hover:bg-white/[0.03]'
              }`}
            >
              Offers
              {pathname === '/offers' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-[#C9A04F] to-[#DFC17B] rounded-full" />
              )}
            </Link>

            {/* 6. Gallery */}
            <Link
              href="/gallery"
              className={`px-3 py-2 text-xs font-medium tracking-[0.12em] uppercase whitespace-nowrap transition-all rounded-md relative ${
                pathname === '/gallery'
                  ? 'text-[#C9A04F] font-semibold'
                  : 'text-[#D0C8B8] hover:text-[#DFC17B] hover:bg-white/[0.03]'
              }`}
            >
              Gallery
              {pathname === '/gallery' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-[#C9A04F] to-[#DFC17B] rounded-full" />
              )}
            </Link>

            {/* 7. Heritage / Our Story */}
            <Link
              href="/about"
              className={`px-3 py-2 text-xs font-medium tracking-[0.12em] uppercase whitespace-nowrap transition-all rounded-md relative ${
                pathname === '/about'
                  ? 'text-[#C9A04F] font-semibold'
                  : 'text-[#D0C8B8] hover:text-[#DFC17B] hover:bg-white/[0.03]'
              }`}
            >
              Heritage
              {pathname === '/about' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-[#C9A04F] to-[#DFC17B] rounded-full" />
              )}
            </Link>

            {/* 8. Boutique */}
            <Link
              href="/contact"
              className={`px-3 py-2 text-xs font-medium tracking-[0.12em] uppercase whitespace-nowrap transition-all rounded-md relative ${
                pathname === '/contact'
                  ? 'text-[#C9A04F] font-semibold'
                  : 'text-[#D0C8B8] hover:text-[#DFC17B] hover:bg-white/[0.03]'
              }`}
            >
              Boutique
              {pathname === '/contact' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-[#C9A04F] to-[#DFC17B] rounded-full" />
              )}
            </Link>
          </nav>

          {/* Right Action Cluster: Search & Mobile Toggle */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[#D0C8B8] hover:text-[#C9A04F] hover:bg-white/[0.05] border border-[#2A241A] hover:border-[#C9A04F]/50 transition-all"
              aria-label="Search Collection"
              title="Search Timepieces"
            >
              <Search className="w-4 h-4 text-[#C9A04F]" />
              <span className="text-xs font-medium tracking-[0.1em] uppercase text-[#B8AF9E]">
                Search
              </span>
            </button>

            {/* Mobile Hamburger Toggle (Visible below xl) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg text-[#F5F0E6] hover:bg-white/[0.05] border border-[#2B271F] transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Expandable Luxury Search Drawer */}
        {searchOpen && (
          <div className="bg-[#121212]/98 border-t border-b border-[#2A241A] py-4 px-4 sm:px-8 shadow-2xl backdrop-blur-xl animate-fadeIn">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 bg-[#1A1813] border border-[#3A3324] rounded-xl px-4 py-2.5 shadow-inner focus-within:border-[#C9A04F] transition-all">
                <Search className="w-5 h-5 text-[#C9A04F] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by timepiece name, brand (Titan, Casio, Citizen...), model or calibre..."
                  className="w-full bg-transparent border-none text-[#F5F0E6] placeholder-[#7E7769] text-xs sm:text-sm focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#C9A04F] hover:bg-[#DFC17B] text-[#101010] text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shrink-0"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="p-1 text-[#8A8170] hover:text-white transition-colors"
                  aria-label="Close search"
                >
                  <X className="w-5 h-5" />
                </button>
              </form>

              {/* Quick Suggestion Pills */}
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 text-xs">
                <span className="text-[10px] text-[#7E7769] uppercase font-bold tracking-wider">
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
                    className="px-2.5 py-1 rounded-full bg-[#181611] border border-[#2B261D] text-[#B8AF9F] hover:text-[#C9A04F] hover:border-[#C9A04F]/50 text-[11px] transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden bg-black/85 backdrop-blur-md flex justify-end animate-fadeIn">
          <div className="w-4/5 max-w-sm bg-[#111111] h-full border-l border-[#2E281E] p-6 flex flex-col justify-between overflow-y-auto">
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

              {/* Mobile Links */}
              <div className="py-6 space-y-1.5">
                {[
                  { label: 'Home', href: '/' },
                  { label: 'Shop / Catalogue', href: '/shop' },
                  { label: 'Brands Showcase', href: '/brands' },
                  { label: 'Horological Collections', href: '/categories' },
                  { label: 'Exclusive Offers', href: '/offers' },
                  { label: 'Visual Gallery', href: '/gallery' },
                  { label: 'Heritage & Story', href: '/about' },
                  { label: 'Boutique & Contact', href: '/contact' },
                ].map((item) => (
                  <Link
                    key={item.href}
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
                href={`https://wa.me/${MEGHANI_STORE_INFO.whatsapp}?text=${encodeURIComponent(
                  'Hello Meghani Watch Co., I am inquiring from your mobile website.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 bg-[#C9A04F] hover:bg-[#DFC17B] text-[#101010] font-bold uppercase tracking-wider shadow-lg transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#101010]" />
                <span>WhatsApp Concierge</span>
              </a>

              <Link
                href="/login"
                className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 bg-[#181818] text-[#8E877A] border border-[#2B271F] hover:text-[#C9A04F] transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#C9A04F]" />
                <span>Staff Portal (Connect 360)</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
