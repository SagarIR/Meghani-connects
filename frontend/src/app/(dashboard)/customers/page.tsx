'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, Users, Phone, Gift, Edit, Trash2, Eye, ShoppingCart, 
  Wrench, Mail, MapPin, Calendar, Award, Star, TrendingUp, History,
  LayoutGrid, List, MessageSquare, Send, Crown, Sparkles, Receipt,
  Clock, ShieldCheck
} from 'lucide-react'
import { api } from '@/services/api'
import { Customer, Sale, Repair } from '@/types'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Modal, { ConfirmModal } from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import SortableHeader, { SortDirection } from '@/components/ui/SortableHeader'
import ExportButton from '@/components/ui/ExportButton'
import { customerExportColumns } from '@/utils/export'
import { useDebounce } from '@/hooks/useDebounce'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const schema = yup.object({
  name: yup.string().required('Client full name is required'),
  phone: yup.string().required('Phone number is required').min(10, 'Valid 10-digit phone required'),
  email: yup.string().email('Invalid email address').nullable(),
  address: yup.string().nullable(),
  date_of_birth: yup.string().nullable(),
  language_preference: yup.string().default('en'),
  notes: yup.string().nullable(),
})

type FormData = yup.InferType<typeof schema>

const languages = [
  { value: 'en', label: 'English' },
  { value: 'gu', label: 'Gujarati (ગુજરાતી)' },
  { value: 'hi', label: 'Hindi (हिंदी)' },
]

