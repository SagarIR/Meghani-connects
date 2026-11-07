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
export interface Product {
  id: number
  name: string
  brand: string
  category: string
  cost_price: number
  selling_price: number
  stock: number
  barcode: string | null
  supplier_name: string
  image: string | null
  description: string
  warranty_months: number
  is_active: boolean
  profit_margin: number
  profit_percentage: number
  is_low_stock: boolean
  created_at: string
}

// Customer types
export interface Customer {
  id: number
  name: string
  phone: string
  email: string
  address: string
  date_of_birth: string | null
  language_preference: string
  loyalty_points: number
  total_purchases: number
  purchase_count: number
  created_at: string
}

// Sale types
export interface SaleItem {
  id: number
  product: number
  product_name: string
  product_brand: string
  quantity: number
  unit_price: number
  subtotal: number
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
  profit: number
  notes: string
  sale_date: string
  items: SaleItem[]
  created_by_name: string
}

// Repair types
export interface Repair {
  id: number
  ticket_number: string
  customer: number
  customer_name: string
  customer_phone: string
  item_type: string
  brand: string
  model_number: string
  issue_description: string
  estimated_cost: number | null
  repair_charge: number | null
  advance_paid: number
  balance_due: number
  status: 'received' | 'in_repair' | 'ready' | 'delivered' | 'cancelled'
  received_date: string
  expected_delivery: string | null
  days_in_repair: number
  notes: string
}

// Expense types
export interface Expense {
  id: number
  category: string
  category_display: string
  amount: number
  date: string
  description: string
  vendor_name: string
  created_at: string
}

// Cart types (for POS)
export interface CartItem {
  product: Product
  quantity: number
  unit_price: number
}
