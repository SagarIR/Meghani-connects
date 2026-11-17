/**
 * POS & Inventory Engine - Order 3 Logic Verification
 * Tests Cart, Barcode wedge, Pricing, Split/Mixed Payment validation, and Invoice formatting.
 */

const assert = require('assert')

console.log('--- RUNNING ORDER 3 POS & INVENTORY ENGINE VERIFICATION ---')

// 1. Mock Product Catalog
const catalog = [
  { id: 1, name: 'Casio Edifice Chrono', brand: 'Casio', barcode: 'CASIO-EDIF-001', cost_price: 5000, selling_price: 8500, stock: 5 },
  { id: 2, name: 'Tissot PRX Powermatic', brand: 'Tissot', barcode: 'TISSOT-PRX-002', cost_price: 45000, selling_price: 68000, stock: 2 },
  { id: 3, name: 'Fossil Grant Chronograph', brand: 'Fossil', barcode: 'FOSSIL-GRNT-003', cost_price: 7000, selling_price: 11500, stock: 0 }
]

// 2. Barcode Lookup Logic
function findProductByBarcode(code) {
  return catalog.find(p => p.barcode === code) || null
}

const p1 = findProductByBarcode('CASIO-EDIF-001')
assert.strictEqual(p1 !== null, true, 'Barcode lookup should find valid product')
assert.strictEqual(p1.name, 'Casio Edifice Chrono')
console.log('✓ Case 1 Passed: Instant barcode lookup resolved correct product')

const pUnknown = findProductByBarcode('INVALID-999')
assert.strictEqual(pUnknown, null, 'Unknown barcode must return null')
console.log('✓ Case 2 Passed: Unknown barcode safely handled without crash')

// 3. Cart & Stock Validation Logic
let cart = []

function addToCart(product, qty = 1) {
  if (product.stock <= 0) {
    throw new Error(`Out of stock: ${product.name}`)
  }
  const existing = cart.find(i => i.product.id === product.id)
  if (existing) {
    if (existing.quantity + qty > product.stock) {
      throw new Error(`Insufficient stock for ${product.name} (available: ${product.stock})`)
    }
    existing.quantity += qty
  } else {
    if (qty > product.stock) {
      throw new Error(`Insufficient stock for ${product.name} (available: ${product.stock})`)
    }
    cart.push({ product, quantity: qty, unit_price: product.selling_price })
  }
}

// Add Casio (stock 5)
addToCart(p1, 2)
assert.strictEqual(cart.length, 1)
assert.strictEqual(cart[0].quantity, 2)
console.log('✓ Case 3 Passed: Initial cart addition and quantity registered')

// Duplicate scan handles quantity increment
addToCart(p1, 1)
assert.strictEqual(cart[0].quantity, 3)
console.log('✓ Case 4 Passed: Duplicate barcode scan increments quantity correctly')

// Out of stock product addition blocked
assert.throws(() => {
  addToCart(catalog[2], 1)
}, /Out of stock/, 'Out of stock product must be rejected')
console.log('✓ Case 5 Passed: Zero-stock product addition rejected')

// Insufficient stock addition blocked (attempting to add 3 more when stock is 5 and cart has 3)
assert.throws(() => {
  addToCart(p1, 3)
}, /Insufficient stock/, 'Quantity exceeding stock must be rejected')
console.log('✓ Case 6 Passed: Exceeding stock limit rejected')

// 4. Cart Totals & Discount Calculation
function calculateCartTotals(cartItems, discount = 0, tax = 0) {
  const subtotal = cartItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
  if (discount < 0) throw new Error('Discount cannot be negative')
  if (discount > subtotal) throw new Error('Discount cannot exceed subtotal')
  const total = subtotal - discount + tax
  return { subtotal, discount, tax, total }
}

const totals = calculateCartTotals(cart, 500, 0)
// 3 * 8500 = 25500, discount 500 -> 25000
assert.strictEqual(totals.subtotal, 25500)
assert.strictEqual(totals.total, 25000)
console.log('✓ Case 7 Passed: Accurate subtotal and discount applied (₹25,500 - ₹500 = ₹25,000)')

