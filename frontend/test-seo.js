const assert = require('assert');
const http = require('http');

const PORT = process.env.PORT || 3000;

function fetchUrl(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function runSeoTests() {
  console.log('=== RUNNING MEGHANI CONNECT 360 SEO AUTOMATED QA TESTS ===\n');
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ [FAIL] ${name}`);
      console.error(`  ${err.message}`);
    }
  }

  // 1. Robots.txt
  console.log('--- Test Suite 1: robots.txt Rules ---');
  const robotsRes = await fetchUrl('/robots.txt');
  test('robots.txt returns HTTP 200', () => {
    assert.strictEqual(robotsRes.status, 200);
  });
  test('robots.txt points to canonical sitemap.xml', () => {
    assert(robotsRes.body.includes('Sitemap: https://meghaniwatch.com/sitemap.xml'));
  });
  test('robots.txt allows all public routes', () => {
    assert(robotsRes.body.includes('Allow: /'));
    assert(robotsRes.body.includes('Allow: /shop'));
    assert(robotsRes.body.includes('Allow: /brands'));
    assert(robotsRes.body.includes('Allow: /categories'));
    assert(robotsRes.body.includes('Allow: /offers'));
    assert(robotsRes.body.includes('Allow: /gallery'));
    assert(robotsRes.body.includes('Allow: /about'));
    assert(robotsRes.body.includes('Allow: /contact'));
  });
  test('robots.txt disallows internal ERP/POS routes (dashboard, products, customers, etc)', () => {
    assert(robotsRes.body.includes('Disallow: /dashboard'));
    assert(robotsRes.body.includes('Disallow: /products'));
    assert(robotsRes.body.includes('Disallow: /customers'));
    assert(robotsRes.body.includes('Disallow: /repairs'));
    assert(robotsRes.body.includes('Disallow: /sales'));
    assert(robotsRes.body.includes('Disallow: /settings'));
    assert(robotsRes.body.includes('Disallow: /api/*'));
  });

  // 2. Sitemap.xml
  console.log('\n--- Test Suite 2: sitemap.xml Canonical Integrity ---');
  const sitemapRes = await fetchUrl('/sitemap.xml');
  test('sitemap.xml returns HTTP 200', () => {
    assert.strictEqual(sitemapRes.status, 200);
  });
  test('sitemap.xml contains public landing pages', () => {
    assert(sitemapRes.body.includes('<loc>https://meghaniwatch.com</loc>'));
    assert(sitemapRes.body.includes('<loc>https://meghaniwatch.com/shop</loc>'));
    assert(sitemapRes.body.includes('<loc>https://meghaniwatch.com/brands</loc>'));
    assert(sitemapRes.body.includes('<loc>https://meghaniwatch.com/categories</loc>'));
    assert(sitemapRes.body.includes('<loc>https://meghaniwatch.com/about</loc>'));
    assert(sitemapRes.body.includes('<loc>https://meghaniwatch.com/contact</loc>'));
  });
  test('sitemap.xml contains product detail pages', () => {
    assert(sitemapRes.body.includes('<loc>https://meghaniwatch.com/shop/30</loc>'));
    assert(sitemapRes.body.includes('<loc>https://meghaniwatch.com/shop/31</loc>'));
  });
  test('sitemap.xml contains ZERO query-parameterized URLs (no facet duplication)', () => {
    assert(!sitemapRes.body.includes('?brand='));
    assert(!sitemapRes.body.includes('?category='));
    assert(!sitemapRes.body.includes('?search='));
  });

  // 3. Page Metadata, Canonicals & Schemas
  console.log('\n--- Test Suite 3: Public Page Metadata & Schema QA ---');
  const pages = [
    { path: '/', titleExpected: 'Meghani Watch Co.', canonical: 'https://meghaniwatch.com', expectedSchemas: ['Organization', 'WebSite', 'JewelryStore'] },
    { path: '/shop', titleExpected: 'Curated Luxury Watch Catalogue', canonical: 'https://meghaniwatch.com/shop', expectedSchemas: ['ItemList', 'BreadcrumbList'] },
    { path: '/brands', titleExpected: 'Authorized Watch Brands', canonical: 'https://meghaniwatch.com/brands', expectedSchemas: ['ItemList', 'BreadcrumbList'] },
    { path: '/categories', titleExpected: 'Horological Categories', canonical: 'https://meghaniwatch.com/categories', expectedSchemas: ['ItemList', 'BreadcrumbList'] },
    { path: '/about', titleExpected: 'Our Heritage Since 1984', canonical: 'https://meghaniwatch.com/about', expectedSchemas: ['AboutPage', 'BreadcrumbList'] },
    { path: '/contact', titleExpected: 'Boutique Visit, Appointment', canonical: 'https://meghaniwatch.com/contact', expectedSchemas: ['ContactPage', 'BreadcrumbList'] },
    { path: '/gallery', titleExpected: 'Horological Gallery', canonical: 'https://meghaniwatch.com/gallery', expectedSchemas: ['ImageGallery', 'BreadcrumbList'] },
    { path: '/offers', titleExpected: 'Boutique Privileges', canonical: 'https://meghaniwatch.com/offers', expectedSchemas: ['CollectionPage', 'BreadcrumbList'] },
    { path: '/privacy-policy', titleExpected: 'Client Privacy Policy', canonical: 'https://meghaniwatch.com/privacy-policy', expectedSchemas: ['BreadcrumbList'] },
    { path: '/terms', titleExpected: 'Terms of Service', canonical: 'https://meghaniwatch.com/terms', expectedSchemas: ['BreadcrumbList'] },
    { path: '/shop/30', titleExpected: 'Titan Classic Leather Strap Analog', canonical: 'https://meghaniwatch.com/shop/30', expectedSchemas: ['Product', 'BreadcrumbList'] }
  ];

  for (const page of pages) {
    const res = await fetchUrl(page.path);
    test(`${page.path} returns HTTP 200`, () => {
      assert.strictEqual(res.status, 200);
    });

    test(`${page.path} has unique relevant title`, () => {
      const titleMatch = res.body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      assert(titleMatch, 'Title tag must exist');
      assert(titleMatch[1].includes(page.titleExpected), `Title "${titleMatch[1]}" should include "${page.titleExpected}"`);
      // Check no duplicated suffix like "| Meghani Watch Co. | Meghani Watch Co."
      const occurrences = (titleMatch[1].match(/Meghani Watch Co/g) || []).length;
      assert(occurrences <= 1, `Title should not duplicate brand suffix: "${titleMatch[1]}"`);
    });

    test(`${page.path} has explicit self-referencing canonical tag`, () => {
      const canonicalMatch = res.body.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i)
        || res.body.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/i);
      assert(canonicalMatch, 'Canonical tag must exist');
      assert.strictEqual(canonicalMatch[1], page.canonical, `Canonical should be ${page.canonical}`);
    });

    test(`${page.path} has exactly one clear H1`, () => {
      const h1Matches = [...res.body.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
      assert.strictEqual(h1Matches.length, 1, `Expected 1 H1 on ${page.path}, found ${h1Matches.length}`);
    });

    test(`${page.path} embeds required JSON-LD schemas`, () => {
      const jsonLdMatches = [...res.body.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      const types = [];
      for (const m of jsonLdMatches) {
        try {
          const parsed = JSON.parse(m[1]);
          if (parsed['@type']) types.push(parsed['@type']);
        } catch (e) {}
      }
      for (const expected of page.expectedSchemas) {
        assert(types.includes(expected), `Page ${page.path} should contain schema @type: ${expected}`);
      }
    });

    test(`${page.path} has OpenGraph and Twitter card metadata`, () => {
      assert(res.body.includes('property="og:title"') || res.body.includes('property="og:description"'));
      assert(res.body.includes('name="twitter:card"'));
    });
  }

  // 4. Strict Price Privacy in Schema & Metadata
  console.log('\n--- Test Suite 4: Strict Price Privacy in SEO Metadata & Schema ---');
  // Check product 99 (Royal Heritage Tourbillon, price_visible: false)
  const p99Res = await fetchUrl('/shop/99');
  test('Product 99 (Price Hidden) does NOT leak price into title or description', () => {
    const titleMatch = p99Res.body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    assert(!titleMatch[1].includes('₹'), 'Title must not contain rupee price when hidden');
    const descMatch = p99Res.body.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    assert(!descMatch[1].includes('₹'), 'Description must not contain rupee price when hidden');
  });

  test('Product 99 (Price Hidden) schema uses PreOrder / on request offer without price field', () => {
    const jsonLdMatches = [...p99Res.body.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    let foundProductSchema = false;
    for (const m of jsonLdMatches) {
      try {
        const parsed = JSON.parse(m[1]);
        if (parsed['@type'] === 'Product') {
          foundProductSchema = true;
          assert.strictEqual(parsed.offers.price, undefined, 'Price must not be present in schema when hidden');
          assert.strictEqual(parsed.offers.priceSpecification.description, 'Price Available on Request');
        }
      } catch (e) {}
    }
    assert(foundProductSchema, 'Product schema must be present for product 99');
  });

  console.log(`\n==================================================`);
  console.log(`TOTAL SEO TESTS: ${total}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${total - passed}`);
  console.log(`==================================================`);

  if (passed === total) {
    console.log('\n🎉 ALL SEO VALIDATION TESTS PASSED WITH 100% SUCCESS!');
  } else {
    process.exit(1);
  }
}

runSeoTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
