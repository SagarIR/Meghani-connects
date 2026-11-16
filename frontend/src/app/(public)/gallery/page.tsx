import { Metadata } from 'next';
import GalleryClient from './GalleryClient';
import { buildPageMetadata, SITE_URL } from '@/utils/seo';
import { PUBLIC_GALLERY, getPublicGallery } from '@/services/publicCatalogue';

export const metadata: Metadata = buildPageMetadata({
  title: 'Watch Gallery — Horological Gallery, Showroom & Workshop | Meghani Watch Co.',
  description:
    'Explore our watch gallery at Meghani Watch Co. in Vadodara: see our watch showroom, expert repair workshop, and featured branded watches.',
  path: '/gallery',
  keywords: [
    'watch gallery Vadodara',
    'watch showroom photos Vadodara',
    'watch repair workshop Gujarat',
    'Titan watch photos',
    'Casio watch pictures Vadodara'
  ],
  ogImage: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=80',
});

export default async function GalleryPage() {
  const items = await getPublicGallery();
  const galleryItems = items.length > 0 ? items : PUBLIC_GALLERY;

  const gallerySchema = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    '@id': `${SITE_URL}/gallery/#gallery`,
    name: 'Meghani Watch Co. Watch Gallery',
    description:
      'Photos of our watch showroom, watch repair workshop, and watch collections in Vadodara.',
    url: `${SITE_URL}/gallery`,
    image: galleryItems.map((item) => ({
      '@type': 'ImageObject',
      contentUrl: item.imageUrl,
      caption: item.caption,
      name: item.title,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gallerySchema) }}
      />
      <GalleryClient initialItems={galleryItems} />
    </>
  );
}
