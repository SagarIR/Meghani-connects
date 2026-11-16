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
          '/sales/*',
          '/customers/*',
          '/repairs/*',
          '/expenses/*',
          '/reports/*',
          '/settings/*',
          '/api/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

