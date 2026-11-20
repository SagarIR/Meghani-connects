// User types
export interface User {
  id: number
  username: string
  name: string
  email: string
  phone: string
  role: 'admin' | 'staff'
  language: string
  created_at: string
}

// Product types
export interface Subcategory {
  id: number
  category: number
  category_slug?: string
  category_name?: string
  name: string
  slug: string
  description?: string
  display_order?: number
  is_active: boolean
}

export interface Product {
  id: number
  article_code?: string | null
  model_number?: string
  size?: string
  name: string
  brand: string
  brand_id?: number | null
  category: string
  category_id?: number | null
  subcategory?: string | null
  subcategory_id?: number | null
  subcategory_name?: string
  mrp?: number | null
  cost_price: number
  selling_price: number
  hsn_code?: string | null
  tax_rate?: number | null
  unit?: string | null
  price_visible?: boolean
  availability?: string
  stock: number
  barcode: string | null
  supplier_name: string
  image: string | null
  gallery_images?: Array<{ id: number; url: string; display_order: number }>
  description: string
  specifications?: Record<string, string>
  warranty_months: number
  is_featured?: boolean
  is_new_arrival?: boolean
  is_active: boolean
  profit_margin: number
  profit_percentage: number
  is_low_stock: boolean
  created_at: string
}

// Customer types
export interface LoyaltyTransaction {
  id: number
  customer: number
  customer_name: string
  points: number
  transaction_type: 'earned' | 'redeemed' | 'adjusted' | 'expired'
  transaction_type_display: string
  reference_id: string
  description: string
  created_at: string
}

export interface CustomerDossier {
  customer: Customer
  metrics: {
    lifetime_sales_value: number
    sales_transactions_count: number
    lifetime_repairs_value: number
    repairs_count: number
    active_warranties_count: number
    total_spend: number
    loyalty_tier: string
  }
  sales: Array<{
    id: number
    invoice_number: string
    sale_date: string
    total_amount: number
    payment_mode: string
    items_count: number
  }>
  repairs: Array<{
    id: number
    ticket_number: string
    brand: string
    model_number: string
    status: string
    status_display: string
    repair_charge: number
    received_date: string
  }>
  warranties: Array<{
    id: number
    warranty_code: string
    product_name: string
    status: string
    status_display: string
    expiry_date: string
    is_expired: boolean
  }>
  loyalty_ledger: LoyaltyTransaction[]
}

export interface Customer {
  id: number
  name: string
  phone: string
  email: string
  address: string
  city?: string
  gstin?: string
  date_of_birth: string | null
  anniversary_date?: string | null
  language_preference: string
  loyalty_points: number
  total_purchases: number
  purchase_count: number
  repair_count?: number
  active_warranties_count?: number
  notes?: string
  created_at: string
}

// Sale types
export interface SaleItem {
  id: number
  product: number
  product_name: string
  product_brand: string
  product_article_code?: string
  quantity: number
  returned_quantity?: number
  returnable_quantity?: number
  unit_price: number
  cost_price?: number
  subtotal: number
}

export interface SaleReturnItem {
  id: number
  sale_item: number
  product: number
  product_name: string
  product_brand: string
  product_article_code?: string
  quantity: number
  refund_amount: number
  condition: 'resellable' | 'damaged' | 'defective'
  condition_display: string
  notes: string
}

export interface SaleReturn {
  id: number
  return_number: string
  sale: number
  sale_invoice_number: string
  customer: number | null
  customer_name: string | null
  refund_amount: number
  refund_mode: 'cash' | 'upi' | 'card' | 'store_credit'
  reason: string
  status: 'completed' | 'cancelled'
  created_by_name: string
  items: SaleReturnItem[]
  created_at: string
}

export interface Sale {
  id: number
  invoice_number: string
  customer: number | null
  customer_name: string | null
  customer_phone: string | null
  total_amount: number
  discount: number
  tax: number
  payment_mode: 'cash' | 'upi' | 'card' | 'mixed'
  payment_details?: Record<string, number>
  profit: number
  notes: string
  sale_date: string
  items: SaleItem[]
  returns?: SaleReturn[]
  created_by_name: string
}

export interface WarrantyClaim {
  id: number
  claim_number: string
  warranty: number
  repair?: number | null
  repair_ticket?: string
  issue_description: string
  claim_date: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  status_display: string
  resolution_notes: string
  covered_amount: number
  created_by_name: string
  created_at: string
}

export interface Warranty {
  id: number
  warranty_code: string
  sale: number
  sale_invoice_number: string
  product: number
  product_name: string
  product_brand: string
  product_article_code?: string
  customer: number
  customer_name: string
  customer_phone?: string
  warranty_months: number
  start_date: string
  expiry_date: string
  status: 'active' | 'claimed' | 'expired' | 'voided'
  status_display: string
  serial_number: string
  terms: string
  is_expired: boolean
  days_remaining: number
  claims?: WarrantyClaim[]
  created_at: string
}

// Repair types
export interface RepairPart {
  id: number
  repair: number
  product: number
  product_name: string
  product_article_code?: string
  product_brand?: string
  quantity: number
  unit_cost: number
  charge_to_customer: number
  total_cost: number
  total_charge: number
  notes: string
  created_at: string
}

