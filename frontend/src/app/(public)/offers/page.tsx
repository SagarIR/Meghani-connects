import { PUBLIC_OFFERS, getPublicOffers, getStoreInfo } from '@/services/publicCatalogue';
import { buildPageMetadata, SITE_URL } from '@/utils/seo';
import OffersClient from './OffersClient';

export const metadata = buildPageMetadata({
  title: 'Special Offers & Boutique Privileges — Festive Deals & Wedding Pairs | Meghani Watch Co.',
  description:
    'Discover special offers, festive deals, wedding gift pairs, and free watch service checks at Meghani Watch Co. in Vadodara.',
  path: '/offers',
  keywords: [
    'watch offers Vadodara',
    'watch discounts Vadodara',
    'wedding watch pairs',
    'Titan festive offer Vadodara',
    'free watch inspection Vadodara',
    'Casio watch offers Gujarat'
  ],
  ogImage: 'https://images.pexels.com/photos/125779/pexels-photo-125779.jpeg?auto=compress&cs=tinysrgb&w=1200',
});

export default async function OffersPage() {
  const [offers, storeInfo] = await Promise.all([
    getPublicOffers(),
    getStoreInfo()
  ]);
  const offersList = offers.length > 0 ? offers : PUBLIC_OFFERS;

  const offersSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_URL}/offers/#webpage`,
    name: 'Special Offers & Boutique Privileges | Meghani Watch Co.',
    description:
      'Special festive offers, wedding gift pairs, and complimentary watch service checks in Vadodara.',
    url: `${SITE_URL}/offers`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offersSchema) }}
      />
      <OffersClient initialOffers={offersList} storeInfo={storeInfo} />
    </>
  );
}
