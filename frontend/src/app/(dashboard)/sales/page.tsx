'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Plus, Minus, Trash2, User, CreditCard, Wallet, Smartphone, 
  ShoppingCart, Package, Barcode, Receipt, X, Check, ChevronRight, Camera,
  Gift, Star, ChevronUp
} from 'lucide-react'
import { api } from '@/services/api'
import { Product, CartItem, Customer } from '@/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import BarcodeScanner from '@/components/features/BarcodeScanner'
import Invoice from '@/components/features/Invoice'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [discount, setDiscount] = useState(0)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'card'>('cash')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)
  const [invoiceData, setInvoiceData] = useState<any>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

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
      toast.error('Product not found. Try searching instead.')
    }
  }

  useEffect(() => {
    if (search.length >= 2) {
      searchProducts()
    } else {
      setProducts([])
    }
  }, [search])

  useEffect(() => {
    if (customerSearch.length >= 2) {
      searchCustomers()
    } else {
      setCustomerResults([])
    }
  }, [customerSearch])

  const searchProducts = async () => {
    try {
      const response = await api.get(`/products/search/?q=${search}`)
      setProducts(response.data)
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  const searchCustomers = async () => {
    try {
      const response = await api.get(`/customers/?search=${customerSearch}`)
      setCustomerResults(response.data.results || response.data)
    } catch (error) {
      console.error('Customer search failed:', error)
    }
  }

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id)
    
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error('Insufficient stock')
        return
      }
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { product, quantity: 1, unit_price: product.selling_price }])
    }
    
    toast.success(`${product.name} added`, { duration: 1500, icon: '🛒' })
    setSearch('')
    setProducts([])
  }

  const updateQuantity = (productId: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta
        if (newQty < 1) return item
        if (newQty > item.product.stock) {
          toast.error('Insufficient stock')
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
    toast.success(`Customer: ${c.name}`, { duration: 1500 })
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
  const total = subtotal - discount

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    setIsProcessing(true)
    try {
      const payload = {
        customer_id: customer?.id || null,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        discount,
        payment_mode: paymentMode,
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
      }
      
      setInvoiceData(invoice)
      setShowInvoice(true)
      toast.success(`Sale completed! Invoice: ${response.data.invoice_number}`, { duration: 3000 })
      
      setCart([])
      setCustomer(null)
      setDiscount(0)
      setShowPaymentModal(false)
      setShowMobileCart(false)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to complete sale')
    } finally {
      setIsProcessing(false)
    }
  }

  const clearCart = () => {
    setCart([])
    setDiscount(0)
    toast.success('Cart cleared')
  }

  return (
    <div className="h-[calc(100vh-6rem)] lg:h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4 lg:gap-6">
      {/* Left - Product Search & Selection */}
      <div className="flex-1 flex flex-col gap-3 lg:gap-4 min-h-0">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-sm border border-gray-100"
        >
          <div className="relative">
            <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 lg:pl-12 pr-20 lg:pr-24 py-3 lg:py-4 bg-gray-50 border-0 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm lg:text-lg text-gray-900 placeholder-gray-400"
              autoFocus
            />
            <div className="absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 lg:gap-2">
              <button
                onClick={() => setShowScanner(true)}
                className="p-1.5 lg:p-2 bg-primary-100 hover:bg-primary-200 rounded-lg transition-colors group"
                title="Scan Barcode"
              >
                <Camera className="w-4 h-4 lg:w-5 lg:h-5 text-primary-600 group-hover:text-primary-700" />
              </button>
              <kbd className="hidden sm:inline px-2 py-1 bg-gray-200 rounded text-xs text-gray-500 font-mono">/</kbd>
            </div>
          </div>

          {/* Search Results */}
          <AnimatePresence>
            {products.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 lg:mt-4 space-y-1.5 lg:space-y-2 max-h-48 lg:max-h-80 overflow-y-auto"
              >
                {products.map((product, index) => (
                  <motion.button
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => addToCart(product)}
                    className="w-full flex items-center gap-3 lg:gap-4 p-3 lg:p-4 bg-gray-50 hover:bg-primary-50 rounded-lg lg:rounded-xl transition-all group"
                  >
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-lg flex items-center justify-center border border-gray-100 group-hover:border-primary-200 flex-shrink-0">
                      <Package className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400 group-hover:text-primary-500" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-sm lg:text-base text-gray-900 group-hover:text-primary-700 truncate">{product.name}</p>
                      <div className="flex items-center gap-2 lg:gap-3 mt-0.5 lg:mt-1">
                        <span className="text-xs lg:text-sm text-gray-500 truncate">{product.brand}</span>
                        <span className={clsx(
                          'text-[10px] lg:text-xs px-1.5 lg:px-2 py-0.5 rounded-full flex-shrink-0',
                          product.stock > 5 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        )}>
                          Stock: {product.stock}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm lg:text-base text-primary-600">{formatCurrency(product.selling_price)}</p>
                      <p className="text-[10px] lg:text-xs text-gray-400">Tap to add</p>
                    </div>
                    <Plus className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 group-hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hidden sm:block" />
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Customer Selection */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-sm border border-gray-100"
        >
          {customer ? (
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-lg lg:text-xl font-bold text-white">{customer.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm lg:text-base text-gray-900">{customer.name}</p>
                  <span className="text-[10px] lg:text-xs px-1.5 lg:px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1 flex-shrink-0">
                    <Star className="w-2.5 h-2.5 lg:w-3 lg:h-3" /> {customer.loyalty_points} pts
                  </span>
                </div>
                <p className="text-xs lg:text-sm text-gray-500">{customer.phone}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCustomer(null)} className="flex-shrink-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomerSearch(true)}
              className="w-full flex items-center gap-3 lg:gap-4 p-2 lg:p-3 bg-gray-50 hover:bg-gray-100 rounded-lg lg:rounded-xl transition-colors"
            >
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-200 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-sm lg:text-base text-gray-700">Add Customer</p>
                <p className="text-xs lg:text-sm text-gray-500 hidden sm:block">Track loyalty points & history</p>
              </div>
              <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 flex-shrink-0" />
            </button>
          )}
        </motion.div>

        {/* Quick Info - Hidden on mobile when cart has items */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={clsx(
            "flex-1 bg-gradient-to-br from-primary-50 to-purple-50 rounded-xl lg:rounded-2xl p-4 lg:p-6 flex flex-col items-center justify-center border border-primary-100",
            cart.length > 0 && "hidden lg:flex"
          )}
        >
          {cart.length === 0 ? (
            <div className="text-center">
              <div className="w-14 h-14 lg:w-20 lg:h-20 mx-auto bg-white rounded-xl lg:rounded-2xl flex items-center justify-center mb-3 lg:mb-4 shadow-sm">
                <Barcode className="w-7 h-7 lg:w-10 lg:h-10 text-primary-400" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold text-gray-800 mb-1 lg:mb-2">Ready to Scan</h3>
              <p className="text-sm lg:text-base text-gray-500 max-w-sm">Search products or scan barcode to add items</p>
              <div className="hidden sm:flex items-center justify-center gap-4 lg:gap-6 mt-4 lg:mt-6">
                <div className="text-center">
                  <kbd className="px-2 lg:px-3 py-1 lg:py-1.5 bg-white rounded-lg text-xs lg:text-sm font-mono shadow-sm">Ctrl + K</kbd>
                  <p className="text-[10px] lg:text-xs text-gray-500 mt-1">Global Search</p>
                </div>
                <div className="text-center">
                  <kbd className="px-2 lg:px-3 py-1 lg:py-1.5 bg-white rounded-lg text-xs lg:text-sm font-mono shadow-sm">/</kbd>
                  <p className="text-[10px] lg:text-xs text-gray-500 mt-1">Focus Search</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-14 h-14 lg:w-20 lg:h-20 mx-auto bg-white rounded-xl lg:rounded-2xl flex items-center justify-center mb-3 lg:mb-4 shadow-sm">
                <ShoppingCart className="w-7 h-7 lg:w-10 lg:h-10 text-primary-500" />
              </div>
              <h3 className="text-3xl lg:text-4xl font-bold text-gray-900">{cart.length}</h3>
              <p className="text-sm lg:text-base text-gray-600">items in cart</p>
              <p className="text-xl lg:text-2xl font-bold text-primary-600 mt-2">{formatCurrency(total)}</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Right - Cart (Desktop) */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden lg:flex w-[380px] xl:w-[420px] bg-white rounded-2xl shadow-sm border border-gray-100 flex-col"
      >
        {/* Cart Header */}
        <div className="p-4 lg:p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary-100 rounded-lg lg:rounded-xl flex items-center justify-center">
              <Receipt className="w-4 h-4 lg:w-5 lg:h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="font-semibold text-sm lg:text-base text-gray-900">Current Sale</h2>
              <p className="text-xs lg:text-sm text-gray-500">{cart.length} items</p>
            </div>
          </div>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-1" /> Clear
            </Button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-2 lg:space-y-3">
          <AnimatePresence mode="popLayout">
            {cart.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center"
              >
                <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gray-100 rounded-xl lg:rounded-2xl flex items-center justify-center mb-3 lg:mb-4">
                  <ShoppingCart className="w-7 h-7 lg:w-8 lg:h-8 text-gray-300" />
                </div>
                <p className="text-sm lg:text-base text-gray-500">Cart is empty</p>
                <p className="text-xs lg:text-sm text-gray-400">Add products to get started</p>
              </motion.div>
            ) : (
              cart.map((item, index) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-gray-50 rounded-lg lg:rounded-xl p-3 lg:p-4 hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-2 lg:mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-medium text-sm lg:text-base text-gray-900 line-clamp-1">{item.product.name}</p>
                      <p className="text-xs lg:text-sm text-gray-500">{formatCurrency(item.unit_price)} each</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.product.id)} 
                      className="p-1 lg:p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5 lg:gap-1 bg-white rounded-lg border border-gray-200">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center hover:bg-gray-100 rounded-l-lg transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      </button>
                      <span className="w-8 lg:w-10 text-center font-semibold text-sm lg:text-base text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center hover:bg-gray-100 rounded-r-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      </button>
                    </div>
                    <p className="font-bold text-sm lg:text-base text-gray-900">{formatCurrency(item.unit_price * item.quantity)}</p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Totals & Checkout */}
        <div className="p-4 lg:p-5 border-t border-gray-100 bg-gray-50/50">
          <div className="space-y-2 lg:space-y-3 mb-4 lg:mb-5">
            <div className="flex justify-between text-sm lg:text-base text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm lg:text-base text-gray-600">Discount</span>
              <div className="relative">
                <span className="absolute left-2.5 lg:left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-24 lg:w-28 pl-6 lg:pl-7 pr-2 lg:pr-3 py-1.5 lg:py-2 bg-white border border-gray-200 rounded-lg text-right text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 lg:pt-3 border-t border-gray-200">
              <span className="text-base lg:text-lg font-semibold text-gray-900">Total</span>
              <span className="text-xl lg:text-2xl font-bold text-primary-600">{formatCurrency(total)}</span>
            </div>
          </div>

          <Button
            className="w-full py-3 lg:py-4 text-base lg:text-lg"
            disabled={cart.length === 0}
            onClick={() => setShowPaymentModal(true)}
          >
            <CreditCard className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
            Proceed to Payment
          </Button>
        </div>
      </motion.div>

      {/* Mobile Cart Button */}
      {cart.length > 0 && (
        <motion.button
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          onClick={() => setShowMobileCart(true)}
          className="lg:hidden fixed bottom-4 left-4 right-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl p-4 shadow-lg shadow-primary-500/25 flex items-center justify-between z-40"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-semibold">{cart.length} items</p>
              <p className="text-sm text-white/80">View cart</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">{formatCurrency(total)}</p>
            <ChevronUp className="w-5 h-5 mx-auto mt-0.5" />
          </div>
        </motion.button>
      )}

      {/* Mobile Cart Modal */}
      <AnimatePresence>
        {showMobileCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowMobileCart(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] z-50 flex flex-col"
            >
              {/* Cart Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Receipt className="w-5 h-5 text-primary-600" />
                  <h2 className="font-semibold text-gray-900">Cart ({cart.length})</h2>
                </div>
                <div className="flex items-center gap-2">
                  {cart.length > 0 && (
                    <button onClick={clearCart} className="text-sm text-red-600 font-medium">Clear</button>
                  )}
                  <button onClick={() => setShowMobileCart(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.map((item) => (
                  <div key={item.product.id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-medium text-sm text-gray-900 line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(item.unit_price)} each</p>
                      </div>
                      <button onClick={() => removeFromCart(item.product.id)} className="p-1 text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="w-8 h-8 flex items-center justify-center">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="w-8 h-8 flex items-center justify-center">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="font-bold text-sm text-gray-900">{formatCurrency(item.unit_price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals & Checkout */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Discount</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-24 pl-6 pr-2 py-1.5 bg-white border border-gray-200 rounded-lg text-right text-sm outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-primary-600">{formatCurrency(total)}</span>
                </div>
                <Button
                  className="w-full py-4 text-base"
                  disabled={cart.length === 0}
                  onClick={() => { setShowMobileCart(false); setShowPaymentModal(true); }}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Proceed to Payment
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Customer Search Modal */}
      <Modal
        isOpen={showCustomerSearch}
        onClose={() => setShowCustomerSearch(false)}
        title="Find Customer"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {customerResults.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCustomer(c)}
                className="w-full flex items-center gap-3 lg:gap-4 p-3 lg:p-4 bg-gray-50 hover:bg-primary-50 rounded-xl transition-colors group"
              >
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-base lg:text-lg font-bold text-white">{c.name.charAt(0)}</span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-sm lg:text-base text-gray-900">{c.name}</p>
                  <p className="text-xs lg:text-sm text-gray-500">{c.phone}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="flex items-center gap-1 text-yellow-600 text-sm">
                    <Gift className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> {c.loyalty_points} pts
                  </span>
                </div>
              </button>
            ))}
            {customerSearch.length >= 2 && customerResults.length === 0 && (
              <div className="text-center py-6 lg:py-8 text-gray-500">
                <User className="w-8 h-8 lg:w-10 lg:h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm lg:text-base">No customers found</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Complete Payment"
        size="md"
      >
        <div className="space-y-4 lg:space-y-6">
          {/* Payment Methods */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2 lg:mb-3">Payment Method</p>
            <div className="grid grid-cols-3 gap-2 lg:gap-3">
              {[
                { mode: 'cash', label: 'Cash', icon: Wallet, color: 'from-green-500 to-emerald-600' },
                { mode: 'upi', label: 'UPI', icon: Smartphone, color: 'from-purple-500 to-violet-600' },
                { mode: 'card', label: 'Card', icon: CreditCard, color: 'from-blue-500 to-indigo-600' },
              ].map(({ mode, label, icon: Icon, color }) => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode as 'cash' | 'upi' | 'card')}
                  className={clsx(
                    'relative p-3 lg:p-5 border-2 rounded-lg lg:rounded-xl flex flex-col items-center gap-2 lg:gap-3 transition-all',
                    paymentMode === mode
                      ? 'border-primary-500 bg-primary-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className={clsx(
                    'w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl flex items-center justify-center',
                    paymentMode === mode ? `bg-gradient-to-br ${color}` : 'bg-gray-100'
                  )}>
                    <Icon className={clsx('w-5 h-5 lg:w-6 lg:h-6', paymentMode === mode ? 'text-white' : 'text-gray-500')} />
                  </div>
                  <span className={clsx('font-medium text-xs lg:text-sm', paymentMode === mode ? 'text-primary-700' : 'text-gray-700')}>
                    {label}
                  </span>
                  {paymentMode === mode && (
                    <motion.div
                      layoutId="payment-check"
                      className="absolute top-1.5 lg:top-2 right-1.5 lg:right-2 w-4 h-4 lg:w-5 lg:h-5 bg-primary-500 rounded-full flex items-center justify-center"
                    >
                      <Check className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-white" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-3 lg:p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg lg:rounded-xl space-y-2 lg:space-y-3">
            <div className="flex justify-between text-sm lg:text-base text-gray-600">
              <span>Items ({cart.length})</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm lg:text-base text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            {customer && (
              <div className="flex justify-between text-sm lg:text-base text-gray-600">
                <span>Customer</span>
                <span>{customer.name}</span>
              </div>
            )}
            <div className="pt-2 lg:pt-3 border-t border-gray-200 flex justify-between items-center">
              <span className="text-base lg:text-lg font-semibold text-gray-900">Total Amount</span>
              <span className="text-2xl lg:text-3xl font-bold text-primary-600">{formatCurrency(total)}</span>
            </div>
          </div>

          <Button
            className="w-full py-3 lg:py-4 text-base lg:text-lg"
            onClick={handleCheckout}
            loading={isProcessing}
          >
            <Check className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
            Complete Sale
          </Button>
        </div>
      </Modal>

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScan}
      />

      {/* Invoice Preview */}
      {showInvoice && invoiceData && (
        <Invoice
          data={invoiceData}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </div>
  )
}
