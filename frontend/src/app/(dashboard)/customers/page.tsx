'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, Users, Phone, Gift, Edit, Trash2, Eye, ShoppingCart, 
  Wrench, Mail, MapPin, Calendar, Award, Star, TrendingUp, History,
  LayoutGrid, List
} from 'lucide-react'
import { api } from '@/services/api'
import { Customer, Sale, Repair } from '@/types'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import SortableHeader, { SortDirection } from '@/components/ui/SortableHeader'
import ExportButton from '@/components/ui/ExportButton'
import { customerExportColumns } from '@/utils/export'
import { useDebounce } from '@/hooks/useDebounce'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const schema = yup.object({
  name: yup.string().required('Customer name is required'),
  phone: yup.string().required('Phone number is required').min(10, 'Invalid phone number'),
  email: yup.string().email('Invalid email').nullable(),
  address: yup.string().nullable(),
  date_of_birth: yup.string().nullable(),
  language_preference: yup.string().default('en'),
  notes: yup.string().nullable(),
})

type FormData = yup.InferType<typeof schema>

const languages = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'gu', label: 'Gujarati' },
]

const getLoyaltyTier = (points: number) => {
  if (points >= 5000) return { tier: 'Platinum', color: 'text-purple-600', bg: 'bg-purple-100', icon: Award }
  if (points >= 2000) return { tier: 'Gold', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Star }
  if (points >= 500) return { tier: 'Silver', color: 'text-gray-600', bg: 'bg-gray-200', icon: Gift }
  return { tier: 'Bronze', color: 'text-orange-600', bg: 'bg-orange-100', icon: Gift }
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
      toast.error('Failed to load customers')
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
    reset(customer)
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
        toast.success('Customer updated')
      } else {
        await api.post('/customers/', data)
        toast.success('Customer created')
      }
      setShowFormModal(false)
      fetchCustomers()
    } catch (error: any) {
      if (error.response?.data?.phone) {
        toast.error('Phone number already exists')
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
      toast.success('Customer deleted')
      setShowDeleteModal(false)
      fetchCustomers()
    } catch (error) {
      toast.error('Failed to delete customer')
    }
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

  // Stats calculation
  const stats = {
    total: customers.length,
    totalPurchases: customers.reduce((sum, c) => sum + (c.total_purchases || 0), 0),
    totalPoints: customers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0),
    platinum: customers.filter(c => c.loyalty_points >= 5000).length,
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
            Customers
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Manage relationships and loyalty rewards</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 sm:gap-3"
        >
          <ExportButton 
            data={customers} 
            columns={customerExportColumns} 
            filename={`customers_${new Date().toISOString().split('T')[0]}`}
          />
          <Button onClick={openAddModal} icon={<Plus className="w-4 h-4" />} className="flex-1 sm:flex-none">
            <span className="hidden sm:inline">Add Customer</span>
            <span className="sm:hidden">Add</span>
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
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Total</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Revenue</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPurchases)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Points</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalPoints.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Platinum</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.platinum}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm sm:text-base text-gray-900 placeholder-gray-400"
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
      </motion.div>

      {/* Customers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 animate-pulse">
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 sm:h-5 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-24" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-gray-100">
                <div className="h-10 sm:h-12 bg-gray-100 rounded-lg" />
                <div className="h-10 sm:h-12 bg-gray-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-12 sm:py-16 px-4"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No customers yet</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-6">Start adding customers to manage relationships</p>
          <Button onClick={openAddModal} icon={<Plus className="w-4 h-4" />}>
            Add First Customer
          </Button>
        </motion.div>
      ) : viewMode === 'grid' ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {customers.map((customer, index) => {
              const loyalty = getLoyaltyTier(customer.loyalty_points || 0)
              const LoyaltyIcon = loyalty.icon
              
              return (
                <motion.div
                  key={customer.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-primary-200 transition-all duration-300 overflow-hidden"
                >
                  {/* Header with Loyalty Badge */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="relative flex-shrink-0">
                        <div className={clsx(
                          'w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl font-bold',
                          'bg-gradient-to-br from-primary-500 to-primary-700 text-white'
                        )}>
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className={clsx(
                          'absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-sm',
                          loyalty.bg
                        )}>
                          <LoyaltyIcon className={clsx('w-2.5 h-2.5 sm:w-3 sm:h-3', loyalty.color)} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors text-sm sm:text-base">
                          {customer.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={clsx(
                            'text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full',
                            loyalty.bg, loyalty.color
                          )}>
                            {loyalty.tier}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 grid grid-cols-2 gap-2 sm:gap-4">
                      <div className="text-center p-1.5 sm:p-2 bg-gray-50 rounded-lg">
                        <p className="text-[10px] sm:text-xs text-gray-500">Spent</p>
                        <p className="font-bold text-gray-900 text-sm sm:text-base">{formatCurrency(customer.total_purchases || 0)}</p>
                      </div>
                      <div className="text-center p-1.5 sm:p-2 bg-gray-50 rounded-lg">
                        <p className="text-[10px] sm:text-xs text-gray-500">Points</p>
                        <p className="font-bold text-yellow-600 text-sm sm:text-base">{(customer.loyalty_points || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                    <div className="flex gap-1.5 sm:gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openViewModal(customer)}
                        className="flex-1 text-xs sm:text-sm"
                      >
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" /> View
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEditModal(customer)}
                        className="flex-1 text-xs sm:text-sm"
                      >
                        <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" /> Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openDeleteModal(customer)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
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
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <SortableHeader label="Customer" field="name" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Loyalty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Spent</th>
                  <th className="px-4 py-3 text-left">
                    <SortableHeader label="Points" field="loyalty_points" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((customer, index) => {
                  const loyalty = getLoyaltyTier(customer.loyalty_points || 0)
                  return (
                    <motion.tr
                      key={customer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{customer.name}</p>
                            {customer.language_preference && (
                              <p className="text-xs text-gray-500">{customer.language_preference === 'en' ? 'English' : customer.language_preference === 'hi' ? 'Hindi' : 'Gujarati'}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>{customer.phone}</span>
                          </div>
                          {customer.email && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 truncate max-w-[200px]">
                              <Mail className="w-3.5 h-3.5 text-gray-400" />
                              <span className="truncate">{customer.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx(
                          'text-xs font-medium px-2 py-1 rounded-full',
                          loyalty.bg, loyalty.color
                        )}>
                          {loyalty.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 text-sm">{formatCurrency(customer.total_purchases || 0)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-yellow-600 text-sm">{(customer.loyalty_points || 0).toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openViewModal(customer)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                          <button onClick={() => openEditModal(customer)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <Edit className="w-4 h-4 text-gray-500" />
                          </button>
                          <button onClick={() => openDeleteModal(customer)} className="p-1.5 hover:bg-danger-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4 text-danger-500" />
                          </button>
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
      {!loading && customers.length > 0 && (
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

      {/* Add/Edit Modal */}
      <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)} title={selectedCustomer ? 'Edit Customer' : 'Add Customer'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <Input 
              label="Full Name" 
              {...register('name')} 
              error={errors.name?.message} 
              icon={<Users className="w-4 h-4" />}
              required
            />
            <Input 
              label="Phone Number" 
              {...register('phone')} 
              error={errors.phone?.message} 
              placeholder="+91 XXXXXXXXXX"
              icon={<Phone className="w-4 h-4" />}
              required
            />
            <Input 
              label="Email" 
              type="email" 
              {...register('email')} 
              error={errors.email?.message}
              icon={<Mail className="w-4 h-4" />}
            />
            <Input 
              label="Date of Birth" 
              type="date" 
              {...register('date_of_birth')}
              icon={<Calendar className="w-4 h-4" />}
            />
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Language Preference</label>
              <select 
                {...register('language_preference')} 
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm sm:text-base"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                <MapPin className="w-4 h-4 inline mr-1" /> Address
              </label>
              <textarea 
                {...register('address')} 
                rows={2} 
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm sm:text-base" 
                placeholder="Enter full address"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Notes</label>
              <textarea 
                {...register('notes')} 
                rows={2} 
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm sm:text-base" 
                placeholder="Any additional notes..."
              />
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-5 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setShowFormModal(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">{selectedCustomer ? 'Update Customer' : 'Create Customer'}</Button>
          </div>
        </form>
      </Modal>

      {/* View Modal (with Tabs) */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Customer Details" size="lg">
        {selectedCustomer && (
          <div className="space-y-4 sm:space-y-5">
            {/* Customer Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 p-4 sm:p-5 bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-2xl sm:text-3xl font-bold text-white">{selectedCustomer.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{selectedCustomer.name}</h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                  <span className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {selectedCustomer.phone}
                  </span>
                  {(() => {
                    const loyalty = getLoyaltyTier(selectedCustomer.loyalty_points || 0)
                    return (
                      <span className={clsx('text-xs sm:text-sm font-medium px-2 sm:px-3 py-0.5 sm:py-1 rounded-full', loyalty.bg, loyalty.color)}>
                        {loyalty.tier} Member
                      </span>
                    )
                  })()}
                </div>
              </div>
              <div className="flex gap-4 sm:gap-6">
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs text-gray-500">Points</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">{(selectedCustomer.loyalty_points || 0).toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs text-gray-500">Spent</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(selectedCustomer.total_purchases || 0)}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
              {(['info', 'purchases', 'repairs'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all',
                    detailTab === tab ? 'bg-white shadow-sm text-primary-600' : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {tab === 'info' && 'Info'}
                  {tab === 'purchases' && <><ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden xs:inline">Purchases</span><span className="xs:hidden">Buy</span></>}
                  {tab === 'repairs' && <><Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Repairs</>}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {detailTab === 'info' && (
                <motion.div
                  key="info"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-2 gap-2 sm:gap-5"
                >
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Email</p>
                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{selectedCustomer.email || '-'}</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Date of Birth</p>
                    <p className="font-medium text-gray-900 text-sm sm:text-base">{selectedCustomer.date_of_birth ? formatDate(selectedCustomer.date_of_birth) : '-'}</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Language</p>
                    <p className="font-medium text-gray-900 capitalize text-sm sm:text-base">{selectedCustomer.language_preference}</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Customer Since</p>
                    <p className="font-medium text-gray-900 text-sm sm:text-base">{formatDate(selectedCustomer.created_at)}</p>
                  </div>
                  <div className="col-span-2 p-3 sm:p-4 bg-gray-50 rounded-xl">
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Address</p>
                    <p className="font-medium text-gray-900 text-sm sm:text-base">{selectedCustomer.address || '-'}</p>
                  </div>
                  {selectedCustomer.notes && (
                    <div className="col-span-2 p-3 sm:p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <p className="text-[10px] sm:text-xs text-amber-700 mb-0.5 sm:mb-1">Notes</p>
                      <p className="text-amber-900 text-sm sm:text-base">{selectedCustomer.notes}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {detailTab === 'purchases' && (
                <motion.div
                  key="purchases"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-h-56 sm:max-h-64 overflow-y-auto"
                >
                  {loadingDetails ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    </div>
                  ) : purchases.length === 0 ? (
                    <div className="text-center py-10 sm:py-12 bg-gray-50 rounded-xl">
                      <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm sm:text-base text-gray-500">No purchase history</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {purchases.map((sale: any) => (
                        <div key={sale.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{sale.invoice_number}</p>
                              <p className="text-xs sm:text-sm text-gray-500">{formatDate(sale.sale_date)}</p>
                            </div>
                          </div>
                          <p className="font-bold text-green-600 text-sm sm:text-base flex-shrink-0">{formatCurrency(sale.total_amount)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {detailTab === 'repairs' && (
                <motion.div
                  key="repairs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-h-56 sm:max-h-64 overflow-y-auto"
                >
                  {loadingDetails ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    </div>
                  ) : repairs.length === 0 ? (
                    <div className="text-center py-10 sm:py-12 bg-gray-50 rounded-xl">
                      <Wrench className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm sm:text-base text-gray-500">No repair history</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {repairs.map((repair: any) => (
                        <div key={repair.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{repair.ticket_number}</p>
                              <p className="text-xs sm:text-sm text-gray-500 truncate">{repair.item_type}</p>
                            </div>
                          </div>
                          <Badge variant={repair.status === 'delivered' ? 'success' : 'warning'}>{repair.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-5 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowViewModal(false)} className="w-full sm:w-auto">Close</Button>
              <Button onClick={() => { setShowViewModal(false); openEditModal(selectedCustomer); }} className="w-full sm:w-auto">
                <Edit className="w-4 h-4 mr-1" /> Edit Customer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Customer">
        <div className="text-center py-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Delete &ldquo;{selectedCustomer?.name}&rdquo;?</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-6">This will also remove their purchase and repair history links. This action cannot be undone.</p>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={handleDelete} className="flex-1">Delete Customer</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
