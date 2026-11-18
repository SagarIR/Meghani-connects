'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, Wrench, Eye, CheckCircle, XCircle, Download, Clock, 
  Phone, User, Calendar, AlertTriangle, Package, IndianRupee, ArrowRight,
  Filter, MoreHorizontal, Timer, Truck, LayoutGrid, List, MessageSquare,
  ShieldCheck, Check, Sparkles, Watch, Send
} from 'lucide-react'
import { api } from '@/services/api'
import { Repair, Customer } from '@/types'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import SortableHeader, { SortDirection } from '@/components/ui/SortableHeader'
import ExportButton from '@/components/ui/ExportButton'
import { repairExportColumns } from '@/utils/export'
import { useDebounce } from '@/hooks/useDebounce'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const schema = yup.object({
  customer: yup.number().nullable(),
  customer_phone: yup.string(),
  customer_name: yup.string(),
  item_type: yup.string().required('Item type is required'),
  brand: yup.string().nullable(),
  model_number: yup.string().nullable(),
  serial_number: yup.string().nullable(),
  issue_description: yup.string().required('Issue description is required'),
  estimated_cost: yup.number().nullable(),
  advance_paid: yup.number().default(0),
  expected_delivery: yup.string().nullable(),
  notes: yup.string().nullable(),
})

type FormData = yup.InferType<typeof schema>

const statusConfig: Record<string, { label: string; stageNumber: number; next: string | null; icon: any; color: string; bg: string; border: string }> = {
  received: { 
    label: 'Intake Logged', 
    stageNumber: 1, 
    next: 'in_repair', 
    icon: Package, 
    color: 'text-[#8D8980]', 
    bg: 'bg-[#1F1E1A]', 
    border: 'border-[#2A261F]' 
  },
  in_repair: { 
    label: 'Atelier Bench', 
    stageNumber: 2, 
    next: 'ready', 
    icon: Wrench, 
    color: 'text-amber-400', 
    bg: 'bg-amber-950/30', 
    border: 'border-amber-800/40' 
  },
  ready: { 
    label: 'Ready for Collection', 
    stageNumber: 3, 
    next: 'delivered', 
    icon: CheckCircle, 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-950/30', 
    border: 'border-emerald-800/40' 
  },
  delivered: { 
    label: 'Discharged / Delivered', 
    stageNumber: 4, 
    next: null, 
    icon: Truck, 
    color: 'text-sky-400', 
    bg: 'bg-sky-950/30', 
    border: 'border-sky-800/40' 
  },
  cancelled: { 
    label: 'Archived / Returned', 
    stageNumber: 0, 
    next: null, 
    icon: XCircle, 
    color: 'text-rose-400', 
    bg: 'bg-rose-950/30', 
    border: 'border-rose-800/40' 
  },
}