const getLoyaltyTier = (points: number) => {
  if (points >= 5000) return { 
    tier: 'Platinum Connoisseur', 
    color: 'text-[#E8D5A7]', 
    bg: 'bg-[#C9A45C]/15', 
    border: 'border-[#C9A45C]/40',
    icon: Crown 
  }
  if (points >= 2000) return { 
    tier: 'Gold Patron', 
    color: 'text-[#C9A45C]', 
    bg: 'bg-amber-950/30', 
    border: 'border-amber-800/40',
    icon: Star 
  }
  if (points >= 500) return { 
    tier: 'Silver Member', 
    color: 'text-[#F3EFE6]', 
    bg: 'bg-[#1F1E1A]', 
    border: 'border-[#2A261F]',
    icon: Award 
  }
  return { 
    tier: 'Bronze Member', 
    color: 'text-[#8D8980]', 
    bg: 'bg-[#12110F]', 
    border: 'border-[#2A261F]',
    icon: Gift 
  }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  
  // Sorting state
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  // Debounce search
  const debouncedSearch = useDebounce(search, 300)
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Customer details
  const [purchases, setPurchases] = useState<Sale[]>([])
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [detailTab, setDetailTab] = useState<'info' | 'purchases' | 'repairs'>('info')
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { language_preference: 'en' }
  })

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, sortField, sortDirection])

  useEffect(() => {
    fetchCustomers()
  }, [debouncedSearch, currentPage, pageSize, sortField, sortDirection])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)
      params.append('page', currentPage.toString())
      params.append('page_size', pageSize.toString())
      
      if (sortField && sortDirection) {
        const ordering = sortDirection === 'desc' ? `-${sortField}` : sortField
        params.append('ordering', ordering)
      }
      
      const response = await api.get(`/customers/?${params.toString()}`)
      const data = response.data
      
      if (data.results) {
        setCustomers(data.results)
        setTotalItems(data.count || 0)
        setTotalPages(Math.ceil((data.count || 0) / pageSize))
      } else {
        setCustomers(data)
        setTotalItems(data.length)
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
      toast.error('Failed to load clientele roster')
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

  const openAddModal = () => {
    setSelectedCustomer(null)
    reset({ language_preference: 'en', name: '', phone: '', email: '', address: '', date_of_birth: '', notes: '' })
    setShowFormModal(true)
  }

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    reset({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      date_of_birth: customer.date_of_birth || '',
      language_preference: customer.language_preference || 'en',
      notes: customer.notes || ''
    })
    setShowFormModal(true)
  }

  const openViewModal = async (customer: Customer) => {
    setSelectedCustomer(customer)
    setDetailTab('info')
    setShowViewModal(true)
    setLoadingDetails(true)
    
    try {
      const [purchasesRes, repairsRes] = await Promise.all([
        api.get(`/customers/${customer.id}/purchases/`).catch(() => ({ data: [] })),
        api.get(`/customers/${customer.id}/repairs/`).catch(() => ({ data: [] })),
      ])
      setPurchases(purchasesRes.data || [])
      setRepairs(repairsRes.data || [])
    } catch (error) {
      console.error('Failed to load customer details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const openDeleteModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowDeleteModal(true)
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      if (selectedCustomer) {
        await api.patch(`/customers/${selectedCustomer.id}/`, data)
        toast.success('Client profile updated')
      } else {
        await api.post('/customers/', data)
        toast.success('New client registered in boutique CRM')
      }
      setShowFormModal(false)
      fetchCustomers()
    } catch (error: any) {
      if (error.response?.data?.phone) {
        toast.error('Mobile number already assigned to an existing client')
      } else {
        toast.error(error.response?.data?.detail || 'Operation failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedCustomer) return
    try {
      await api.delete(`/customers/${selectedCustomer.id}/`)
      toast.success('Client record archived')
      setShowDeleteModal(false)
      fetchCustomers()
    } catch (error) {
      toast.error('Failed to delete customer')
    }
  }

  const openWhatsApp = (phone?: string, name?: string) => {
    if (!phone) {
      toast.error('Phone number not available')
      return
    }
    const cleanPhone = phone.replace(/\D/g, '')
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
    const msg = encodeURIComponent(
      `Hello ${name || 'Valued Client'},\nGreetings from Meghani Watch Co. (Est. 1984), Vadodara.`
    )
    window.open(`https://wa.me/${phoneWithCountry}?text=${msg}`, '_blank')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Summary Metrics
  const stats = useMemo(() => ({
    total: totalItems || customers.length,
    totalPurchases: customers.reduce((sum, c) => sum + (c.total_purchases || 0), 0),
    totalPoints: customers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0),
    platinum: customers.filter(c => (c.loyalty_points || 0) >= 5000).length,
  }), [customers, totalItems])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#171613] border border-[#2A261F] rounded-xl flex items-center justify-center shadow-md">
            <Users className="w-5 h-5 text-[#C9A45C]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-serif font-bold text-[#F3EFE6] tracking-tight">Clientele CRM & VIP Concierge</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F1E1A] text-[#C9A45C] border border-[#2A261F] font-mono">
                {stats.total} patrons
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8D8980]">Client directories, purchase histories, and luxury loyalty tier programs</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <ExportButton 
            data={customers} 
            columns={customerExportColumns} 
            filename={`meghani_clientele_${new Date().toISOString().split('T')[0]}`} 
          />
          <Button onClick={openAddModal} icon={<Plus className="w-4 h-4" />} className="shadow-gold">
            <span>Register New Client</span>
          </Button>
        </div>
      </div>

      {/* CRM Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1F1E1A] border border-[#2A261F] flex items-center justify-center text-[#C9A45C]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#8D8980] uppercase tracking-wider">Total Clientele</p>
              <p className="text-2xl font-bold font-mono text-[#F3EFE6]">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#8D8980] uppercase tracking-wider">Cumulative Spend</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                {formatCurrency(stats.totalPurchases)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-800/40 flex items-center justify-center text-[#C9A45C]">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#8D8980] uppercase tracking-wider">Loyalty Escrow</p>
              <p className="text-2xl font-bold font-mono text-[#C9A45C]">{stats.totalPoints.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9A45C]/15 border border-[#C9A45C]/40 flex items-center justify-center text-[#E8D5A7]">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#8D8980] uppercase tracking-wider">Platinum Tier</p>
              <p className="text-2xl font-bold font-mono text-[#E8D5A7]">{stats.platinum} VIPs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Layout Toggles */}
      <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D8980] group-focus-within:text-[#C9A45C] transition-colors" />
            <input
              type="text"
              placeholder="Search clientele by name, phone number, email or loyalty rank..."
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
      </div>

      {/* Customers Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[#171613] rounded-2xl border border-[#2A261F] p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#1F1E1A]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#1F1E1A] rounded w-28" />
                  <div className="h-3 bg-[#1F1E1A] rounded w-20" />
                </div>
              </div>
              <div className="h-16 bg-[#1F1E1A] rounded-xl" />
            </div>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-12 text-center shadow-xl">
          <div className="w-16 h-16 mx-auto bg-[#1F1E1A] border border-[#2A261F] rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-[#8D8980]" />
          </div>
          <h3 className="text-lg font-serif font-bold text-[#F3EFE6] mb-1">No Patrons Found</h3>
          <p className="text-sm text-[#8D8980] mb-5">Start by adding your first client into the Meghani CRM roster.</p>
          <Button onClick={openAddModal} icon={<Plus className="w-4 h-4" />}>
            Register First Client
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {customers.map((customer, index) => {
              const loyalty = getLoyaltyTier(customer.loyalty_points || 0)
              const LoyaltyIcon = loyalty.icon
              
              return (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  className="group bg-[#171613] rounded-2xl border border-[#2A261F] hover:border-[#C9A45C]/50 shadow-xl transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5">
                    {/* Header with Avatar and Tier */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-[#1F1E1A] border border-[#2A261F] flex items-center justify-center font-serif font-bold text-lg text-[#C9A45C] flex-shrink-0">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-serif font-bold text-base text-[#F3EFE6] truncate group-hover:text-[#E8D5A7] transition-colors">
                            {customer.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border', loyalty.bg, loyalty.color, loyalty.border)}>
                              <LoyaltyIcon className="w-2.5 h-2.5" />
                              <span>{loyalty.tier}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openWhatsApp(customer.phone, customer.name)}
                          className="p-1.5 hover:bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 rounded-lg transition-colors"
                          title="WhatsApp Chat"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-1.5 mb-4 text-xs">
                      <div className="flex items-center gap-2 text-[#8D8980]">
                        <Phone className="w-3.5 h-3.5 text-[#C9A45C] flex-shrink-0" />
                        <span className="font-mono text-[#F3EFE6]">{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2 text-[#8D8980]">
                          <Mail className="w-3.5 h-3.5 text-[#8D8980] flex-shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Financial & Loyalty Strip */}
                    <div className="p-3 bg-[#12110F] border border-[#2A261F] rounded-xl grid grid-cols-2 gap-2 text-center">
                      <div>
                        <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Total Spent</span>
                        <p className="font-mono font-bold text-sm text-[#F3EFE6] mt-0.5">
                          {formatCurrency(customer.total_purchases || 0)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Loyalty Points</span>
                        <p className="font-mono font-bold text-sm text-[#C9A45C] mt-0.5">
                          {(customer.loyalty_points || 0).toLocaleString()} pts
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 pb-4 pt-1 flex items-center gap-2 border-t border-[#2A261F]/60">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => openViewModal(customer)}
                      className="flex-1"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" /> Dossier
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => openEditModal(customer)}
                      className="flex-1"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <button
                      onClick={() => openDeleteModal(customer)}
                      className="p-2 text-[#8D8980] hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors border border-[#2A261F]"
                      title="Archive Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* Ledger Table View */
        <div className="bg-[#171613] rounded-2xl border border-[#2A261F] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead className="bg-[#12110F] border-b border-[#2A261F]">
                <tr>
                  <th className="px-5 py-3.5 text-left">
                    <SortableHeader label="Client Full Name" field="name" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Contact & Phone</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">VIP Loyalty Tier</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Total Purchases</th>
                  <th className="px-4 py-3.5 text-right">
                    <SortableHeader label="Points" field="loyalty_points" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A261F]">
                {customers.map((customer, index) => {
                  const loyalty = getLoyaltyTier(customer.loyalty_points || 0)
                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-[#1F1E1A] transition-colors cursor-pointer"
                      onClick={() => openViewModal(customer)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#12110F] border border-[#2A261F] flex items-center justify-center font-serif font-bold text-xs text-[#C9A45C]">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-serif font-bold text-sm text-[#F3EFE6]">{customer.name}</p>
                            <p className="text-[11px] text-[#8D8980] font-mono">Member #{customer.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-sm font-mono text-[#F3EFE6]">{customer.phone}</p>
                        {customer.email && <p className="text-xs text-[#8D8980]">{customer.email}</p>}
                      </td>

                      <td className="px-4 py-4">
                        <span className={clsx('text-xs font-medium px-2.5 py-1 rounded-full inline-block border', loyalty.bg, loyalty.color, loyalty.border)}>
                          {loyalty.tier}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right font-mono font-bold text-sm text-[#F3EFE6]">
                        {formatCurrency(customer.total_purchases || 0)}
                      </td>

                      <td className="px-4 py-4 text-right font-mono font-bold text-sm text-[#C9A45C]">
                        {(customer.loyalty_points || 0).toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openWhatsApp(customer.phone, customer.name)}
                            className="p-1.5 hover:bg-emerald-950/40 text-emerald-400 rounded-lg transition-colors"
                            title="WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => openViewModal(customer)}
                            className="p-1.5 hover:bg-[#2A261F] text-[#8D8980] hover:text-[#F3EFE6] rounded-lg transition-colors"
                            title="Inspect Dossier"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openEditModal(customer)}
                            className="p-1.5 hover:bg-[#C9A45C]/15 text-[#C9A45C] rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(customer)}
                            className="p-1.5 hover:bg-rose-950/40 text-rose-400 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
      {!loading && customers.length > 0 && (
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

      {/* Add / Edit Client Modal */}
      <Modal 
        isOpen={showFormModal} 
        onClose={() => setShowFormModal(false)} 
        title={selectedCustomer ? 'Update Client Dossier' : 'Register New Boutique Client'}
        description={selectedCustomer ? `Editing CRM profile for ${selectedCustomer.name}` : 'Create a dedicated VIP customer record in the Meghani boutique roster'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input 
            label="Client Full Name *" 
            placeholder="e.g. Dr. Rajesh Meghani" 
            {...register('name')} 
            error={errors.name?.message} 
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input 
              label="Mobile Phone *" 
              placeholder="e.g. 98250XXXXX" 
              {...register('phone')} 
              error={errors.phone?.message} 
            />
            <Input 
              label="Email Address" 
              type="email"
              placeholder="client@domain.com" 
              {...register('email')} 
              error={errors.email?.message} 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input 
              label="Date of Birth / Anniversary" 
              type="date"
              {...register('date_of_birth')} 
            />
            <div>
              <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Language Preference</label>
              <select
                {...register('language_preference')}
                className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-xs text-[#F3EFE6]"
              >
                {languages.map((l) => (
                  <option key={l.value} value={l.value} className="bg-[#171613]">{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Residential / Boutique Delivery Address</label>
            <textarea
              {...register('address')}
              rows={2}
              className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-xs text-[#F3EFE6] resize-none"
              placeholder="Street, locality, city, pincode..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">VIP Notes & Horological Preferences</label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-xs text-[#F3EFE6] resize-none"
              placeholder="Collector of Swiss chronographs, prefers 38-40mm case sizes, gold dials..."
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#2A261F]">
            <Button type="button" variant="secondary" onClick={() => setShowFormModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} className="shadow-gold">
              {selectedCustomer ? 'Save Changes' : 'Register Client'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Client Profile Dossier Modal */}
      <Modal 
        isOpen={showViewModal} 
        onClose={() => setShowViewModal(false)} 
        title="Patron Dossier & Concierge Summary"
        description="Comprehensive client purchase record, atelier service history, and loyalty awards"
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-5">
            {/* Patron Profile Header */}
            <div className="p-4 bg-[#12110F] border border-[#2A261F] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-[#171613] border border-[#2A261F] flex items-center justify-center font-serif font-bold text-xl text-[#C9A45C]">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#F3EFE6]">{selectedCustomer.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const loyalty = getLoyaltyTier(selectedCustomer.loyalty_points || 0)
                      return (
                        <span className={clsx('text-xs font-semibold px-2.5 py-0.5 rounded-full border', loyalty.bg, loyalty.color, loyalty.border)}>
                          {loyalty.tier}
                        </span>
                      )
                    })()}
                    <span className="text-xs text-[#8D8980] font-mono">Mobile: {selectedCustomer.phone}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => openWhatsApp(selectedCustomer.phone, selectedCustomer.name)}
                  className="bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/50"
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  <span>WhatsApp Concierge</span>
                </Button>
              </div>
            </div>

            {/* Tabs Selector */}
            <div className="flex items-center gap-1.5 p-1 bg-[#12110F] border border-[#2A261F] rounded-xl text-xs font-semibold">
              <button
                onClick={() => setDetailTab('info')}
                className={clsx(
                  'flex-1 py-2 px-3 rounded-lg transition-all',
                  detailTab === 'info'
                    ? 'bg-[#C9A45C] text-[#0B0B0A] shadow-md font-bold'
                    : 'text-[#8D8980] hover:text-[#F3EFE6]'
                )}
              >
                1. General Profile
              </button>
              <button
                onClick={() => setDetailTab('purchases')}
                className={clsx(
                  'flex-1 py-2 px-3 rounded-lg transition-all',
                  detailTab === 'purchases'
                    ? 'bg-[#C9A45C] text-[#0B0B0A] shadow-md font-bold'
                    : 'text-[#8D8980] hover:text-[#F3EFE6]'
                )}
              >
                2. Purchase Invoices ({purchases.length})
              </button>
              <button
                onClick={() => setDetailTab('repairs')}
                className={clsx(
                  'flex-1 py-2 px-3 rounded-lg transition-all',
                  detailTab === 'repairs'
                    ? 'bg-[#C9A45C] text-[#0B0B0A] shadow-md font-bold'
                    : 'text-[#8D8980] hover:text-[#F3EFE6]'
                )}
              >
                3. Atelier Tickets ({repairs.length})
              </button>
            </div>

            {/* TAB 1: Info */}
            {detailTab === 'info' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#12110F] border border-[#2A261F] rounded-xl text-center">
                  <div>
                    <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Total Lifetime Spend</span>
                    <p className="font-mono font-bold text-base text-[#F3EFE6] mt-0.5">
                      {formatCurrency(selectedCustomer.total_purchases || 0)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Available Rewards</span>
                    <p className="font-mono font-bold text-base text-[#C9A45C] mt-0.5">
                      {(selectedCustomer.loyalty_points || 0).toLocaleString()} pts
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Member Since</span>
                    <p className="font-mono text-xs text-[#F3EFE6] mt-1">
                      {formatDate(selectedCustomer.created_at)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Date of Birth</span>
                    <p className="font-mono text-xs text-[#F3EFE6] mt-1">
                      {selectedCustomer.date_of_birth ? formatDate(selectedCustomer.date_of_birth) : 'Not specified'}
                    </p>
                  </div>
                </div>

                {selectedCustomer.address && (
                  <div className="p-3 bg-[#12110F] border border-[#2A261F] rounded-xl">
                    <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block mb-1">Registered Address</span>
                    <p className="text-xs text-[#F3EFE6]">{selectedCustomer.address}</p>
                  </div>
                )}

                {selectedCustomer.notes && (
                  <div className="p-3 bg-[#12110F] border border-[#2A261F] rounded-xl">
                    <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block mb-1">Concierge & Horological Notes</span>
                    <p className="text-xs text-[#F3EFE6] leading-relaxed">{selectedCustomer.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Purchases */}
            {detailTab === 'purchases' && (
              <div className="space-y-3">
                {purchases.length === 0 ? (
                  <div className="p-8 text-center bg-[#12110F] border border-[#2A261F] rounded-xl">
                    <Receipt className="w-8 h-8 text-[#8D8980] mx-auto mb-2" />
                    <p className="text-xs text-[#8D8980]">No purchase invoices on record for this client yet.</p>
                  </div>
                ) : (
                  <div className="border border-[#2A261F] rounded-xl overflow-hidden bg-[#12110F]">
                    <table className="w-full text-xs">
                      <thead className="bg-[#171613] border-b border-[#2A261F] text-[#8D8980]">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-medium">Invoice #</th>
                          <th className="px-4 py-2.5 text-left font-medium">Date</th>
                          <th className="px-4 py-2.5 text-left font-medium">Tender</th>
                          <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2A261F]">
                        {purchases.map((sale: any) => (
                          <tr key={sale.id} className="hover:bg-[#1F1E1A]/40">
                            <td className="px-4 py-2.5 font-mono font-bold text-[#C9A45C]">{sale.invoice_number}</td>
                            <td className="px-4 py-2.5 text-[#8D8980] font-mono">{formatDate(sale.sale_date)}</td>
                            <td className="px-4 py-2.5 uppercase text-[11px] text-[#E8D5A7]">{sale.payment_mode}</td>
                            <td className="px-4 py-2.5 text-right font-mono font-bold text-[#F3EFE6]">{formatCurrency(sale.total_amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Repairs */}
            {detailTab === 'repairs' && (
              <div className="space-y-3">
                {repairs.length === 0 ? (
                  <div className="p-8 text-center bg-[#12110F] border border-[#2A261F] rounded-xl">
                    <Wrench className="w-8 h-8 text-[#8D8980] mx-auto mb-2" />
                    <p className="text-xs text-[#8D8980]">No atelier restoration tickets on record for this client.</p>
                  </div>
                ) : (
                  <div className="border border-[#2A261F] rounded-xl overflow-hidden bg-[#12110F]">
                    <table className="w-full text-xs">
                      <thead className="bg-[#171613] border-b border-[#2A261F] text-[#8D8980]">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-medium">Ticket #</th>
                          <th className="px-4 py-2.5 text-left font-medium">Article</th>
                          <th className="px-4 py-2.5 text-left font-medium">Status</th>
                          <th className="px-4 py-2.5 text-right font-medium">Charge</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2A261F]">
                        {repairs.map((rep: any) => (
                          <tr key={rep.id} className="hover:bg-[#1F1E1A]/40">
                            <td className="px-4 py-2.5 font-mono font-bold text-[#C9A45C]">{rep.ticket_number}</td>
                            <td className="px-4 py-2.5 text-[#F3EFE6]">{rep.brand || ''} {rep.item_type}</td>
                            <td className="px-4 py-2.5 uppercase text-[10px] text-[#E8D5A7] font-semibold">{rep.status}</td>
                            <td className="px-4 py-2.5 text-right font-mono font-bold text-[#F3EFE6]">
                              {formatCurrency(rep.repair_charge || rep.estimated_cost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#2A261F]">
              <Button variant="secondary" onClick={() => setShowViewModal(false)}>
                Dismiss
              </Button>
              <Button onClick={() => { setShowViewModal(false); openEditModal(selectedCustomer); }}>
                <Edit className="w-4 h-4 mr-1.5" />
                Edit Profile
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Archive Client Profile"
        message={`Are you certain you wish to archive the profile for "${selectedCustomer?.name}"? All transaction associations will remain permanently locked.`}
        confirmText="Archive Client"
        variant="danger"
      />
    </div>
  )
}
