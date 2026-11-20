'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Wallet, Calendar, Home, Users, Zap, Wrench, ShoppingCart, 
  Megaphone, Truck, MoreHorizontal, TrendingUp, TrendingDown, IndianRupee,
  Filter, Edit, Trash2, PieChart, LayoutGrid, List, ShieldCheck, Lock,
  Building, FileText, CheckCircle2, AlertCircle, RefreshCw, DollarSign,
  Receipt, Landmark, CreditCard, Smartphone
} from 'lucide-react'
import { api } from '@/services/api'
import { Expense, CashRegister } from '@/types'
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
  rent: { label: 'Store Rent', icon: Building, color: 'text-sky-400', bg: 'bg-sky-950/30', border: 'border-sky-800/40' },
  salary: { label: 'Staff Salaries', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-950/30', border: 'border-emerald-800/40' },
  utilities: { label: 'Electricity & Utilities', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-950/30', border: 'border-amber-800/40' },
  maintenance: { label: 'Repairs & Maintenance', icon: Wrench, color: 'text-orange-400', bg: 'bg-orange-950/30', border: 'border-orange-800/40' },
  purchase: { label: 'Stock & Parts Purchases', icon: ShoppingCart, color: 'text-[#C9A45C]', bg: 'bg-[#C9A45C]/15', border: 'border-[#C9A45C]/40' },
  marketing: { label: 'Marketing & Advertising', icon: Megaphone, color: 'text-rose-400', bg: 'bg-rose-950/30', border: 'border-rose-800/40' },
  transport: { label: 'Courier & Shipping', icon: Truck, color: 'text-indigo-400', bg: 'bg-indigo-950/30', border: 'border-indigo-800/40' },
  other: { label: 'Other Expenses', icon: Wallet, color: 'text-[#8D8980]', bg: 'bg-[#1F1E1A]', border: 'border-[#2A261F]' },
}

const paymentModeLabels: Record<string, { label: string; icon: any; color: string }> = {
  cash: { label: 'Cash Drawer', icon: DollarSign, color: 'text-emerald-400' },
  upi: { label: 'UPI / QR', icon: Smartphone, color: 'text-purple-400' },
  card: { label: 'Card Swipe', icon: CreditCard, color: 'text-blue-400' },
  bank_transfer: { label: 'Net Banking', icon: Landmark, color: 'text-cyan-400' },
  cheque: { label: 'Cheque', icon: FileText, color: 'text-amber-400' },
}

export default function ExpensesPage() {
  const { user } = useAuth()
  const isManagement = user?.role === 'admin' || user?.role === 'manager'

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'expenses' | 'till'>('expenses')

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [category, setCategory] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table')
  
  // Till / Cash Register state
  const [till, setTill] = useState<CashRegister | null>(null)
  const [loadingTill, setLoadingTill] = useState(false)
  const [showOpenTillModal, setShowOpenTillModal] = useState(false)
  const [showCloseTillModal, setShowCloseTillModal] = useState(false)
  const [openingCashInput, setOpeningCashInput] = useState('5000')
  const [actualCashInput, setActualCashInput] = useState('')
  const [tillNotes, setTillNotes] = useState('')
  const [submittingTill, setSubmittingTill] = useState(false)

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
    tax_amount: '0',
    payment_mode: 'cash',
    date: new Date().toISOString().split('T')[0],
    description: '',
    vendor_name: '',
    gstin: '',
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

  useEffect(() => {
    if (activeTab === 'till') {
      fetchTill()
    }
  }, [activeTab])

  const fetchTill = async () => {
    setLoadingTill(true)
    try {
      const res = await api.get('/cash-registers/today/')
      setTill(res.data)
      if (res.data?.actual_closing_cash !== null && res.data?.actual_closing_cash !== undefined) {
        setActualCashInput(res.data.actual_closing_cash.toString())
      } else {
        setActualCashInput(res.data.expected_closing_cash?.toString() || '0')
      }
      setTillNotes(res.data?.notes || '')
    } catch (error: any) {
      if (error.response?.status === 404) {
        setTill(null)
      } else {
        console.error('Failed to load till:', error)
      }
    } finally {
      setLoadingTill(false)
    }
  }

  const handleOpenTill = async () => {
    setSubmittingTill(true)
    try {
      const payload = {
        opening_cash: parseFloat(openingCashInput) || 0,
        register_date: new Date().toISOString().split('T')[0],
      }
      const res = await api.post('/cash-registers/', payload)
      setTill(res.data)
      setShowOpenTillModal(false)
      toast.success('Cash drawer & register initialized for today')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to open register')
    } finally {
      setSubmittingTill(false)
    }
  }

  const handleRecalculateTill = async () => {
    setSubmittingTill(true)
    try {
      const res = await api.post('/cash-registers/today/recalculate/')
      setTill(res.data)
      setActualCashInput(res.data.expected_closing_cash?.toString() || '0')
      toast.success('Drawer totals reconciled with live POS & expense logs')
    } catch (error) {
      toast.error('Failed to recalculate till')
    } finally {
      setSubmittingTill(false)
    }
  }

  const handleCloseTill = async () => {
    if (!actualCashInput || isNaN(parseFloat(actualCashInput))) {
      toast.error('Please enter the physical closing cash count')
      return
    }

    setSubmittingTill(true)
    try {
      const res = await api.post('/cash-registers/today/close_till/', {
        actual_closing_cash: parseFloat(actualCashInput),
        notes: tillNotes,
      })
      setTill(res.data)
      setShowCloseTillModal(false)
      toast.success('Register reconciled and closed successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to close register')
    } finally {
      setSubmittingTill(false)
    }
  }

  const openAddModal = () => {
    setSelectedExpense(null)
    setFormData({
      category: 'other',
      amount: '',
      tax_amount: '0',
      payment_mode: 'cash',
      date: new Date().toISOString().split('T')[0],
      description: '',
      vendor_name: '',
      gstin: '',
    })
    setShowModal(true)
  }

  const openEditModal = (expense: Expense) => {
    setSelectedExpense(expense)
    setFormData({
      category: expense.category,
      amount: expense.amount.toString(),
      tax_amount: expense.tax_amount?.toString() || '0',
      payment_mode: expense.payment_mode || 'cash',
      date: expense.date,
      description: expense.description || '',
      vendor_name: expense.vendor_name || '',
      gstin: expense.gstin || '',
    })
    setShowModal(true)
  }

  const openDeleteModal = (expense: Expense) => {
    if (!isManagement) {
      toast.error('Deleting an expense requires Manager or Admin permission')
      return
    }
    setSelectedExpense(expense)
    setShowDeleteModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Please enter a valid expense amount')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        tax_amount: parseFloat(formData.tax_amount || '0'),
      }

      if (selectedExpense) {
        await api.patch(`/expenses/${selectedExpense.id}/`, payload)
        toast.success('Expense updated successfully')
      } else {
        await api.post('/expenses/', payload)
        toast.success('Expense voucher created successfully')
      }
      setShowModal(false)
      fetchExpenses()
      if (activeTab === 'till') {
        fetchTill()
      }
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
      toast.success('Expense deleted successfully')
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
    { value: 'rent', label: 'Store Rent' },
    { value: 'salary', label: 'Staff Salaries' },
    { value: 'utilities', label: 'Electricity & Utilities' },
    { value: 'maintenance', label: 'Repairs & Maintenance' },
    { value: 'purchase', label: 'Stock & Parts Purchases' },
    { value: 'marketing', label: 'Marketing & Advertising' },
    { value: 'transport', label: 'Courier & Shipping' },
    { value: 'other', label: 'Other Expenses' },
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
              <h1 className="text-2xl font-serif font-bold text-[#F3EFE6] tracking-tight">Store Expenses</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F1E1A] text-[#C9A45C] border border-[#2A261F] font-mono">
                {totalItems} entries
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8D8980]">Track store expenses, rent, utilities, payroll, and supplies</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <ExportButton 
            data={expenses} 
            columns={expenseExportColumns} 
            filename={`meghani_expenses_${new Date().toISOString().split('T')[0]}`} 
          />
          <Button onClick={openAddModal} icon={<Plus className="w-4 h-4" />} className="shadow-gold">
            <span>Add Expense</span>
          </Button>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2A261F] pb-3">
        <button
          onClick={() => setActiveTab('expenses')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border',
            activeTab === 'expenses'
              ? 'bg-[#C9A45C] text-[#0B0B0A] border-[#C9A45C] shadow-md'
              : 'bg-[#12110F] text-[#8D8980] border-[#2A261F] hover:text-[#F3EFE6]'
          )}
        >
          <Receipt className="w-4 h-4" />
          <span>Expense Ledgers & Vouchers</span>
        </button>
        <button
          onClick={() => setActiveTab('till')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border',
            activeTab === 'till'
              ? 'bg-[#C9A45C] text-[#0B0B0A] border-[#C9A45C] shadow-md'
              : 'bg-[#12110F] text-[#8D8980] border-[#2A261F] hover:text-[#F3EFE6]'
          )}
        >
          <Landmark className="w-4 h-4" />
          <span>Till & Cash Drawer Reconciliation</span>
          {till?.is_closed ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          )}
        </button>
      </div>

      {activeTab === 'expenses' ? (
        <>
          {/* Expense KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950/40 border border-rose-800/40 flex items-center justify-center text-rose-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#8D8980] uppercase tracking-wider">Total Expenses</p>
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
              <p className="text-xs text-[#8D8980] uppercase tracking-wider">This Month</p>
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
              <p className="text-xs text-[#8D8980] uppercase tracking-wider">Average Expense</p>
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
              <p className="text-xs text-[#8D8980] uppercase tracking-wider">Top Category</p>
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
            <span className="text-xs font-semibold text-[#F3EFE6] uppercase tracking-wider">Filter by Category:</span>
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
              title="Table View"
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
              title="Card View"
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
          <p className="text-sm text-[#8D8980]">Loading expenses...</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-12 text-center shadow-xl">
          <div className="w-16 h-16 mx-auto bg-[#1F1E1A] border border-[#2A261F] rounded-2xl flex items-center justify-center mb-4">
            <Wallet className="w-8 h-8 text-[#8D8980]" />
          </div>
          <h3 className="text-lg font-serif font-bold text-[#F3EFE6] mb-1">No Expenses Found</h3>
          <p className="text-sm text-[#8D8980] mb-5">There are no expense records under the selected category.</p>
          <Button onClick={openAddModal} icon={<Plus className="w-4 h-4" />}>
            Add Expense
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-[#171613] rounded-2xl border border-[#2A261F] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead className="bg-[#12110F] border-b border-[#2A261F]">
                <tr>
                  <th className="px-5 py-3.5 text-left">
                    <SortableHeader label="Date" field="date" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Voucher #</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Vendor / Payee</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Payment Mode</th>
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
                  const modeCfg = paymentModeLabels[expense.payment_mode] || paymentModeLabels.cash
                  const ModeIcon = modeCfg.icon
                  return (
                    <tr key={expense.id} className="hover:bg-[#1F1E1A] transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-[#F3EFE6]">
                        {formatDate(expense.date)}
                      </td>

                      <td className="px-4 py-4 font-mono text-xs font-bold text-[#C9A45C]">
                        {expense.voucher_number || `EXP-${expense.id}`}
                      </td>

                      <td className="px-4 py-4">
                        <span className={clsx('text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 border', cfg.bg, cfg.color, cfg.border)}>
                          <CatIcon className="w-3 h-3" />
                          <span>{cfg.label}</span>
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-medium text-sm text-[#F3EFE6]">{expense.vendor_name || 'Store Expense'}</p>
                        {expense.gstin && (
                          <span className="font-mono text-[10px] text-[#8D8980] block">GST: {expense.gstin}</span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 text-xs text-[#F3EFE6]">
                          <ModeIcon className={clsx('w-3.5 h-3.5', modeCfg.color)} />
                          <span>{modeCfg.label}</span>
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs text-[#8D8980] line-clamp-1 max-w-[240px]">{expense.description || '-'}</p>
                      </td>

                      <td className="px-5 py-4 text-right font-mono font-bold text-base text-[#C9A45C]">
                        {formatCurrency(expense.amount)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => openEditModal(expense)}
                            className="p-1.5 hover:bg-[#C9A45C]/15 text-[#C9A45C] rounded-lg transition-colors"
                            title="Edit Expense"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {isManagement ? (
                            <button 
                              onClick={() => openDeleteModal(expense)}
                              className="p-1.5 hover:bg-rose-950/40 text-rose-400 rounded-lg transition-colors"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span title="Manager Permission Required" className="p-1.5 text-[#8D8980]/50 cursor-not-allowed">
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
                    <div className="flex items-start justify-between mb-2">
                      <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 border', cfg.bg, cfg.color, cfg.border)}>
                        <CatIcon className="w-3.5 h-3.5" />
                        <span>{cfg.label}</span>
                      </span>
                      <span className="text-xs font-mono text-[#8D8980]">{formatDate(expense.date)}</span>
                    </div>

                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-[#C9A45C]">
                        {expense.voucher_number || `EXP-${expense.id}`}
                      </span>
                      <span className="text-[11px] text-[#8D8980] flex items-center gap-1">
                        {paymentModeLabels[expense.payment_mode]?.label || expense.payment_mode}
                      </span>
                    </div>

                    <p className="font-serif font-bold text-base text-[#F3EFE6] mt-1">{expense.vendor_name || 'Store Expense'}</p>
                    {expense.gstin && (
                      <span className="font-mono text-[10px] text-[#8D8980] block">GST: {expense.gstin}</span>
                    )}
                    <p className="text-xs text-[#8D8980] mt-1 line-clamp-2">{expense.description || 'General store expense'}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#2A261F] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Amount</span>
                      <p className="font-mono font-bold text-lg text-[#C9A45C]">{formatCurrency(expense.amount)}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => openEditModal(expense)}
                        className="p-2 hover:bg-[#C9A45C]/15 text-[#C9A45C] rounded-lg transition-colors border border-[#2A261F]"
                        title="Edit Expense"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {isManagement && (
                        <button 
                          onClick={() => openDeleteModal(expense)}
                          className="p-2 hover:bg-rose-950/40 text-rose-400 rounded-lg transition-colors border border-[#2A261F]"
                          title="Delete Expense"
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
      </>
    ) : (
      /* Till & Cash Register Daily Reconciliation Dashboard */
      <div className="space-y-6">
        {loadingTill ? (
          <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-12 text-center">
            <div className="w-8 h-8 border-2 border-[#C9A45C] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-[#8D8980]">Reconciling store cash registers...</p>
          </div>
        ) : !till ? (
          <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-12 text-center shadow-xl">
            <div className="w-16 h-16 mx-auto bg-[#1F1E1A] border border-[#2A261F] rounded-2xl flex items-center justify-center mb-4">
              <Landmark className="w-8 h-8 text-[#C9A45C]" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#F3EFE6] mb-1">Cash Register Not Initialized Today</h3>
            <p className="text-sm text-[#8D8980] max-w-md mx-auto mb-6">
              Open today&apos;s register drawer with the opening cash float to begin tracking physical drawer sales, cash repairs, and petty cash expenses.
            </p>
            <Button onClick={() => setShowOpenTillModal(true)} icon={<Plus className="w-4 h-4" />} className="shadow-gold">
              Initialize Today&apos;s Register
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Register Status Banner */}
            <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#1F1E1A] border border-[#2A261F] flex items-center justify-center text-[#C9A45C]">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-serif font-bold text-[#F3EFE6]">Daily Till & Cash Drawer</h2>
                    <span className={clsx(
                      'text-xs font-semibold px-2.5 py-0.5 rounded-full border',
                      till.is_closed 
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' 
                        : 'bg-amber-950/40 text-amber-400 border-amber-800/40'
                    )}>
                      {till.is_closed ? 'Drawer Closed & Audited' : 'Drawer Open / Active'}
                    </span>
                  </div>
                  <p className="text-xs text-[#8D8980] mt-0.5 font-mono">
                    Date: {formatDate(till.register_date)} | Opened by {till.opened_by_name}
                    {till.is_closed && till.closed_by_name && ` | Closed by ${till.closed_by_name}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Button 
                  variant="secondary" 
                  onClick={handleRecalculateTill} 
                  loading={submittingTill}
                  disabled={till.is_closed}
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Sync Live Balances
                </Button>
                {!till.is_closed && (
                  <Button 
                    onClick={() => setShowCloseTillModal(true)} 
                    className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold shadow-md"
                  >
                    <Lock className="w-4 h-4 mr-1.5" />
                    Close & Audit Till
                  </Button>
                )}
              </div>
            </div>

            {/* 4 Till Calculation Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
                <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">1. Opening Float</span>
                <p className="font-mono font-bold text-xl sm:text-2xl text-[#F3EFE6] mt-1">
                  {formatCurrency(till.opening_cash)}
                </p>
                <span className="text-[10px] text-[#8D8980] mt-1 block">Starting drawer cash</span>
              </div>

              <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
                <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">2. Cash Inflows</span>
                <p className="font-mono font-bold text-xl sm:text-2xl text-emerald-400 mt-1">
                  +{formatCurrency(Number(till.cash_sales || 0) + Number(till.cash_repairs || 0))}
                </p>
                <span className="text-[10px] text-[#8D8980] mt-1 block">
                  Sales: {formatCurrency(till.cash_sales)} | Repairs: {formatCurrency(till.cash_repairs)}
                </span>
              </div>

              <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
                <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">3. Cash Outflows</span>
                <p className="font-mono font-bold text-xl sm:text-2xl text-rose-400 mt-1">
                  -{formatCurrency(till.cash_expenses)}
                </p>
                <span className="text-[10px] text-[#8D8980] mt-1 block">Petty cash store expenses</span>
              </div>

              <div className="bg-[#171613] rounded-2xl p-4 border border-[#C9A45C]/40 bg-[#C9A45C]/5 shadow-lg">
                <span className="text-[10px] text-[#C9A45C] uppercase tracking-wider font-bold block">4. Expected In Drawer</span>
                <p className="font-mono font-bold text-xl sm:text-2xl text-[#C9A45C] mt-1">
                  {formatCurrency(till.expected_closing_cash)}
                </p>
                <span className="text-[10px] text-[#8D8980] mt-1 block">System calculated physical cash</span>
              </div>
            </div>

            {/* Till Variance & Audit Card */}
            {till.is_closed ? (
              <div className="p-6 bg-[#12110F] border border-[#2A261F] rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-base text-[#F3EFE6] flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Till Closing Reconciliation Summary
                  </h3>
                  <span className={clsx(
                    'text-xs font-mono font-bold px-3 py-1 rounded-full border',
                    Number(till.variance || 0) === 0 
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' 
                      : Number(till.variance || 0) > 0 
                        ? 'bg-amber-950/40 text-amber-400 border-amber-800/40'
                        : 'bg-rose-950/40 text-rose-400 border-rose-800/40'
                  )}>
                    {Number(till.variance || 0) === 0 
                      ? '✓ Exact Match / Zero Variance' 
                      : Number(till.variance || 0) > 0 
                        ? `Surplus: +${formatCurrency(till.variance || 0)}` 
                        : `Shortage: ${formatCurrency(till.variance || 0)}`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-3 bg-[#171613] rounded-xl border border-[#2A261F]">
                    <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Physical Counted Cash</span>
                    <p className="font-mono font-bold text-lg text-[#F3EFE6] mt-0.5">
                      {formatCurrency(till.actual_closing_cash || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-[#171613] rounded-xl border border-[#2A261F]">
                    <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Expected Drawer Balance</span>
                    <p className="font-mono font-bold text-lg text-[#C9A45C] mt-0.5">
                      {formatCurrency(till.expected_closing_cash || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-[#171613] rounded-xl border border-[#2A261F]">
                    <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Cash Discrepancy / Variance</span>
                    <p className={clsx(
                      'font-mono font-bold text-lg mt-0.5',
                      Number(till.variance || 0) === 0 ? 'text-emerald-400' :
                      Number(till.variance || 0) > 0 ? 'text-amber-400' : 'text-rose-400'
                    )}>
                      {formatCurrency(till.variance || 0)}
                    </p>
                  </div>
                </div>

                {till.notes && (
                  <div className="p-3 bg-[#171613] rounded-xl border border-[#2A261F]">
                    <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block mb-1">Supervisor Closing Notes</span>
                    <p className="text-xs text-[#F3EFE6]">{till.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 bg-gradient-to-r from-[#171613] to-[#1F1E1A] border border-[#2A261F] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#F3EFE6]">Ready to balance tonight&apos;s cash register?</h4>
                  <p className="text-xs text-[#8D8980] mt-0.5">
                    Verify physical currency in the cash drawer and complete end-of-day reconciliation.
                  </p>
                </div>
                <Button 
                  onClick={() => setShowCloseTillModal(true)} 
                  className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold shadow-md"
                >
                  Perform End-of-Day Till Close
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    )}

      {/* Add / Edit Expense Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title={selectedExpense ? 'Edit Expense' : 'Add New Expense'}
        description="Record and track store operational expenses"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Expense Category *</label>
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

            <div>
              <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Payment Method *</label>
              <select
                value={formData.payment_mode}
                onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-xs text-[#F3EFE6]"
              >
                <option value="cash" className="bg-[#171613]">Cash Drawer (Petty Cash)</option>
                <option value="upi" className="bg-[#171613]">UPI / Store QR Code</option>
                <option value="card" className="bg-[#171613]">Corporate Debit / Credit Card</option>
                <option value="bank_transfer" className="bg-[#171613]">Bank Transfer / NEFT</option>
                <option value="cheque" className="bg-[#171613]">Bank Cheque</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Input 
              label="Amount (₹) *" 
              type="number" 
              step="any"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
            <Input 
              label="Tax / GST (₹)" 
              type="number" 
              step="any"
              placeholder="0.00"
              value={formData.tax_amount}
              onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
            />
            <Input 
              label="Date *" 
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input 
              label="Vendor / Payee Name" 
              placeholder="e.g. Torrent Power Ltd / Landlord / Spares Co."
              value={formData.vendor_name}
              onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
            />
            <Input 
              label="Vendor GSTIN (Optional)" 
              placeholder="e.g. 24AAACG1234F1Z5"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Description / Purpose</label>
            <textarea
              rows={3}
              className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-xs text-[#F3EFE6] resize-none"
              placeholder="Enter invoice number, bill reference, or purpose..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {!isManagement && (
            <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl flex items-center gap-2 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Staff expenses are logged and flagged for Manager review.</span>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#2A261F]">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} className="shadow-gold">
              {selectedExpense ? 'Update Expense' : 'Generate Expense Voucher'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Open Till Register Modal */}
      <Modal
        isOpen={showOpenTillModal}
        onClose={() => setShowOpenTillModal(false)}
        title="Open Daily Cash Drawer"
        description="Initialize the physical POS register float balance for today's store operations."
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Opening Cash Float (₹) *"
            type="number"
            step="any"
            placeholder="5000.00"
            value={openingCashInput}
            onChange={(e) => setOpeningCashInput(e.target.value)}
          />
          <p className="text-xs text-[#8D8980]">
            Count the physical notes and coins currently sitting in the cash drawer before starting morning retail transactions.
          </p>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#2A261F]">
            <Button variant="secondary" onClick={() => setShowOpenTillModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleOpenTill} 
              loading={submittingTill}
              className="shadow-gold font-bold"
            >
              Open Register
            </Button>
          </div>
        </div>
      </Modal>

      {/* Close & Reconcile Till Modal */}
      <Modal
        isOpen={showCloseTillModal}
        onClose={() => setShowCloseTillModal(false)}
        title="Close & Reconcile Cash Register"
        description="Verify physical cash in drawer, review variance against system sales, and lock today's register."
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-[#12110F] border border-[#2A261F] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Expected In Drawer</span>
              <p className="font-mono font-bold text-xl text-[#C9A45C]">
                {formatCurrency(till?.expected_closing_cash || 0)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Calculated Variance</span>
              {(() => {
                const actual = parseFloat(actualCashInput) || 0
                const expected = Number(till?.expected_closing_cash || 0)
                const diff = actual - expected
                return (
                  <p className={clsx(
                    'font-mono font-bold text-base',
                    diff === 0 ? 'text-emerald-400' : diff > 0 ? 'text-amber-400' : 'text-rose-400'
                  )}>
                    {diff === 0 ? 'Balanced (₹0)' : diff > 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)}
                  </p>
                )
              })()}
            </div>
          </div>

          <Input
            label="Actual Physical Cash Counted (₹) *"
            type="number"
            step="any"
            placeholder="0.00"
            value={actualCashInput}
            onChange={(e) => setActualCashInput(e.target.value)}
          />

          <div>
            <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Reconciliation Notes</label>
            <textarea
              rows={2}
              className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-xs text-[#F3EFE6] resize-none"
              placeholder="Note any cash shortages, surplus reasons, or handover remarks..."
              value={tillNotes}
              onChange={(e) => setTillNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#2A261F]">
            <Button variant="secondary" onClick={() => setShowCloseTillModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCloseTill} 
              loading={submittingTill}
              className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold shadow-md"
            >
              Lock & Archive Register
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message={`Are you sure you want to delete this ₹${selectedExpense?.amount?.toLocaleString('en-IN')} expense? This action cannot be undone.`}
        confirmText="Delete Expense"
        variant="danger"
      />
    </div>
  )
}
