import { MetadataRoute } from 'next';
import {
  PUBLIC_BRANDS,
  PUBLIC_CATEGORIES,
  SEED_PUBLIC_PRODUCTS
} from '@/services/publicCatalogue';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://meghaniwatch.com';
  const now = new Date();

  // 1. Static indexable public routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/brands`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/offers`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // 2. Individual Brand Showcase routes (Titan, Casio, Citizen, etc.)
  const brandRoutes: MetadataRoute.Sitemap = PUBLIC_BRANDS.map((brand) => ({
    url: `${baseUrl}/brands/${brand.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 3. Individual Category routes (Analog, Digital, Smart, Wall Clocks, etc.)
  const categoryRoutes: MetadataRoute.Sitemap = PUBLIC_CATEGORIES.map((cat) => ({
    url: `${baseUrl}/categories/${cat.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 4. Dynamic Product routes - 100% canonical product URLs
  const productRoutes: MetadataRoute.Sitemap = SEED_PUBLIC_PRODUCTS.map((product) => ({
    url: `${baseUrl}/shop/${product.id}`,
    lastModified: product.created_at ? new Date(product.created_at) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...brandRoutes, ...categoryRoutes, ...productRoutes];
}
