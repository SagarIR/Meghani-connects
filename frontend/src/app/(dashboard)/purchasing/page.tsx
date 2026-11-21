'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Truck, Plus, Search, Eye, CheckCircle2, XCircle, Clock, 
  Package, IndianRupee, FileText, ArrowDownLeft, ArrowUpRight,
  Filter, Building2, ShieldCheck, AlertCircle, RefreshCw,
  Calendar, Layers, Check, ChevronRight
} from 'lucide-react'
import { api } from '@/services/api'
import { Supplier, PurchaseOrder, GoodsReceipt, StockMovement, Product } from '@/types'
import { usePreferences } from '@/context/PreferencesContext'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ExportButton from '@/components/ui/ExportButton'
import { purchaseOrderExportColumns, stockMovementExportColumns } from '@/utils/export'
import toast from 'react-hot-toast'
import clsx from 'clsx'

type TabType = 'orders' | 'receipts' | 'suppliers' | 'ledger'

export default function PurchasingPage() {
  const { t } = usePreferences()
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
        items: validItems.map(item => ({
          product: item.product_id,
          ordered_quantity: item.ordered_quantity,
          unit_cost: item.unit_cost,
          discount_percent: item.discount_percent,
          tax_rate: item.tax_rate
        }))
      })
      toast.success('Purchase order created successfully!')
      setIsPoModalOpen(false)
      setPoNotes('')
      setPoSupplierId('')
      setPoItems([{ product_id: 0, ordered_quantity: 1, unit_cost: 0, discount_percent: 0, tax_rate: 18 }])
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || JSON.stringify(err.response?.data || 'Failed to create purchase order.'))
    }
  }

  // Handle Supplier Creation
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSupplier.name.trim() || !newSupplier.phone.trim()) {
      toast.error('Supplier name and phone are required.')
      return
    }

    try {
      await api.post('/purchasing/suppliers/', newSupplier)
      toast.success('Supplier registered successfully!')
      setIsSupplierModalOpen(false)
      setNewSupplier({
        name: '', contact_person: '', phone: '', email: '', address: '', gstin: '', payment_terms: 'Net 30 Days', notes: ''
      })
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create supplier.')
    }
  }

  // Handle Receive Goods (GRN)
  const handleOpenReceiveModal = (po: PurchaseOrder) => {
    setSelectedPoForReceive(po)
    const initialQty: Record<number, number> = {}
    ;(po.items || []).forEach(item => {
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

    const receiveItems = Object.entries(receiveQuantities)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([itemId, qty]) => ({
        po_item_id: Number(itemId),
        quantity_received: Number(qty)
      }))

    if (receiveItems.length === 0) {
      toast.error('Enter at least 1 unit to receive across order items.')
      return
    }

    try {
      await api.post(`/purchasing/orders/${selectedPoForReceive.id}/receive/`, {
        supplier_delivery_note: receiveDeliveryNote,
        notes: receiveNotes,
        items: receiveItems
      })
      toast.success('Goods received and stock movements recorded!')
      setIsReceiveModalOpen(false)
      setSelectedPoForReceive(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to receive goods.')
    }
  }

  // Handle Manual Stock Adjustment
  const handleManualAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustProduct || !adjustReason.trim() || adjustQuantity <= 0) {
      toast.error('Please specify a valid product, quantity, and audit reason.')
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
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
            <ArrowDownLeft className="w-3 h-3" />
            <span>Purchase Receipt</span>
          </span>
        )
      case 'sale':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-950/40 border border-sky-800/40 text-sky-400">
            <ArrowUpRight className="w-3 h-3" />
            <span>Sale (POS)</span>
          </span>
        )
      case 'manual_adjustment':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-950/40 border border-purple-800/40 text-purple-400">
            <span>Adjustment</span>
          </span>
        )
      case 'customer_return':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/40 border border-amber-800/40 text-amber-400">
            <span>Customer Return</span>
          </span>
        )
      case 'opening_stock':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#1F1E1A] border border-[#2A261F] text-[#8D8980]">
            <span>Opening Balance</span>
          </span>
        )
      default:
        return <Badge variant="gray">{type}</Badge>
    }
  }

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount || 0))
  }

  if (loading) {
    return (
      <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-16 text-center shadow-xl">
        <div className="w-8 h-8 border-2 border-[#C9A45C] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-[#8D8980]">Loading purchasing and inventory data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#171613] border border-[#2A261F] rounded-xl flex items-center justify-center shadow-md">
            <Truck className="w-5 h-5 text-[#C9A45C]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-serif font-bold text-[#F3EFE6] tracking-tight">{t('purchasingLedger', 'Purchasing & Ledger')}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F1E1A] text-[#C9A45C] border border-[#2A261F] font-mono">
                {orders.length} {t('totalTransactions', 'orders')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8D8980]">
              {t('purchasingLedger', 'Supplier procurement, goods receipts (GRN), and immutable double-entry stock movement ledger')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {activeTab === 'orders' && (
            <ExportButton 
              data={filteredOrders} 
              columns={purchaseOrderExportColumns} 
              filename={`meghani_purchase_orders_${new Date().toISOString().split('T')[0]}`} 
            />
          )}
          {activeTab === 'ledger' && (
            <ExportButton 
              data={filteredMovements} 
              columns={stockMovementExportColumns} 
              filename={`meghani_stock_ledger_${new Date().toISOString().split('T')[0]}`} 
            />
          )}
          <Button variant="secondary" onClick={() => setIsAdjustModalOpen(true)}>
            Stock Adjustment
          </Button>
          <Button variant="secondary" onClick={() => setIsSupplierModalOpen(true)} icon={<Building2 className="w-4 h-4" />}>
            New Supplier
          </Button>
          <Button onClick={() => setIsPoModalOpen(true)} icon={<Plus className="w-4 h-4" />} className="shadow-gold">
            New Purchase Order
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#171613] border border-[#2A261F] rounded-xl p-4">
          <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block font-medium">Active POs</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-[#C9A45C] mt-1">
            {stats.activeCount}
          </p>
          <span className="text-[11px] text-[#8D8980] mt-0.5 block">Pending fulfillment</span>
        </div>

        <div className="bg-[#171613] border border-[#2A261F] rounded-xl p-4">
          <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block font-medium">Pending Inward</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-[#F3EFE6] mt-1">
            {stats.pendingInwardItems} <span className="text-xs font-normal text-[#8D8980]">units</span>
          </p>
          <span className="text-[11px] text-[#8D8980] mt-0.5 block">Awaiting receipt verification</span>
        </div>

        <div className="bg-[#171613] border border-[#2A261F] rounded-xl p-4">
          <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block font-medium">Active Suppliers</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-[#E8D5A7] mt-1">
            {stats.totalSuppliersCount}
          </p>
          <span className="text-[11px] text-[#8D8980] mt-0.5 block">Verified manufacturer network</span>
        </div>

        <div className="bg-[#171613] border border-[#2A261F] rounded-xl p-4">
          <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block font-medium">Ledger Records</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">
            {stats.totalMovements}
          </p>
          <span className="text-[11px] text-emerald-500/80 mt-0.5 block">Immutable double-entry log</span>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2A261F] pb-3 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('orders'); setSearchQuery(''); }}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap',
            activeTab === 'orders'
              ? 'bg-[#C9A45C] text-[#0B0B0A] border-[#C9A45C] shadow-md'
              : 'bg-[#12110F] text-[#8D8980] border-[#2A261F] hover:text-[#F3EFE6] hover:bg-[#1F1E1A]'
          )}
        >
          <FileText className="w-4 h-4" />
          <span>Purchase Orders</span>
          <span className={clsx(
            'px-2 py-0.5 rounded-full text-[11px] font-mono',
            activeTab === 'orders' ? 'bg-[#0B0B0A]/20 text-[#0B0B0A]' : 'bg-[#1F1E1A] text-[#C9A45C] border border-[#2A261F]'
          )}>
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('receipts'); setSearchQuery(''); }}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap',
            activeTab === 'receipts'
              ? 'bg-[#C9A45C] text-[#0B0B0A] border-[#C9A45C] shadow-md'
              : 'bg-[#12110F] text-[#8D8980] border-[#2A261F] hover:text-[#F3EFE6] hover:bg-[#1F1E1A]'
          )}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Goods Receipts (GRN)</span>
          <span className={clsx(
            'px-2 py-0.5 rounded-full text-[11px] font-mono',
            activeTab === 'receipts' ? 'bg-[#0B0B0A]/20 text-[#0B0B0A]' : 'bg-[#1F1E1A] text-[#C9A45C] border border-[#2A261F]'
          )}>
            {receipts.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('suppliers'); setSearchQuery(''); }}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap',
            activeTab === 'suppliers'
              ? 'bg-[#C9A45C] text-[#0B0B0A] border-[#C9A45C] shadow-md'
              : 'bg-[#12110F] text-[#8D8980] border-[#2A261F] hover:text-[#F3EFE6] hover:bg-[#1F1E1A]'
          )}
        >
          <Building2 className="w-4 h-4" />
          <span>Suppliers Directory</span>
          <span className={clsx(
            'px-2 py-0.5 rounded-full text-[11px] font-mono',
            activeTab === 'suppliers' ? 'bg-[#0B0B0A]/20 text-[#0B0B0A]' : 'bg-[#1F1E1A] text-[#C9A45C] border border-[#2A261F]'
          )}>
            {suppliers.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('ledger'); setSearchQuery(''); }}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap',
            activeTab === 'ledger'
              ? 'bg-[#C9A45C] text-[#0B0B0A] border-[#C9A45C] shadow-md'
              : 'bg-[#12110F] text-[#8D8980] border-[#2A261F] hover:text-[#F3EFE6] hover:bg-[#1F1E1A]'
          )}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Stock Movement Ledger</span>
          <span className={clsx(
            'px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide',
            activeTab === 'ledger' ? 'bg-[#0B0B0A]/20 text-[#0B0B0A]' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
          )}>
            Live Audit
          </span>
        </button>
      </div>

      {/* TAB 1: PURCHASE ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-4 shadow-xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D8980] group-focus-within:text-[#C9A45C] transition-colors" />
                <input
                  type="text"
                  placeholder="Search PO # or supplier..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl 
                            text-[#F3EFE6] placeholder-[#8D8980]/70 text-sm
                            focus:border-[#C9A45C] focus:ring-1 focus:ring-[#C9A45C]
                            transition-all outline-none"
                />
              </div>

              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                <div className="w-full sm:w-48">
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl 
                              text-[#F3EFE6] text-sm focus:border-[#C9A45C] focus:ring-1 focus:ring-[#C9A45C]
                              outline-none cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="ordered">Ordered / In Transit</option>
                    <option value="partially_received">Partially Received</option>
                    <option value="completed">Completed</option>
                    <option value="draft">Draft</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <button
                  onClick={fetchData}
                  className="p-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl text-[#8D8980] hover:text-[#C9A45C] hover:border-[#C9A45C]/50 transition-colors"
                  title="Refresh Data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          {filteredOrders.length === 0 ? (
            <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-12 text-center shadow-xl">
              <div className="w-16 h-16 mx-auto bg-[#1F1E1A] border border-[#2A261F] rounded-2xl flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-[#8D8980]" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#F3EFE6] mb-1">No Purchase Orders Found</h3>
              <p className="text-sm text-[#8D8980] mb-5">Try changing your search or status filters.</p>
              <Button onClick={() => setIsPoModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
                Create Purchase Order
              </Button>
            </div>
          ) : (
            <div className="bg-[#171613] rounded-2xl border border-[#2A261F] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead className="bg-[#12110F] border-b border-[#2A261F]">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">PO Number</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Supplier</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Order Date</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Items / Progress</th>
                      <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Total Amount</th>
                      <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A261F]">
                    {filteredOrders.map(po => {
                      const totalOrdered = (po.items || []).reduce((s, i) => s + i.ordered_quantity, 0)
                      const totalReceived = (po.items || []).reduce((s, i) => s + (i.received_quantity || 0), 0)
                      const canReceive = po.status === 'ordered' || po.status === 'partially_received'

                      return (
                        <tr key={po.id} className="hover:bg-[#1F1E1A] transition-colors group">
                          <td className="px-5 py-4">
                            <span className="font-mono font-bold text-sm text-[#C9A45C]">
                              {po.order_number}
                            </span>
                            {po.items && (
                              <span className="block text-[11px] text-[#8D8980]">
                                {po.items.length} {po.items.length === 1 ? 'line item' : 'line items'}
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-serif font-semibold text-sm text-[#F3EFE6] truncate">
                              {po.supplier_name}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            {getStatusBadge(po.status)}
                          </td>

                          <td className="px-4 py-4">
                            <p className="text-xs font-medium text-[#F3EFE6] font-mono">
                              {new Date(po.order_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs text-[#F3EFE6]">
                                {totalReceived} / {totalOrdered}
                              </span>
                              <div className="w-24 bg-[#12110F] border border-[#2A261F] h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-[#C9A45C] to-[#E8D5A7] h-full rounded-full transition-all" 
                                  style={{ width: `${totalOrdered > 0 ? Math.min(100, Math.round((totalReceived / totalOrdered) * 100)) : 0}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <p className="font-mono font-bold text-base text-[#C9A45C]">
                              {formatCurrency(po.total_amount)}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-right">
                            {canReceive ? (
                              <Button 
                                size="sm" 
                                onClick={() => handleOpenReceiveModal(po)}
                                className="shadow-gold"
                              >
                                Receive Goods
                              </Button>
                            ) : (
                              <span className="text-xs text-[#8D8980] font-mono">Archived</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GOODS RECEIPTS (GRN) */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          {receipts.length === 0 ? (
            <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-12 text-center shadow-xl">
              <div className="w-16 h-16 mx-auto bg-[#1F1E1A] border border-[#2A261F] rounded-2xl flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-[#8D8980]" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#F3EFE6] mb-1">No Goods Receipts Recorded</h3>
              <p className="text-sm text-[#8D8980]">
                Goods receipts (GRN) are automatically generated when receiving goods from active purchase orders.
              </p>
            </div>
          ) : (
            <div className="bg-[#171613] rounded-2xl border border-[#2A261F] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead className="bg-[#12110F] border-b border-[#2A261F]">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">GRN Receipt #</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">PO Reference</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Supplier</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Received Date</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Delivery Note</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Received By</th>
                      <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Items Inward</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A261F]">
                    {receipts.map(grn => {
                      const totalQty = (grn.items || []).reduce((s, i) => s + i.quantity_received, 0)
                      return (
                        <tr key={grn.id} className="hover:bg-[#1F1E1A] transition-colors group">
                          <td className="px-5 py-4">
                            <span className="font-mono font-bold text-sm text-[#C9A45C]">
                              {grn.receipt_number}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-mono text-xs text-[#E8D5A7]">
                            {grn.purchase_order_number}
                          </td>
                          <td className="px-5 py-4 font-serif font-medium text-sm text-[#F3EFE6]">
                            {grn.supplier_name}
                          </td>
                          <td className="px-4 py-4 text-xs font-mono text-[#8D8980]">
                            {new Date(grn.received_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-4 text-xs font-mono text-[#F3EFE6]">
                            {grn.supplier_delivery_note || '—'}
                          </td>
                          <td className="px-4 py-4 text-xs text-[#8D8980]">
                            {grn.received_by_name || 'Staff Member'}
                          </td>
                          <td className="px-5 py-4 text-right font-mono font-bold text-emerald-400">
                            +{totalQty} units
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUPPLIERS DIRECTORY */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map(sup => (
              <div 
                key={sup.id} 
                className="bg-[#171613] p-5 rounded-2xl border border-[#2A261F] shadow-xl hover:border-[#C9A45C]/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-serif font-bold text-[#F3EFE6] text-base group-hover:text-[#C9A45C] transition-colors">
                      {sup.name}
                    </h3>
                    {sup.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="gray">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-[#8D8980] mt-1">
                    Contact: <span className="text-[#F3EFE6] font-medium">{sup.contact_person || 'N/A'}</span>
                  </p>

                  <div className="mt-4 space-y-2 text-xs border-t border-[#2A261F] pt-3">
                    <p className="flex justify-between">
                      <span className="text-[#8D8980]">Phone:</span> 
                      <span className="text-[#F3EFE6] font-mono">{sup.phone || 'N/A'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-[#8D8980]">Email:</span> 
                      <span className="text-[#F3EFE6] truncate max-w-[180px]">{sup.email || 'N/A'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-[#8D8980]">GSTIN:</span> 
                      <span className="font-mono text-[#E8D5A7]">{sup.gstin || 'N/A'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-[#8D8980]">Terms:</span> 
                      <span className="text-[#C9A45C] font-medium">{sup.payment_terms || 'Standard'}</span>
                    </p>
                    {sup.notes && (
                      <p className="italic text-[#8D8980] line-clamp-2 mt-2 pt-2 border-t border-[#2A261F]/60">
                        {sup.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#2A261F] flex items-center justify-between text-xs text-[#8D8980]">
                  <span>Products: <strong className="text-[#F3EFE6] font-mono">{sup.products_count || 0}</strong></span>
                  <span>Active POs: <strong className="text-[#C9A45C] font-mono">{sup.active_pos_count || 0}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STOCK MOVEMENT AUDIT LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-4 shadow-xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D8980] group-focus-within:text-[#C9A45C] transition-colors" />
                <input
                  type="text"
                  placeholder="Search product, article code, reference..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl 
                            text-[#F3EFE6] placeholder-[#8D8980]/70 text-sm
                            focus:border-[#C9A45C] focus:ring-1 focus:ring-[#C9A45C]
                            transition-all outline-none"
                />
              </div>

              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                <div className="w-full sm:w-48">
                  <select
                    value={selectedMovementType}
                    onChange={e => setSelectedMovementType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl 
                              text-[#F3EFE6] text-sm focus:border-[#C9A45C] focus:ring-1 focus:ring-[#C9A45C]
                              outline-none cursor-pointer"
                  >
                    <option value="all">All Movement Types</option>
                    <option value="purchase_receipt">Purchase Receipt</option>
                    <option value="sale">Sale (POS)</option>
                    <option value="manual_adjustment">Manual Adjustment</option>
                    <option value="opening_stock">Opening Balance</option>
                    <option value="customer_return">Customer Return</option>
                  </select>
                </div>

                <button
                  onClick={fetchData}
                  className="p-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl text-[#8D8980] hover:text-[#C9A45C] hover:border-[#C9A45C]/50 transition-colors"
                  title="Refresh Data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          {filteredMovements.length === 0 ? (
            <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-12 text-center shadow-xl">
              <div className="w-16 h-16 mx-auto bg-[#1F1E1A] border border-[#2A261F] rounded-2xl flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-[#8D8980]" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#F3EFE6] mb-1">No Stock Movement Logs Found</h3>
              <p className="text-sm text-[#8D8980]">No ledger audit events match the active search criteria.</p>
            </div>
          ) : (
            <div className="bg-[#171613] rounded-2xl border border-[#2A261F] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead className="bg-[#12110F] border-b border-[#2A261F]">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Timestamp</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Movement Type</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold text-[#8D8980] uppercase tracking-wider">In (+)</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Out (-)</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Balance</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Reference</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Reason / Notes</th>
                      <th className="px-4 py-3.5 text-right text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Staff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A261F]">
                    {filteredMovements.map(m => (
                      <tr key={m.id} className="hover:bg-[#1F1E1A] transition-colors group">
                        <td className="px-5 py-4 text-xs font-mono text-[#8D8980] whitespace-nowrap">
                          {new Date(m.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-serif font-semibold text-sm text-[#F3EFE6]">
                            {m.product_name}
                          </p>
                          {m.product_article_code && (
                            <span className="block font-mono text-[11px] text-[#C9A45C]">
                              {m.product_article_code}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {getMovementBadge(m.movement_type)}
                        </td>
                        <td className="px-4 py-4 text-center font-mono font-bold text-emerald-400">
                          {m.quantity_in > 0 ? `+${m.quantity_in}` : '—'}
                        </td>
                        <td className="px-4 py-4 text-center font-mono font-bold text-rose-400">
                          {m.quantity_out > 0 ? `-${m.quantity_out}` : '—'}
                        </td>
                        <td className="px-4 py-4 text-center font-mono font-bold text-[#F3EFE6]">
                          {m.resulting_balance}
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-[#8D8980]">
                          {m.reference_id || '—'}
                        </td>
                        <td className="px-5 py-4 text-xs text-[#8D8980] max-w-xs truncate">
                          {m.reason || '—'}
                        </td>
                        <td className="px-4 py-4 text-right text-xs text-[#8D8980]">
                          {m.created_by_name || 'System'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: NEW PURCHASE ORDER */}
      <Modal isOpen={isPoModalOpen} onClose={() => setIsPoModalOpen(false)} title="Create New Purchase Order">
        <form onSubmit={handleCreatePo} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8D8980] uppercase tracking-wider mb-1">
              Supplier <span className="text-rose-500">*</span>
            </label>
            <select
              value={poSupplierId}
              onChange={e => setPoSupplierId(Number(e.target.value))}
              required
              className="w-full bg-[#12110F] border border-[#2A261F] rounded-xl p-2.5 text-sm text-[#F3EFE6] focus:border-[#C9A45C] focus:ring-1 focus:ring-[#C9A45C] outline-none cursor-pointer"
            >
              <option value="">Select Supplier...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.payment_terms})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#8D8980] uppercase tracking-wider">
                Order Items <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setPoItems([...poItems, { product_id: 0, ordered_quantity: 1, unit_cost: 0, discount_percent: 0, tax_rate: 18 }])}
                className="text-xs text-[#C9A45C] hover:underline font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            {poItems.map((item, idx) => (
              <div key={idx} className="p-3 bg-[#12110F] rounded-xl border border-[#2A261F] grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
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
                    className="w-full bg-[#171613] border border-[#2A261F] rounded-lg p-2 text-xs text-[#F3EFE6] focus:border-[#C9A45C] outline-none"
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
                    className="w-full bg-[#171613] border border-[#2A261F] rounded-lg p-2 text-xs text-[#F3EFE6] text-center focus:border-[#C9A45C] outline-none"
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
                    className="w-full bg-[#171613] border border-[#2A261F] rounded-lg p-2 text-xs text-[#F3EFE6] text-right focus:border-[#C9A45C] outline-none"
                  />
                </div>

                <div className="sm:col-span-1 text-center">
                  {poItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                      className="text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8D8980] uppercase tracking-wider mb-1">
              Internal PO Notes
            </label>
            <textarea
              rows={2}
              value={poNotes}
              onChange={e => setPoNotes(e.target.value)}
              placeholder="Delivery terms, requested freight carrier..."
              className="w-full bg-[#12110F] border border-[#2A261F] rounded-xl p-2.5 text-sm text-[#F3EFE6] placeholder-[#8D8980]/50 focus:border-[#C9A45C] outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#2A261F]">
            <Button variant="secondary" type="button" onClick={() => setIsPoModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="shadow-gold">Create Purchase Order</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: RECEIVE GOODS (GRN) */}
      <Modal isOpen={isReceiveModalOpen} onClose={() => setIsReceiveModalOpen(false)} title={`Receive Goods: ${selectedPoForReceive?.order_number || ''}`}>
        <form onSubmit={handleConfirmReceive} className="space-y-4">
          <div className="p-3.5 bg-[#1F1E1A] rounded-xl border border-[#C9A45C]/30 text-xs text-[#E8D5A7] leading-relaxed">
            <span className="font-bold text-[#F3EFE6]">Supplier:</span> {selectedPoForReceive?.supplier_name}
            <br />
            Goods received will immediately increment physical stock levels and record an immutable Goods Receipt audit entry.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#8D8980] uppercase tracking-wider mb-1">
                Supplier Delivery Note #
              </label>
              <input
                type="text"
                value={receiveDeliveryNote}
                onChange={e => setReceiveDeliveryNote(e.target.value)}
                placeholder="e.g. DN-2026-991"
                className="w-full bg-[#12110F] border border-[#2A261F] rounded-xl p-2.5 text-sm text-[#F3EFE6] placeholder-[#8D8980]/50 focus:border-[#C9A45C] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8D8980] uppercase tracking-wider mb-1">
                Receipt Notes
              </label>
              <input
                type="text"
                value={receiveNotes}
                onChange={e => setReceiveNotes(e.target.value)}
                placeholder="Box condition, seal verification..."
                className="w-full bg-[#12110F] border border-[#2A261F] rounded-xl p-2.5 text-sm text-[#F3EFE6] placeholder-[#8D8980]/50 focus:border-[#C9A45C] outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#8D8980] uppercase tracking-wider">
              Line Items Verification
            </label>
            <div className="divide-y divide-[#2A261F] border border-[#2A261F] rounded-xl overflow-hidden bg-[#12110F]">
              {(selectedPoForReceive?.items || []).map(item => (
                <div key={item.id} className="p-3.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-serif font-medium text-[#F3EFE6]">{item.product_name}</p>
                    <p className="text-xs text-[#8D8980] font-mono mt-0.5">Ordered: {item.ordered_quantity} | Pending: {item.pending_quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#8D8980]">Receive:</span>
                    <input
                      type="number"
                      min="0"
                      max={item.pending_quantity}
                      value={receiveQuantities[item.id] ?? 0}
                      onChange={e => setReceiveQuantities({ ...receiveQuantities, [item.id]: Number(e.target.value) })}
                      className="w-20 bg-[#171613] border border-[#2A261F] rounded-lg p-1.5 text-center text-sm font-bold font-mono text-[#C9A45C] focus:border-[#C9A45C] outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#2A261F]">
            <Button variant="secondary" type="button" onClick={() => setIsReceiveModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="shadow-gold">Confirm & Book Goods</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: NEW SUPPLIER */}
      <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title="Register New Supplier">
        <form onSubmit={handleCreateSupplier} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#8D8980] uppercase tracking-wider mb-1">
              Supplier / Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newSupplier.name}
              onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
              placeholder="e.g. Seiko Watch India Pvt Ltd"
              className="w-full bg-[#12110F] border border-[#2A261F] rounded-xl p-2.5 text-sm text-[#F3EFE6] placeholder-[#8D8980]/50 focus:border-[#C9A45C] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#8D8980] uppercase tracking-wider mb-1">Contact Person</label>
              <input
                type="text"
                value={newSupplier.contact_person}
                onChange={e => setNewSupplier({ ...newSupplier, contact_person: e.target.value })}
                className="w-full bg-[#12110F] border border-[#2A261F] rounded-xl p-2.5 text-sm text-[#F3EFE6] focus:border-[#C9A45C] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8D8980] uppercase tracking-wider mb-1">Phone <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={newSupplier.phone}
                onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                className="w-full bg-[#12110F] border border-[#2A261F] rounded-xl p-2.5 text-sm text-[#F3EFE6] font-mono focus:border-[#C9A45C] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#8D8980] uppercase tracking-wider mb-1">GSTIN</label>
              <input
                type="text"
                value={newSupplier.gstin}
                onChange={e => setNewSupplier({ ...newSupplier, gstin: e.target.value })}
                placeholder="22AAAAA0000A1Z5"
                className="w-full bg-[#12110F] border border-[#2A261F] rounded-xl p-2.5 text-sm font-mono text-[#E8D5A7] focus:border-[#C9A45C] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8D8980] uppercase tracking-wider mb-1">Payment Terms</label>
              <input
                type="text"
                value={newSupplier.payment_terms}
                onChange={e => setNewSupplier({ ...newSupplier, payment_terms: e.target.value })}
                placeholder="Net 30 Days"
                className="w-full bg-[#12110F] border border-[#2A261F] rounded-xl p-2.5 text-sm text-[#F3EFE6] focus:border-[#C9A45C] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8D8980] uppercase tracking-wider mb-1">Notes</label>
            <textarea
              rows={2}
              value={newSupplier.notes}
              onChange={e => setNewSupplier({ ...newSupplier, notes: e.target.value })}
              className="w-full bg-[#12110F] border border-[#2A261F] rounded-xl p-2.5 text-sm text-[#F3EFE6] placeholder-[#8D8980]/50 focus:border-[#C9A45C] outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#2A261F]">
            <Button variant="secondary" type="button" onClick={() => setIsSupplierModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="shadow-gold">Save Supplier</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: MANUAL STOCK ADJUSTMENT */}
      <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title="Record Stock Adjustment">
        <form onSubmit={handleManualAdjustment} className="space-y-4">
          <div className="p-3.5 bg-purple-950/20 rounded-xl border border-purple-800/30 text-xs text-purple-300 leading-relaxed">
            Manual adjustments require administrative justification and are recorded permanently in the stock movement ledger.
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8D8980] uppercase tracking-wider mb-1">
              Product <span className="text-rose-500">*</span>
            </label>
            <select
              value={adjustProduct}
              onChange={e => setAdjustProduct(Number(e.target.value))}
              required
              className="w-full bg-[#12110F] border border-[#2A261F] rounded-xl p-2.5 text-sm text-[#F3EFE6] focus:border-[#C9A45C] outline-none cursor-pointer"
            >
              <option value="">Select Product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Current Stock: {p.stock})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#8D8980] uppercase tracking-wider mb-1">
                Direction
              </label>
              <select
                value={adjustDirection}
                onChange={e => setAdjustDirection(e.target.value as 'in' | 'out')}
                className="w-full bg-[#12110F] border border-[#2A261F] rounded-xl p-2.5 text-sm text-[#F3EFE6] focus:border-[#C9A45C] outline-none cursor-pointer"
              >
                <option value="in">Inward (+) / Found Stock</option>
                <option value="out">Outward (-) / Loss or Damage</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8D8980] uppercase tracking-wider mb-1">
                Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={adjustQuantity}
                onChange={e => setAdjustQuantity(Number(e.target.value))}
                className="w-full bg-[#12110F] border border-[#2A261F] rounded-xl p-2.5 text-sm text-[#F3EFE6] text-center font-mono focus:border-[#C9A45C] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8D8980] uppercase tracking-wider mb-1">
              Audit Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={adjustReason}
              onChange={e => setAdjustReason(e.target.value)}
              placeholder="e.g. Stock count variance audit, display piece scratch write-off..."
              className="w-full bg-[#12110F] border border-[#2A261F] rounded-xl p-2.5 text-sm text-[#F3EFE6] placeholder-[#8D8980]/50 focus:border-[#C9A45C] outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#2A261F]">
            <Button variant="secondary" type="button" onClick={() => setIsAdjustModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="shadow-gold">Commit Ledger Adjustment</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
