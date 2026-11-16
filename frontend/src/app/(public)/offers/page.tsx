import { PUBLIC_OFFERS, MEGHANI_STORE_INFO } from '@/services/publicCatalogue';
import { buildPageMetadata, SITE_URL } from '@/utils/seo';
import OffersClient from './OffersClient';

export const metadata = buildPageMetadata({
  title: 'Boutique Privileges, Festive Offers & Wedding Suites',
  description:
    'Discover seasonal promotions, festive wedding suites, and complimentary watchmaker inspection privileges at Meghani Watch Co. in Vadodara.',
  path: '/offers',
  keywords: [
    'watch offers Vadodara',
    'luxury watch discounts Vadodara',
    'wedding watch gifts',
    'Titan festive offer',
    'free watchmaker inspection Vadodara',
    'Citizen Eco Drive privilege'
  ],
  ogImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
});

export default function OffersPage() {
  const offersSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_URL}/offers/#webpage`,
    name: 'Boutique Privileges & Special Offers | Meghani Watch Co.',
    description:
      'Curated seasonal advantages, celebratory wedding pairs, and atelier service privileges in Vadodara.',
    url: `${SITE_URL}/offers`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offersSchema) }}
      />
      <OffersClient />
    </>
  );
}
