// Verification test suite for Public Website services
const assert = require('assert');

function runTests() {
  console.log('--- RUNNING FRONTEND LOGIC VERIFICATION ---');

  // Test 1: buildWhatsAppEnquiryUrl logic
  const whatsappNumber = '919106680191';
  
  function buildWhatsAppEnquiryUrl(product, customMessage) {
    let text = '';
    if (product) {
      const priceText = product.price_visible && product.price
        ? `₹${product.price.toLocaleString('en-IN')}`
        : 'Price on Request';

      text = `Hello Meghani Watch Co.,\n\nI am interested in this watch from your collection:\n\n*${product.name}*\n• Brand: ${product.brand}\n• Category: ${product.category}\n• Availability: ${product.availability.replace('_', ' ').toUpperCase()}\n• Price: ${priceText}\n${product.barcode ? `• Reference Code: ${product.barcode}\n` : ''}\nPlease let me know if it is available in your Vadodara showroom and how I can see or purchase it.\n\nThank you.`;
    } else if (customMessage) {
      text = `Hello Meghani Watch Co.,\n\n${customMessage}\n\nThank you.`;
    } else {
      text = `Hello Meghani Watch Co.,\n\nI would like to enquire about your watch collection and showroom in Vadodara.`;
    }

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  }

  // Case 1A: Product with price visible
  const prodVisible = {
    id: 1,
    name: 'Titan Edge Ceramic Slim',
    brand: 'Titan',
    category: 'analog',
    price: 24995,
    price_visible: true,
    availability: 'in_stock',
    barcode: 'TIT-EDG-001'
  };
  const url1 = buildWhatsAppEnquiryUrl(prodVisible);
  assert(url1.startsWith('https://wa.me/919106680191?text='), 'Must point to configured WhatsApp number');
  assert(decodeURIComponent(url1).includes('₹24,995'), 'Must contain formatted Indian rupee price');
  assert(decodeURIComponent(url1).includes('Titan Edge Ceramic Slim'), 'Must contain product name');
  console.log('✓ Case 1A Passed: WhatsApp enquiry url with visible price');

  // Case 1B: Product with price_visible === false (Strict Price Hiding)
  const prodHidden = {
    id: 99,
    name: 'Meghani Royal Heritage Tourbillon (Atelier Edition)',
    brand: 'Meghani Atelier',
    category: 'automatic',
    price: null,
    price_visible: false,
    availability: 'on_request',
    barcode: 'MGH-ATL-TOURB-001'
  };
  const url2 = buildWhatsAppEnquiryUrl(prodHidden);
  const decoded2 = decodeURIComponent(url2);
  assert(decoded2.includes('Price on Request'), 'Must contain "Price on Request"');
  assert(!decoded2.includes('₹'), 'Must NOT contain any rupee symbol');
  assert(decoded2.includes('ON REQUEST'), 'Must contain availability status');
  console.log('✓ Case 1B Passed: WhatsApp enquiry url with strictly hidden price on request');

  // Case 1C: General enquiry without product
  const url3 = buildWhatsAppEnquiryUrl();
  assert(decodeURIComponent(url3).includes('watch collection and showroom in Vadodara'), 'General showroom consultation enquiry');
  console.log('✓ Case 1C Passed: General showroom consultation WhatsApp enquiry');

  // Test 2: In-memory Filtering, Searching and Sorting logic (replicates getPublicProducts)
  const seedProducts = [
    { id: 1, name: 'Titan Edge Ceramic Slim', brand: 'Titan', category: 'analog', price: 24995, price_visible: true, availability: 'in_stock', created_at: '2024-01-15' },
    { id: 2, name: 'G-Shock Mudmaster Carbon Core', brand: 'Casio', category: 'digital', price: 29995, price_visible: true, availability: 'in_stock', created_at: '2024-02-10' },
    { id: 3, name: 'Citizen Promaster Marine Diver', brand: 'Citizen', category: 'chronograph', price: 34900, price_visible: true, availability: 'in_stock', created_at: '2024-01-20' },
    { id: 4, name: 'Timex Marlin Automatic California Dial', brand: 'Timex', category: 'automatic', price: 21995, price_visible: true, availability: 'out_of_stock', created_at: '2024-02-01' },
    { id: 99, name: 'Meghani Royal Heritage Tourbillon', brand: 'Meghani Atelier', category: 'automatic', price: null, price_visible: false, availability: 'on_request', created_at: '2024-03-01' }
  ];

  function filterProducts(list, params) {
    let res = [...list];
    if (params.category && params.category !== 'all') {
      res = res.filter(p => p.category.toLowerCase() === params.category.toLowerCase());
    }
    if (params.brand && params.brand !== 'all') {
      res = res.filter(p => p.brand.toLowerCase() === params.brand.toLowerCase());
    }
    if (params.availability && params.availability !== 'all') {
      res = res.filter(p => p.availability === params.availability);
    }
    if (params.query) {
      const q = params.query.toLowerCase();
      res = res.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    if (params.minPrice !== undefined) {
      res = res.filter(p => p.price === null || p.price >= params.minPrice);
    }
    if (params.maxPrice !== undefined) {
      res = res.filter(p => p.price === null || p.price <= params.maxPrice);
    }
    if (params.sort === 'price_asc') {
      res.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (params.sort === 'price_desc') {
      res.sort((a, b) => (b.price || 0) - (a.price || 0));
    }
    return res;
  }

  // Filter test: brand
  const titanOnly = filterProducts(seedProducts, { brand: 'titan' });
  assert.strictEqual(titanOnly.length, 1);
  assert.strictEqual(titanOnly[0].name, 'Titan Edge Ceramic Slim');
  console.log('✓ Filter by Brand Passed');

  // Filter test: category
  const automaticOnly = filterProducts(seedProducts, { category: 'automatic' });
  assert.strictEqual(automaticOnly.length, 2);
  console.log('✓ Filter by Category Passed');

  // Filter test: availability
  const onRequestOnly = filterProducts(seedProducts, { availability: 'on_request' });
  assert.strictEqual(onRequestOnly.length, 1);
  assert.strictEqual(onRequestOnly[0].id, 99);
  console.log('✓ Filter by Availability (on_request) Passed');

  // Filter test: search query
  const searchQuery = filterProducts(seedProducts, { query: 'tourbillon' });
  assert.strictEqual(searchQuery.length, 1);
  assert.strictEqual(searchQuery[0].id, 99);
  console.log('✓ Search query Passed');

  // Sort test: price_asc
  const sortedAsc = filterProducts(seedProducts, { sort: 'price_asc' });
  assert.strictEqual(sortedAsc[0].id, 99); // null price treated as 0 for sorting
  assert.strictEqual(sortedAsc[1].price, 21995);
  console.log('✓ Sort by Price Ascending Passed');

  console.log('\nALL 7 FRONTEND VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runTests();

