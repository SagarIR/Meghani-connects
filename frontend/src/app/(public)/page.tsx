import {
  SEED_PUBLIC_PRODUCTS,
  MEGHANI_STORE_INFO,
  buildWhatsAppEnquiryUrl,
  getPublicProducts,
  getPublicBrands,
  getPublicCategories,
  getStoreInfo
} from '@/services/publicCatalogue';
import HomeClient from './HomeClient';

export const metadata = {
  title: {
    absolute: 'Meghani Watch Co. — Watch Shop & Showroom in Vadodara',
  },
  description:
    'Meghani Watch Co. is an authorized watch store and showroom in Vadodara, Gujarat since 1984. Buy original watches from Titan, Casio, Citizen, Timex, Fastrack, Sonata, and wall clocks with official brand warranty.',
  alternates: {
    canonical: 'https://meghaniwatch.com',
  },
  openGraph: {
    title: 'Meghani Watch Co. — Watch Shop & Showroom in Vadodara',
    description:
      'Explore genuine watches from top brands and professional watch repair at Meghani Watch Co., Vadodara. Visit our showroom or enquire on WhatsApp.',
    url: 'https://meghaniwatch.com',
    siteName: 'Meghani Watch Co.',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'Meghani Watch Co. Watch Showroom in Vadodara',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meghani Watch Co. — Watch Shop & Showroom in Vadodara',
    description:
      'Authorized watch retailer in Vadodara since 1984. Titan, Casio, Timex, Citizen, and more.',
    images: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80'],
  },
};

export default async function HomePage() {
  const [productsResult, brands, categories, storeInfo] = await Promise.all([
    getPublicProducts({ featured: true, pageSize: 6 }),
    getPublicBrands(),
    getPublicCategories(),
    getStoreInfo()
  ]);

  const featuredProducts = productsResult.results && productsResult.results.length > 0
    ? productsResult.results
    : SEED_PUBLIC_PRODUCTS.slice(0, 6);

  const generalWhatsAppUrl = buildWhatsAppEnquiryUrl();

  // Structured Data (JSON-LD) for LocalBusiness
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JewelryStore',
    name: storeInfo.name,
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80',
    telephone: storeInfo.phone,
    email: storeInfo.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${storeInfo.address.line1}, ${storeInfo.address.line2}`,
      addressLocality: storeInfo.address.city,
      addressRegion: storeInfo.address.state,
      postalCode: storeInfo.address.pincode,
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
        brands={brands}
        categories={categories}
        storeInfo={storeInfo}
      />
    </>
  );
}
