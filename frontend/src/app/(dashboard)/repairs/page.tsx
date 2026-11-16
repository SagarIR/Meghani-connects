'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, Wrench, Eye, CheckCircle, XCircle, Download, Clock, 
  Phone, User, Calendar, AlertTriangle, Package, IndianRupee, ArrowRight,
  Filter, MoreHorizontal, Timer, Truck, LayoutGrid, List
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

const statusConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'success' | 'info' | 'danger'; next: string | null; icon: any; color: string; bg: string }> = {
  received: { label: 'Received', variant: 'default', next: 'in_repair', icon: Package, color: 'text-gray-600', bg: 'bg-gray-100' },
  in_repair: { label: 'In Repair', variant: 'warning', next: 'ready', icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-100' },
  ready: { label: 'Ready for Pickup', variant: 'success', next: 'delivered', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  delivered: { label: 'Delivered', variant: 'info', next: null, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-100' },
  cancelled: { label: 'Cancelled', variant: 'danger', next: null, icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
}

const itemTypes = ['Wrist Watch', 'Wall Clock', 'Table Clock', 'Smart Watch', 'Pocket Watch', 'Other']

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
      toast.error('Failed to load repairs')
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
      toast.error('Please select or add a customer')
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
      toast.success('Repair job created')
      setShowFormModal(false)
      fetchRepairs()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Operation failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const downloadPDF = async (repairId: number, ticketNumber: string) => {
    try {
      const response = await api.get(`/repairs/${repairId}/invoice/pdf/`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `repair_${ticketNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Failed to download PDF')
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
      toast.success('Status updated')
      setShowStatusModal(false)
      setShowViewModal(false)
      fetchRepairs()
    } catch (error) {
      toast.error('Failed to update status')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Stats
  const stats = {
    total: repairs.length,
    pending: repairs.filter(r => r.status === 'received' || r.status === 'in_repair').length,
    ready: repairs.filter(r => r.status === 'ready').length,
    completed: repairs.filter(r => r.status === 'delivered').length,
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Repair Jobs
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Track and manage repair tickets</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 sm:gap-3"
        >
          <ExportButton 
            data={repairs} 
            columns={repairExportColumns} 
            filename={`repairs_${new Date().toISOString().split('T')[0]}`}
          />
          <Button onClick={openAddModal} icon={<Plus className="w-4 h-4" />} className="flex-1 sm:flex-none">
            <span className="hidden sm:inline">New Repair</span>
            <span className="sm:hidden">New</span>
          </Button>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Total Jobs</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Timer className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">In Progress</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Ready</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.ready}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Delivered</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm"
      >
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ticket, customer, item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm sm:text-base"
              />
            </div>
            <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={clsx(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'grid' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={clsx(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'table' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {Object.entries(statusConfig).slice(0, 4).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
                className={clsx(
                  'px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0',
                  statusFilter === key
                    ? `${config.bg} ${config.color}`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Repairs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 animate-pulse">
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 sm:h-5 bg-gray-200 rounded w-24 mb-2" />
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-32" />
                </div>
              </div>
              <div className="h-16 sm:h-20 bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
      ) : repairs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-12 sm:py-16 px-4"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Wrench className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No repair jobs</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-6">Create your first repair ticket to get started</p>
          <Button onClick={openAddModal} icon={<Plus className="w-4 h-4" />}>
            New Repair Job
          </Button>
        </motion.div>
      ) : viewMode === 'grid' ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
        >
          <AnimatePresence mode="popLayout">
            {repairs.map((repair, index) => {
              const config = statusConfig[repair.status]
              const StatusIcon = config.icon
              
              return (
                <motion.div
                  key={repair.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => openViewModal(repair)}
                  className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-primary-200 transition-all cursor-pointer overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={clsx('w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0', config.bg)}>
                          <StatusIcon className={clsx('w-5 h-5 sm:w-6 sm:h-6', config.color)} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm sm:text-base text-primary-600 group-hover:text-primary-700 truncate">{repair.ticket_number}</p>
                          <span className={clsx('text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full inline-block', config.bg, config.color)}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                      <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      </button>
                    </div>

                    {/* Customer & Item */}
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate">{repair.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{repair.item_type}</span>
                        {repair.brand && <span className="text-gray-400 hidden sm:inline">| {repair.brand}</span>}
                      </div>
                    </div>

                    {/* Issue preview */}
                    <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{repair.issue_description}</p>
                    </div>

                    {/* Footer */}
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>{formatDate(repair.received_date)}</span>
                      </div>
                      {repair.estimated_cost && (
                        <span className="font-medium text-gray-900">{formatCurrency(repair.estimated_cost)}</span>
                      )}
                    </div>
                  </div>

                  {/* Progress indicator */}
                  <div className="h-1 bg-gray-100">
                    <div 
                      className={clsx(
                        'h-full transition-all',
                        repair.status === 'received' && 'w-1/4 bg-gray-400',
                        repair.status === 'in_repair' && 'w-1/2 bg-orange-500',
                        repair.status === 'ready' && 'w-3/4 bg-green-500',
                        repair.status === 'delivered' && 'w-full bg-blue-500',
                        repair.status === 'cancelled' && 'w-full bg-red-500',
                      )}
                    />
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* Table View */
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <SortableHeader label="Ticket" field="ticket_number" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left">
                    <SortableHeader label="Item" field="item_type" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <SortableHeader label="Status" field="status" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <SortableHeader label="Date" field="received_date" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <SortableHeader label="Cost" field="estimated_cost" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {repairs.map((repair, index) => {
                  const config = statusConfig[repair.status]
                  const StatusIcon = config.icon
                  return (
                    <motion.tr
                      key={repair.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => openViewModal(repair)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-bold text-sm text-primary-600">{repair.ticket_number}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {repair.customer_name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate max-w-[120px]">{repair.customer_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">{repair.item_type}</p>
                        {repair.brand && <p className="text-xs text-gray-500">{repair.brand}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('text-xs font-medium px-2 py-1 rounded-full inline-flex items-center gap-1', config.bg, config.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">{formatDate(repair.received_date)}</p>
                        {repair.expected_delivery && (
                          <p className="text-xs text-gray-400">Due: {formatDate(repair.expected_delivery)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {repair.estimated_cost ? (
                          <p className="font-semibold text-sm text-gray-900">{formatCurrency(repair.estimated_cost)}</p>
                        ) : (
                          <p className="text-sm text-gray-400">-</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={(e) => { e.stopPropagation(); openViewModal(repair) }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                          {config.next && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); openStatusModal(repair, config.next!) }} 
                              className="p-1.5 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                              <ArrowRight className="w-4 h-4 text-primary-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Pagination */}
      {!loading && repairs.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl border border-gray-100 shadow-sm"
        >
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </motion.div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)} title="New Repair Job" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          {/* Customer Selection */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <User className="w-4 h-4 text-gray-500" /> Customer
            </h4>
            {selectedCustomer ? (
              <div className="p-3 sm:p-4 bg-primary-50 rounded-xl flex items-center justify-between border border-primary-100">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{selectedCustomer.name}</p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>Change</Button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => searchCustomers(e.target.value)}
                    placeholder="Search existing customer..."
                    className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm sm:text-base"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => selectCustomer(customer)}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-gray-50 flex items-center gap-2 sm:gap-3"
                        >
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 rounded-lg flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">
                            {customer.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{customer.name}</p>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">{customer.phone}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs sm:text-sm text-gray-500">or add new customer</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Input label="Customer Name" {...register('customer_name')} placeholder="Full name" icon={<User className="w-4 h-4" />} />
                  <Input label="Phone Number" {...register('customer_phone')} placeholder="+91 XXXXXXXXXX" icon={<Phone className="w-4 h-4" />} />
                </div>
              </div>
            )}
          </div>

          {/* Item Details */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <Wrench className="w-4 h-4 text-gray-500" /> Item Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Item Type *</label>
                <select {...register('item_type')} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm sm:text-base">
                  <option value="">Select type...</option>
                  {itemTypes.map((type) => (<option key={type} value={type}>{type}</option>))}
                </select>
                {errors.item_type && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.item_type.message}</p>}
              </div>
              <Input label="Brand" {...register('brand')} icon={<Package className="w-4 h-4" />} />
              <Input label="Model Number" {...register('model_number')} />
              <Input label="Serial Number" {...register('serial_number')} />
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Issue Description *</label>
                <textarea 
                  {...register('issue_description')} 
                  rows={3} 
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm sm:text-base" 
                  placeholder="Describe the problem in detail..." 
                />
                {errors.issue_description && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.issue_description.message}</p>}
              </div>
            </div>
          </div>

          {/* Charges */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <IndianRupee className="w-4 h-4 text-gray-500" /> Charges & Schedule
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Input label="Estimated Cost (INR)" type="number" {...register('estimated_cost')} icon={<IndianRupee className="w-4 h-4" />} />
              <Input label="Advance Paid (INR)" type="number" {...register('advance_paid')} icon={<IndianRupee className="w-4 h-4" />} />
              <Input label="Expected Delivery" type="date" {...register('expected_delivery')} icon={<Calendar className="w-4 h-4" />} />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-5 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setShowFormModal(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">Create Repair Ticket</Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={selectedRepair?.ticket_number || ''} size="lg">
        {selectedRepair && (
          <div className="space-y-4 sm:space-y-6">
            {/* Status Bar */}
            <div className={clsx('p-4 sm:p-5 rounded-xl', statusConfig[selectedRepair.status]?.bg)}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  {(() => {
                    const config = statusConfig[selectedRepair.status]
                    const Icon = config.icon
                    return (
                      <>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                          <Icon className={clsx('w-5 h-5 sm:w-6 sm:h-6', config.color)} />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Current Status</p>
                          <p className={clsx('text-base sm:text-lg font-bold', config.color)}>{config.label}</p>
                        </div>
                      </>
                    )
                  })()}
                </div>
                {selectedRepair.status !== 'delivered' && selectedRepair.status !== 'cancelled' && (
                  <div className="flex gap-2">
                    {statusConfig[selectedRepair.status]?.next && (
                      <Button size="sm" onClick={() => openStatusModal(selectedRepair, statusConfig[selectedRepair.status].next!)} className="flex-1 sm:flex-none">
                        <ArrowRight className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">{statusConfig[statusConfig[selectedRepair.status].next!]?.label}</span>
                        <span className="sm:hidden">Next</span>
                      </Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => openStatusModal(selectedRepair, 'cancelled')}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Customer</p>
                <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{selectedRepair.customer_name}</p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Phone</p>
                <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{selectedRepair.customer_phone}</p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Item Type</p>
                <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{selectedRepair.item_type}</p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Brand</p>
                <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{selectedRepair.brand || '-'}</p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Received</p>
                <p className="font-medium text-gray-900 text-sm sm:text-base">{formatDate(selectedRepair.received_date)}</p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Delivery</p>
                <p className="font-medium text-gray-900 text-sm sm:text-base">{formatDate(selectedRepair.expected_delivery)}</p>
              </div>
            </div>

            {/* Charges */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="p-3 sm:p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Estimated</p>
                <p className="text-base sm:text-xl font-bold text-gray-700">{formatCurrency(selectedRepair.estimated_cost)}</p>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 rounded-xl text-center">
                <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Final</p>
                <p className="text-base sm:text-xl font-bold text-green-600">{formatCurrency(selectedRepair.repair_charge)}</p>
              </div>
              <div className="p-3 sm:p-4 bg-blue-50 rounded-xl text-center">
                <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Advance</p>
                <p className="text-base sm:text-xl font-bold text-blue-600">{formatCurrency(selectedRepair.advance_paid)}</p>
              </div>
            </div>

            {/* Issue */}
            <div className="p-3 sm:p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-[10px] sm:text-xs text-amber-700 mb-0.5 sm:mb-1 font-medium">Issue Description</p>
              <p className="text-gray-900 text-sm sm:text-base">{selectedRepair.issue_description}</p>
            </div>

            {selectedRepair.notes && (
              <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Notes</p>
                <p className="text-xs sm:text-sm text-gray-600 whitespace-pre-wrap">{selectedRepair.notes}</p>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-5 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowViewModal(false)} className="w-full sm:w-auto">Close</Button>
              <Button onClick={() => downloadPDF(selectedRepair.id, selectedRepair.ticket_number)} className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Status Update Modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Update Status">
        <div className="space-y-4 sm:space-y-5">
          <div className={clsx('p-3 sm:p-4 rounded-xl', statusConfig[newStatus]?.bg)}>
            <p className="text-xs sm:text-sm text-gray-600">Updating to</p>
            <p className={clsx('text-base sm:text-lg font-bold', statusConfig[newStatus]?.color)}>{statusConfig[newStatus]?.label}</p>
          </div>

          {(newStatus === 'ready' || newStatus === 'delivered') && (
            <Input
              label="Final Repair Charge (INR)"
              type="number"
              value={repairCharge}
              onChange={(e) => setRepairCharge(e.target.value)}
              icon={<IndianRupee className="w-4 h-4" />}
              placeholder="Enter final charge"
            />
          )}

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Notes (Optional)</label>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              rows={3}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm sm:text-base"
              placeholder="Add any notes about this update..."
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
            <Button variant="secondary" onClick={() => setShowStatusModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={updateStatus} isLoading={isSubmitting} className="flex-1">Update Status</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
