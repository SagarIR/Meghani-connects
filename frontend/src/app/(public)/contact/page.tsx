import { Metadata } from 'next';
import ContactClient from './ContactClient';
import { buildPageMetadata, getLocalBusinessSchema, SITE_URL } from '@/utils/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Boutique Visit, Appointment & Concierge Enquiry',
  description:
    'Connect with Meghani Watch Co. in Vadodara. Visit our luxury salon at Cactus Park, New Sama Road, or arrange private timepiece viewings and atelier repair appointments. Concierge: +91 91066 80191.',
  path: '/contact',
  keywords: [
    'Meghani Watch Co contact',
    'watch store New Sama Road',
    'watch boutique Vadodara',
    'book watch viewing Vadodara',
    'watch repair appointment Vadodara',
    'watch concierge WhatsApp'
  ],
  ogImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
});

export default function ContactPage() {
  const contactPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${SITE_URL}/contact/#webpage`,
    name: 'Contact & Boutique Appointments | Meghani Watch Co.',
    description:
      'Schedule private timepiece viewings, enquire about luxury watches, or arrange master watchmaker services at Meghani Watch Co. Vadodara.',
    url: `${SITE_URL}/contact`,
    mainEntity: getLocalBusinessSchema(),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
      />
      <ContactClient />
    </>
  );
}
