import { buildPageMetadata, SITE_URL } from '@/utils/seo';
import AboutClient from './AboutClient';

export const metadata = buildPageMetadata({
  title: 'Our Heritage Since 1984 — Four Decades of Horological Trust',
  description:
    'Since 1984, Meghani Watch Co. has stood as Vadodara’s premier authorized luxury watch retailer and master watchmaker atelier. Explore our four decades of horological heritage and craftsmanship.',
  path: '/about',
  keywords: [
    'Meghani Watch Co history',
    'watch retailer Vadodara since 1984',
    'master watchmaker Vadodara',
    'authorized Titan dealer story',
    'watch restoration Vadodara history',
    'luxury watch salon heritage'
  ],
  ogImage: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=80',
});

export default function AboutPage() {
  const aboutSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${SITE_URL}/about/#webpage`,
    name: 'Our Heritage & Story | Meghani Watch Co.',
    description:
      'The four-decade journey of Meghani Watch Co. as Vadodara’s trusted purveyor of authentic wristwatches and master horological restoration atelier.',
    url: `${SITE_URL}/about`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />
      <AboutClient />
    </>
  );
}
