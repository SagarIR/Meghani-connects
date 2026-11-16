import Link from 'next/link';
import Image from 'next/image';
import {
  Watch,
  ArrowRight,
  ShieldCheck,
  Award,
  Sparkles,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  CheckCircle2,
  ChevronRight,
  Star
} from 'lucide-react';
import {
  SEED_PUBLIC_PRODUCTS,
  PUBLIC_BRANDS,
  PUBLIC_CATEGORIES,
  PUBLIC_OFFERS,
  PUBLIC_GALLERY,
  MEGHANI_STORE_INFO,
  buildWhatsAppEnquiryUrl
} from '@/services/publicCatalogue';
import ProductCard from '@/components/public/ProductCard';

export const metadata = {
  title: 'Meghani Watch Co. — Timeless Style. Trusted Quality. | Luxury Timepiece Purveyor',
  description:
    'Authorized purveyor of luxury wristwatches, automatic timepieces, and precision wall clocks in Ahmedabad since 1984. Curations from Titan, Casio, Timex, and Citizen.',
  openGraph: {
    title: 'Meghani Watch Co. — Timeless Style. Trusted Quality.',
    description:
      'Authorized luxury watch retailer and master watchmaker atelier in Ahmedabad. Discover authentic collections and personal consultation.',
    url: 'https://meghaniwatch.com',
    siteName: 'Meghani Watch Co.',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function HomePage() {
  const featuredProducts = SEED_PUBLIC_PRODUCTS.slice(0, 6);
  const generalWhatsAppUrl = buildWhatsAppEnquiryUrl();

  // Structured Data (JSON-LD) for LocalBusiness
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JewelryStore',
    name: 'Meghani Watch Co.',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80',
    telephone: MEGHANI_STORE_INFO.phone,
    email: MEGHANI_STORE_INFO.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${MEGHANI_STORE_INFO.address.line1}, ${MEGHANI_STORE_INFO.address.line2}`,
      addressLocality: MEGHANI_STORE_INFO.address.city,
      addressRegion: MEGHANI_STORE_INFO.address.state,
      postalCode: MEGHANI_STORE_INFO.address.pincode,
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 23.0282,
      longitude: 72.5852,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '10:00',
        closes: '21:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Sunday'],
        opens: '11:00',
        closes: '20:00',
      },
    ],
    priceRange: '₹₹₹',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#0D0D0D] border-b border-[#221F1A]">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=2000&q=80"
            alt="Meghani Watch Co. Horological Craftsmanship"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-25 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101010] via-[#101010]/80 to-[#101010]/60" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#C9A04F]/10 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-20 text-center flex flex-col items-center">
          {/* Heritage Tagline Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1C1812]/90 border border-[#C9A04F]/40 text-[#DFC17B] text-xs font-semibold uppercase tracking-[0.2em] mb-6 shadow-xl shadow-[#C9A04F]/10">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A04F]" />
            <span>Authorized Luxury Timepiece Purveyor • Est. 1984</span>
          </div>

          {/* Main Title */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#F5F0E6] max-w-4xl leading-[1.15]">
            Where Time Meets <br className="hidden sm:inline" />
            <span className="italic bg-gradient-to-r from-[#C9A04F] via-[#DFC17B] to-[#C9A04F] bg-clip-text text-transparent">
              Timeless Artistry.
            </span>
          </h1>

          <p className="mt-6 text-sm sm:text-base lg:text-lg text-[#B5AEA1] max-w-2xl leading-relaxed">
            Curating legendary horological creations from Titan, Casio, Timex, and Citizen. Discover handcrafted mechanical wristwatches, precision wall clocks, and master watchmaker care in Ahmedabad.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href="/shop"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#C9A04F] to-[#DFC17B] text-[#101010] font-bold text-xs uppercase tracking-widest shadow-xl shadow-[#C9A04F]/20 hover:from-[#DFC17B] hover:to-[#C9A04F] hover:shadow-2xl hover:shadow-[#C9A04F]/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <span>Explore Timepieces</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href={generalWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#161616] text-[#F5F0E6] border border-[#332E24] hover:border-[#C9A04F] hover:text-[#C9A04F] font-semibold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <MessageCircle className="w-4 h-4 text-[#C9A04F]" />
              <span>Personal Consultation</span>
            </a>
          </div>

          {/* Heritage Metrics */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 pt-10 border-t border-[#2A261F]/60 max-w-4xl w-full text-center">
            <div>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#C9A04F] block">
                40+ Years
              </span>
              <span className="text-[11px] text-[#8E877A] uppercase tracking-wider block mt-1">
                Heritage & Trust
              </span>
            </div>
            <div>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#C9A04F] block">
                100%
              </span>
              <span className="text-[11px] text-[#8E877A] uppercase tracking-wider block mt-1">
                Authenticity Guaranteed
              </span>
            </div>
            <div>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#C9A04F] block">
                50,000+
              </span>
              <span className="text-[11px] text-[#8E877A] uppercase tracking-wider block mt-1">
                Clients Purveyed
              </span>
            </div>
            <div>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#C9A04F] block">
                Official
              </span>
              <span className="text-[11px] text-[#8E877A] uppercase tracking-wider block mt-1">
                Warranty Partner
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Watches Section */}
      <section className="py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-[#C9A04F] font-semibold uppercase tracking-[0.2em] mb-2">
              <Watch className="w-4 h-4" />
              Curated Selection
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F0E6]">
              Featured Timepieces
            </h2>
            <p className="text-xs sm:text-sm text-[#8E877A] mt-2 max-w-xl">
              Hand-selected wristwatches embodying mechanical integrity, artistic dial finishings, and authentic warranty.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#C9A04F] hover:text-[#DFC17B] uppercase tracking-wider group"
          >
            <span>View Complete Catalogue</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} featured={product.is_featured} />
          ))}
        </div>
      </section>

      {/* Category Discovery Banner */}
      <section className="py-16 bg-[#0E0E0E] border-y border-[#221F1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs text-[#C9A04F] font-semibold uppercase tracking-[0.2em] block mb-2">
              Horological Horizons
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F0E6]">
              Explore by Category
            </h2>
            <p className="text-xs sm:text-sm text-[#8E877A] mt-2">
              From traditional automatic calibres to iconic digital chronographs and fine pendulum clocks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {PUBLIC_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.id}`}
                className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-[#26221A] hover:border-[#C9A04F]/60 transition-all flex flex-col justify-end p-5 shadow-lg"
              >
                <Image
                  src={cat.imageUrl}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                  className="object-cover object-center group-hover:scale-110 transition-transform duration-700 opacity-40 group-hover:opacity-55"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#101010] via-[#101010]/60 to-transparent" />

                <div className="relative z-10">
                  <span className="text-[10px] text-[#C9A04F] uppercase tracking-widest font-semibold block mb-1">
                    {cat.count}+ Timepieces
                  </span>
                  <h3 className="font-serif text-lg font-bold text-[#F5F0E6] group-hover:text-[#DFC17B] transition-colors leading-snug">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-[#8E877A] mt-1 line-clamp-2">
                    {cat.tagline}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#C9A04F] font-semibold mt-3 group-hover:translate-x-1 transition-transform">
                    <span>Discover</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Showcase Section */}
      <section className="py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs text-[#C9A04F] font-semibold uppercase tracking-[0.2em] block mb-2">
            Purveyors of Heritage
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F0E6]">
            Authorized Brand Partners
          </h2>
          <p className="text-xs sm:text-sm text-[#8E877A] mt-2">
            Every watch in our collection is backed by direct authorized brand credentials and manufacturer warranty.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {PUBLIC_BRANDS.map((brand) => (
            <Link
              key={brand.slug}
              href={`/shop?brand=${brand.name}`}
              className="group p-5 rounded-xl bg-[#141414] border border-[#26221A] hover:border-[#C9A04F]/60 transition-all flex flex-col items-center justify-center text-center shadow-md hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-full bg-[#1C1A16] border border-[#332E24] flex items-center justify-center text-[#C9A04F] mb-3 group-hover:border-[#C9A04F] transition-colors">
                <Watch className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-sm font-bold text-[#F5F0E6] group-hover:text-[#DFC17B] transition-colors">
                {brand.name}
              </h4>
              <span className="text-[10px] text-[#8E877A] uppercase tracking-wider block mt-1">
                {brand.country} • {brand.established}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Heritage & Watchmaker Commitment Spotlight */}
      <section className="py-20 bg-gradient-to-b from-[#121212] to-[#0A0A0A] border-t border-[#221F1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Visual Box */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#2A261F] shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=80"
                alt="Meghani Watch Co. Watchmaker Atelier"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101010]/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-[#101010]/90 backdrop-blur-md border border-[#C9A04F]/30">
                <div className="flex items-center gap-3">
                  <Award className="w-6 h-6 text-[#C9A04F] shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-[#F5F0E6] block">
                      Certified Master Watchmaker Atelier
                    </span>
                    <span className="text-[11px] text-[#8E877A] block">
                      Swiss & Japanese movement diagnostic equipment in-house
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Narrative Box */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#C9A04F] uppercase tracking-[0.2em]">
                <Clock className="w-4 h-4" />
                The Meghani Philosophy
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F0E6] leading-tight">
                Four Decades of Horological Passion & Trust
              </h2>

              <p className="text-xs sm:text-sm text-[#B0A99C] leading-relaxed">
                Founded in 1984 in the historic heart of Ahmedabad, Meghani Watch Co. began with a single promise: to treat every timepiece as a monument of personal achievement, family legacy, and mechanical beauty.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A04F] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#D0C8B8]">
                    <strong className="text-[#F5F0E6]">100% Genuine Authorized Sourcing:</strong> All timepieces carry official company warranty certificates and factory seals.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A04F] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#D0C8B8]">
                    <strong className="text-[#F5F0E6]">Timegrapher Precision Regulation:</strong> Mechanical and automatic movements are checked for rate, amplitude, and beat error prior to delivery.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A04F] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#D0C8B8]">
                    <strong className="text-[#F5F0E6]">Dedicated WhatsApp Concierge:</strong> Direct personal assistance for bespoke curations, wedding gifts, and after-sales support.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Link
                  href="/about"
                  className="px-6 py-3 rounded-xl bg-[#1E1B15] border border-[#C9A04F]/40 text-[#DFC17B] hover:bg-[#C9A04F] hover:text-[#101010] text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-2"
                >
                  <span>Read Our Complete Story</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/contact"
                  className="text-xs text-[#8E877A] hover:text-[#F5F0E6] transition-colors"
                >
                  Visit Ahmedabad Boutique →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Special Offers Banner */}
      <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-[#1C1810] via-[#14120D] to-[#0A0A0A] border border-[#C9A04F]/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A04F]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#C9A04F] text-[#101010] inline-block mb-4">
              Seasonal Privilege
            </span>

            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F0E6]">
              {PUBLIC_OFFERS[0].title}
            </h3>

            <p className="text-xs sm:text-sm text-[#B0A99C] mt-3 leading-relaxed">
              {PUBLIC_OFFERS[0].description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/offers"
                className="px-6 py-3 rounded-xl bg-[#C9A04F] text-[#101010] font-bold text-xs uppercase tracking-wider hover:bg-[#DFC17B] transition-colors"
              >
                View All Exclusive Offers
              </Link>

              <span className="text-xs text-[#8E877A]">
                {PUBLIC_OFFERS[0].validity} • Terms apply
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Gallery Showcase */}
      <section className="py-20 bg-[#0B0B0B] border-t border-[#221F1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs text-[#C9A04F] font-semibold uppercase tracking-[0.2em] block mb-2">
                Art of Horology
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F0E6]">
                Horological Gallery
              </h2>
            </div>
            <Link
              href="/gallery"
              className="text-xs font-semibold text-[#C9A04F] hover:text-[#DFC17B] uppercase tracking-wider inline-flex items-center gap-1.5"
            >
              <span>Explore Full Gallery</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {PUBLIC_GALLERY.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square rounded-xl overflow-hidden border border-[#26221A] shadow-md"
              >
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover object-center group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-[10px] text-[#F5F0E6] font-medium leading-tight">
                    {item.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visit the Ahmedabad Boutique Section */}
      <section className="py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#C9A04F] uppercase tracking-[0.2em] mb-3">
              <MapPin className="w-4 h-4" />
              Visit The Boutique
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F0E6] leading-tight">
              An Immersive Timepiece Salon in Vadodara
            </h2>

            <p className="text-xs sm:text-sm text-[#9E9789] mt-4 leading-relaxed">
              Step into our boutique on New Sama Road for a private viewing experience. Our horological advisors will present curated pieces tailored to your style and milestone celebrations.
            </p>

            <div className="mt-8 space-y-4 border-l-2 border-[#C9A04F]/40 pl-4 text-xs">
              <div>
                <span className="text-[#F5F0E6] font-bold block text-sm">Boutique Address</span>
                <p className="text-[#8E877A] mt-1 leading-relaxed">
                  {MEGHANI_STORE_INFO.address.line1}<br />
                  {MEGHANI_STORE_INFO.address.line2}, {MEGHANI_STORE_INFO.address.city} – {MEGHANI_STORE_INFO.address.pincode}
                </p>
              </div>

              <div>
                <span className="text-[#F5F0E6] font-bold block text-sm">Operating Hours</span>
                <p className="text-[#8E877A] mt-1">
                  {MEGHANI_STORE_INFO.hours.weekdays}<br />
                  {MEGHANI_STORE_INFO.hours.sunday}
                </p>
              </div>

              <div>
                <span className="text-[#F5F0E6] font-bold block text-sm">Direct Contact</span>
                <p className="text-[#8E877A] mt-1">
                  Telephone: {MEGHANI_STORE_INFO.phone}<br />
                  Email: {MEGHANI_STORE_INFO.email}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/contact"
                className="px-6 py-3 rounded-xl bg-[#C9A04F] text-[#101010] font-bold text-xs uppercase tracking-wider hover:bg-[#DFC17B] transition-colors shadow-lg shadow-[#C9A04F]/20"
              >
                Schedule Private Viewing
              </Link>

              <a
                href={MEGHANI_STORE_INFO.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-[#161616] text-[#F5F0E6] border border-[#2A261F] hover:border-[#C9A04F] text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Open Google Maps
              </a>
            </div>
          </div>

          {/* Interactive Google Map Embed */}
          <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-[#2A261F] shadow-2xl relative">
            <iframe
              src={MEGHANI_STORE_INFO.googleMapsEmbedSrc}
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'grayscale(0.6) invert(0.9) contrast(1.2)' }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Meghani Watch Co. Store Location"
            />
          </div>
        </div>
      </section>
    </>
  );
}

