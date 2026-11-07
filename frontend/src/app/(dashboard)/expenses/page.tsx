'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Wallet, Calendar, Home, Users, Zap, Wrench, ShoppingCart, 
  Megaphone, Truck, MoreHorizontal, TrendingUp, TrendingDown, DollarSign,
  Filter, Edit, Trash2, PieChart, LayoutGrid, List
} from 'lucide-react'
import { api } from '@/services/api'
import { Expense } from '@/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Pagination from '@/components/ui/Pagination'
import SortableHeader, { SortDirection } from '@/components/ui/SortableHeader'
import ExportButton from '@/components/ui/ExportButton'
import { expenseExportColumns } from '@/utils/export'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const categoryConfig: Record<string, { label: string; icon: any; color: string; bg: string; gradient: string }> = {
  rent: { label: 'Rent', icon: Home, color: 'text-blue-600', bg: 'bg-blue-100', gradient: 'from-blue-500 to-blue-600' },
  salary: { label: 'Salary', icon: Users, color: 'text-green-600', bg: 'bg-green-100', gradient: 'from-green-500 to-emerald-600' },
  utilities: { label: 'Utilities', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-100', gradient: 'from-yellow-500 to-amber-600' },
  maintenance: { label: 'Maintenance', icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-100', gradient: 'from-orange-500 to-orange-600' },
  purchase: { label: 'Purchase/Stock', icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-100', gradient: 'from-purple-500 to-violet-600' },
  marketing: { label: 'Marketing', icon: Megaphone, color: 'text-pink-600', bg: 'bg-pink-100', gradient: 'from-pink-500 to-rose-600' },
  transport: { label: 'Transport', icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-100', gradient: 'from-indigo-500 to-indigo-600' },
  other: { label: 'Other', icon: Wallet, color: 'text-gray-600', bg: 'bg-gray-100', gradient: 'from-gray-500 to-gray-600' },
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [category, setCategory] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  
  // Sorting state
  const [sortField, setSortField] = useState<string>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Form state
  const [formData, setFormData] = useState({
    category: 'other',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    vendor_name: '',
  })

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [category, sortField, sortDirection])

  useEffect(() => {
    fetchExpenses()
  }, [category, currentPage, pageSize, sortField, sortDirection])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      params.append('page', currentPage.toString())
      params.append('page_size', pageSize.toString())
      
      if (sortField && sortDirection) {
        const ordering = sortDirection === 'desc' ? `-${sortField}` : sortField
        params.append('ordering', ordering)
      }
      
      const response = await api.get(`/expenses/?${params.toString()}`)
      const data = response.data
      
      if (data.results) {
        setExpenses(data.results)
        setTotalItems(data.count || 0)
        setTotalPages(Math.ceil((data.count || 0) / pageSize))
      } else {
        setExpenses(data)
        setTotalItems(data.length)
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error)
      toast.error('Failed to load expenses')
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
    setSelectedExpense(null)
    setFormData({
      category: 'other',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      vendor_name: '',
    })
    setShowModal(true)
  }

  const openEditModal = (expense: Expense) => {
    setSelectedExpense(expense)
    setFormData({
      category: expense.category,
      amount: expense.amount.toString(),
      date: expense.date,
      description: expense.description || '',
      vendor_name: expense.vendor_name || '',
    })
    setShowModal(true)
  }

  const openDeleteModal = (expense: Expense) => {
    setSelectedExpense(expense)
    setShowDeleteModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
      }

      if (selectedExpense) {
        await api.patch(`/expenses/${selectedExpense.id}/`, payload)
        toast.success('Expense updated')
      } else {
        await api.post('/expenses/', payload)
        toast.success('Expense added')
      }
      setShowModal(false)
      fetchExpenses()
    } catch (error) {
      toast.error('Failed to save expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedExpense) return
    try {
      await api.delete(`/expenses/${selectedExpense.id}/`)
      toast.success('Expense deleted')
      setShowDeleteModal(false)
      fetchExpenses()
    } catch (error) {
      toast.error('Failed to delete expense')
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

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'rent', label: 'Rent' },
    { value: 'salary', label: 'Salary' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'purchase', label: 'Purchase/Stock' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'transport', label: 'Transport' },
    { value: 'other', label: 'Other' },
  ]

  // Calculate stats
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const thisMonth = expenses.filter(e => {
    const expDate = new Date(e.date)
    const now = new Date()
    return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()
  })
  const thisMonthTotal = thisMonth.reduce((sum, e) => sum + e.amount, 0)
  const avgExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0

  // Category breakdown
  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount
    return acc
  }, {} as Record<string, number>)

  const topCategory = Object.entries(categoryTotals).sort(([,a], [,b]) => b - a)[0]

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Expenses
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Track and manage business expenses</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 sm:gap-3"
        >
          <ExportButton 
            data={expenses} 
            columns={expenseExportColumns} 
            filename={`expenses_${new Date().toISOString().split('T')[0]}`}
          />
          <Button onClick={openAddModal} icon={<Plus className="w-4 h-4" />} className="flex-1 sm:flex-none">
            <span className="hidden sm:inline">Add Expense</span>
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
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Total</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">This Month</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(thisMonthTotal)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Average</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(avgExpense)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={clsx(
              'w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center bg-gradient-to-br flex-shrink-0',
              topCategory ? categoryConfig[topCategory[0]]?.gradient : 'from-gray-500 to-gray-600'
            )}>
              <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Top</p>
              <p className="text-sm sm:text-lg font-bold text-gray-900 truncate">
                {topCategory ? categoryConfig[topCategory[0]]?.label : '-'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide flex-1">
            {categories.map((cat) => {
              const config = cat.value ? categoryConfig[cat.value] : null
              const Icon = config?.icon || Filter
              return (
                <button
                  key={cat.value || 'all'}
                  onClick={() => setCategory(cat.value)}
                  className={clsx(
                    'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0',
                    category === cat.value
                      ? config ? `${config.bg} ${config.color}` : 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">{cat.label}</span>
                  <span className="xs:hidden">{cat.label.split('/')[0]}</span>
                </button>
              )
            })}
          </div>
          <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-1 flex-shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                viewMode === 'list' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
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

      {/* Expenses List */}
      {loading ? (
        <div className="space-y-2 sm:space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 animate-pulse">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 sm:h-5 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-48" />
                </div>
                <div className="h-5 sm:h-6 bg-gray-200 rounded w-20 sm:w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-12 sm:py-16 px-4"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No expenses yet</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-6">Start tracking your business expenses</p>
          <Button onClick={openAddModal} icon={<Plus className="w-4 h-4" />}>
            Add First Expense
          </Button>
        </motion.div>
      ) : viewMode === 'list' ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-2 sm:space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {expenses.map((expense, index) => {
              const config = categoryConfig[expense.category] || categoryConfig.other
              const Icon = config.icon
              
              return (
                <motion.div
                  key={expense.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                  className="group bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Icon */}
                    <div className={clsx(
                      'w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center bg-gradient-to-br flex-shrink-0',
                      config.gradient
                    )}>
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{config.label}</h3>
                        <span className={clsx('text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full hidden sm:inline', config.bg, config.color)}>
                          {expense.category_display}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 truncate">
                        {expense.description || expense.vendor_name || 'No description'}
                      </p>
                      <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2 text-xs sm:text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(expense.date)}
                        </span>
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="text-right">
                        <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(expense.amount)}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(expense)}
                          className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(expense)}
                          className="p-1.5 sm:p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                        </button>
                      </div>
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
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <SortableHeader label="Category" field="category" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-4 py-3 text-left">
                    <SortableHeader label="Date" field="date" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-right">
                    <SortableHeader label="Amount" field="amount" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} className="justify-end" />
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map((expense, index) => {
                  const config = categoryConfig[expense.category] || categoryConfig.other
                  const Icon = config.icon
                  return (
                    <motion.tr
                      key={expense.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br flex-shrink-0', config.gradient)}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className={clsx('text-xs font-medium px-2 py-1 rounded-full', config.bg, config.color)}>
                            {config.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900 truncate max-w-[200px]">
                          {expense.description || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">{expense.vendor_name || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">{formatDate(expense.date)}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(expense.amount)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(expense)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <Edit className="w-4 h-4 text-gray-500" />
                          </button>
                          <button onClick={() => openDeleteModal(expense)} className="p-1.5 hover:bg-danger-50 rounded-lg transition-colors">
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
      {!loading && expenses.length > 0 && (
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

      {/* Add/Edit Expense Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={selectedExpense ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Category</label>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {categories.filter(c => c.value).map((cat) => {
                const config = categoryConfig[cat.value]
                const Icon = config.icon
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    className={clsx(
                      'p-2 sm:p-3 rounded-lg sm:rounded-xl flex flex-col items-center gap-1 sm:gap-2 transition-all border-2',
                      formData.category === cat.value
                        ? `${config.bg} ${config.color} border-current`
                        : 'border-gray-100 hover:border-gray-200'
                    )}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-[10px] sm:text-xs font-medium text-center leading-tight">{cat.label.split('/')[0]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <Input
            label="Amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            icon={<DollarSign className="w-4 h-4" />}
            placeholder="0"
            required
          />

          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            icon={<Calendar className="w-4 h-4" />}
            required
          />

          <Input
            label="Vendor/Payee"
            value={formData.vendor_name}
            onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
            placeholder="Who was paid?"
          />

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm sm:text-base"
              placeholder="What was this expense for?"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              {selectedExpense ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Expense">
        <div className="text-center py-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Delete this expense?</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-6">
            {selectedExpense && `${categoryConfig[selectedExpense.category]?.label} - ${formatCurrency(selectedExpense.amount)}`}
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
