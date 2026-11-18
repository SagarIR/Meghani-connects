'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Plus, Minus, Trash2, User, CreditCard, Wallet, Smartphone, 
  ShoppingCart, Package, Barcode, Receipt, X, Check, ChevronRight, Camera,
  Gift, Star, ChevronUp, Split, Sparkles, Filter, AlertCircle, RefreshCw
} from 'lucide-react'
import { api } from '@/services/api'
import { Product, CartItem, Customer } from '@/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import BarcodeScanner from '@/components/features/BarcodeScanner'
import Invoice from '@/components/features/Invoice'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const categories = [
  { value: '', label: 'All Watches' },
  { value: 'analog', label: 'Analog' },
  { value: 'digital', label: 'Digital' },
  { value: 'smart', label: 'Smart' },
  { value: 'wall', label: 'Wall Clocks' },
  { value: 'accessory', label: 'Accessories' },
]

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [initialProducts, setInitialProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [discount, setDiscount] = useState(0)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'card' | 'mixed'>('cash')
  const [splitPayments, setSplitPayments] = useState<{ cash: number; upi: number; card: number }>({
    cash: 0,
    upi: 0,
    card: 0,
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)
  const [invoiceData, setInvoiceData] = useState<any>(null)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Fetch initial catalog on mount
  useEffect(() => {
    fetchInitialCatalog()
  }, [])

  const fetchInitialCatalog = async () => {
    setLoadingProducts(true)
    try {
      const response = await api.get('/products/?page_size=12&ordering=-created_at')
      const items = response.data?.results || response.data || []
      setInitialProducts(items)
    } catch (err) {
      console.error('Failed to load initial catalog:', err)
    } finally {
      setLoadingProducts(false)
    }
  }

  // Keyboard shortcut listener (/ for search, F4 for payment modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === 'F4' && cart.length > 0) {
        e.preventDefault()
        setShowPaymentModal(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cart.length])

  // Keyboard-wedge barcode scanner hardware listener
  useEffect(() => {
    let buffer = ''
    let lastKeyTime = Date.now()

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA'

      const currentTime = Date.now()
      if (currentTime - lastKeyTime > 120) {
        buffer = ''
      }
      lastKeyTime = currentTime

      if (e.key === 'Enter') {
        if (buffer.length >= 3 && !isInput) {
          e.preventDefault()
          handleBarcodeScan(buffer.trim())
          buffer = ''
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (!isInput) {
          buffer += e.key
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [cart])

  // Handle barcode scan
  const handleBarcodeScan = async (barcode: string) => {
    try {
      const response = await api.get(`/products/barcode/${barcode}/`)
      if (response.data) {
        addToCart(response.data)
        setShowScanner(false)
      }
    } catch (error) {
      setSearch(barcode)
      setShowScanner(false)
      toast.error('Product not found for scanned barcode. Filtering inventory.')
    }
  }

  useEffect(() => {
    if (search.length >= 2) {
      searchProducts()
    } else {
      setProducts([])
    }
  }, [search, selectedCategory])

  useEffect(() => {
    if (customerSearch.length >= 2) {
      searchCustomers()
    } else {
      setCustomerResults([])
    }
  }, [customerSearch])

  const searchProducts = async () => {
    try {
      let url = `/products/search/?q=${encodeURIComponent(search)}`
      if (selectedCategory) {
        url += `&category=${selectedCategory}`
      }
      const response = await api.get(url)
      setProducts(response.data)
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  const searchCustomers = async () => {
    try {
      const response = await api.get(`/customers/?search=${encodeURIComponent(customerSearch)}`)
      setCustomerResults(response.data.results || response.data)
    } catch (error) {
      console.error('Customer search failed:', error)
    }
  }

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id)
    
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error(`Insufficient stock for ${product.name} (Max: ${product.stock})`)
        return
      }
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      if (product.stock <= 0) {
        toast.error(`${product.name} is out of stock`)
        return
      }
      setCart([...cart, { product, quantity: 1, unit_price: product.selling_price }])
    }
    
    toast.success(`${product.name} added to cart`, { duration: 1500 })
    setSearch('')
    setProducts([])
  }

  const updateQuantity = (productId: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta
        if (newQty < 1) return item
        if (newQty > item.product.stock) {
          toast.error(`Maximum available stock is ${item.product.stock}`)
          return item
        }
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  const selectCustomer = (c: Customer) => {
    setCustomer(c)
    setShowCustomerSearch(false)
    setCustomerSearch('')
    setCustomerResults([])
    toast.success(`Client Attached: ${c.name}`, { duration: 1500 })
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
  const total = Math.max(0, subtotal - discount)
  const splitTotal = Math.round(((Number(splitPayments.cash) || 0) + (Number(splitPayments.upi) || 0) + (Number(splitPayments.card) || 0)) * 100) / 100
  const remainingToPay = Math.round((total - splitTotal) * 100) / 100

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Register cart is empty')
      return
    }

    if (paymentMode === 'mixed') {
      const activeMethods = Object.entries(splitPayments).filter(([_, v]) => Number(v) > 0)
      if (activeMethods.length < 2) {
        toast.error('Split payment requires at least two payment methods with non-zero amounts')
        return
      }
      if (Math.abs(remainingToPay) > 0.01) {
        toast.error(`Split tender must equal total payable amount. Remaining: ${formatCurrency(remainingToPay)}`)
        return
      }
    }

    setIsProcessing(true)
    try {
      const payload: any = {
        customer_id: customer?.id || null,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        discount,
        payment_mode: paymentMode,
      }

      if (paymentMode === 'mixed') {
        payload.payment_details = {
          cash: Number(splitPayments.cash) || 0,
          upi: Number(splitPayments.upi) || 0,
          card: Number(splitPayments.card) || 0,
        }
      }

      const response = await api.post('/sales/', payload)
      
      // Prepare invoice data
      const invoice = {
        invoice_number: response.data.invoice_number,
        date: response.data.sale_date || new Date().toISOString(),
        customer_name: customer?.name,
        customer_phone: customer?.phone,
        items: cart.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.quantity * item.unit_price,
        })),
        subtotal: subtotal,
        discount: discount,
        tax: 0,
        total: total,
        payment_mode: paymentMode,
        payment_details: response.data.payment_details || (paymentMode === 'mixed' ? payload.payment_details : null),
      }
      
      setInvoiceData(invoice)
      setShowInvoice(true)
      toast.success(`Sale completed! Invoice: ${response.data.invoice_number}`, { duration: 3500 })
      
      setCart([])
      setCustomer(null)
      setDiscount(0)
      setSplitPayments({ cash: 0, upi: 0, card: 0 })
      setShowPaymentModal(false)
      setShowMobileCart(false)
      fetchInitialCatalog()
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 
                     (typeof error.response?.data?.payment_details === 'string' ? error.response.data.payment_details : null) ||
                     (Array.isArray(error.response?.data?.payment_details) ? error.response.data.payment_details[0] : null) ||
                     (Array.isArray(error.response?.data?.items) ? error.response.data.items[0] : null) ||
                     'Failed to complete sale'
      toast.error(errMsg)
    } finally {
      setIsProcessing(false)
    }
  }

  const clearCart = () => {
    setCart([])
    setDiscount(0)
    toast.success('Cart cleared')
  }

  // Active product list to render
  const displayedProducts = products.length > 0 
    ? products 
    : (selectedCategory 
        ? initialProducts.filter(p => p.category === selectedCategory) 
        : initialProducts)

  return (
    <div className="h-[calc(100vh-5.5rem)] lg:h-[calc(100vh-7rem)] flex flex-col lg:flex-row gap-4 lg:gap-6 text-[#F3EFE6]">
      {/* Left Workspace: Search, Inventory Gallery & Quick Selection */}
      <div className="flex-1 flex flex-col gap-3 lg:gap-4 min-h-0">
        {/* Top Search & Barcode Wedge Bar */}
        <div className="bg-[#171613] border border-[#2A261F] rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="relative">
            <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#C9A45C]" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by timepiece name, brand, or scan barcode wedge (Enter)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const trimmed = search.trim()
                  if (!trimmed) return
                  try {
                    const res = await api.get(`/products/barcode/${trimmed}/`)
                    if (res.data) {
                      addToCart(res.data)
                      setSearch('')
                      setProducts([])
                      return
                    }
                  } catch {
                    if (products.length === 1) {
                      addToCart(products[0])
                      setSearch('')
                      setProducts([])
                      return
                    }
                  }
                }
              }}
              className="w-full pl-10 sm:pl-12 pr-24 py-3 bg-[#12110F] border border-[#2A261F] rounded-xl text-sm sm:text-base text-[#F3EFE6] placeholder-[#8D8980] focus:outline-none focus:border-[#C9A45C] focus:ring-1 focus:ring-[#C9A45C] transition-all"
              autoFocus
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setShowScanner(true)}
                className="p-2 bg-[#1F1E1A] hover:bg-[#282620] border border-[#2A261F] hover:border-[#C9A45C]/50 rounded-lg text-[#C9A45C] transition-colors"
                title="Camera Barcode Scanner"
              >
                <Camera className="w-4 h-4" />
              </button>
              <kbd className="hidden sm:inline-flex items-center px-2 py-1 bg-[#1F1E1A] border border-[#2A261F] rounded text-xs text-[#8D8980] font-mono">
                /
              </kbd>
            </div>
          </div>

          {/* Quick Filter Categories */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pt-3 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={clsx(
                  'px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all border',
                  selectedCategory === cat.value
                    ? 'bg-[#C9A45C] text-[#0B0B0A] font-bold border-[#C9A45C] shadow-sm shadow-[#C9A45C]/20'
                    : 'bg-[#12110F] text-[#8D8980] border-[#2A261F] hover:border-[#C9A45C]/40 hover:text-[#F3EFE6]'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Attachment Card */}
        <div className="bg-[#171613] border border-[#2A261F] rounded-2xl p-3 sm:p-3.5 shadow-xl">
          {customer ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2A261F] to-[#171613] border border-[#C9A45C]/50 flex items-center justify-center font-bold text-sm text-[#C9A45C] flex-shrink-0">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-[#F3EFE6] truncate">{customer.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-800/50 text-amber-300 font-medium flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 text-amber-400" /> {customer.loyalty_points} VIP pts
                    </span>
                  </div>
                  <p className="text-xs text-[#8D8980] font-mono">{customer.phone}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCustomer(null)} className="flex-shrink-0">
                <X className="w-4 h-4 mr-1" /> Detach
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomerSearch(true)}
              className="w-full flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-[#12110F] hover:bg-[#1A1916] border border-[#2A261F] hover:border-[#C9A45C]/40 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1F1E1A] border border-[#2A261F] flex items-center justify-center text-[#8D8980] group-hover:text-[#C9A45C]">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs sm:text-sm font-semibold text-[#F3EFE6]">Attach Customer Profile</p>
                  <p className="text-[11px] text-[#8D8980]">Earn loyalty points & link invoice to warranty CRM</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8D8980] group-hover:text-[#C9A45C] group-hover:translate-x-0.5 transition-all" />
            </button>
          )}
        </div>

        {/* Timepiece Selection Grid / Instant Search Results */}
        <div className="flex-1 overflow-y-auto bg-[#171613] border border-[#2A261F] rounded-2xl p-3 sm:p-4 shadow-xl min-h-0">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8D8980]">
              {search.length >= 2 ? `Search Results (${products.length})` : 'Timepiece Quick Select'}
            </span>
            <span className="text-[11px] font-mono text-[#8D8980]/70">
              Wedge scanner active
            </span>
          </div>

          {displayedProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#8D8980]">
              <Barcode className="w-12 h-12 text-[#2A261F] mb-3" />
              <p className="text-sm font-medium text-[#F3EFE6]">No matching timepieces found</p>
              <p className="text-xs mt-1">Try another brand name or scan with the barcode scanner</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3">
              {displayedProducts.map((product) => {
                const inCart = cart.find(c => c.product.id === product.id)
                const isOutOfStock = product.stock <= 0

                return (
                  <button
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    disabled={isOutOfStock}
                    className={clsx(
                      'relative text-left p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between group',
                      isOutOfStock
                        ? 'opacity-40 bg-[#12110F] border-[#2A261F] cursor-not-allowed'
                        : inCart
                          ? 'bg-[#1F1E1A] border-[#C9A45C]/60 shadow-md shadow-[#C9A45C]/10'
                          : 'bg-[#12110F] border-[#2A261F] hover:border-[#C9A45C]/50 hover:bg-[#1A1916]'
                    )}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#1F1E1A] text-[#8D8980] border border-[#2A261F]">
                          {product.brand || 'Boutique'}
                        </span>
                        <span className={clsx(
                          'text-[10px] font-mono px-1.5 py-0.5 rounded-full font-medium',
                          product.stock > 3 
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40' 
                            : product.stock > 0 
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                              : 'bg-red-950/60 text-red-300 border border-red-800/40'
                        )}>
                          {product.stock > 0 ? `Stock: ${product.stock}` : 'Sold Out'}
                        </span>
                      </div>
                      <p className="font-serif font-bold text-sm text-[#F3EFE6] line-clamp-1 group-hover:text-[#C9A45C] transition-colors">
                        {product.name}
                      </p>
                      {product.barcode && (
                        <p className="text-[10px] font-mono text-[#8D8980]/80 mt-0.5">
                          {product.barcode}
                        </p>
                      )}
                    </div>

                    <div className="flex items-baseline justify-between pt-2.5 mt-2 border-t border-[#2A261F]/60">
                      <span className="font-mono text-sm sm:text-base font-bold text-[#C9A45C]">
                        {formatCurrency(product.selling_price)}
                      </span>
                      {inCart ? (
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                          In Cart: {inCart.quantity}
                        </span>
                      ) : (
                        <span className="text-xs text-[#8D8980] group-hover:text-[#F3EFE6] flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5 text-[#C9A45C]" /> Add
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Workspace: Register Cart & Live Tender (Desktop) */}
      <div className="hidden lg:flex w-[390px] xl:w-[430px] bg-[#171613] border border-[#2A261F] rounded-2xl shadow-2xl flex-col">
        {/* Cart Header */}
        <div className="p-4 border-b border-[#2A261F] bg-[#12110F]/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1F1E1A] border border-[#C9A45C]/40 flex items-center justify-center text-[#C9A45C]">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-[#F3EFE6]">Register Order</h2>
              <p className="text-[11px] font-mono text-[#8D8980]">{cart.length} item(s) in tender</p>
            </div>
          </div>
          {cart.length > 0 && (
            <button 
              onClick={clearCart} 
              className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 px-2 py-1 rounded-lg border border-transparent hover:border-red-800/40 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Cart Line Items */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8D8980]">
              <ShoppingCart className="w-10 h-10 text-[#2A261F] mb-3" />
              <p className="text-sm font-semibold text-[#F3EFE6]">Register Cart is Empty</p>
              <p className="text-xs text-[#8D8980] mt-1">Scan a barcode or tap a timepiece to begin sale</p>
            </div>
          ) : (
            cart.map((item) => (
              <div 
                key={item.product.id} 
                className="p-3 rounded-xl bg-[#12110F] border border-[#2A261F] hover:border-[#C9A45C]/40 transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-serif font-bold text-sm text-[#F3EFE6] truncate group-hover:text-[#C9A45C] transition-colors">
                      {item.product.name}
                    </p>
                    <p className="text-xs font-mono text-[#8D8980]">
                      {formatCurrency(item.unit_price)} each
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-[#8D8980] hover:text-red-400 rounded-lg transition-colors flex-shrink-0"
                    title="Remove item"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 bg-[#1F1E1A] border border-[#2A261F] rounded-lg p-0.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#282620] transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold font-mono text-[#F3EFE6]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#282620] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="font-mono text-sm font-bold text-[#F3EFE6]">
                    {formatCurrency(item.unit_price * item.quantity)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Totals & Checkout Trigger */}
        <div className="p-4 border-t border-[#2A261F] bg-[#12110F]/90 space-y-3">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-[#8D8980]">
              <span>Subtotal</span>
              <span className="font-mono text-[#F3EFE6]">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8D8980]">Special Courtesy Discount</span>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8D8980] text-xs font-semibold">₹</span>
                <input
                  type="number"
                  min="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0"
                  className="w-24 pl-6 pr-2 py-1 text-right text-xs bg-[#1F1E1A] border border-[#2A261F] focus:border-[#C9A45C] rounded-lg text-[#F3EFE6] font-mono outline-none"
                />
              </div>
            </div>
            <div className="flex justify-between items-baseline pt-2.5 border-t border-[#2A261F]">
              <span className="font-serif text-sm font-semibold text-[#F3EFE6]">Total Payable</span>
              <span className="font-serif text-2xl font-bold text-[#C9A45C] tracking-tight">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            fullWidth
            size="lg"
            disabled={cart.length === 0}
            onClick={() => setShowPaymentModal(true)}
            className="py-3.5"
          >
            <CreditCard className="w-4 h-4 mr-1.5" />
            Proceed to Payment (F4)
          </Button>
        </div>
      </div>

      {/* Mobile Cart Floating Action Bar */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
          <button
            onClick={() => setShowMobileCart(true)}
            className="w-full bg-gradient-to-r from-[#C9A45C] via-[#DFC17B] to-[#C9A45C] text-[#0B0B0A] rounded-2xl p-3.5 shadow-2xl flex items-center justify-between font-bold"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0B0B0A]/15 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <span className="text-sm">{cart.length} item(s) in cart</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-serif font-extrabold">{formatCurrency(total)}</span>
              <ChevronUp className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Mobile Cart Drawer */}
      <AnimatePresence>
        {showMobileCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
              onClick={() => setShowMobileCart(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#171613] border-t border-[#2A261F] text-[#F3EFE6] rounded-t-3xl max-h-[85vh] z-50 flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-[#2A261F] flex items-center justify-between bg-[#12110F]">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#C9A45C]" />
                  <span className="font-serif font-bold text-base">Cart Review ({cart.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  {cart.length > 0 && (
                    <button onClick={clearCart} className="text-xs text-red-400 font-medium">Clear</button>
                  )}
                  <button onClick={() => setShowMobileCart(false)} className="p-1.5 text-[#8D8980]">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {cart.map((item) => (
                  <div key={item.product.id} className="p-3 bg-[#12110F] border border-[#2A261F] rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-sm text-[#F3EFE6]">{item.product.name}</p>
                        <p className="text-xs font-mono text-[#8D8980]">{formatCurrency(item.unit_price)} each</p>
                      </div>
                      <button onClick={() => removeFromCart(item.product.id)} className="p-1 text-[#8D8980]">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-[#1F1E1A] border border-[#2A261F] rounded-lg">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="w-7 h-7 flex items-center justify-center">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold font-mono">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="w-7 h-7 flex items-center justify-center">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="font-mono font-bold text-sm text-[#C9A45C]">
                        {formatCurrency(item.unit_price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-[#2A261F] bg-[#12110F] space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-semibold">Total Payable</span>
                  <span className="text-xl font-bold font-serif text-[#C9A45C]">{formatCurrency(total)}</span>
                </div>
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={() => {
                    setShowMobileCart(false)
                    setShowPaymentModal(true)
                  }}
                >
                  Proceed to Payment
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Customer Lookup Modal */}
      <Modal
        isOpen={showCustomerSearch}
        onClose={() => setShowCustomerSearch(false)}
        title="Lookup Boutique Client"
        description="Search client by full name or phone number"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C9A45C]" />
            <input
              type="text"
              placeholder="Search by client name or mobile..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl text-sm text-[#F3EFE6] placeholder-[#8D8980] focus:border-[#C9A45C] outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {customerResults.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCustomer(c)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#12110F] hover:bg-[#1F1E1A] border border-[#2A261F] hover:border-[#C9A45C]/40 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1F1E1A] border border-[#C9A45C]/30 flex items-center justify-center font-bold text-xs text-[#C9A45C]">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#F3EFE6]">{c.name}</p>
                    <p className="text-xs font-mono text-[#8D8980]">{c.phone}</p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-800/40 text-amber-300">
                  {c.loyalty_points} pts
                </span>
              </button>
            ))}
            {customerSearch.length >= 2 && customerResults.length === 0 && (
              <div className="text-center py-8 text-[#8D8980]">
                <User className="w-8 h-8 mx-auto text-[#2A261F] mb-2" />
                <p className="text-sm">No client found matching &ldquo;{customerSearch}&rdquo;</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Complete Payment & Split Tender Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Complete Boutique Tender"
        description="Select tender method and confirm payment allocation"
        size="lg"
      >
        <div className="space-y-5">
          {/* Payment Method Selector */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8D8980] mb-2">
              Payment Method
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { mode: 'cash', label: 'Cash Tender', icon: Wallet },
                { mode: 'upi', label: 'UPI / QR', icon: Smartphone },
                { mode: 'card', label: 'Credit / Debit', icon: CreditCard },
                { mode: 'mixed', label: 'Split Tender', icon: Split },
              ].map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode as 'cash' | 'upi' | 'card' | 'mixed')}
                  className={clsx(
                    'relative p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all',
                    paymentMode === mode
                      ? 'border-[#C9A45C] bg-[#1F1E1A] shadow-md shadow-[#C9A45C]/15'
                      : 'border-[#2A261F] bg-[#12110F] hover:bg-[#1A1916] text-[#8D8980]'
                  )}
                >
                  <div className={clsx(
                    'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                    paymentMode === mode ? 'bg-[#C9A45C] text-[#0B0B0A]' : 'bg-[#1F1E1A] text-[#8D8980]'
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={clsx('text-xs font-semibold', paymentMode === mode ? 'text-[#F3EFE6]' : 'text-[#8D8980]')}>
                    {label}
                  </span>
                  {paymentMode === mode && (
                    <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[#C9A45C] flex items-center justify-center text-[#0B0B0A]">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Split Payment Breakdown UI */}
          {paymentMode === 'mixed' && (
            <div className="bg-[#12110F] border border-[#2A261F] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#C9A45C] uppercase tracking-wider flex items-center gap-1.5">
                  <Split className="w-4 h-4" /> Split Tender Breakdown
                </span>
                <button
                  type="button"
                  onClick={() => setSplitPayments({ cash: 0, upi: 0, card: 0 })}
                  className="text-xs text-[#8D8980] hover:text-[#F3EFE6] underline"
                >
                  Clear Tender
                </button>
              </div>

              {/* Cash Input */}
              <div className="flex items-center gap-2">
                <div className="w-24 text-xs font-semibold text-[#8D8980] flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Cash:
                </div>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8D8980]">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={splitPayments.cash || ''}
                    onChange={(e) => setSplitPayments({ ...splitPayments, cash: Math.max(0, parseFloat(e.target.value) || 0) })}
                    placeholder="0.00"
                    className="w-full pl-6 pr-2 py-1.5 text-xs bg-[#1F1E1A] border border-[#2A261F] focus:border-[#C9A45C] rounded-lg text-[#F3EFE6] font-mono outline-none text-right"
                  />
                </div>
                {remainingToPay > 0 && (
                  <button
                    type="button"
                    onClick={() => setSplitPayments({ ...splitPayments, cash: (splitPayments.cash || 0) + remainingToPay })}
                    className="px-2 py-1 text-xs bg-[#1F1E1A] border border-[#C9A45C]/40 text-[#C9A45C] rounded hover:bg-[#282620] whitespace-nowrap font-mono"
                  >
                    +₹{remainingToPay}
                  </button>
                )}
              </div>

              {/* UPI Input */}
              <div className="flex items-center gap-2">
                <div className="w-24 text-xs font-semibold text-[#8D8980] flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-sky-400" /> UPI / QR:
                </div>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8D8980]">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={splitPayments.upi || ''}
                    onChange={(e) => setSplitPayments({ ...splitPayments, upi: Math.max(0, parseFloat(e.target.value) || 0) })}
                    placeholder="0.00"
                    className="w-full pl-6 pr-2 py-1.5 text-xs bg-[#1F1E1A] border border-[#2A261F] focus:border-[#C9A45C] rounded-lg text-[#F3EFE6] font-mono outline-none text-right"
                  />
                </div>
                {remainingToPay > 0 && (
                  <button
                    type="button"
                    onClick={() => setSplitPayments({ ...splitPayments, upi: (splitPayments.upi || 0) + remainingToPay })}
                    className="px-2 py-1 text-xs bg-[#1F1E1A] border border-[#C9A45C]/40 text-[#C9A45C] rounded hover:bg-[#282620] whitespace-nowrap font-mono"
                  >
                    +₹{remainingToPay}
                  </button>
                )}
              </div>

              {/* Card Input */}
              <div className="flex items-center gap-2">
                <div className="w-24 text-xs font-semibold text-[#8D8980] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" /> Card:
                </div>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8D8980]">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={splitPayments.card || ''}
                    onChange={(e) => setSplitPayments({ ...splitPayments, card: Math.max(0, parseFloat(e.target.value) || 0) })}
                    placeholder="0.00"
                    className="w-full pl-6 pr-2 py-1.5 text-xs bg-[#1F1E1A] border border-[#2A261F] focus:border-[#C9A45C] rounded-lg text-[#F3EFE6] font-mono outline-none text-right"
                  />
                </div>
                {remainingToPay > 0 && (
                  <button
                    type="button"
                    onClick={() => setSplitPayments({ ...splitPayments, card: (splitPayments.card || 0) + remainingToPay })}
                    className="px-2 py-1 text-xs bg-[#1F1E1A] border border-[#C9A45C]/40 text-[#C9A45C] rounded hover:bg-[#282620] whitespace-nowrap font-mono"
                  >
                    +₹{remainingToPay}
                  </button>
                )}
              </div>

              {/* Tender Allocation Balance Indicator */}
              <div className="pt-2.5 border-t border-[#2A261F] flex items-center justify-between text-xs">
                <span className="text-[#8D8980]">
                  Allocated: <b className="text-[#F3EFE6] font-mono">{formatCurrency(splitTotal)}</b>
                </span>
                {remainingToPay === 0 ? (
                  <span className="text-emerald-300 font-bold flex items-center gap-1 bg-emerald-950/70 border border-emerald-800/50 px-2 py-0.5 rounded">
                    <Check className="w-3 h-3 text-emerald-400" /> Exact Match (₹0.00 Remaining)
                  </span>
                ) : remainingToPay > 0 ? (
                  <span className="text-amber-300 font-bold bg-amber-950/70 border border-amber-800/50 px-2 py-0.5 rounded">
                    Remaining: {formatCurrency(remainingToPay)}
                  </span>
                ) : (
                  <span className="text-red-300 font-bold bg-red-950/70 border border-red-800/50 px-2 py-0.5 rounded">
                    Overallocated: +{formatCurrency(Math.abs(remainingToPay))}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Tender Summary Box */}
          <div className="p-4 bg-[#12110F] border border-[#2A261F] rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-[#8D8980]">
              <span>Cart Timepieces ({cart.length})</span>
              <span className="font-mono text-[#F3EFE6]">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount Applied</span>
                <span className="font-mono">-{formatCurrency(discount)}</span>
              </div>
            )}
            {customer && (
              <div className="flex justify-between text-[#8D8980]">
                <span>Boutique Client</span>
                <span className="text-[#F3EFE6] font-semibold">{customer.name}</span>
              </div>
            )}
            <div className="pt-2.5 border-t border-[#2A261F] flex justify-between items-baseline">
              <span className="text-sm font-semibold text-[#F3EFE6]">Total Payable Amount</span>
              <span className="font-serif text-2xl font-bold text-[#C9A45C]">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={handleCheckout}
              loading={isProcessing}
              disabled={paymentMode === 'mixed' && (remainingToPay !== 0 || Object.values(splitPayments).filter(v => Number(v) > 0).length < 2)}
            >
              <Check className="w-4 h-4 mr-1.5" />
              Authorize & Complete Sale
            </Button>
            {paymentMode === 'mixed' && remainingToPay !== 0 && (
              <p className="text-[11px] text-center text-amber-300">
                Split tender must match the total payable amount exactly before authorising transaction.
              </p>
            )}
            {paymentMode === 'mixed' && remainingToPay === 0 && Object.values(splitPayments).filter(v => Number(v) > 0).length < 2 && (
              <p className="text-[11px] text-center text-amber-300">
                Please allocate across at least two payment methods for a split transaction.
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* Barcode Camera Scanner Modal */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScan}
      />

      {/* Luxury Thermal Invoice Preview */}
      {showInvoice && invoiceData && (
        <Invoice
          data={invoiceData}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </div>
  )
}
