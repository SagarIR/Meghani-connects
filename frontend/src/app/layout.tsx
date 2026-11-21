import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { PreferencesProvider } from '@/context/PreferencesContext';
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
    default: 'Meghani Watch Co. — Watch Shop & Showroom in Vadodara Since 1984',
    template: '%s | Meghani Watch Co.',
  },
  description:
    'Meghani Watch Co. is a trusted watch shop and showroom in Vadodara, Gujarat since 1984. Explore original watches from Titan, Casio, Citizen, Timex, Fastrack, Sonata, and wall clocks with official brand warranty.',
  keywords: [
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
    'smart watches',
    'analog watches',
    'digital watches',
    'Titan watch dealer Vadodara',
    'Casio watches Vadodara',
    'Citizen Eco Drive Vadodara',
    'Timex automatic watches',
    'watch repair Vadodara',
    'wall clocks Vadodara',
    'New Sama Road watch showroom'
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
    title: 'Meghani Watch Co. — Watch Shop & Showroom in Vadodara',
    description:
      'Vadodara’s trusted store for original branded watches and certified watch repair since 1984. Official retailer for Titan, Casio, Timex, Citizen, and more.',
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Meghani Watch Co. Watch Showroom in Vadodara',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meghani Watch Co. — Watch Showroom in Vadodara Since 1984',
    description:
      'Explore original branded watches and expert watch repair services at Meghani Watch Co., Vadodara, Gujarat.',
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
        {/* Theme Anti-Flash Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('meghani_theme');
                if (theme === 'light') {
                  document.documentElement.setAttribute('data-theme', 'light');
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                } else if (theme === 'dark') {
                  document.documentElement.setAttribute('data-theme', 'dark');
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else if (theme === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches) {
                  document.documentElement.setAttribute('data-theme', 'light');
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <PreferencesProvider>
            {children}
            <Toaster position="top-right" />
          </PreferencesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
