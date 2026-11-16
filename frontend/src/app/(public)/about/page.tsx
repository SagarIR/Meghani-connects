import { buildPageMetadata, SITE_URL } from '@/utils/seo';
import { getPublicMilestones } from '@/services/publicCatalogue';
import AboutClient from './AboutClient';

export const metadata = buildPageMetadata({
  title: 'About Us — Our Heritage Since 1984 in Vadodara',
  description:
    'Since 1984, Meghani Watch Co. has been Vadodara’s trusted watch showroom and repair workshop. Learn about our 40-year journey of offering 100% genuine branded watches with official manufacturer warranty.',
  path: '/about',
  keywords: [
    'Meghani Watch Co history',
    'watch shop in Vadodara since 1984',
    'watch showroom Vadodara',
    'authorized Titan dealer Vadodara',
    'watch repair in Vadodara',
    'branded watches in Vadodara'
  ],
  ogImage: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=80',
});

export default async function AboutPage() {
  const milestones = await getPublicMilestones();

  const aboutSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${SITE_URL}/about/#webpage`,
    name: 'About Us — Our Heritage Since 1984 | Meghani Watch Co.',
    description:
      'The 40-year journey of Meghani Watch Co. as Vadodara’s trusted watch retailer and expert repair workshop.',
    url: `${SITE_URL}/about`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />
      <AboutClient initialMilestones={milestones} />
    </>
  );
}
