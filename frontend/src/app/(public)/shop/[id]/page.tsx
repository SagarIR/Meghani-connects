import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Watch,
  ShieldCheck,
  Award,
  Truck,
  RotateCcw,
  Clock,
  MessageCircle,
  Calendar,
  Share2,
  CheckCircle2,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import {
  getPublicProductById,
  getPublicProducts,
  SEED_PUBLIC_PRODUCTS,
  buildWhatsAppEnquiryUrl,
  MEGHANI_STORE_INFO
} from '@/services/publicCatalogue';
import ProductCard from '@/components/public/ProductCard';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import ProductDetailClient from './ProductDetailClient';
import { SITE_URL } from '@/utils/seo';

interface ProductDetailPageProps {
  params: { id: string };
}

// Statically prerender all seed public products for ultra-fast LCP & SEO indexing
export async function generateStaticParams() {
  return SEED_PUBLIC_PRODUCTS.map((product) => ({
    id: product.id.toString(),
  }));
}

// Generate dynamic metadata respecting price visibility
export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const product = await getPublicProductById(params.id);

  if (!product) {
    return {
      title: 'Watch Not Found',
      robots: { index: false, follow: false },
    };
  }

  const title = `${product.name} — ${product.brand} Watches`;
  const description = `${product.name} by ${product.brand}. ${product.description.slice(
    0,
    140
  )}... 100% genuine with official brand warranty from Meghani Watch Co. Vadodara.`;
  const canonicalUrl = `${SITE_URL}/shop/${product.id}`;
  const ogImageUrl =
    product.image ||
    'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | Meghani Watch Co.`,
      description,
      url: canonicalUrl,
      siteName: 'Meghani Watch Co.',
      locale: 'en_IN',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${product.brand} ${product.name} - Watch | Meghani Watch Co.`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Meghani Watch Co.`,
      description,
      images: [ogImageUrl],
      creator: '@meghaniwatchco',
    },
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const product = await getPublicProductById(params.id);

  if (!product) {
    notFound();
  }

  // Related products from same category or brand fetched dynamically
  const relatedResult = await getPublicProducts({ category: product.category, pageSize: 4 });
  let relatedProducts = relatedResult.results.filter((p) => p.id !== product.id).slice(0, 3);
  if (relatedProducts.length === 0) {
    relatedProducts = SEED_PUBLIC_PRODUCTS.filter(
      (p) => p.id !== product.id && (p.brand === product.brand || p.category === product.category)
    ).slice(0, 3);
  }

  // CRITICAL: Structured JSON-LD Data for Product
  // Strictly enforce omitting price when price_visible is false
  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${SITE_URL}/shop/${product.id}#product`,
    name: product.name,
    image: product.image,
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    category: `${product.category} Watch`,
    itemCondition: 'https://schema.org/NewCondition',
    sku: product.barcode || `MGH-${product.id}`,
  };

  // ONLY attach offers and price if price visibility is true and price is non-null
  if (product.price_visible && product.price !== null) {
    jsonLd.offers = {
      '@type': 'Offer',
      url: `${SITE_URL}/shop/${product.id}`,
      priceCurrency: 'INR',
      price: product.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        product.availability === 'in_stock'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'JewelryStore',
        name: 'Meghani Watch Co.',
      },
    };
  } else {
    // When price is hidden or on request, provide an inquiry offer WITHOUT price
    jsonLd.offers = {
      '@type': 'Offer',
      url: `${SITE_URL}/shop/${product.id}`,
      availability: 'https://schema.org/PreOrder',
      itemCondition: 'https://schema.org/NewCondition',
      priceSpecification: {
        '@type': 'PriceSpecification',
        description: 'Price Available on Request',
      },
      seller: {
        '@type': 'JewelryStore',
        name: 'Meghani Watch Co.',
      },
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* Breadcrumb Trail */}
        <Breadcrumbs
          items={[
            { label: 'Shop Watches', href: '/shop' },
            { label: product.brand, href: `/shop?brand=${encodeURIComponent(product.brand)}` },
            { label: product.name },
          ]}
        />

        {/* Client Interactive Component with Image Selector & WhatsApp Flow */}
        <ProductDetailClient product={product} />

        {/* Related Curations */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 pt-12 border-t border-[#2A261F]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs text-[#C9A45C] font-semibold uppercase tracking-[0.25em] block mb-2">
                  Similar Watches
                </span>
                <h3 className="font-serif text-2xl sm:text-4xl font-normal text-[#F3EFE6]">
                  Related Watches You May Like
                </h3>
              </div>

              <Link
                href="/shop"
                className="text-xs font-semibold text-[#C9A45C] hover:text-[#E8D5A7] uppercase tracking-[0.15em] inline-flex items-center gap-1.5 transition-colors"
              >
                <span>View All Watches</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
