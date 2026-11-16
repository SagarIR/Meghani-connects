import { Metadata } from 'next';
import { MEGHANI_STORE_INFO } from '@/services/publicCatalogue';
import { PublicProduct, BrandItem, CategoryItem } from '@/types/public';

export const SITE_URL = 'https://meghaniwatch.com';
export const SITE_NAME = 'Meghani Watch Co.';
export const DEFAULT_OG_IMAGE = 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80';

export interface SeoProps {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'article';
  noIndex?: boolean;
}

/**
 * Builds clean, consistent metadata for Next.js 14 App Router pages.
 * Enforces canonical URL, OpenGraph, Twitter cards, and title templating.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  keywords,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noIndex = false,
}: SeoProps): Metadata {
  const canonicalUrl = `${SITE_URL}${path === '/' ? '' : path}`;

  return {
    title,
    description,
    keywords: keywords || [
      'Meghani Watch Co',
      'watch shop in Vadodara',
      'watch showroom in Vadodara',
      'watches in Vadodara',
      'branded watches in Vadodara',
      'buy watches in Vadodara',
      'watch store in Gujarat',
      'buy watches online in India',
      'branded watches online',
      'men watches',
      'women watches',
      'Titan watch dealer Vadodara',
      'Casio watches Vadodara',
      'Citizen Eco Drive',
      'Timex automatic watches',
      'watch repair Vadodara',
      'wall clocks Vadodara',
      'New Sama Road watch showroom'
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: 'en_IN',
      type: ogType,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${title} | ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: '@meghaniwatchco',
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
  };
}

/**
 * Structured Data (JSON-LD) for Meghani Watch Co. Organization
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Meghani Watch Co.',
    legalName: 'Meghani Watch Co.',
    url: SITE_URL,
    logo: `${SITE_URL}/images/gold-m-emblem.png`,
    foundingDate: '1984',
    founders: [
      {
        '@type': 'Person',
        name: 'Meghani Family',
      },
    ],
    description:
      'Premier authorized watch retailer and watch repair workshop in Vadodara since 1984. Selling genuine watches from Titan, Casio, Timex, Citizen, and more with official warranty.',
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
    sameAs: [
      MEGHANI_STORE_INFO.socials.instagram,
      MEGHANI_STORE_INFO.socials.facebook,
      MEGHANI_STORE_INFO.googleMapsUrl,
    ],
  };
}

/**
 * Structured Data (JSON-LD) for WebSite with Sitelinks Searchbox
 */
export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'Meghani Watch Co.',
    description:
      'Authorized watch retailer offering Titan, Casio, Timex, Citizen, and more watches and wall clocks in Vadodara since 1984.',
    publisher: {
      '@id': `${SITE_URL}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/shop?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en-IN',
  };
}

/**
 * Structured Data (JSON-LD) for LocalBusiness / JewelryStore
 */
export function getLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'JewelryStore',
    '@id': `${SITE_URL}/#boutique`,
    name: 'Meghani Watch Co.',
    image: [
      `${SITE_URL}/images/gold-m-emblem.png`,
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80'
    ],
    telephone: MEGHANI_STORE_INFO.phone,
    email: MEGHANI_STORE_INFO.email,
    url: SITE_URL,
    priceRange: '₹₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, Credit Card, Debit Card, UPI, Net Banking',
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
    hasMap: MEGHANI_STORE_INFO.googleMapsUrl,
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
  };
}

/**
 * Structured Data (JSON-LD) for BreadcrumbList
 */
export function getBreadcrumbListSchema(
  items: Array<{ label: string; href?: string }>
) {
  const itemListElement = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: SITE_URL,
    },
    ...items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 2,
      name: item.label,
      item: item.href
        ? `${SITE_URL}${item.href.startsWith('/') ? item.href : `/${item.href}`}`
        : `${SITE_URL}`,
    })),
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}

/**
 * Structured Data (JSON-LD) for an ItemList (e.g. Brands, Categories, or Products)
 */
export function getItemListSchema(
  title: string,
  description: string,
  items: Array<{ name: string; url: string; image?: string | null; position: number }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    description,
    numberOfItems: items.length,
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      url: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}