export interface Repair {
  id: number
  ticket_number: string
  customer: number
  customer_name: string
  customer_phone: string
  item_type: string
  brand: string
  model_number: string
  serial_number?: string
  service_type: string
  service_type_display?: string
  warranty?: number | null
  warranty_code?: string
  is_warranty_repair?: boolean
  issue_description: string
  diagnosis_notes?: string
  estimated_cost: number | null
  repair_charge: number | null
  advance_paid: number
  balance_due: number
  status: 'received' | 'diagnosing' | 'awaiting_approval' | 'in_repair' | 'testing' | 'ready' | 'delivered' | 'cancelled'
  status_display?: string
  assigned_technician?: number | null
  assigned_technician_name?: string | null
  qc_passed?: boolean
  parts_used?: RepairPart[]
  total_parts_charge?: number
  received_date: string
  expected_delivery: string | null
  delivered_date?: string | null
  days_in_repair: number
  notes: string
}

// Expense types
export interface Expense {
  id: number
  voucher_number?: string
  category: string
  category_display: string
  amount: number
  tax_amount?: number
  payment_mode: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque'
  payment_mode_display?: string
  date: string
  description: string
  vendor_name: string
  gstin?: string
  receipt?: string | null
  created_at: string
}

export interface CashRegister {
  id: number
  register_date: string
  opening_cash: number
  cash_sales: number
  cash_repairs: number
  cash_expenses: number
  expected_closing_cash: number
  actual_closing_cash: number | null
  variance: number | null
  notes: string
  is_closed: boolean
  opened_by_name: string
  closed_by_name: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
}

export interface FinancialStatementData {
  period: {
    start_date: string
    end_date: string
  }
  revenue: {
    sales_gross: number
    sales_discounts: number
    sales_tax: number
    sales_net: number
    repairs_revenue: number
    total_revenue: number
  }
  cogs: {
    goods_sold_cost: number
    total_cogs: number
  }
  gross_profit: number
  gross_margin_percentage: number
  operating_expenses: {
    total: number
    breakdown: Record<string, number>
  }
  net_profit: number
  net_margin_percentage: number
}

export interface GSTReportData {
  period: {
    start_date: string
    end_date: string
  }
  summary: {
    total_transactions: number
    total_taxable_value: number
    cgst_amount: number
    sgst_amount: number
    igst_amount: number
    total_tax_amount: number
    total_invoice_value: number
  }
  b2c_summary: {
    sales_count: number
    taxable_value: number
    tax_collected: number
  }
  hsn_summary: Array<{
    hsn_code: string
    description: string
    quantity: number
    taxable_value: number
    tax_rate: number
    cgst_amount: number
    sgst_amount: number
    igst_amount: number
    total_tax: number
  }>
}

// Cart types (for POS)
export interface CartItem {
  product: Product
  quantity: number
  unit_price: number
}

// Purchasing & Supplier types
export interface Supplier {
  id: number
  name: string
  contact_person: string
  phone: string
  email: string
  address: string
  gstin: string
  payment_terms: string
  opening_balance: number
  notes: string
  is_active: boolean
  products_count: number
  active_pos_count: number
  created_at: string
  updated_at: string
}

export interface ProductSupplier {
  id: number
  product: number
  product_name: string
  product_brand: string
  supplier: number
  supplier_name: string
  supplier_sku: string
  last_cost_price: number
  lead_time_days: number
  is_preferred: boolean
  created_at: string
}

export interface PurchaseOrderItem {
  id: number
  product: number
  product_name: string
  product_brand: string
  product_article_code: string
  ordered_quantity: number
  received_quantity: number
  pending_quantity: number
  unit_cost: number
  discount_percent: number
  tax_rate: number
  subtotal: number
}

export interface PurchaseOrder {
  id: number
  order_number: string
  supplier: number
  supplier_name: string
  status: 'draft' | 'ordered' | 'partially_received' | 'completed' | 'cancelled'
  status_display: string
  order_date: string
  expected_delivery_date: string | null
  supplier_invoice_number: string
  supplier_invoice_date: string | null
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  created_by_name: string
  notes: string
  items: PurchaseOrderItem[]
  created_at: string
  updated_at: string
}

export interface GoodsReceiptItem {
  id: number
  purchase_order_item: number
  product: number
  product_name: string
  quantity_received: number
  unit_cost: number
  batch_number: string
  notes: string
}

export interface GoodsReceipt {
  id: number
  receipt_number: string
  purchase_order: number
  purchase_order_number: string
  supplier_name: string
  received_by_name: string
  received_at: string
  supplier_delivery_note: string
  notes: string
  items: GoodsReceiptItem[]
  created_at: string
}

export interface StockMovement {
  id: number
  product: number
  product_name: string
  product_brand: string
  product_article_code: string
  movement_type: string
  movement_type_display: string
  quantity_in: number
  quantity_out: number
  previous_balance: number
  resulting_balance: number
  reference_id: string
  reason: string
  created_by_name: string
  created_at: string
}

export interface BusinessSettings {
  id: number
  business_name: string
  tagline: string
  logo: string | null
  logo_url: string | null
  currency_code: string
  currency_symbol: string
  country: string
  timezone: string
  phone: string
  alternate_phone: string
  whatsapp_number: string
  email: string
  website: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  pincode: string
  landmark: string
  gst_number: string
  pan_number: string
  default_tax_rate: number
  invoice_prefix: string
  repair_prefix: string
  po_prefix: string
  invoice_footer: string
  terms_and_conditions: string
  privacy_policy?: string
  opening_hours_weekdays?: string
  opening_hours_sunday?: string
  google_maps_url?: string
  google_maps_embed_src?: string
  instagram_url?: string
  facebook_url?: string
  loyalty_points_per_100: number
  loyalty_redemption_rate: number
  low_stock_threshold: number
  enable_whatsapp: boolean
  enable_sms: boolean
  enable_email: boolean
  updated_at: string
}
