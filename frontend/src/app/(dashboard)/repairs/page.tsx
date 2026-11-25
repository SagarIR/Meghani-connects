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
  ShieldCheck, Check, Sparkles, Watch, Send, Trash2, Cpu, UserCheck, ChevronRight
} from 'lucide-react'
import { api } from '@/services/api'
import { Repair, Customer, RepairPart } from '@/types'
import { usePreferences } from '@/context/PreferencesContext'
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
  service_type: yup.string().default('general'),
  assigned_technician: yup.number().nullable(),
  issue_description: yup.string().required('Issue description is required'),
  diagnosis_notes: yup.string().nullable(),
  estimated_cost: yup.number().nullable(),
  advance_paid: yup.number().default(0),
  expected_delivery: yup.string().nullable(),
  notes: yup.string().nullable(),
})

type FormData = yup.InferType<typeof schema>

const statusConfig: Record<string, { label: string; stageNumber: number; next: string | null; icon: any; color: string; bg: string; border: string }> = {
  received: { 
    label: 'Received', 
    stageNumber: 1, 
    next: 'diagnosing', 
    icon: Package, 
    color: 'text-[#8D8980]', 
    bg: 'bg-[#1F1E1A]', 
    border: 'border-[#2A261F]' 
  },
  diagnosing: { 
    label: 'Diagnosing', 
    stageNumber: 2, 
    next: 'awaiting_approval', 
    icon: Search, 
    color: 'text-indigo-400', 
    bg: 'bg-indigo-950/30', 
    border: 'border-indigo-800/40' 
  },
  awaiting_approval: { 
    label: 'Awaiting Approval', 
    stageNumber: 3, 
    next: 'in_repair', 
    icon: AlertTriangle, 
    color: 'text-amber-400', 
    bg: 'bg-amber-950/30', 
    border: 'border-amber-800/40' 
  },
  in_repair: { 
    label: 'In Repair', 
    stageNumber: 4, 
    next: 'testing', 
    icon: Wrench, 
    color: 'text-yellow-400', 
    bg: 'bg-yellow-950/30', 
    border: 'border-yellow-800/40' 
  },
  testing: { 
    label: 'Testing & QC', 
    stageNumber: 5, 
    next: 'ready', 
    icon: ShieldCheck, 
    color: 'text-cyan-400', 
    bg: 'bg-cyan-950/30', 
    border: 'border-cyan-800/40' 
  },
  ready: { 
    label: 'Ready for Collection', 
    stageNumber: 6, 
    next: 'delivered', 
    icon: CheckCircle, 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-950/30', 
    border: 'border-emerald-800/40' 
  },
  delivered: { 
    label: 'Delivered', 
    stageNumber: 7, 
    next: null, 
    icon: Truck, 
    color: 'text-sky-400', 
    bg: 'bg-sky-950/30', 
    border: 'border-sky-800/40' 
  },
  cancelled: { 
    label: 'Cancelled', 
    stageNumber: 0, 
    next: null, 
    icon: XCircle, 
    color: 'text-rose-400', 
    bg: 'bg-rose-950/30', 
    border: 'border-rose-800/40' 
  },
}

const serviceTypes = [
  { value: 'general', label: 'General Repair & Diagnostic' },
  { value: 'battery', label: 'Battery Replacement' },
  { value: 'overhaul', label: 'Complete Movement Overhaul / Service' },
  { value: 'crystal', label: 'Crystal / Glass Replacement' },
  { value: 'polishing', label: 'Case & Bracelet Refurbishing / Polishing' },
  { value: 'strap', label: 'Strap / Bracelet Customization & Sizing' },
  { value: 'water_resistance', label: 'Water Resistance Reseal & Gasket' },
  { value: 'crown_stem', label: 'Crown / Stem Repair' },
]

const itemTypes = [
  'Automatic / Mechanical Watch',
  'Quartz Watch',
  'Chronograph Watch',
  'Pocket Watch',
  'Wall Clock',
  'Smartwatch',
  'Strap / Clasp Repair'
]

interface Technician {
  id: number
  name: string
  username: string
  role: string
}

interface ProductItem {
  id: number
  name: string
  brand: string
  stock: number
  selling_price: number
  article_code?: string
}