// 5. Split / Mixed Payment Validation Logic
function validateSplitPayment(total, paymentDetails) {
  const allowed = ['cash', 'upi', 'card']
  let sum = 0
  let activeCount = 0

  for (const [method, amount] of Object.entries(paymentDetails)) {
    if (!allowed.includes(method.toLowerCase())) {
      throw new Error(`Unsupported method ${method}`)
    }
    const val = Number(amount) || 0
    if (val < 0) throw new Error(`Negative amount for ${method}`)
    if (val > 0) {
      activeCount++
      sum += val
    }
  }

  if (activeCount < 2) {
    throw new Error('Split payment requires at least two payment methods')
  }
  const remaining = Math.round((total - sum) * 100) / 100
  if (remaining !== 0) {
    throw new Error(`Split tender mismatch. Remaining: ₹${remaining}`)
  }
  return true
}

// Valid Split: 15,000 Cash + 10,000 Card = 25,000 Total
assert.strictEqual(validateSplitPayment(25000, { cash: 15000, card: 10000, upi: 0 }), true)
console.log('✓ Case 8 Passed: Valid 2-way split payment accepted (₹15,000 Cash + ₹10,000 Card = ₹25,000)')

// Valid 3-way Split: 10,000 Cash + 10,000 Card + 5,000 UPI = 25,000 Total
assert.strictEqual(validateSplitPayment(25000, { cash: 10000, card: 10000, upi: 5000 }), true)
console.log('✓ Case 9 Passed: Valid 3-way split payment accepted (₹10k Cash + ₹10k Card + ₹5k UPI = ₹25,000)')

// Underpayment Split: 10,000 Cash + 10,000 Card = 20,000 (Remaining 5,000)
assert.throws(() => {
  validateSplitPayment(25000, { cash: 10000, card: 10000, upi: 0 })
}, /Split tender mismatch/, 'Underpayment must be rejected')
console.log('✓ Case 10 Passed: Underpayment split tender rejected')

// Overpayment Split: 15,000 Cash + 15,000 Card = 30,000 (Over 5,000)
assert.throws(() => {
  validateSplitPayment(25000, { cash: 15000, card: 15000 })
}, /Split tender mismatch/, 'Overpayment must be rejected')
console.log('✓ Case 11 Passed: Overpayment split tender rejected')

// Only 1 method in split mode rejected
assert.throws(() => {
  validateSplitPayment(25000, { cash: 25000 })
}, /requires at least two payment methods/, 'Single method in split mode must be rejected')
console.log('✓ Case 12 Passed: Single method in split tender mode rejected')

// 6. Invoice Formatting Logic
function formatInvoiceReceipt(invoice) {
  const lines = []
  lines.push(`INVOICE: ${invoice.invoice_number}`)
  lines.push(`STORE: ${invoice.business_name}`)
  lines.push(`TOTAL: ₹${invoice.total.toLocaleString('en-IN')}`)
  if (invoice.payment_mode === 'mixed' && invoice.payment_details) {
    const details = Object.entries(invoice.payment_details)
      .filter(([_, v]) => v > 0)
      .map(([k, v]) => `${k.toUpperCase()}: ₹${v.toLocaleString('en-IN')}`)
      .join(' | ')
    lines.push(`PAYMENT: MIXED (${details})`)
  } else {
    lines.push(`PAYMENT: ${invoice.payment_mode.toUpperCase()}`)
  }
  return lines.join('\n')
}

const sampleInvoice = {
  invoice_number: 'INV-20261117-0042',
  business_name: 'Meghani Watch Co.',
  total: 25000,
  payment_mode: 'mixed',
  payment_details: { cash: 15000, card: 10000 }
}

const receiptText = formatInvoiceReceipt(sampleInvoice)
assert.strictEqual(receiptText.includes('MIXED (CASH: ₹15,000 | CARD: ₹10,000)'), true)
console.log('✓ Case 13 Passed: Invoice receipt renders verified split payment breakdown')

console.log('\nALL 13 ORDER 3 POS WORKFLOW TESTS PASSED SUCCESSFULLY!')
