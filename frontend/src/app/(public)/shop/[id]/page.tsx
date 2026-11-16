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
  SEED_PUBLIC_PRODUCTS,
  buildWhatsAppEnquiryUrl,
  MEGHANI_STORE_INFO
} from '@/services/publicCatalogue';
import ProductCard from '@/components/public/ProductCard';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import ProductDetailClient from './ProductDetailClient';

interface ProductDetailPageProps {
  params: { id: string };
}

// Generate dynamic metadata respecting price visibility
export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const product = await getPublicProductById(params.id);

  if (!product) {
    return {
      title: 'Timepiece Not Found — Meghani Watch Co.',
    };
  }

  // Price visibility check: never include price in meta title or description if hidden
  const priceSnippet =
    product.price_visible && product.price
      ? `₹${product.price.toLocaleString('en-IN')}`
      : 'Price on Request';

  return {
    title: `${product.name} | ${product.brand} — Meghani Watch Co.`,
    description: `${product.name} by ${product.brand}. ${product.description.slice(
      0,
      140
    )}... Official warranty and authenticated timepiece.`,
    openGraph: {
      title: `${product.name} | ${product.brand} — Meghani Watch Co.`,
      description: `${product.name}. Available at Meghani Watch Co. Ahmedabad.`,
      images: [
        {
          url:
            product.image ||
            'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80',
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
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

  // Related products from same brand or category
  const relatedProducts = SEED_PUBLIC_PRODUCTS.filter(
    (p) => p.id !== product.id && (p.brand === product.brand || p.category === product.category)
  ).slice(0, 3);

  // CRITICAL: Structured JSON-LD Data for Product
  // Strictly enforce omitting price when price_visible is false
  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image,
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    sku: product.barcode || `MGH-${product.id}`,
  };

  // ONLY attach offers and price if price visibility is true and price is non-null
  if (product.price_visible && product.price !== null) {
    jsonLd.offers = {
      '@type': 'Offer',
      url: `https://meghaniwatch.com/shop/${product.id}`,
      priceCurrency: 'INR',
      price: product.price,
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
      url: `https://meghaniwatch.com/shop/${product.id}`,
      availability: 'https://schema.org/PreOrder',
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
            { label: 'Shop / Catalogue', href: '/shop' },
            { label: product.brand, href: `/shop?brand=${product.brand}` },
            { label: product.name },
          ]}
        />

        {/* Client Interactive Component with Image Selector & WhatsApp Flow */}
        <ProductDetailClient product={product} />

        {/* Related Curations */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 pt-12 border-t border-[#221F18]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs text-[#C9A04F] font-semibold uppercase tracking-[0.2em] block mb-1">
                  Complimentary Curations
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F0E6]">
                  More Timepieces You May Admire
                </h3>
              </div>

              <Link
                href="/shop"
                className="text-xs font-semibold text-[#C9A04F] hover:text-[#DFC17B] uppercase tracking-wider inline-flex items-center gap-1.5"
              >
                <span>View Catalogue</span>
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

