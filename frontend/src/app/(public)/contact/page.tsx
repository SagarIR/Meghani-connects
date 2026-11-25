import { Metadata } from 'next';
import ContactClient from './ContactClient';
import { buildPageMetadata, getLocalBusinessSchema, SITE_URL } from '@/utils/seo';
import { getStoreInfo } from '@/services/publicCatalogue';

export const metadata: Metadata = buildPageMetadata({
  title: 'Contact Us — Boutique Visit, Appointment & Showroom Details',
  description:
    'Contact Meghani Watch Co. in Vadodara. Visit our watch showroom at Near Cactus Park, New Sama Road, or contact us for watch enquiries and repair services. Phone: +91 91066 80191.',
  path: '/contact',
  keywords: [
    'Meghani Watch Co contact',
    'watch shop in Vadodara',
    'watch showroom New Sama Road',
    'watch store Vadodara',
    'watch repair in Vadodara',
    'watch showroom phone number'
  ],
  ogImage: 'https://images.pexels.com/photos/277319/pexels-photo-277319.jpeg?auto=compress&cs=tinysrgb&w=1200',
});

export default async function ContactPage() {
  const storeInfo = await getStoreInfo();

  const contactPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${SITE_URL}/contact/#webpage`,
    name: 'Contact Meghani Watch Co.',
    description:
      'Visit our watch showroom, enquire about watches, or schedule watch repair services at Meghani Watch Co. in Vadodara.',
    url: `${SITE_URL}/contact`,
    mainEntity: getLocalBusinessSchema(),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
      />
      <ContactClient storeInfo={storeInfo} />
    </>
  );
}
