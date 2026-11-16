import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  getOrganizationSchema,
  getWebSiteSchema,
  getLocalBusinessSchema
} from '@/utils/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Meghani Watch Co. — Luxury Watches & Master Horologist in Vadodara Since 1984',
    template: '%s | Meghani Watch Co.',
  },
  description:
    'Authorized luxury watch retailer and master watchmaker atelier in Vadodara since 1984. Purveying genuine timepieces with official warranty from Titan, Casio, Citizen, and Timex.',
  keywords: [
    'Meghani Watch Co',
    'luxury watches Vadodara',
    'authorized watch retailer Vadodara',
    'Titan watch dealer Vadodara',
    'Casio watches Gujarat',
    'Citizen Eco Drive Vadodara',
    'Timex automatic watches',
    'watch repair Vadodara',
    'mechanical watch service',
    'precision wall clocks',
    'New Sama Road watch boutique'
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'Meghani Watch Co. — Timeless Style. Trusted Quality.',
    description:
      'Vadodara’s premier authorized purveyor of genuine luxury watches and certified master watchmaker workshop since 1984.',
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Meghani Watch Co. Luxury Horological Atelier Vadodara',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meghani Watch Co. — Luxury Timepieces & Horological Atelier',
    description:
      'Authorized luxury watch retailer in Vadodara since 1984. Curations from Titan, Casio, Timex, and Citizen.',
    images: [DEFAULT_OG_IMAGE],
    creator: '@meghaniwatchco',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
  },
  robots: {
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationSchema = getOrganizationSchema();
  const webSiteSchema = getWebSiteSchema();
  const localBusinessSchema = getLocalBusinessSchema();

  return (
    <html lang="en">
      <head>
        {/* Global Structured Data: Organization, WebSite & LocalBusiness */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body>
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
