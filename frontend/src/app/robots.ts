import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://meghaniwatch.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/shop',
          '/shop/*',
          '/brands',
          '/categories',
          '/offers',
          '/gallery',
          '/about',
          '/contact',
          '/privacy-policy',
          '/terms',
        ],
        disallow: [
          '/dashboard',
          '/dashboard/*',
          '/login',
          '/products',
          '/products/*',
          '/customers',
          '/customers/*',
          '/repairs',
          '/repairs/*',
          '/expenses',
          '/expenses/*',
          '/reports',
          '/reports/*',
          '/sales',
          '/sales/*',
          '/settings',
          '/settings/*',
          '/notifications',
          '/notifications/*',
          '/api/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
