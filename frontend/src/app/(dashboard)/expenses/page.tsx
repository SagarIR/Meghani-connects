'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Wallet, Calendar, Home, Users, Zap, Wrench, ShoppingCart, 
  Megaphone, Truck, MoreHorizontal, TrendingUp, TrendingDown, IndianRupee,
  Filter, Edit, Trash2, PieChart, LayoutGrid, List, ShieldCheck, Lock,
  Building, FileText, CheckCircle2, AlertCircle
} from 'lucide-react'
import { api } from '@/services/api'
import { Expense } from '@/types'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import Modal, { ConfirmModal } from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Pagination from '@/components/ui/Pagination'
import SortableHeader, { SortDirection } from '@/components/ui/SortableHeader'
import ExportButton from '@/components/ui/ExportButton'
import { expenseExportColumns } from '@/utils/export'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const categoryConfig: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
  rent: { label: 'Showroom Lease / Rent', icon: Building, color: 'text-sky-400', bg: 'bg-sky-950/30', border: 'border-sky-800/40' },
  salary: { label: 'Staff & Horologist Payroll', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-950/30', border: 'border-emerald-800/40' },
  utilities: { label: 'Power & Boutique Utilities', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-950/30', border: 'border-amber-800/40' },
  maintenance: { label: 'Atelier Tooling & Upkeep', icon: Wrench, color: 'text-orange-400', bg: 'bg-orange-950/30', border: 'border-orange-800/40' },
  purchase: { label: 'Wholesale Inventory / Parts', icon: ShoppingCart, color: 'text-[#C9A45C]', bg: 'bg-[#C9A45C]/15', border: 'border-[#C9A45C]/40' },
  marketing: { label: 'Luxury Brand Marketing', icon: Megaphone, color: 'text-rose-400', bg: 'bg-rose-950/30', border: 'border-rose-800/40' },
  transport: { label: 'Insured Logistics & Courier', icon: Truck, color: 'text-indigo-400', bg: 'bg-indigo-950/30', border: 'border-indigo-800/40' },
  other: { label: 'General Boutique Operational', icon: Wallet, color: 'text-[#8D8980]', bg: 'bg-[#1F1E1A]', border: 'border-[#2A261F]' },
}

export default function ExpensesPage() {
  const { user } = useAuth()
  const isManagement = user?.role === 'admin' || user?.role === 'manager'

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [category, setCategory] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table')
  
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
      toast.error('Failed to load expenditure ledger')
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
    if (!isManagement) {
      toast.error('Expense cancellation requires Manager / Admin authorization')
      return
    }
    setSelectedExpense(expense)
    setShowDeleteModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Please enter a valid disbursement amount')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
      }

      if (selectedExpense) {
        await api.patch(`/expenses/${selectedExpense.id}/`, payload)
        toast.success('Disbursement entry updated')
      } else {
        await api.post('/expenses/', payload)
        toast.success('Boutique expense booked successfully')
      }
      setShowModal(false)
      fetchExpenses()
    } catch (error) {
      toast.error('Failed to record expenditure')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedExpense) return
    try {
      await api.delete(`/expenses/${selectedExpense.id}/`)
      toast.success('Expense record purged')
      setShowDeleteModal(false)
      fetchExpenses()
    } catch (error) {
      toast.error('Failed to delete expense entry')
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
    { value: '', label: 'All Cost Centers' },
    { value: 'rent', label: 'Showroom Lease / Rent' },
    { value: 'salary', label: 'Payroll & Compensation' },
    { value: 'utilities', label: 'Utilities & Power' },
    { value: 'maintenance', label: 'Atelier Upkeep & Tooling' },
    { value: 'purchase', label: 'Wholesale Inventory / Parts' },
    { value: 'marketing', label: 'Branding & Campaigns' },
    { value: 'transport', label: 'Insured Logistics' },
    { value: 'other', label: 'General Operational' },
  ]

  // Calculate Metrics
  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0), [expenses])
  
  const thisMonthTotal = useMemo(() => {
    const now = new Date()
    return expenses.filter(e => {
      const expDate = new Date(e.date)
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()
    }).reduce((sum, e) => sum + Number(e.amount || 0), 0)
  }, [expenses])

  const avgExpense = useMemo(() => (expenses.length > 0 ? totalExpenses / expenses.length : 0), [expenses, totalExpenses])

  const topCategory = useMemo(() => {
    const totals = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount || 0)
      return acc
    }, {} as Record<string, number>)
    return Object.entries(totals).sort(([,a], [,b]) => b - a)[0]
  }, [expenses])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#171613] border border-[#2A261F] rounded-xl flex items-center justify-center shadow-md">
            <Wallet className="w-5 h-5 text-[#C9A45C]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-serif font-bold text-[#F3EFE6] tracking-tight">Operating Expenses & Ledger</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F1E1A] text-[#C9A45C] border border-[#2A261F] font-mono">
                {totalItems} entries
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8D8980]">Manage boutique overheads, showroom maintenance, payroll, and vendor disbursements</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <ExportButton 
            data={expenses} 
            columns={expenseExportColumns} 
            filename={`meghani_expenses_${new Date().toISOString().split('T')[0]}`} 
          />
          <Button onClick={openAddModal} icon={<Plus className="w-4 h-4" />} className="shadow-gold">
            <span>Book Expense</span>
          </Button>
        </div>
      </div>

      {/* Financial Health KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950/40 border border-rose-800/40 flex items-center justify-center text-rose-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#8D8980] uppercase tracking-wider">Total Ledger</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-[#F3EFE6] mt-0.5">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-800/40 flex items-center justify-center text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#8D8980] uppercase tracking-wider">Current Month</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-[#C9A45C] mt-0.5">
                {formatCurrency(thisMonthTotal)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1F1E1A] border border-[#2A261F] flex items-center justify-center text-[#8D8980]">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#8D8980] uppercase tracking-wider">Average Ticket</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-[#E8D5A7] mt-0.5">
                {formatCurrency(avgExpense)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-950/40 border border-sky-800/40 flex items-center justify-center text-sky-400">
              <PieChart className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#8D8980] uppercase tracking-wider">Primary Head</p>
              <p className="text-base font-bold font-serif text-[#F3EFE6] truncate mt-0.5">
                {topCategory ? (categoryConfig[topCategory[0]]?.label || topCategory[0]) : 'None'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#C9A45C]" />
            <span className="text-xs font-semibold text-[#F3EFE6] uppercase tracking-wider">Cost Center Filter:</span>
          </div>

          <div className="flex items-center bg-[#12110F] border border-[#2A261F] rounded-xl p-1 flex-shrink-0">
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
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'p-2 rounded-lg transition-all',
                viewMode === 'list' 
                  ? 'bg-[#C9A45C] text-[#0B0B0A] font-semibold shadow-sm' 
                  : 'text-[#8D8980] hover:text-[#F3EFE6]'
              )}
              title="Card Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap border',
                category === c.value
                  ? 'bg-[#C9A45C] text-[#0B0B0A] border-[#C9A45C] font-bold shadow-md'
                  : 'bg-[#12110F] border-[#2A261F] text-[#8D8980] hover:text-[#F3EFE6]'
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Content */}
      {loading ? (
        <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-12 text-center">
          <div className="w-8 h-8 border-2 border-[#C9A45C] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-[#8D8980]">Loading boutique expense records...</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-12 text-center shadow-xl">
          <div className="w-16 h-16 mx-auto bg-[#1F1E1A] border border-[#2A261F] rounded-2xl flex items-center justify-center mb-4">
            <Wallet className="w-8 h-8 text-[#8D8980]" />
          </div>
          <h3 className="text-lg font-serif font-bold text-[#F3EFE6] mb-1">No Disbursements Recorded</h3>
          <p className="text-sm text-[#8D8980] mb-5">There are no expense records under the selected category.</p>
          <Button onClick={openAddModal} icon={<Plus className="w-4 h-4" />}>
            Book New Expense
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-[#171613] rounded-2xl border border-[#2A261F] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead className="bg-[#12110F] border-b border-[#2A261F]">
                <tr>
                  <th className="px-5 py-3.5 text-left">
                    <SortableHeader label="Date" field="date" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Cost Center</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Vendor / Payee</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Description</th>
                  <th className="px-5 py-3.5 text-right">
                    <SortableHeader label="Amount" field="amount" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A261F]">
                {expenses.map((expense) => {
                  const cfg = categoryConfig[expense.category] || categoryConfig.other
                  const CatIcon = cfg.icon
                  return (
                    <tr key={expense.id} className="hover:bg-[#1F1E1A] transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-[#F3EFE6]">
                        {formatDate(expense.date)}
                      </td>

                      <td className="px-4 py-4">
                        <span className={clsx('text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 border', cfg.bg, cfg.color, cfg.border)}>
                          <CatIcon className="w-3 h-3" />
                          <span>{cfg.label}</span>
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-medium text-sm text-[#F3EFE6]">{expense.vendor_name || 'Boutique Counter'}</p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs text-[#8D8980] line-clamp-1 max-w-[280px]">{expense.description || '-'}</p>
                      </td>

                      <td className="px-5 py-4 text-right font-mono font-bold text-base text-[#C9A45C]">
                        {formatCurrency(expense.amount)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => openEditModal(expense)}
                            className="p-1.5 hover:bg-[#C9A45C]/15 text-[#C9A45C] rounded-lg transition-colors"
                            title="Edit Record"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {isManagement ? (
                            <button 
                              onClick={() => openDeleteModal(expense)}
                              className="p-1.5 hover:bg-rose-950/40 text-rose-400 rounded-lg transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span title="Manager Authorization Required" className="p-1.5 text-[#8D8980]/50 cursor-not-allowed">
                              <Lock className="w-3.5 h-3.5" />
                            </span>
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
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {expenses.map((expense, index) => {
              const cfg = categoryConfig[expense.category] || categoryConfig.other
              const CatIcon = cfg.icon
              return (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-[#171613] rounded-2xl border border-[#2A261F] p-5 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 border', cfg.bg, cfg.color, cfg.border)}>
                        <CatIcon className="w-3.5 h-3.5" />
                        <span>{cfg.label}</span>
                      </span>
                      <span className="text-xs font-mono text-[#8D8980]">{formatDate(expense.date)}</span>
                    </div>

                    <p className="font-serif font-bold text-base text-[#F3EFE6] mt-1">{expense.vendor_name || 'Boutique Operations'}</p>
                    <p className="text-xs text-[#8D8980] mt-1 line-clamp-2">{expense.description || 'Routine overhead disbursement'}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#2A261F] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Disbursed</span>
                      <p className="font-mono font-bold text-lg text-[#C9A45C]">{formatCurrency(expense.amount)}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => openEditModal(expense)}
                        className="p-2 hover:bg-[#C9A45C]/15 text-[#C9A45C] rounded-lg transition-colors border border-[#2A261F]"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {isManagement && (
                        <button 
                          onClick={() => openDeleteModal(expense)}
                          className="p-2 hover:bg-rose-950/40 text-rose-400 rounded-lg transition-colors border border-[#2A261F]"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {!loading && expenses.length > 0 && (
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

      {/* Add / Edit Expense Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title={selectedExpense ? 'Update Expense Record' : 'Book Operating Expense'}
        description="Record an operational disbursement into the boutique accounting ledger"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Cost Center Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-xs text-[#F3EFE6]"
            >
              {categories.filter(c => c.value !== '').map((c) => (
                <option key={c.value} value={c.value} className="bg-[#171613]">{c.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input 
              label="Disbursement Amount (₹) *" 
              type="number" 
              step="any"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
            <Input 
              label="Transaction Date *" 
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <Input 
            label="Vendor / Payee Name" 
            placeholder="e.g. Torrent Power Ltd / Showroom Landlord"
            value={formData.vendor_name}
            onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
          />

          <div>
            <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Disbursement Details / Invoice Ref</label>
            <textarea
              rows={3}
              className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-xs text-[#F3EFE6] resize-none"
              placeholder="Provide invoice number, cheque reference, or operational reason..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {!isManagement && (
            <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl flex items-center gap-2 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Staff disbursements are logged and flagged for Manager review.</span>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#2A261F]">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} className="shadow-gold">
              {selectedExpense ? 'Update Entry' : 'Book Disbursement'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Purge Expenditure Record"
        message={`Are you sure you wish to delete this ₹${selectedExpense?.amount?.toLocaleString('en-IN')} expense entry? This action is restricted to Store Managers.`}
        confirmText="Confirm Purge"
        variant="danger"
      />
    </div>
  )
}
