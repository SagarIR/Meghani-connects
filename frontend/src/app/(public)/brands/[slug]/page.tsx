import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  PUBLIC_BRANDS,
  getPublicBrandBySlug,
  getPublicProducts,
  getStoreInfo
} from '@/services/publicCatalogue';
import { buildPageMetadata, getBrandSchema, getBreadcrumbListSchema, getItemListSchema, SITE_URL } from '@/utils/seo';
import BrandDetailClient from './BrandDetailClient';

interface BrandPageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  return PUBLIC_BRANDS.map((brand) => ({
    slug: brand.slug,
  }));
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const brand = await getPublicBrandBySlug(params.slug);

  if (!brand) {
    return {
      title: 'Brand Not Found',
      robots: { index: false, follow: false },
    };
  }

  const title = `${brand.name} Watches in Vadodara — Official Retailer | Meghani Watch Co.`;
  const description = `Explore 100% authentic ${brand.name} watches at Meghani Watch Co. in Vadodara. ${brand.description.slice(
    0,
    140
  )}... Official brand warranty and certified service.`;
  const canonicalUrl = `${SITE_URL}/brands/${brand.slug}`;

  return buildPageMetadata({
    title,
    description,
    path: `/brands/${brand.slug}`,
    keywords: [
      `${brand.name} watches Vadodara`,
      `buy ${brand.name} watches`,
      `${brand.name} showroom Gujarat`,
      `authorized ${brand.name} dealer`,
      `${brand.name} watch price in India`,
      'Meghani Watch Co'
    ],
    ogImage: brand.heroImage,
  });
}

export default async function BrandDetailPage({ params }: BrandPageProps) {
  const [brand, storeInfo] = await Promise.all([
    getPublicBrandBySlug(params.slug),
    getStoreInfo(),
  ]);

  if (!brand) {
    notFound();
  }

  // Fetch all timepieces belonging to this brand
  const productsResult = await getPublicProducts({
    brand: brand.name,
    pageSize: 40,
  });

  const products = productsResult.results;

  // Structured Data (JSON-LD)
  const brandSchema = getBrandSchema(brand);
  const breadcrumbSchema = getBreadcrumbListSchema([
    { label: 'Watch Brands', href: '/brands' },
    { label: brand.name },
  ]);
  const productListSchema = getItemListSchema(
    `${brand.name} Timepieces at Meghani Watch Co.`,
    `Curated collection of 100% genuine ${brand.name} watches with official warranty in Vadodara.`,
    products.map((p, idx) => ({
      name: `${p.brand} ${p.name}`,
      url: `/shop/${p.id}`,
      image: p.image || undefined,
      position: idx + 1,
    }))
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(brandSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productListSchema) }}
      />

      <BrandDetailClient
        brand={brand}
        products={products}
        whatsappNumber={storeInfo.whatsapp}
      />
    </>
  );
}
