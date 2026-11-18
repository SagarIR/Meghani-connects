import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  PUBLIC_CATEGORIES,
  getPublicCategoryBySlug,
  getPublicProducts,
  getStoreInfo
} from '@/services/publicCatalogue';
import { buildPageMetadata, getCategorySchema, getBreadcrumbListSchema, getItemListSchema, SITE_URL } from '@/utils/seo';
import CategoryDetailClient from './CategoryDetailClient';

interface CategoryPageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  return PUBLIC_CATEGORIES.map((category) => ({
    slug: category.slug,
  }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = await getPublicCategoryBySlug(params.slug);

  if (!category) {
    return {
      title: 'Category Not Found',
      robots: { index: false, follow: false },
    };
  }

  const title = `${category.name} Watches in Vadodara — Curated Collection | Meghani Watch Co.`;
  const description = `Explore ${category.name} at Meghani Watch Co. in Vadodara. ${category.description.slice(
    0,
    140
  )}... 100% genuine with official manufacturer warranty.`;

  return buildPageMetadata({
    title,
    description,
    path: `/categories/${category.slug}`,
    keywords: [
      `${category.name} watches Vadodara`,
      `buy ${category.name}`,
      `${category.name} shop Gujarat`,
      `best ${category.name} watches`,
      'Meghani Watch Co'
    ],
    ogImage: category.imageUrl,
  });
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const [category, storeInfo] = await Promise.all([
    getPublicCategoryBySlug(params.slug),
    getStoreInfo(),
  ]);

  if (!category) {
    notFound();
  }

  // Fetch all timepieces belonging to this category
  const productsResult = await getPublicProducts({
    category: category.id,
    pageSize: 40,
  });

  const products = productsResult.results;

  // Structured Data (JSON-LD)
  const categorySchema = getCategorySchema(category);
  const breadcrumbSchema = getBreadcrumbListSchema([
    { label: 'Watch Categories', href: '/categories' },
    { label: category.name },
  ]);
  const productListSchema = getItemListSchema(
    `${category.name} at Meghani Watch Co.`,
    `Curated collection of 100% genuine ${category.name} with official warranty in Vadodara.`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categorySchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productListSchema) }}
      />

      <CategoryDetailClient
        category={category}
        products={products}
        whatsappNumber={storeInfo.whatsapp}
      />
    </>
  );
}