const itemTypes = [
  'Automatic / Mechanical Watch',
  'Swiss Quartz Wristwatch',
  'Luxury Chronograph',
  'Vintage Pocket Watch',
  'Grandfather / Wall Clock',
  'Smartwatch / Digital',
  'Fine Jewelry / Clasp'
]

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  
  // Sorting state
  const [sortField, setSortField] = useState<string>('received_date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  // Debounce search
  const debouncedSearch = useDebounce(search, 300)
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  
  // Customer search
  const [customerSearch, setCustomerSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  
  // Status update
  const [newStatus, setNewStatus] = useState('')
  const [repairCharge, setRepairCharge] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { advance_paid: 0 }
  })

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, statusFilter, sortField, sortDirection])

  useEffect(() => {
    fetchRepairs()
  }, [debouncedSearch, statusFilter, currentPage, pageSize, sortField, sortDirection])

  const fetchRepairs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (statusFilter) params.append('status', statusFilter)
      params.append('page', currentPage.toString())
      params.append('page_size', pageSize.toString())
      
      if (sortField && sortDirection) {
        const ordering = sortDirection === 'desc' ? `-${sortField}` : sortField
        params.append('ordering', ordering)
      }
      
      const response = await api.get(`/repairs/?${params.toString()}`)
      const data = response.data
      
      if (data.results) {
        setRepairs(data.results)
        setTotalItems(data.count || 0)
        setTotalPages(Math.ceil((data.count || 0) / pageSize))
      } else {
        setRepairs(data)
        setTotalItems(data.length)
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Failed to fetch repairs:', error)
      toast.error('Failed to load repair records')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSort = useCallback((field: string, direction: SortDirection) => {
    setSortField(field)
    setSortDirection(direction)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }, [])

  const searchCustomers = async (query: string) => {
    setCustomerSearch(query)
    if (query.length >= 2) {
      try {
        const response = await api.get(`/customers/search/?q=${query}`)
        setSearchResults(response.data)
      } catch (error) {
        console.error('Search failed:', error)
      }
    } else {
      setSearchResults([])
    }
  }

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setValue('customer', customer.id)
    setCustomerSearch('')
    setSearchResults([])
  }

  const openAddModal = () => {
    setSelectedRepair(null)
    setSelectedCustomer(null)
    reset({ advance_paid: 0, item_type: '', brand: '', model_number: '', serial_number: '', issue_description: '', estimated_cost: undefined, expected_delivery: '', notes: '', customer: undefined, customer_phone: '', customer_name: '' })
    setShowFormModal(true)
  }

  const openViewModal = (repair: Repair) => {
    setSelectedRepair(repair)
    setShowViewModal(true)
  }

  const openStatusModal = (repair: Repair, status: string) => {
    setSelectedRepair(repair)
    setNewStatus(status)
    setRepairCharge(repair.repair_charge?.toString() || '')
    setStatusNote('')
    setShowStatusModal(true)
  }

  const onSubmit = async (data: FormData) => {
    if (!selectedCustomer && !data.customer_phone) {
      toast.error('Please select or specify a customer')
      return
    }
    
    setIsSubmitting(true)
    try {
      const payload = {
        ...data,
        customer: selectedCustomer?.id || undefined,
        customer_phone: !selectedCustomer ? data.customer_phone : undefined,
        customer_name: !selectedCustomer ? data.customer_name : undefined,
      }
      
      await api.post('/repairs/', payload)
      toast.success('Horological repair ticket registered')
      setShowFormModal(false)
      fetchRepairs()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Operation failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const downloadPDF = async (repairId: number, ticketNumber: string) => {
    setDownloadingId(repairId)
    try {
      const response = await api.get(`/repairs/${repairId}/invoice/pdf/`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Meghani_Repair_${ticketNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success(`Service ticket ${ticketNumber} downloaded`)
    } catch (error) {
      toast.error('Failed to download repair docket')
    } finally {
      setDownloadingId(null)
    }
  }

  const updateStatus = async () => {
    if (!selectedRepair) return
    setIsSubmitting(true)
    try {
      await api.patch(`/repairs/${selectedRepair.id}/update_status/`, {
        status: newStatus,
        repair_charge: repairCharge ? parseFloat(repairCharge) : undefined,
        notes: statusNote,
      })
      toast.success('Atelier workflow state updated')
      setShowStatusModal(false)
      setShowViewModal(false)
      fetchRepairs()
    } catch (error) {
      toast.error('Failed to update repair state')
    } finally {
      setIsSubmitting(false)
    }
  }

  const sendWhatsAppNotification = (repair: Repair) => {
    if (!repair.customer_phone) {
      toast.error('Customer phone number not available')
      return
    }
    const cleanPhone = repair.customer_phone.replace(/\D/g, '')
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
    const msg = encodeURIComponent(
      `Dear ${repair.customer_name || 'Valued Client'},\n\n` +
      `Update from Meghani Watch Co. Atelier (Est. 1984):\n` +
      `Your repair ticket *#${repair.ticket_number}* for *${repair.brand || ''} ${repair.item_type}* is now: *${statusConfig[repair.status]?.label?.toUpperCase()}*.\n\n` +
      `Estimated/Charge: ₹${(repair.repair_charge || repair.estimated_cost || 0).toLocaleString('en-IN')}\n` +
      `Thank you for trusting Meghani Watch Co. Vadodara.`
    )
    window.open(`https://wa.me/${phoneWithCountry}?text=${msg}`, '_blank')
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-'
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Summary Metrics
  const stats = useMemo(() => ({
    total: totalItems || repairs.length,
    pending: repairs.filter(r => r.status === 'received' || r.status === 'in_repair').length,
    ready: repairs.filter(r => r.status === 'ready').length,
    completed: repairs.filter(r => r.status === 'delivered').length,
  }), [repairs, totalItems])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#171613] border border-[#2A261F] rounded-xl flex items-center justify-center shadow-md">
            <Wrench className="w-5 h-5 text-[#C9A45C]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-serif font-bold text-[#F3EFE6] tracking-tight">Master Watchmaker Atelier</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F1E1A] text-[#C9A45C] border border-[#2A261F] font-mono">
                {stats.total} total tickets
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8D8980]">Precision horological restoration, service tracking, and client notifications</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <ExportButton 
            data={repairs} 
            columns={repairExportColumns} 
            filename={`meghani_atelier_${new Date().toISOString().split('T')[0]}`} 
          />
          <Button onClick={openAddModal} icon={<Plus className="w-4 h-4" />} className="shadow-gold">
            <span>New Repair Intake</span>
          </Button>
        </div>
      </div>

      {/* Atelier Status Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1F1E1A] border border-[#2A261F] flex items-center justify-center text-[#C9A45C]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#8D8980] uppercase tracking-wider">Total Atelier Jobs</p>
              <p className="text-2xl font-bold font-mono text-[#F3EFE6]">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#171613] rounded-2xl p-4 border border-amber-900/40 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-800/40 flex items-center justify-center text-amber-400">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#8D8980] uppercase tracking-wider">On Service Bench</p>
              <p className="text-2xl font-bold font-mono text-amber-400">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#171613] rounded-2xl p-4 border border-emerald-900/40 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#8D8980] uppercase tracking-wider">Ready for Pickup</p>
              <p className="text-2xl font-bold font-mono text-emerald-400">{stats.ready}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#171613] rounded-2xl p-4 border border-sky-900/40 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-950/40 border border-sky-800/40 flex items-center justify-center text-sky-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#8D8980] uppercase tracking-wider">Discharged</p>
              <p className="text-2xl font-bold font-mono text-sky-400">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Atelier Stages Filter */}
      <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-4 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D8980] group-focus-within:text-[#C9A45C] transition-colors" />
            <input
              type="text"
              placeholder="Search by ticket # (e.g. REP-1002), client name, timepiece brand or serial..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl 
                       text-[#F3EFE6] placeholder-[#8D8980]/70 text-sm
                       focus:border-[#C9A45C] focus:ring-1 focus:ring-[#C9A45C]
                       transition-all outline-none"
            />
          </div>

          <div className="flex items-center bg-[#12110F] border border-[#2A261F] rounded-xl p-1 flex-shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-2 rounded-lg transition-all',
                viewMode === 'grid' 
                  ? 'bg-[#C9A45C] text-[#0B0B0A] font-semibold shadow-sm' 
                  : 'text-[#8D8980] hover:text-[#F3EFE6]'
              )}
              title="Card Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={clsx(
                'p-2 rounded-lg transition-all',
                viewMode === 'table' 
                  ? 'bg-[#C9A45C] text-[#0B0B0A] font-semibold shadow-sm' 
                  : 'text-[#8D8980] hover:text-[#F3EFE6]'
              )}
              title="Ledger Table"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workflow Stage Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide pt-1">
          <button
            onClick={() => setStatusFilter('')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
              statusFilter === ''
                ? 'bg-[#C9A45C] text-[#0B0B0A] font-bold'
                : 'bg-[#12110F] border border-[#2A261F] text-[#8D8980] hover:text-[#F3EFE6]'
            )}
          >
            All Tickets ({stats.total})
          </button>
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 border',
                statusFilter === key
                  ? `${config.bg} ${config.color} ${config.border} font-bold`
                  : 'bg-[#12110F] border-[#2A261F] text-[#8D8980] hover:text-[#F3EFE6]'
              )}
            >
              <config.icon className="w-3.5 h-3.5" />
              <span>{config.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Repairs Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[#171613] rounded-2xl border border-[#2A261F] p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#1F1E1A]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#1F1E1A] rounded w-28" />
                  <div className="h-3 bg-[#1F1E1A] rounded w-40" />
                </div>
              </div>
              <div className="h-16 bg-[#1F1E1A] rounded-xl" />
            </div>
          ))}
        </div>
      ) : repairs.length === 0 ? (
        <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-12 text-center shadow-xl">
          <div className="w-16 h-16 mx-auto bg-[#1F1E1A] border border-[#2A261F] rounded-2xl flex items-center justify-center mb-4">
            <Wrench className="w-8 h-8 text-[#8D8980]" />
          </div>
          <h3 className="text-lg font-serif font-bold text-[#F3EFE6] mb-1">No Atelier Tickets in Stage</h3>
          <p className="text-sm text-[#8D8980] mb-5">There are no repair tickets matching your active filter criteria.</p>
          <Button onClick={openAddModal} icon={<Plus className="w-4 h-4" />}>
            Register Service Intake
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {repairs.map((repair, index) => {
              const config = statusConfig[repair.status] || statusConfig.received
              const StatusIcon = config.icon
              
              return (
                <motion.div
                  key={repair.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => openViewModal(repair)}
                  className="group bg-[#171613] rounded-2xl border border-[#2A261F] hover:border-[#C9A45C]/50 shadow-xl transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0', config.bg, config.border)}>
                          <StatusIcon className={clsx('w-5 h-5', config.color)} />
                        </div>
                        <div className="min-w-0">
                          <span className="font-mono font-bold text-sm text-[#C9A45C] group-hover:underline truncate block">
                            {repair.ticket_number}
                          </span>
                          <span className={clsx('text-[11px] font-medium px-2 py-0.5 rounded-full inline-block border mt-0.5', config.bg, config.color, config.border)}>
                            {config.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {repair.customer_phone && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              sendWhatsAppNotification(repair)
                            }}
                            className="p-1.5 hover:bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 rounded-lg transition-colors"
                            title="Send WhatsApp Update"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadPDF(repair.id, repair.ticket_number)
                          }}
                          className="p-1.5 hover:bg-[#2A261F] text-[#8D8980] hover:text-[#F3EFE6] rounded-lg transition-colors"
                          title="Print Docket"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Customer & Timepiece */}
                    <div className="space-y-2 mb-3.5">
                      <div className="flex items-center gap-2 text-xs">
                        <User className="w-3.5 h-3.5 text-[#C9A45C] flex-shrink-0" />
                        <span className="font-serif font-semibold text-[#F3EFE6] truncate">{repair.customer_name}</span>
                        {repair.customer_phone && (
                          <span className="text-[#8D8980] font-mono text-[11px]">({repair.customer_phone})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#8D8980]">
                        <Watch className="w-3.5 h-3.5 text-[#8D8980] flex-shrink-0" />
                        <span className="text-[#E8D5A7] truncate font-medium">{repair.brand || 'Horological Article'}</span>
                        <span className="text-[#8D8980]">| {repair.item_type}</span>
                      </div>
                    </div>

                    {/* Issue Description */}
                    <div className="p-3 bg-[#12110F] border border-[#2A261F] rounded-xl text-xs text-[#8D8980] line-clamp-2">
                      {repair.issue_description}
                    </div>

                    {/* Dates & Cost */}
                    <div className="mt-4 pt-3 border-t border-[#2A261F] flex items-center justify-between text-xs">
                      <div className="text-[#8D8980] font-mono text-[11px]">
                        <span>Received: </span>
                        <span className="text-[#F3EFE6]">{formatDate(repair.received_date)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#8D8980] block uppercase tracking-wider">
                          {repair.repair_charge ? 'Final Charge' : 'Estimated'}
                        </span>
                        <span className="font-mono font-bold text-sm text-[#C9A45C]">
                          {formatCurrency(repair.repair_charge || repair.estimated_cost)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4-Stage Progress Track */}
                  <div>
                    <div className="h-1 bg-[#12110F] border-t border-[#2A261F] flex">
                      <div className={clsx('h-full flex-1 transition-all', repair.status !== 'cancelled' ? 'bg-[#C9A45C]' : 'bg-rose-500')} />
                      <div className={clsx('h-full flex-1 transition-all', ['in_repair', 'ready', 'delivered'].includes(repair.status) ? 'bg-[#C9A45C]' : 'bg-transparent')} />
                      <div className={clsx('h-full flex-1 transition-all', ['ready', 'delivered'].includes(repair.status) ? 'bg-emerald-400' : 'bg-transparent')} />
                      <div className={clsx('h-full flex-1 transition-all', repair.status === 'delivered' ? 'bg-sky-400' : 'bg-transparent')} />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* Table View */
        <div className="bg-[#171613] rounded-2xl border border-[#2A261F] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-[#12110F] border-b border-[#2A261F]">
                <tr>
                  <th className="px-5 py-3.5 text-left">
                    <SortableHeader label="Ticket #" field="ticket_number" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Client & Phone</th>
                  <th className="px-4 py-3.5 text-left">
                    <SortableHeader label="Timepiece" field="item_type" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-left">
                    <SortableHeader label="Atelier Status" field="status" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-left">
                    <SortableHeader label="Due Date" field="expected_delivery" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-right">
                    <SortableHeader label="Estimated / Final" field="estimated_cost" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A261F]">
                {repairs.map((repair, index) => {
                  const config = statusConfig[repair.status] || statusConfig.received
                  const StatusIcon = config.icon
                  return (
                    <tr
                      key={repair.id}
                      className="hover:bg-[#1F1E1A] transition-colors cursor-pointer"
                      onClick={() => openViewModal(repair)}
                    >
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-sm text-[#C9A45C] hover:underline">
                          {repair.ticket_number}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-serif font-semibold text-sm text-[#F3EFE6] truncate max-w-[150px]">{repair.customer_name}</p>
                        <p className="text-[11px] font-mono text-[#8D8980]">{repair.customer_phone || '-'}</p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-[#F3EFE6]">{repair.brand || 'Luxury Horology'}</p>
                        <p className="text-xs text-[#8D8980] truncate max-w-[140px]">{repair.item_type}</p>
                      </td>

                      <td className="px-4 py-4">
                        <span className={clsx('text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 border', config.bg, config.color, config.border)}>
                          <StatusIcon className="w-3 h-3" />
                          <span>{config.label}</span>
                        </span>
                      </td>

                      <td className="px-4 py-4 font-mono text-xs text-[#8D8980]">
                        {repair.expected_delivery ? formatDate(repair.expected_delivery) : formatDate(repair.received_date)}
                      </td>

                      <td className="px-4 py-4 text-right font-mono font-bold text-sm text-[#C9A45C]">
                        {formatCurrency(repair.repair_charge || repair.estimated_cost)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {repair.customer_phone && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                sendWhatsAppNotification(repair)
                              }}
                              className="p-1.5 hover:bg-emerald-950/40 text-emerald-400 rounded-lg transition-colors"
                              title="WhatsApp Notification"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              openViewModal(repair)
                            }}
                            className="p-1.5 hover:bg-[#2A261F] text-[#8D8980] hover:text-[#F3EFE6] rounded-lg transition-colors"
                            title="Inspect"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {config.next && (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation() 
                                openStatusModal(repair, config.next!) 
                              }} 
                              className="p-1.5 hover:bg-[#C9A45C]/15 text-[#C9A45C] rounded-lg transition-colors"
                              title={`Advance to ${statusConfig[config.next]?.label}`}
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && repairs.length > 0 && (
        <div className="bg-[#171613] rounded-xl border border-[#2A261F] p-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}

      {/* Create Repair Intake Modal */}
      <Modal 
        isOpen={showFormModal} 
        onClose={() => setShowFormModal(false)} 
        title="Register Watchmaker Atelier Intake" 
        description="Issue official service ticket and record client timepiece characteristics"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Clientele Lookup */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[#C9A45C] uppercase tracking-wider block">1. Client Identification</span>
            {selectedCustomer ? (
              <div className="p-3.5 bg-[#12110F] rounded-xl flex items-center justify-between border border-[#2A261F]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-[#1F1E1A] border border-[#2A261F] rounded-xl flex items-center justify-center text-[#C9A45C] font-serif font-bold text-sm flex-shrink-0">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif font-semibold text-[#F3EFE6] text-sm truncate">{selectedCustomer.name}</p>
                    <p className="text-xs text-[#8D8980] font-mono truncate">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedCustomer(null)}>
                  Change Client
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D8980]" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => searchCustomers(e.target.value)}
                    placeholder="Search existing clientele directory by name or mobile..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl text-sm text-[#F3EFE6] placeholder-[#8D8980]/70 focus:border-[#C9A45C] outline-none"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute z-20 w-full mt-1.5 bg-[#171613] border border-[#2A261F] rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-[#2A261F]">
                      {searchResults.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => selectCustomer(customer)}
                          className="w-full px-4 py-2.5 text-left hover:bg-[#1F1E1A] flex items-center gap-3 transition-colors"
                        >
                          <div className="w-8 h-8 bg-[#12110F] rounded-lg flex items-center justify-center text-xs font-bold text-[#C9A45C]">
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-[#F3EFE6]">{customer.name}</p>
                            <p className="text-xs text-[#8D8980] font-mono">{customer.phone}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Input label="Direct Client Name" {...register('customer_name')} placeholder="Full name if new client" />
                  <Input label="Client Mobile Phone" {...register('customer_phone')} placeholder="+91 XXXXXXXXXX" />
                </div>
              </div>
            )}
          </div>

          {/* Timepiece & Diagnostic */}
          <div className="space-y-2 pt-2 border-t border-[#2A261F]">
            <span className="text-xs font-semibold text-[#C9A45C] uppercase tracking-wider block">2. Horological Article & Diagnostics</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Article Classification *</label>
                <select 
                  {...register('item_type')} 
                  className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-sm text-[#F3EFE6]"
                >
                  <option value="">Select horological class...</option>
                  {itemTypes.map((type) => (
                    <option key={type} value={type} className="bg-[#171613]">{type}</option>
                  ))}
                </select>
                {errors.item_type && <p className="text-rose-400 text-xs mt-1">{errors.item_type.message}</p>}
              </div>

              <Input label="Brand / Maison" {...register('brand')} placeholder="e.g. Omega, Seiko, Titan" />
              <Input label="Model / Calibre Reference" {...register('model_number')} placeholder="e.g. Speedmaster 3861" />
              <Input label="Case / Movement Serial Number" {...register('serial_number')} placeholder="e.g. SN-89240182" />

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Issue Diagnostic & Customer Statement *</label>
                <textarea 
                  {...register('issue_description')} 
                  rows={3} 
                  className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-sm text-[#F3EFE6] resize-none" 
                  placeholder="Detail symptoms (e.g., losing 45 sec/day, stem dislodged, crystal scratched, water ingress, full overhaul required)..." 
                />
                {errors.issue_description && <p className="text-rose-400 text-xs mt-1">{errors.issue_description.message}</p>}
              </div>
            </div>
          </div>

          {/* Charges & Target Delivery */}
          <div className="space-y-2 pt-2 border-t border-[#2A261F]">
            <span className="text-xs font-semibold text-[#C9A45C] uppercase tracking-wider block">3. Estimates & Restoration Schedule</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input label="Estimated Cost (₹)" type="number" {...register('estimated_cost')} placeholder="0" />
              <Input label="Advance Paid (₹)" type="number" {...register('advance_paid')} placeholder="0" />
              <Input label="Target Ready Date" type="date" {...register('expected_delivery')} />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#2A261F]">
            <Button type="button" variant="secondary" onClick={() => setShowFormModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} className="shadow-gold">
              Create Service Ticket
            </Button>
          </div>
        </form>
      </Modal>

      {/* Inspect View Dossier Modal */}
      <Modal 
        isOpen={showViewModal} 
        onClose={() => setShowViewModal(false)} 
        title={`Atelier Dossier: ${selectedRepair?.ticket_number}`}
        description="Comprehensive diagnostic card, workshop history, and client notification status"
        size="lg"
      >
        {selectedRepair && (
          <div className="space-y-5">
            {/* Stage Progression Banner */}
            <div className={clsx('p-4 rounded-xl border', statusConfig[selectedRepair.status]?.bg, statusConfig[selectedRepair.status]?.border)}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#171613] rounded-xl border border-[#2A261F] flex items-center justify-center">
                    {(() => {
                      const Icon = statusConfig[selectedRepair.status]?.icon || Package
                      return <Icon className={clsx('w-5 h-5', statusConfig[selectedRepair.status]?.color)} />
                    })()}
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Atelier Stage</span>
                    <span className={clsx('text-base font-bold font-serif', statusConfig[selectedRepair.status]?.color)}>
                      {statusConfig[selectedRepair.status]?.label}
                    </span>
                  </div>
                </div>

                {selectedRepair.status !== 'delivered' && selectedRepair.status !== 'cancelled' && (
                  <div className="flex gap-2">
                    {statusConfig[selectedRepair.status]?.next && (
                      <Button 
                        size="sm" 
                        onClick={() => openStatusModal(selectedRepair, statusConfig[selectedRepair.status].next!)}
                        className="shadow-gold"
                      >
                        <ArrowRight className="w-3.5 h-3.5 mr-1" />
                        <span>Advance to {statusConfig[statusConfig[selectedRepair.status].next!]?.label}</span>
                      </Button>
                    )}
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={() => openStatusModal(selectedRepair, 'cancelled')}
                    >
                      Archive / Return
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Client & Watch Details Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#12110F] border border-[#2A261F] rounded-xl">
              <div>
                <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Client</span>
                <p className="font-serif font-bold text-sm text-[#F3EFE6] mt-0.5 truncate">{selectedRepair.customer_name}</p>
                <p className="text-xs text-[#8D8980] font-mono mt-0.5">{selectedRepair.customer_phone || '-'}</p>
              </div>

              <div>
                <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Timepiece</span>
                <p className="text-sm font-semibold text-[#C9A45C] mt-0.5">{selectedRepair.brand || 'Horology'}</p>
                <p className="text-xs text-[#8D8980] truncate">{selectedRepair.item_type}</p>
              </div>

              <div>
                <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Intake Date</span>
                <p className="text-xs font-mono text-[#F3EFE6] mt-0.5">{formatDate(selectedRepair.received_date)}</p>
              </div>

              <div>
                <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Target Delivery</span>
                <p className="text-xs font-mono text-emerald-400 mt-0.5">{formatDate(selectedRepair.expected_delivery)}</p>
              </div>
            </div>

            {/* Diagnostic Box */}
            <div className="p-3.5 bg-[#12110F] border border-[#2A261F] rounded-xl space-y-1">
              <span className="text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Reported Issue & Symptoms</span>
              <p className="text-xs text-[#F3EFE6] leading-relaxed">{selectedRepair.issue_description}</p>
            </div>

            {/* Financial Ledger */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-[#12110F] border border-[#2A261F] rounded-xl text-center">
              <div>
                <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Estimated Cost</span>
                <p className="font-mono font-bold text-base text-[#8D8980] mt-1">{formatCurrency(selectedRepair.estimated_cost)}</p>
              </div>

              <div>
                <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Advance Deposit</span>
                <p className="font-mono font-bold text-base text-emerald-400 mt-1">{formatCurrency(selectedRepair.advance_paid)}</p>
              </div>

              <div>
                <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Final Charge</span>
                <p className="font-mono font-bold text-lg text-[#C9A45C] mt-1">
                  {formatCurrency(selectedRepair.repair_charge || selectedRepair.estimated_cost)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-[#2A261F]">
              {selectedRepair.customer_phone ? (
                <button
                  onClick={() => sendWhatsAppNotification(selectedRepair)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 text-emerald-400 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Notify Client on WhatsApp</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setShowViewModal(false)}>
                  Dismiss
                </Button>
                <Button 
                  onClick={() => downloadPDF(selectedRepair.id, selectedRepair.ticket_number)}
                  icon={<Download className="w-4 h-4" />}
                  loading={downloadingId === selectedRepair.id}
                  className="shadow-gold"
                >
                  Download Service Docket PDF
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Status Transition Modal */}
      <Modal 
        isOpen={showStatusModal} 
        onClose={() => setShowStatusModal(false)} 
        title="Advance Atelier Stage"
        description="Update horological bench status and finalize billable restoration charges"
      >
        <div className="space-y-4">
          <div className={clsx('p-4 rounded-xl border', statusConfig[newStatus]?.bg, statusConfig[newStatus]?.border)}>
            <span className="text-xs text-[#8D8980] uppercase tracking-wider block">Target Stage</span>
            <p className={clsx('text-base font-bold font-serif mt-0.5', statusConfig[newStatus]?.color)}>
              {statusConfig[newStatus]?.label}
            </p>
          </div>

          {(newStatus === 'ready' || newStatus === 'delivered') && (
            <Input
              label="Final Repair Charge (₹)"
              type="number"
              value={repairCharge}
              onChange={(e) => setRepairCharge(e.target.value)}
              placeholder="Enter final charge payable"
            />
          )}

          <div>
            <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Workshop Notes / Replacement Parts Logged</label>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-xs text-[#F3EFE6] resize-none"
              placeholder="e.g. Replaced mainspring, new case gasket fitted, timing tested to +2 sec/day..."
            />
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-[#2A261F]">
            <Button variant="secondary" onClick={() => setShowStatusModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={updateStatus} loading={isSubmitting} className="flex-1 shadow-gold">
              Commit Status Change
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