export default function RepairsPage() {
  const { t } = usePreferences()

  const getStatusInfo = (status: string) => {
    const config = statusConfig[status] || statusConfig.received
    let localizedLabel = config.label
    switch (status) {
      case 'received': localizedLabel = t('statusReceived', config.label); break;
      case 'diagnosing': localizedLabel = t('statusDiagnosing', config.label); break;
      case 'awaiting_approval': localizedLabel = t('statusAwaitingApproval', config.label); break;
      case 'in_repair': localizedLabel = t('statusInRepair', config.label); break;
      case 'testing': localizedLabel = t('statusTesting', config.label); break;
      case 'ready': localizedLabel = t('statusReadyCollection', config.label); break;
      case 'delivered': localizedLabel = t('statusDelivered', config.label); break;
      case 'cancelled': localizedLabel = t('statusCancelled', config.label); break;
    }
    return { ...config, label: localizedLabel }
  }

  const [repairs, setRepairs] = useState<Repair[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  // Master Lists
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])

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
  const [showAddPartModal, setShowAddPartModal] = useState(false)
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  
  // Customer search
  const [customerSearch, setCustomerSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  
  // Status update form state
  const [newStatus, setNewStatus] = useState('received')
  const [repairCharge, setRepairCharge] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [selectedTechId, setSelectedTechId] = useState<number | null>(null)
  const [statusServiceType, setStatusServiceType] = useState('general')
  const [statusQcPassed, setStatusQcPassed] = useState(false)
  const [statusDiagnosisNotes, setStatusDiagnosisNotes] = useState('')

  // Add Spare Part form state
  const [partProductId, setPartProductId] = useState<number | null>(null)
  const [partQuantity, setPartQuantity] = useState(1)
  const [partCharge, setPartCharge] = useState('')
  const [partNotes, setPartNotes] = useState('')
  const [isAddingPart, setIsAddingPart] = useState(false)
  const [removingPartId, setRemovingPartId] = useState<number | null>(null)

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { 
      advance_paid: 0,
      service_type: 'general',
    }
  })

  // Load Technicians & Products Catalog
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [techsRes, productsRes] = await Promise.all([
          api.get('/repairs/technicians/'),
          api.get('/products/?page_size=100')
        ])
        setTechnicians(techsRes.data || [])
        setProducts(productsRes.data?.results || productsRes.data || [])
      } catch (err) {
        console.error('Failed to load master workshop data:', err)
      }
    }
    loadMasterData()
  }, [])

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
    reset({ 
      advance_paid: 0, 
      service_type: 'general',
      item_type: '', 
      brand: '', 
      model_number: '', 
      serial_number: '', 
      issue_description: '', 
      diagnosis_notes: '',
      estimated_cost: undefined, 
      expected_delivery: '', 
      notes: '', 
      customer: undefined, 
      customer_phone: '', 
      customer_name: '' 
    })
    setShowFormModal(true)
  }

  const openViewModal = async (repair: Repair) => {
    setSelectedRepair(repair)
    setShowViewModal(true)
    try {
      // Fetch full detailed repair with spare parts
      const res = await api.get(`/repairs/${repair.id}/`)
      setSelectedRepair(res.data)
    } catch (err) {
      console.error('Failed to fetch full repair detail', err)
    }
  }

  const openStatusModal = (repair: Repair, status: string) => {
    setSelectedRepair(repair)
    setNewStatus(status)
    setRepairCharge(repair.repair_charge?.toString() || repair.estimated_cost?.toString() || '')
    setStatusNote(repair.notes || '')
    setSelectedTechId(repair.assigned_technician || null)
    setStatusServiceType(repair.service_type || 'general')
    setStatusQcPassed(repair.qc_passed || false)
    setStatusDiagnosisNotes(repair.diagnosis_notes || '')
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
        assigned_technician: data.assigned_technician || undefined,
      }
      
      await api.post('/repairs/', payload)
      toast.success('Repair ticket created successfully')
      setShowFormModal(false)
      fetchRepairs()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || error.response?.data?.error || 'Failed to create repair ticket')
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
      toast.success(`Repair ticket ${ticketNumber} downloaded`)
    } catch (error) {
      toast.error('Failed to download repair ticket')
    } finally {
      setDownloadingId(null)
    }
  }

  const updateStatus = async () => {
    if (!selectedRepair) return
    setIsSubmitting(true)
    try {
      const payload: any = {
        status: newStatus,
        repair_charge: repairCharge ? parseFloat(repairCharge) : undefined,
        notes: statusNote,
        assigned_technician: selectedTechId || null,
        service_type: statusServiceType,
        qc_passed: statusQcPassed,
        diagnosis_notes: statusDiagnosisNotes,
      }
      const res = await api.patch(`/repairs/${selectedRepair.id}/update_status/`, payload)
      toast.success(`Ticket ${selectedRepair.ticket_number} advanced to ${statusConfig[newStatus]?.label || newStatus}`)
      setShowStatusModal(false)
      setSelectedRepair(res.data)
      fetchRepairs()
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.detail || 'Failed to update repair status')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddSparePart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRepair || !partProductId) {
      toast.error('Please select a spare part / product')
      return
    }
    setIsAddingPart(true)
    try {
      await api.post(`/repairs/${selectedRepair.id}/add_part/`, {
        product_id: partProductId,
        quantity: partQuantity || 1,
        charge_to_customer: partCharge ? parseFloat(partCharge) : undefined,
        notes: partNotes,
      })
      toast.success('Spare part consumed from inventory')
      const res = await api.get(`/repairs/${selectedRepair.id}/`)
      setSelectedRepair(res.data)
      setShowAddPartModal(false)
      setPartProductId(null)
      setPartQuantity(1)
      setPartCharge('')
      setPartNotes('')
      fetchRepairs()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add spare part')
    } finally {
      setIsAddingPart(false)
    }
  }

  const handleRemoveSparePart = async (partId: number) => {
    if (!selectedRepair) return
    setRemovingPartId(partId)
    try {
      await api.post(`/repairs/${selectedRepair.id}/remove_part/`, {
        part_id: partId
      })
      toast.success('Spare part returned to stock')
      const res = await api.get(`/repairs/${selectedRepair.id}/`)
      setSelectedRepair(res.data)
      fetchRepairs()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to return spare part')
    } finally {
      setRemovingPartId(null)
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
      `Dear ${repair.customer_name || 'Customer'},\n\n` +
      `Update from Meghani Watch Co. Atelier (Est. 1984):\n` +
      `Your repair ticket *#${repair.ticket_number}* for *${repair.brand || 'Watch'} (${repair.item_type})* is now: *${statusConfig[repair.status]?.label?.toUpperCase()}*.\n` +
      (repair.service_type_display ? `Service: *${repair.service_type_display}*\n` : '') +
      (repair.assigned_technician_name ? `Horologist: *${repair.assigned_technician_name}*\n` : '') +
      `Estimated/Charge: ₹${(repair.repair_charge || repair.estimated_cost || 0).toLocaleString('en-IN')}\n\n` +
      `Thank you for entrusting your timepiece with Meghani Watch Co. Vadodara.`
    )
    window.open(`https://wa.me/${phoneWithCountry}?text=${msg}`, '_blank')
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-'
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Summary Metrics
  const stats = useMemo(() => ({
    total: totalItems || repairs.length,
    inWorkshop: repairs.filter(r => ['received', 'diagnosing', 'awaiting_approval', 'in_repair', 'testing'].includes(r.status)).length,
    ready: repairs.filter(r => r.status === 'ready').length,
    delivered: repairs.filter(r => r.status === 'delivered').length,
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
              <h1 className="text-2xl font-serif font-bold text-[#F3EFE6] tracking-tight">{t('workshopTitle', 'Watch Workshop & Repairs')}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F1E1A] text-[#C9A45C] border border-[#2A261F] font-mono">
                {stats.total} {t('totalTickets', 'total tickets')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8D8980]">{t('workshopSubtitle', 'Atelier job tracking, horologist dispatch, spare parts consumption, and QC assurance')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <ExportButton 
            data={repairs} 
            columns={repairExportColumns} 
            filename={`meghani_repairs_${new Date().toISOString().split('T')[0]}`} 
          />
          <Button onClick={openAddModal} icon={<Plus className="w-4 h-4" />} className="shadow-gold">
            <span>{t('newRepairTicket', 'New Repair Ticket')}</span>
          </Button>
        </div>
      </div>

      {/* Repair Status Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1F1E1A] border border-[#2A261F] flex items-center justify-center text-[#C9A45C]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#8D8980] uppercase tracking-wider">{t('totalTickets', 'Total Tickets')}</p>
              <p className="text-2xl font-bold font-mono text-[#F3EFE6]">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#171613] rounded-2xl p-4 border border-amber-900/40 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-800/40 flex items-center justify-center text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#8D8980] uppercase tracking-wider">{t('inAtelierBench', 'In Atelier / Bench')}</p>
              <p className="text-2xl font-bold font-mono text-amber-400">{stats.inWorkshop}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#171613] rounded-2xl p-4 border border-emerald-900/40 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#8D8980] uppercase tracking-wider">{t('readyForCollection', 'Ready for Collection')}</p>
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
              <p className="text-xs text-[#8D8980] uppercase tracking-wider">{t('deliveredStatus', 'Delivered')}</p>
              <p className="text-2xl font-bold font-mono text-sky-400">{stats.delivered}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Repair Stages Filter */}
      <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-4 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D8980] group-focus-within:text-[#C9A45C] transition-colors" />
            <input
              type="text"
              placeholder={t('searchRepairsPlaceholder', 'Search by ticket # (e.g. REP-1002), customer, watch brand, model or horologist...')}
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

        {/* 8 Workflow Stage Filter Pills */}
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
            {t('allStages', 'All Stages')} ({stats.total})
          </button>
          {Object.entries(statusConfig).map(([key, config]) => {
            const statusInfo = getStatusInfo(key)
            return (
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
                <span>{statusInfo.label}</span>
              </button>
            )
          })}
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
          <h3 className="text-lg font-serif font-bold text-[#F3EFE6] mb-1">{t('noRepairsFound', 'No Repair Tickets Found')}</h3>
          <p className="text-sm text-[#8D8980] mb-5">{t('noRepairsMatchingFilter', 'There are no repair tickets matching your active filter criteria.')}</p>
          <Button onClick={openAddModal} icon={<Plus className="w-4 h-4" />}>
            {t('newRepairTicket', 'New Repair Ticket')}
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {repairs.map((repair, index) => {
              const config = getStatusInfo(repair.status)
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
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={clsx('text-[11px] font-medium px-2 py-0.5 rounded-full inline-block border', config.bg, config.color, config.border)}>
                              {config.label}
                            </span>
                            {repair.qc_passed && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 inline-flex items-center gap-0.5">
                                <ShieldCheck className="w-3 h-3" />
                                QC
                              </span>
                            )}
                          </div>
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
                          title="Download Ticket PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Customer & Watch */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-xs">
                        <User className="w-3.5 h-3.5 text-[#C9A45C] flex-shrink-0" />
                        <span className="font-serif font-semibold text-[#F3EFE6] truncate">{repair.customer_name}</span>
                        {repair.customer_phone && (
                          <span className="text-[#8D8980] font-mono text-[11px]">({repair.customer_phone})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#8D8980]">
                        <Watch className="w-3.5 h-3.5 text-[#8D8980] flex-shrink-0" />
                        <span className="text-[#E8D5A7] truncate font-medium">{repair.brand || 'Watch'}</span>
                        <span className="text-[#8D8980]">| {repair.item_type}</span>
                      </div>
                    </div>

                    {/* Service Type & Horologist Tags */}
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#1F1E1A] text-[#C9A45C] border border-[#2A261F]">
                        {repair.service_type_display || repair.service_type || 'General Service'}
                      </span>
                      {repair.assigned_technician_name && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#1A1815] text-[#8D8980] border border-[#2A261F] flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-[#C9A45C]" />
                          {repair.assigned_technician_name}
                        </span>
                      )}
                      {repair.days_in_repair > 0 && (
                        <span className="text-[10px] font-mono text-[#8D8980] ml-auto">
                          {repair.days_in_repair}d in atelier
                        </span>
                      )}
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
                          {repair.repair_charge ? 'Final Cost' : 'Estimated Cost'}
                        </span>
                        <span className="font-mono font-bold text-sm text-[#C9A45C]">
                          {formatCurrency(repair.repair_charge || repair.estimated_cost)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 8-Stage Progress Track */}
                  <div>
                    <div className="h-1 bg-[#12110F] border-t border-[#2A261F] flex">
                      {[1, 2, 3, 4, 5, 6, 7].map((stageNum) => {
                        const currentStage = config.stageNumber
                        const isPastOrCurrent = currentStage >= stageNum && currentStage !== 0
                        return (
                          <div 
                            key={stageNum}
                            className={clsx(
                              'h-full flex-1 transition-all',
                              repair.status === 'cancelled'
                                ? 'bg-rose-500/40'
                                : isPastOrCurrent
                                  ? stageNum >= 6 ? 'bg-emerald-400' : 'bg-[#C9A45C]'
                                  : 'bg-transparent'
                            )} 
                          />
                        )
                      })}
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
            <table className="w-full min-w-[960px]">
              <thead className="bg-[#12110F] border-b border-[#2A261F]">
                <tr>
                  <th className="px-5 py-3.5 text-left">
                    <SortableHeader label="Ticket #" field="ticket_number" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Customer & Phone</th>
                  <th className="px-4 py-3.5 text-left">
                    <SortableHeader label="Watch & Service" field="item_type" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Horologist</th>
                  <th className="px-4 py-3.5 text-left">
                    <SortableHeader label="Stage" field="status" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-left">
                    <SortableHeader label="Due Date" field="expected_delivery" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-right">
                    <SortableHeader label="Est / Final Cost" field="estimated_cost" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A261F]">
                {repairs.map((repair) => {
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
                        <p className="text-sm font-medium text-[#F3EFE6]">{repair.brand || 'Watch'}</p>
                        <p className="text-xs text-[#C9A45C] truncate max-w-[150px]">{repair.service_type_display || repair.item_type}</p>
                      </td>

                      <td className="px-4 py-4 font-mono text-xs text-[#8D8980]">
                        {repair.assigned_technician_name ? (
                          <span className="flex items-center gap-1 text-[#E8D5A7]">
                            <UserCheck className="w-3.5 h-3.5 text-[#C9A45C]" />
                            {repair.assigned_technician_name}
                          </span>
                        ) : (
                          <span className="text-[#8D8980]/60 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={clsx('text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 border', config.bg, config.color, config.border)}>
                            <StatusIcon className="w-3 h-3" />
                            <span>{config.label}</span>
                          </span>
                          {repair.qc_passed && (
                            <span className="p-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40" title="QC Passed">
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
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
                              title="Send WhatsApp Update"
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
                            title="View Details"
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

      {/* Create Repair Ticket Modal */}
      <Modal 
        isOpen={showFormModal} 
        onClose={() => setShowFormModal(false)} 
        title="New Atelier Repair Ticket" 
        description="Book a timepiece into the workshop, assign a horologist, and record initial diagnosis"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Customer Lookup */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[#C9A45C] uppercase tracking-wider block">1. Customer Information</span>
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
                  Change Customer
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
                    placeholder="Search customers by name or phone..."
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
                  <Input label="Customer Name" {...register('customer_name')} placeholder="Full name if new customer" />
                  <Input label="Customer Phone" {...register('customer_phone')} placeholder="+91 XXXXXXXXXX" />
                </div>
              </div>
            )}
          </div>

          {/* Timepiece & Workshop Details */}
          <div className="space-y-2 pt-2 border-t border-[#2A261F]">
            <span className="text-xs font-semibold text-[#C9A45C] uppercase tracking-wider block">2. Timepiece & Workshop Assignment</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Watch / Item Type *</label>
                <select 
                  {...register('item_type')} 
                  className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-sm text-[#F3EFE6]"
                >
                  <option value="">Select item type...</option>
                  {itemTypes.map((type) => (
                    <option key={type} value={type} className="bg-[#171613]">{type}</option>
                  ))}
                </select>
                {errors.item_type && <p className="text-rose-400 text-xs mt-1">{errors.item_type.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Service Category</label>
                <select 
                  {...register('service_type')} 
                  className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-sm text-[#F3EFE6]"
                >
                  {serviceTypes.map((st) => (
                    <option key={st.value} value={st.value} className="bg-[#171613]">{st.label}</option>
                  ))}
                </select>
              </div>

              <Input label="Brand" {...register('brand')} placeholder="e.g. Omega, Rolex, Seiko, Tissot, Titan" />
              <Input label="Model Reference" {...register('model_number')} placeholder="e.g. Speedmaster 3861, PRX" />
              <Input label="Serial Number / Caseback #" {...register('serial_number')} placeholder="e.g. SN-89240182" />

              <div>
                <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Assign Horologist / Technician</label>
                <select 
                  {...register('assigned_technician')} 
                  className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-sm text-[#F3EFE6]"
                >
                  <option value="">Unassigned (Queue for bench)</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#171613]">{t.name} ({t.role})</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Reported Issue / Symptoms *</label>
                <textarea 
                  {...register('issue_description')} 
                  rows={2} 
                  className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-sm text-[#F3EFE6] resize-none" 
                  placeholder="Customer statement: e.g. losing 2 mins/day, amplitude low, crystal scratched, water ingress..." 
                />
                {errors.issue_description && <p className="text-rose-400 text-xs mt-1">{errors.issue_description.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Initial Diagnosis & Bench Notes</label>
                <textarea 
                  {...register('diagnosis_notes')} 
                  rows={2} 
                  className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-sm text-[#F3EFE6] resize-none" 
                  placeholder="Intake inspection: case condition, escapement check, crown resistance..." 
                />
              </div>
            </div>
          </div>

          {/* Charges & Target Delivery */}
          <div className="space-y-2 pt-2 border-t border-[#2A261F]">
            <span className="text-xs font-semibold text-[#C9A45C] uppercase tracking-wider block">3. Estimates & Target Delivery</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input label="Estimated Cost (₹)" type="number" {...register('estimated_cost')} placeholder="0" />
              <Input label="Advance Paid (₹)" type="number" {...register('advance_paid')} placeholder="0" />
              <Input label="Expected Delivery Date" type="date" {...register('expected_delivery')} />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#2A261F]">
            <Button type="button" variant="secondary" onClick={() => setShowFormModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} className="shadow-gold">
              Create Repair Ticket
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Repair Ticket Details Modal */}
      <Modal 
        isOpen={showViewModal} 
        onClose={() => setShowViewModal(false)} 
        title={`Repair Ticket: ${selectedRepair?.ticket_number}`}
        description="Atelier service dossier, horologist assignment, spare parts consumed, and QC verification"
        size="lg"
      >
        {selectedRepair && (
          <div className="space-y-5">
            {/* Status Progression Banner */}
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
                    <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Current Stage</span>
                    <div className="flex items-center gap-2">
                      <span className={clsx('text-base font-bold font-serif', statusConfig[selectedRepair.status]?.color)}>
                        {statusConfig[selectedRepair.status]?.label}
                      </span>
                      {selectedRepair.qc_passed && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          QC Passed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {selectedRepair.status !== 'delivered' && selectedRepair.status !== 'cancelled' && (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="secondary"
                      size="sm"
                      onClick={() => openStatusModal(selectedRepair, selectedRepair.status)}
                    >
                      Update Stage / Tech
                    </Button>
                    {statusConfig[selectedRepair.status]?.next && (
                      <Button 
                        size="sm" 
                        onClick={() => openStatusModal(selectedRepair, statusConfig[selectedRepair.status].next!)}
                        className="shadow-gold"
                      >
                        <ArrowRight className="w-3.5 h-3.5 mr-1" />
                        <span>Advance</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Customer & Timepiece Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#12110F] border border-[#2A261F] rounded-xl">
              <div>
                <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Customer</span>
                <p className="font-serif font-bold text-sm text-[#F3EFE6] mt-0.5 truncate">{selectedRepair.customer_name}</p>
                <p className="text-xs text-[#8D8980] font-mono mt-0.5">{selectedRepair.customer_phone || '-'}</p>
              </div>

              <div>
                <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Timepiece</span>
                <p className="text-sm font-semibold text-[#C9A45C] mt-0.5">{selectedRepair.brand || 'Watch'}</p>
                <p className="text-xs text-[#8D8980] truncate">{selectedRepair.model_number || selectedRepair.item_type}</p>
              </div>

              <div>
                <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Service Type</span>
                <p className="text-xs font-semibold text-[#E8D5A7] mt-0.5">{selectedRepair.service_type_display || selectedRepair.service_type}</p>
                <p className="text-[11px] font-mono text-[#8D8980] mt-0.5">
                  {selectedRepair.serial_number ? `SN: ${selectedRepair.serial_number}` : 'No serial logged'}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Assigned Horologist</span>
                <p className="text-xs font-medium text-[#F3EFE6] mt-0.5 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-[#C9A45C]" />
                  {selectedRepair.assigned_technician_name || 'Unassigned'}
                </p>
                <p className="text-[11px] font-mono text-emerald-400 mt-0.5">
                  Due: {formatDate(selectedRepair.expected_delivery)}
                </p>
              </div>
            </div>

            {/* Diagnostic Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#12110F] border border-[#2A261F] rounded-xl space-y-1">
                <span className="text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Reported Issue</span>
                <p className="text-xs text-[#F3EFE6] leading-relaxed">{selectedRepair.issue_description}</p>
              </div>
              <div className="p-3.5 bg-[#12110F] border border-[#2A261F] rounded-xl space-y-1">
                <span className="text-xs font-semibold text-[#C9A45C] uppercase tracking-wider">Bench & Diagnosis Notes</span>
                <p className="text-xs text-[#F3EFE6] leading-relaxed">{selectedRepair.diagnosis_notes || 'No bench inspection notes recorded yet.'}</p>
              </div>
            </div>

            {/* Workshop Spare Parts & Consumables Section */}
            <div className="p-4 bg-[#12110F] border border-[#2A261F] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#C9A45C]" />
                  <span className="text-xs font-semibold text-[#F3EFE6] uppercase tracking-wider">Spare Parts & Consumables Used</span>
                  {selectedRepair.parts_used && selectedRepair.parts_used.length > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1F1E1A] text-[#C9A45C] border border-[#2A261F]">
                      {selectedRepair.parts_used.length} parts
                    </span>
                  )}
                </div>
                {selectedRepair.status !== 'delivered' && selectedRepair.status !== 'cancelled' && (
                  <Button 
                    size="sm" 
                    variant="secondary"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => setShowAddPartModal(true)}
                  >
                    Add Spare Part
                  </Button>
                )}
              </div>

              {selectedRepair.parts_used && selectedRepair.parts_used.length > 0 ? (
                <div className="divide-y divide-[#2A261F] border border-[#2A261F] rounded-xl overflow-hidden bg-[#171613]">
                  {selectedRepair.parts_used.map((part) => (
                    <div key={part.id} className="p-3 flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-3">
                        <p className="font-semibold text-[#F3EFE6] truncate">{part.product_name}</p>
                        <p className="text-[11px] text-[#8D8980] font-mono">
                          {part.product_article_code ? `Code: ${part.product_article_code} | ` : ''}Qty: {part.quantity}
                          {part.notes ? ` (${part.notes})` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-mono font-bold text-[#C9A45C]">
                          {formatCurrency(part.total_charge)}
                        </span>
                        {selectedRepair.status !== 'delivered' && selectedRepair.status !== 'cancelled' && (
                          <button
                            onClick={() => handleRemoveSparePart(part.id)}
                            disabled={removingPartId === part.id}
                            className="p-1 text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                            title="Return part to stock"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="p-3 bg-[#12110F] flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#8D8980] uppercase tracking-wider">Total Spare Parts Charge</span>
                    <span className="font-mono font-bold text-sm text-[#C9A45C]">
                      {formatCurrency(selectedRepair.total_parts_charge || 0)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center border border-dashed border-[#2A261F] rounded-xl">
                  <p className="text-xs text-[#8D8980]">No spare parts or consumables logged on this repair ticket.</p>
                </div>
              )}
            </div>

            {/* Cost Summary */}
            <div className="grid grid-cols-4 gap-3 p-4 bg-[#12110F] border border-[#2A261F] rounded-xl text-center">
              <div>
                <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Estimated</span>
                <p className="font-mono font-bold text-sm text-[#8D8980] mt-1">{formatCurrency(selectedRepair.estimated_cost)}</p>
              </div>

              <div>
                <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Advance Paid</span>
                <p className="font-mono font-bold text-sm text-emerald-400 mt-1">{formatCurrency(selectedRepair.advance_paid)}</p>
              </div>

              <div>
                <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Final Charge</span>
                <p className="font-mono font-bold text-sm text-[#C9A45C] mt-1">
                  {formatCurrency(selectedRepair.repair_charge || selectedRepair.estimated_cost)}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Balance Due</span>
                <p className="font-mono font-bold text-base text-amber-400 mt-1">
                  {formatCurrency(selectedRepair.balance_due)}
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
                  <span>Send WhatsApp Update</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
                <Button 
                  onClick={() => downloadPDF(selectedRepair.id, selectedRepair.ticket_number)}
                  icon={<Download className="w-4 h-4" />}
                  loading={downloadingId === selectedRepair.id}
                  className="shadow-gold"
                >
                  Download Repair PDF
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Status Transition & Workshop Update Modal */}
      <Modal 
        isOpen={showStatusModal} 
        onClose={() => setShowStatusModal(false)} 
        title="Update Repair Lifecycle & Workshop Status"
        description="Advance the repair stage, assign horologists, record QC verification, and update charges"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Workshop Stage</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-sm text-[#F3EFE6]"
            >
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key} className="bg-[#171613]">
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Assigned Horologist</label>
              <select
                value={selectedTechId || ''}
                onChange={(e) => setSelectedTechId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-sm text-[#F3EFE6]"
              >
                <option value="">Unassigned</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#171613]">
                    {t.name} ({t.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Service Category</label>
              <select
                value={statusServiceType}
                onChange={(e) => setStatusServiceType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-sm text-[#F3EFE6]"
              >
                {serviceTypes.map((st) => (
                  <option key={st.value} value={st.value} className="bg-[#171613]">
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(newStatus === 'ready' || newStatus === 'delivered' || newStatus === 'in_repair') && (
            <Input
              label="Final Repair Charge (₹)"
              type="number"
              value={repairCharge}
              onChange={(e) => setRepairCharge(e.target.value)}
              placeholder="Enter final charge payable"
            />
          )}

          {/* Quality Control (QC) Passed Checkbox */}
          <div className="p-3 bg-[#12110F] border border-[#2A261F] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-semibold text-[#F3EFE6]">Quality Control (QC) Assurance</p>
                <p className="text-[11px] text-[#8D8980]">Timekeeping, power reserve, and water resistance verified</p>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={statusQcPassed}
              onChange={(e) => setStatusQcPassed(e.target.checked)}
              className="w-4 h-4 rounded border-[#2A261F] text-[#C9A45C] focus:ring-[#C9A45C] bg-[#171613] cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Technical & Bench Notes</label>
            <textarea
              value={statusDiagnosisNotes}
              onChange={(e) => setStatusDiagnosisNotes(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-xs text-[#F3EFE6] resize-none"
              placeholder="e.g. Demagnetized balance spring, replaced battery 377, lubricated rotor bearing..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Status Update Comments (Customer & Staff)</label>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-xs text-[#F3EFE6] resize-none"
              placeholder="e.g. Awaiting client quote approval via WhatsApp..."
            />
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-[#2A261F]">
            <Button variant="secondary" onClick={() => setShowStatusModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={updateStatus} loading={isSubmitting} className="flex-1 shadow-gold">
              Update Status
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Spare Part Modal */}
      <Modal
        isOpen={showAddPartModal}
        onClose={() => setShowAddPartModal(false)}
        title="Consume Spare Part from Catalog"
        description="Select inventory product or watchmaker spare to consume for this repair"
      >
        <form onSubmit={handleAddSparePart} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Select Catalog Product / Spare Part *</label>
            <select
              value={partProductId || ''}
              onChange={(e) => {
                const id = e.target.value ? parseInt(e.target.value) : null
                setPartProductId(id)
                if (id) {
                  const p = products.find(prod => prod.id === id)
                  if (p) {
                    setPartCharge(p.selling_price?.toString() || '0')
                  }
                }
              }}
              className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-sm text-[#F3EFE6]"
              required
            >
              <option value="">Select a part / consumable...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#171613]">
                  {p.name} {p.brand ? `(${p.brand})` : ''} - Stock: {p.stock} | ₹{p.selling_price}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Quantity</label>
              <input
                type="number"
                min={1}
                value={partQuantity}
                onChange={(e) => setPartQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-sm text-[#F3EFE6]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Charge to Customer (₹)</label>
              <input
                type="number"
                step="any"
                value={partCharge}
                onChange={(e) => setPartCharge(e.target.value)}
                placeholder="Defaults to product price"
                className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-sm text-[#F3EFE6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Notes (Optional)</label>
            <input
              type="text"
              value={partNotes}
              onChange={(e) => setPartNotes(e.target.value)}
              placeholder="e.g. Sapphire glass crystal replacement"
              className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-sm text-[#F3EFE6]"
            />
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-[#2A261F]">
            <Button type="button" variant="secondary" onClick={() => setShowAddPartModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={isAddingPart} className="flex-1 shadow-gold">
              Consume Part
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
