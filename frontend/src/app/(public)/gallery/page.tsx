import { Metadata } from 'next';
import GalleryClient from './GalleryClient';
import { buildPageMetadata, SITE_URL } from '@/utils/seo';
import { PUBLIC_GALLERY } from '@/services/publicCatalogue';

export const metadata: Metadata = buildPageMetadata({
  title: 'Horological Gallery — Watchmaking Craftsmanship & Salon Moments',
  description:
    'Immerse in the visual heritage of Meghani Watch Co. Explore behind-the-scenes watchmaker atelier benches, escapement regulation, and our Vadodara luxury salon.',
  path: '/gallery',
  keywords: [
    'horology gallery Vadodara',
    'watchmaker craftsmanship',
    'luxury watch salon images',
    'escapement repair pictures',
    'Titan Casio Citizen gallery'
  ],
  ogImage: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=80',
});

export default function GalleryPage() {
  const gallerySchema = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    '@id': `${SITE_URL}/gallery/#gallery`,
    name: 'Meghani Watch Co. Horological Gallery',
    description:
      'Photographic showcase of fine watchmaking, atelier restoration benches, and luxury timepiece collections in Vadodara.',
    url: `${SITE_URL}/gallery`,
    image: PUBLIC_GALLERY.map((item) => ({
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
      <GalleryClient />
    </>
  );
}
