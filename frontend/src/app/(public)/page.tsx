import {
  SEED_PUBLIC_PRODUCTS,
  MEGHANI_STORE_INFO,
  buildWhatsAppEnquiryUrl
} from '@/services/publicCatalogue';
import HomeClient from './HomeClient';

export const metadata = {
  title: {
    absolute: 'Meghani Watch Co. — Luxury Watches & Master Horologist in Vadodara',
  },
  description:
    'Authorized purveyor of luxury wristwatches, automatic timepieces, and precision wall clocks in Vadodara since 1984. Curations from Titan, Casio, Timex, and Citizen with official warranty.',
  alternates: {
    canonical: 'https://meghaniwatch.com',
  },
  openGraph: {
    title: 'Meghani Watch Co. — Luxury Watches & Master Horologist in Vadodara',
    description:
      'Authorized luxury watch retailer and master watchmaker atelier in Vadodara since 1984. Discover authentic collections and personal consultation.',
    url: 'https://meghaniwatch.com',
    siteName: 'Meghani Watch Co.',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'Meghani Watch Co. Luxury Horological Atelier Vadodara',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meghani Watch Co. — Luxury Watches & Master Horologist in Vadodara',
    description:
      'Authorized luxury watch retailer and master watchmaker atelier in Vadodara since 1984.',
    images: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80'],
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
      latitude: 22.3361,
      longitude: 73.1895,
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
      <HomeClient
        featuredProducts={featuredProducts}
        generalWhatsAppUrl={generalWhatsAppUrl}
      />
    </>
  );
}
