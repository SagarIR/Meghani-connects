'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Truck, Plus, Search, Eye, CheckCircle2, XCircle, Clock, 
  Package, IndianRupee, FileText, ArrowDownLeft, ArrowUpRight,
  Filter, Building2, ShieldCheck, AlertCircle, RefreshCw
} from 'lucide-react'
import { api } from '@/services/api'
import { Supplier, PurchaseOrder, GoodsReceipt, StockMovement, Product } from '@/types'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import clsx from 'clsx'

type TabType = 'orders' | 'receipts' | 'suppliers' | 'ledger'

export default function PurchasingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('orders')
  const [loading, setLoading] = useState(true)

  // Data states
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [products, setProducts] = useState<Product[]>([])

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedMovementType, setSelectedMovementType] = useState<string>('all')

  // Modals
  const [isPoModalOpen, setIsPoModalOpen] = useState(false)
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [selectedPoForReceive, setSelectedPoForReceive] = useState<PurchaseOrder | null>(null)
  const [receiveDeliveryNote, setReceiveDeliveryNote] = useState('')
  const [receiveNotes, setReceiveNotes] = useState('')
  const [receiveQuantities, setReceiveQuantities] = useState<Record<number, number>>({})

  // Form states for New PO
  const [poSupplierId, setPoSupplierId] = useState<number | ''>('')
  const [poNotes, setPoNotes] = useState('')
  const [poItems, setPoItems] = useState<Array<{ product_id: number; ordered_quantity: number; unit_cost: number; discount_percent: number; tax_rate: number }>>([
    { product_id: 0, ordered_quantity: 1, unit_cost: 0, discount_percent: 0, tax_rate: 18 }
  ])

  // Form states for New Supplier
  const [newSupplier, setNewSupplier] = useState({
    name: '', contact_person: '', phone: '', email: '', address: '', gstin: '', payment_terms: 'Net 30 Days', notes: ''
  })

  // Form states for Manual Adjustment
  const [adjustProduct, setAdjustProduct] = useState<number | ''>('')
  const [adjustDirection, setAdjustDirection] = useState<'in' | 'out'>('in')
  const [adjustQuantity, setAdjustQuantity] = useState(1)
  const [adjustReason, setAdjustReason] = useState('')

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [ordersRes, receiptsRes, suppliersRes, movementsRes, productsRes] = await Promise.all([
        api.get('/purchasing/orders/'),
        api.get('/purchasing/receipts/'),
        api.get('/purchasing/suppliers/'),
        api.get('/purchasing/movements/'),
        api.get('/products/')
      ])
      setOrders(ordersRes.data?.results || ordersRes.data || [])
      setReceipts(receiptsRes.data?.results || receiptsRes.data || [])
      setSuppliers(suppliersRes.data?.results || suppliersRes.data || [])
      setMovements(movementsRes.data?.results || movementsRes.data || [])
      setProducts(productsRes.data?.results || productsRes.data || [])
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to load purchasing and inventory data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Summary statistics
  const stats = useMemo(() => {
    const activeOrders = orders.filter(o => o.status === 'ordered' || o.status === 'partially_received')
    const activeCount = activeOrders.length
    const totalSuppliersCount = suppliers.filter(s => s.is_active).length
    const pendingInwardItems = activeOrders.reduce((acc, o) => {
      const orderPending = (o.items || []).reduce((sum, item) => sum + (item.pending_quantity || 0), 0)
      return acc + orderPending
    }, 0)
    return {
      activeCount,
      totalSuppliersCount,
      pendingInwardItems,
      totalMovements: movements.length
    }
  }, [orders, suppliers, movements])

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(po => {
      const matchesSearch = po.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            po.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = selectedStatus === 'all' || po.status === selectedStatus
      return matchesSearch && matchesStatus
    })
  }, [orders, searchQuery, selectedStatus])

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const matchesSearch = m.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (m.product_article_code && m.product_article_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            m.reference_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            m.reason.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = selectedMovementType === 'all' || m.movement_type === selectedMovementType
      return matchesSearch && matchesType
    })
  }, [movements, searchQuery, selectedMovementType])

  // Handle PO Creation
  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!poSupplierId) {
      toast.error('Please select a supplier.')
      return
    }
    const validItems = poItems.filter(i => i.product_id > 0 && i.ordered_quantity > 0 && i.unit_cost > 0)
    if (validItems.length === 0) {
      toast.error('Please add at least one valid product line with quantity and unit cost.')
      return
    }

    try {
      await api.post('/purchasing/orders/', {
        supplier: poSupplierId,
        status: 'ordered',
        notes: poNotes,
        items: validItems
      })
      toast.success('Purchase order created successfully!')
      setIsPoModalOpen(false)
      setPoItems([{ product_id: 0, ordered_quantity: 1, unit_cost: 0, discount_percent: 0, tax_rate: 18 }])
      setPoNotes('')
      fetchData()
    } catch (err: any) {
      const detail = err.response?.data?.detail || JSON.stringify(err.response?.data || 'Failed to create purchase order.')
      toast.error(detail)
    }
  }

  // Handle PO Goods Receipt
  const handleOpenReceiveModal = (po: PurchaseOrder) => {
    setSelectedPoForReceive(po)
    const initialQty: Record<number, number> = {};
    (po.items || []).forEach(item => {
      initialQty[item.id] = item.pending_quantity || 0
    })
    setReceiveQuantities(initialQty)
    setReceiveDeliveryNote('')
    setReceiveNotes('')
    setIsReceiveModalOpen(true)
  }

  const handleConfirmReceive = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPoForReceive) return

    const itemsToReceive = Object.entries(receiveQuantities)
      .map(([itemId, qty]) => ({
        purchase_order_item_id: Number(itemId),
        quantity_received: Number(qty)
      }))
      .filter(i => i.quantity_received > 0)

    if (itemsToReceive.length === 0) {
      toast.error('Please specify received quantity for at least one item.')
      return
    }

    try {
      await api.post(`/purchasing/orders/${selectedPoForReceive.id}/receive/`, {
        supplier_delivery_note: receiveDeliveryNote,
        notes: receiveNotes,
        items: itemsToReceive
      })
      toast.success('Goods received and booked into inventory ledger!')
      setIsReceiveModalOpen(false)
      fetchData()
    } catch (err: any) {
      const detail = err.response?.data?.detail || JSON.stringify(err.response?.data || 'Failed to receive goods.')
      toast.error(detail)
    }
  }

  // Handle Supplier Creation
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSupplier.name.trim() || !newSupplier.phone.trim()) {
      toast.error('Supplier Name and Phone are required.')
      return
    }

    try {
      await api.post('/purchasing/suppliers/', newSupplier)
      toast.success('Supplier added successfully!')
      setIsSupplierModalOpen(false)
      setNewSupplier({ name: '', contact_person: '', phone: '', email: '', address: '', gstin: '', payment_terms: 'Net 30 Days', notes: '' })
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to add supplier.')
    }
  }

  // Handle Manual Stock Adjustment
  const handleManualAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustProduct || adjustQuantity <= 0) {
      toast.error('Select a product and valid quantity.')
      return
    }
    if (!adjustReason.trim()) {
      toast.error('Documented reason is mandatory for manual adjustments.')
      return
    }

    try {
      await api.post('/purchasing/movements/adjust/', {
        product_id: adjustProduct,
        direction: adjustDirection,
        quantity: adjustQuantity,
        reason: adjustReason.trim()
      })
      toast.success('Inventory adjustment recorded in ledger!')
      setIsAdjustModalOpen(false)
      setAdjustReason('')
      setAdjustQuantity(1)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to record stock adjustment.')
    }
  }

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>
      case 'partially_received':
        return <Badge variant="warning">Partially Received</Badge>
      case 'ordered':
        return <Badge variant="primary">Ordered / In Transit</Badge>
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>
      default:
        return <Badge variant="gray">Draft</Badge>
    }
  }

  // Movement Type Badge Helper
  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'purchase_receipt':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"><ArrowDownLeft className="w-3 h-3" /> Purchase Receipt</span>
      case 'sale':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400"><ArrowUpRight className="w-3 h-3" /> Sale POS</span>
      case 'manual_adjustment':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400">Adjustment</span>
      case 'customer_return':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">Customer Return</span>
      case 'opening_stock':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">Opening Balance</span>
      default:
        return <Badge variant="gray">{type}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="h-7 w-7 text-amber-600 dark:text-amber-500" />
            Purchasing & Inventory Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Supplier procurement, goods receipts (GRN), and immutable double-entry stock movement ledger.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => setIsAdjustModalOpen(true)}>
            Stock Adjustment
          </Button>
          <Button variant="secondary" onClick={() => setIsSupplierModalOpen(true)}>
            <Building2 className="w-4 h-4 mr-1.5" />
            New Supplier
          </Button>
          <Button variant="primary" onClick={() => setIsPoModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Purchase Order
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active POs</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.activeCount}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Inward</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.pendingInwardItems} <span className="text-sm font-normal text-slate-500">units</span></p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Suppliers</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalSuppliersCount}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ledger Records</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalMovements}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => { setActiveTab('orders'); setSearchQuery(''); }}
            className={clsx(
              activeTab === 'orders'
                ? 'border-amber-600 text-amber-600 dark:border-amber-500 dark:text-amber-500'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2'
            )}
          >
            <FileText className="w-4 h-4" />
            Purchase Orders
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('receipts'); setSearchQuery(''); }}
            className={clsx(
              activeTab === 'receipts'
                ? 'border-amber-600 text-amber-600 dark:border-amber-500 dark:text-amber-500'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2'
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            Goods Receipts (GRN)
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {receipts.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('suppliers'); setSearchQuery(''); }}
            className={clsx(
              activeTab === 'suppliers'
                ? 'border-amber-600 text-amber-600 dark:border-amber-500 dark:text-amber-500'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2'
            )}
          >
            <Building2 className="w-4 h-4" />
            Suppliers Directory
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {suppliers.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('ledger'); setSearchQuery(''); }}
            className={clsx(
              activeTab === 'ledger'
                ? 'border-amber-600 text-amber-600 dark:border-amber-500 dark:text-amber-500'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2'
            )}
          >
            <ShieldCheck className="w-4 h-4" />
            Stock Movement Ledger
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold">
              Live Audit
            </span>
          </button>
        </nav>
      </div>

      {/* TAB 1: PURCHASE ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search PO # or supplier..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Statuses</option>
                <option value="ordered">Ordered / In Transit</option>
                <option value="partially_received">Partially Received</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <Button variant="secondary" onClick={fetchData} title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Items / Progress</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No purchase orders found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(po => {
                    const totalOrdered = (po.items || []).reduce((s, i) => s + i.ordered_quantity, 0)
                    const totalReceived = (po.items || []).reduce((s, i) => s + (i.received_quantity || 0), 0)
                    const canReceive = po.status === 'ordered' || po.status === 'partially_received'

                    return (
                      <tr key={po.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-white">
                          {po.order_number}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                          {po.supplier_name}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(po.status)}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                          {new Date(po.order_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {totalReceived} / {totalOrdered} received
                            </span>
                            <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-amber-500 h-full rounded-full" 
                                style={{ width: `${totalOrdered > 0 ? Math.min(100, Math.round((totalReceived / totalOrdered) * 100)) : 0}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">
                          ₹{Number(po.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {canReceive ? (
                            <Button 
                              size="sm" 
                              variant="primary" 
                              onClick={() => handleOpenReceiveModal(po)}
                            >
                              Receive Goods
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400">Archived</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GOODS RECEIPTS (GRN) */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">GRN Receipt #</th>
                  <th className="py-3 px-4">PO Reference</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Received Date</th>
                  <th className="py-3 px-4">Delivery Note</th>
                  <th className="py-3 px-4">Received By</th>
                  <th className="py-3 px-4 text-right">Items Inward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No Goods Receipts recorded yet. Goods receipts are generated upon inward shipment verification.
                    </td>
                  </tr>
                ) : (
                  receipts.map(grn => {
                    const totalQty = (grn.items || []).reduce((s, i) => s + i.quantity_received, 0)
                    return (
                      <tr key={grn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-amber-600 dark:text-amber-500">
                          {grn.receipt_number}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                          {grn.purchase_order_number}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                          {grn.supplier_name}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                          {new Date(grn.received_at).toLocaleDateString()} {new Date(grn.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {grn.supplier_delivery_note || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          {grn.received_by_name}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          +{totalQty} units
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SUPPLIERS DIRECTORY */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map(sup => (
              <div 
                key={sup.id} 
                className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base">{sup.name}</h3>
                    {sup.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="gray">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Contact: {sup.contact_person || 'N/A'}</p>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <p><span className="font-medium text-slate-500">Phone:</span> {sup.phone || 'N/A'}</p>
                    <p><span className="font-medium text-slate-500">Email:</span> {sup.email || 'N/A'}</p>
                    <p><span className="font-medium text-slate-500">GSTIN:</span> <span className="font-mono">{sup.gstin || 'N/A'}</span></p>
                    <p><span className="font-medium text-slate-500">Terms:</span> {sup.payment_terms || 'Standard'}</p>
                    {sup.notes && <p className="italic text-slate-400 line-clamp-2 mt-2">{sup.notes}</p>}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Products Mapped: <strong className="text-slate-700 dark:text-slate-200">{sup.products_count || 0}</strong></span>
                  <span className="text-slate-500">Active POs: <strong className="text-amber-600 dark:text-amber-400">{sup.active_pos_count || 0}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STOCK MOVEMENT AUDIT LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search product, article code, ref..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedMovementType}
                onChange={e => setSelectedMovementType(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Movement Types</option>
                <option value="purchase_receipt">Purchase Receipt</option>
                <option value="sale">Sale (POS)</option>
                <option value="manual_adjustment">Manual Adjustment</option>
                <option value="opening_stock">Opening Balance</option>
                <option value="customer_return">Customer Return</option>
              </select>

              <Button variant="secondary" onClick={fetchData} title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4 text-center">In (+)</th>
                  <th className="py-3 px-4 text-center">Out (-)</th>
                  <th className="py-3 px-4 text-center">Resulting Stock</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-sans text-sm">
                      No stock movement ledger records match the query.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(m.created_at).toLocaleDateString()} {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-sans text-sm font-medium text-slate-900 dark:text-white">
                        {m.product_name}
                        {m.product_article_code && (
                          <span className="block font-mono text-xs text-amber-600 dark:text-amber-500">
                            {m.product_article_code}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        {getMovementBadge(m.movement_type)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {m.quantity_in > 0 ? `+${m.quantity_in}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-rose-600 dark:text-rose-400">
                        {m.quantity_out > 0 ? `-${m.quantity_out}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-100">
                        {m.resulting_balance}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {m.reference_id || '—'}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {m.reason || '—'}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-500 dark:text-slate-400">
                        {m.created_by_name}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: NEW PURCHASE ORDER */}
      <Modal isOpen={isPoModalOpen} onClose={() => setIsPoModalOpen(false)} title="Create New Purchase Order">
        <form onSubmit={handleCreatePo} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Supplier <span className="text-rose-500">*</span>
            </label>
            <select
              value={poSupplierId}
              onChange={e => setPoSupplierId(Number(e.target.value))}
              required
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Select Supplier...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.payment_terms})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Order Items <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setPoItems([...poItems, { product_id: 0, ordered_quantity: 1, unit_cost: 0, discount_percent: 0, tax_rate: 18 }])}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            {poItems.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-5">
                  <select
                    value={item.product_id}
                    onChange={e => {
                      const pid = Number(e.target.value)
                      const prod = products.find(p => p.id === pid)
                      const newItems = [...poItems]
                      newItems[idx].product_id = pid
                      if (prod) {
                        newItems[idx].unit_cost = Number(prod.cost_price)
                      }
                      setPoItems(newItems)
                    }}
                    required
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value={0}>Select Product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.article_code || p.brand})</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.ordered_quantity}
                    onChange={e => {
                      const newItems = [...poItems]
                      newItems[idx].ordered_quantity = Number(e.target.value)
                      setPoItems(newItems)
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white text-center"
                  />
                </div>

                <div className="sm:col-span-4">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Unit Cost (₹)"
                    value={item.unit_cost}
                    onChange={e => {
                      const newItems = [...poItems]
                      newItems[idx].unit_cost = Number(e.target.value)
                      setPoItems(newItems)
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white text-right"
                  />
                </div>

                <div className="sm:col-span-1 text-center">
                  {poItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Internal PO Notes
            </label>
            <textarea
              rows={2}
              value={poNotes}
              onChange={e => setPoNotes(e.target.value)}
              placeholder="Delivery terms, requested freight carrier..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsPoModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create Purchase Order</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: RECEIVE GOODS (GRN) */}
      <Modal isOpen={isReceiveModalOpen} onClose={() => setIsReceiveModalOpen(false)} title={`Receive Goods: ${selectedPoForReceive?.order_number || ''}`}>
        <form onSubmit={handleConfirmReceive} className="space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
            <strong>Supplier:</strong> {selectedPoForReceive?.supplier_name}
            <br />
            Goods received will immediately increment physical stock levels and record an immutable Goods Receipt audit entry.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supplier Delivery Note #
              </label>
              <input
                type="text"
                value={receiveDeliveryNote}
                onChange={e => setReceiveDeliveryNote(e.target.value)}
                placeholder="e.g. DN-2026-991"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Receipt Notes
              </label>
              <input
                type="text"
                value={receiveNotes}
                onChange={e => setReceiveNotes(e.target.value)}
                placeholder="Box condition, seal verification..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Line Items Verification
            </label>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              {(selectedPoForReceive?.items || []).map(item => (
                <div key={item.id} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{item.product_name}</p>
                    <p className="text-xs text-slate-500">Ordered: {item.ordered_quantity} | Pending: {item.pending_quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Receive:</span>
                    <input
                      type="number"
                      min="0"
                      max={item.pending_quantity}
                      value={receiveQuantities[item.id] ?? 0}
                      onChange={e => setReceiveQuantities({ ...receiveQuantities, [item.id]: Number(e.target.value) })}
                      className="w-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-center text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsReceiveModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Confirm & Book Goods</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: NEW SUPPLIER */}
      <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title="Register New Supplier">
        <form onSubmit={handleCreateSupplier} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Supplier / Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newSupplier.name}
              onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
              placeholder="e.g. Seiko Watch India Pvt Ltd"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Person</label>
              <input
                type="text"
                value={newSupplier.contact_person}
                onChange={e => setNewSupplier({ ...newSupplier, contact_person: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={newSupplier.phone}
                onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">GSTIN</label>
              <input
                type="text"
                value={newSupplier.gstin}
                onChange={e => setNewSupplier({ ...newSupplier, gstin: e.target.value })}
                placeholder="22AAAAA0000A1Z5"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm font-mono text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Terms</label>
              <input
                type="text"
                value={newSupplier.payment_terms}
                onChange={e => setNewSupplier({ ...newSupplier, payment_terms: e.target.value })}
                placeholder="Net 30 Days"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
            <textarea
              rows={2}
              value={newSupplier.notes}
              onChange={e => setNewSupplier({ ...newSupplier, notes: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsSupplierModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Save Supplier</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: MANUAL STOCK ADJUSTMENT */}
      <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title="Record Stock Adjustment">
        <form onSubmit={handleManualAdjustment} className="space-y-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900/40 text-xs text-purple-800 dark:text-purple-300">
            Manual adjustments require administrative justification and are recorded permanently in the stock movement ledger.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Product <span className="text-rose-500">*</span>
            </label>
            <select
              value={adjustProduct}
              onChange={e => setAdjustProduct(Number(e.target.value))}
              required
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white"
            >
              <option value="">Select Product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Current Stock: {p.stock})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Direction
              </label>
              <select
                value={adjustDirection}
                onChange={e => setAdjustDirection(e.target.value as 'in' | 'out')}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm text-slate-900 dark:text-white"
              >
                <option value="in">Inward (+) / Found Stock</option>
                <option value="out">Outward (-) / Loss or Damage</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={adjustQuantity}
                onChange={e => setAdjustQuantity(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm text-slate-900 dark:text-white text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Audit Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={adjustReason}
              onChange={e => setAdjustReason(e.target.value)}
              placeholder="e.g. Stock count variance audit, display piece scratch write-off..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsAdjustModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Commit Ledger Adjustment</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
