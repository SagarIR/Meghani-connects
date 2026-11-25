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
        url: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1200',
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
    images: ['https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1200'],
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const [productsResult, brands, categories, storeInfo] = await Promise.all([
    getPublicProducts({ featured: true, pageSize: 6 }),
    getPublicBrands(),
    getPublicCategories(),
    getStoreInfo()
  ]);

  let featuredProducts = productsResult.results || [];
  // If featured flag had fewer than 6 items in DB, fetch general latest catalog items to fill 6 slots
  if (featuredProducts.length < 6) {
    try {
      const moreProducts = await getPublicProducts({ pageSize: 6 });
      if (moreProducts.results && moreProducts.results.length > 0) {
        const existingIds = new Set(featuredProducts.map((p) => p.id));
        const additional = moreProducts.results.filter((p) => !existingIds.has(p.id));
        featuredProducts = [...featuredProducts, ...additional].slice(0, 6);
      }
    } catch {
      // Keep existing
    }
  }

  if (featuredProducts.length === 0) {
    featuredProducts = SEED_PUBLIC_PRODUCTS.slice(0, 6);
  }

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
