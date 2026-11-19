'use client'

import { useEffect, useState, useMemo } from 'react'
import { 
  Search, Calendar, Download, Eye, ShoppingCart, Receipt, 
  CreditCard, Smartphone, Banknote, Split, Lock, Filter,
  ArrowUpRight, Clock, User, CheckCircle2, FileText
} from 'lucide-react'
import { api } from '@/services/api'
import { Sale } from '@/types'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import ExportButton from '@/components/ui/ExportButton'
import { saleExportColumns } from '@/utils/export'
import Link from 'next/link'
import clsx from 'clsx'
import toast from 'react-hot-toast'

export default function SalesHistoryPage() {
  const { user } = useAuth()
  const isManagement = user?.role === 'admin' || user?.role === 'manager'

  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  })
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  useEffect(() => {
    fetchSales()
  }, [dateRange])

  const fetchSales = async () => {
    setLoading(true)
    try {
      let url = '/sales/?'
      if (dateRange.start) url += `start_date=${dateRange.start}&`
      if (dateRange.end) url += `end_date=${dateRange.end}&`
      
      const response = await api.get(url)
      setSales(response.data.results || response.data)
    } catch (error) {
      console.error('Failed to fetch sales:', error)
      toast.error('Failed to load sales records')
    } finally {
      setLoading(false)
    }
  }

  const viewSaleDetail = async (saleId: number) => {
    try {
      const response = await api.get(`/sales/${saleId}/`)
      setSelectedSale(response.data)
      setShowDetailModal(true)
    } catch (error) {
      console.error('Failed to fetch sale details:', error)
      toast.error('Could not load invoice details')
    }
  }

  const downloadPDF = async (saleId: number, invoiceNumber: string) => {
    setDownloadingId(saleId)
    try {
      const response = await api.get(`/sales/${saleId}/invoice/pdf/`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Meghani_Invoice_${invoiceNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success(`Invoice ${invoiceNumber} downloaded`)
    } catch (error) {
      console.error('Failed to download PDF:', error)
      toast.error('Failed to generate PDF')
    } finally {
      setDownloadingId(null)
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchesSearch = 
        sale.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        (sale.customer_name?.toLowerCase() || '').includes(search.toLowerCase())
      
      const matchesPayment = 
        paymentFilter === 'all' || sale.payment_mode.toLowerCase() === paymentFilter.toLowerCase()
      
      return matchesSearch && matchesPayment
    })
  }, [sales, search, paymentFilter])

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalVolume = filteredSales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0)
    const totalProfit = filteredSales.reduce((acc, s) => acc + Number(s.profit || 0), 0)
    const count = filteredSales.length
    const avgTicket = count > 0 ? totalVolume / count : 0
    return { totalVolume, totalProfit, count, avgTicket }
  }, [filteredSales])

  const renderPaymentBadge = (mode: string, paymentDetails?: Record<string, number>) => {
    const m = (mode || '').toLowerCase()
    if (m === 'cash') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
          <Banknote className="w-3 h-3" />
          <span>CASH</span>
        </span>
      )
    }
    if (m === 'upi') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-950/40 border border-sky-800/40 text-sky-400">
          <Smartphone className="w-3 h-3" />
          <span>UPI</span>
        </span>
      )
    }
    if (m === 'card') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/40 border border-amber-800/40 text-amber-400">
          <CreditCard className="w-3 h-3" />
          <span>CARD</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#1F1E1A] border border-[#C9A45C]/40 text-[#C9A45C]">
        <Split className="w-3 h-3" />
        <span>SPLIT</span>
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#171613] border border-[#2A261F] rounded-xl flex items-center justify-center shadow-md">
            <Receipt className="w-5 h-5 text-[#C9A45C]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-serif font-bold text-[#F3EFE6] tracking-tight">Sales History & Invoices</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F1E1A] text-[#C9A45C] border border-[#2A261F] font-mono">
                {filteredSales.length} records
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8D8980]">View all completed sales, payment methods, and GST invoices</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <ExportButton 
            data={filteredSales} 
            columns={saleExportColumns} 
            filename={`meghani_sales_${new Date().toISOString().split('T')[0]}`} 
          />
          <Link href="/sales">
            <Button icon={<ShoppingCart className="w-4 h-4" />} className="shadow-gold">
              Open POS
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#171613] border border-[#2A261F] rounded-xl p-4">
          <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block">Total Sales</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-[#C9A45C] mt-1">
            {formatCurrency(summaryMetrics.totalVolume)}
          </p>
          <span className="text-[11px] text-[#8D8980] mt-0.5 block">Across filtered range</span>
        </div>

        <div className="bg-[#171613] border border-[#2A261F] rounded-xl p-4">
          <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block">Total Orders</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-[#F3EFE6] mt-1">
            {summaryMetrics.count}
          </p>
          <span className="text-[11px] text-[#8D8980] mt-0.5 block">Total orders completed</span>
        </div>

        <div className="bg-[#171613] border border-[#2A261F] rounded-xl p-4">
          <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block">Average Sale</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-[#E8D5A7] mt-1">
            {formatCurrency(summaryMetrics.avgTicket)}
          </p>
          <span className="text-[11px] text-[#8D8980] mt-0.5 block">Per sale</span>
        </div>

        <div className="bg-[#171613] border border-[#2A261F] rounded-xl p-4">
          <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block">Gross Profit</span>
          {isManagement ? (
            <div>
              <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">
                +{formatCurrency(summaryMetrics.totalProfit)}
              </p>
              <span className="text-[11px] text-emerald-500/80 mt-0.5 block">Realized net margin</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-[#8D8980] font-mono">
              <Lock className="w-3.5 h-3.5 text-[#C9A45C]" />
              <span>Hidden for Staff</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D8980] group-focus-within:text-[#C9A45C] transition-colors" />
            <input
              type="text"
              placeholder="Search by invoice number (e.g. INV-1001) or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl 
                       text-[#F3EFE6] placeholder-[#8D8980]/70 text-sm
                       focus:border-[#C9A45C] focus:ring-1 focus:ring-[#C9A45C]
                       transition-all outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Payment Filter */}
            <div className="w-40">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl 
                         text-[#F3EFE6] text-sm focus:border-[#C9A45C] focus:ring-1 focus:ring-[#C9A45C]
                         outline-none cursor-pointer"
              >
                <option value="all">All Payment Methods</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="mixed">Split Payment</option>
              </select>
            </div>

            {/* Date Range Picker */}
            <div className="flex items-center gap-2 bg-[#12110F] border border-[#2A261F] rounded-xl px-3 py-1.5">
              <Calendar className="w-4 h-4 text-[#C9A45C] flex-shrink-0" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="bg-transparent text-xs text-[#F3EFE6] outline-none font-mono cursor-pointer"
              />
              <span className="text-[#8D8980] text-xs">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="bg-transparent text-xs text-[#F3EFE6] outline-none font-mono cursor-pointer"
              />
              {(dateRange.start || dateRange.end) && (
                <button
                  onClick={() => setDateRange({ start: '', end: '' })}
                  className="text-[11px] text-[#C9A45C] hover:underline ml-1 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sales Transactions Table */}
      {loading ? (
        <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-12 text-center">
          <div className="w-8 h-8 border-2 border-[#C9A45C] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-[#8D8980]">Loading sales records...</p>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-12 text-center">
          <div className="w-16 h-16 mx-auto bg-[#1F1E1A] border border-[#2A261F] rounded-2xl flex items-center justify-center mb-4">
            <Receipt className="w-8 h-8 text-[#8D8980]" />
          </div>
          <h3 className="text-lg font-serif font-bold text-[#F3EFE6] mb-1">No Invoices Found</h3>
          <p className="text-sm text-[#8D8980] mb-5">Try changing your search or date filters.</p>
          <Link href="/sales">
            <Button icon={<ShoppingCart className="w-4 h-4" />}>
              Process New Sale
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-[#171613] rounded-2xl border border-[#2A261F] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead className="bg-[#12110F] border-b border-[#2A261F]">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Invoice #</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Customer & Staff</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Date & Time</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Payment Method</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Total Amount</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-[#8D8980] uppercase tracking-wider">
                    {isManagement ? 'Profit' : 'Profit Access'}
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A261F]">
                {filteredSales.map((sale: any) => (
                  <tr key={sale.id} className="hover:bg-[#1F1E1A] transition-colors group">
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-sm text-[#C9A45C] group-hover:underline cursor-pointer" onClick={() => viewSaleDetail(sale.id)}>
                        {sale.invoice_number}
                      </span>
                      {sale.items_count && (
                        <span className="block text-[11px] text-[#8D8980]">
                          {sale.items_count} {sale.items_count === 1 ? 'item' : 'items'}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-serif font-semibold text-sm text-[#F3EFE6] truncate">
                        {sale.customer_name || 'Walk-in Customer'}
                      </p>
                      <p className="text-xs text-[#8D8980]">
                        Staff: {sale.created_by_name || 'Staff Member'}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-xs font-medium text-[#F3EFE6] font-mono">{formatDate(sale.sale_date)}</p>
                      <p className="text-[11px] text-[#8D8980] font-mono mt-0.5">{formatTime(sale.sale_date)}</p>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        {renderPaymentBadge(sale.payment_mode, sale.payment_details)}
                        {sale.payment_mode === 'mixed' && sale.payment_details && (
                          <div className="text-[10px] text-[#8D8980] flex flex-wrap gap-1 mt-1 font-mono">
                            {Object.entries(sale.payment_details)
                              .filter(([_, amt]) => Number(amt) > 0)
                              .map(([method, amt]) => (
                                <span key={method} className="bg-[#12110F] px-1.5 py-0.5 rounded border border-[#2A261F]">
                                  {method.toUpperCase()}: ₹{Number(amt).toLocaleString('en-IN')}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <p className="font-mono font-bold text-base text-[#C9A45C]">
                        {formatCurrency(sale.total_amount)}
                      </p>
                      {Number(sale.discount) > 0 && (
                        <p className="text-[11px] text-rose-400 font-mono">
                          Disc: -{formatCurrency(sale.discount)}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right">
                      {isManagement ? (
                        <p className="font-mono font-semibold text-xs text-emerald-400">
                          +{formatCurrency(sale.profit || 0)}
                        </p>
                      ) : (
                        <div className="flex items-center justify-end gap-1 text-xs text-[#8D8980] font-mono">
                          <Lock className="w-3 h-3 text-[#C9A45C]" />
                          <span>Hidden</span>
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => viewSaleDetail(sale.id)}
                          className="p-2 hover:bg-[#2A261F] text-[#8D8980] hover:text-[#F3EFE6] rounded-lg transition-colors"
                          title="View Invoice Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => downloadPDF(sale.id, sale.invoice_number)}
                          disabled={downloadingId === sale.id}
                          className="p-2 hover:bg-[#C9A45C]/15 text-[#C9A45C] rounded-lg transition-colors disabled:opacity-50"
                          title="Download Invoice PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sale Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Invoice Details: ${selectedSale?.invoice_number}`}
        description="Sale details, purchased items, and payment summary"
        size="lg"
      >
        {selectedSale && (
          <div className="space-y-5">
            {/* Header Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#12110F] border border-[#2A261F] rounded-xl">
              <div>
                <p className="text-[10px] text-[#8D8980] uppercase tracking-wider">Customer</p>
                <p className="font-serif font-bold text-[#F3EFE6] text-sm mt-0.5 truncate">
                  {selectedSale.customer_name || 'Walk-in Customer'}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-[#8D8980] uppercase tracking-wider">Issue Date</p>
                <p className="font-mono text-xs text-[#F3EFE6] mt-0.5">
                  {formatDate(selectedSale.sale_date)}
                </p>
                <p className="font-mono text-[10px] text-[#8D8980]">{formatTime(selectedSale.sale_date)}</p>
              </div>

              <div>
                <p className="text-[10px] text-[#8D8980] uppercase tracking-wider">Payment Method</p>
                <div className="mt-1">
                  {renderPaymentBadge(selectedSale.payment_mode)}
                </div>
              </div>

              <div>
                <p className="text-[10px] text-[#8D8980] uppercase tracking-wider">Staff Member</p>
                <p className="text-xs font-medium text-[#F3EFE6] mt-0.5 truncate">
                  {selectedSale.created_by_name || 'Staff Member'}
                </p>
              </div>
            </div>

            {/* Split Breakdown Card (If applicable) */}
            {selectedSale.payment_mode === 'mixed' && (selectedSale as any).payment_details && (
              <div className="p-3.5 bg-[#12110F] border border-[#2A261F] rounded-xl space-y-2">
                <span className="text-xs font-semibold text-[#C9A45C] uppercase tracking-wider">Split Payment Breakdown</span>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries((selectedSale as any).payment_details)
                    .filter(([_, amt]) => Number(amt) > 0)
                    .map(([method, amt]) => (
                      <div key={method} className="p-2.5 bg-[#171613] border border-[#2A261F] rounded-lg">
                        <span className="text-[10px] text-[#8D8980] uppercase block">{method}</span>
                        <span className="text-sm font-mono font-bold text-[#F3EFE6]">
                          ₹{Number(amt).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Itemized Line Items */}
            <div>
              <p className="text-xs font-semibold text-[#8D8980] uppercase tracking-wider mb-2">Purchased Watches & Items</p>
              <div className="border border-[#2A261F] rounded-xl overflow-hidden bg-[#12110F]">
                <table className="w-full text-xs">
                  <thead className="bg-[#171613] border-b border-[#2A261F] text-[#8D8980]">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">Description</th>
                      <th className="px-3 py-2.5 text-center font-medium">Qty</th>
                      <th className="px-4 py-2.5 text-right font-medium">Unit Price</th>
                      <th className="px-4 py-2.5 text-right font-medium">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A261F]">
                    {selectedSale.items?.map((item: any) => (
                      <tr key={item.id} className="hover:bg-[#1F1E1A]/50">
                        <td className="px-4 py-3">
                          <p className="font-serif font-bold text-[#F3EFE6]">{item.product_name}</p>
                          <p className="text-[11px] text-[#C9A45C] mt-0.5">{item.product_brand || 'Meghani Watch'}</p>
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-[#F3EFE6] font-semibold">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-mono text-[#8D8980]">{formatCurrency(item.unit_price)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-[#F3EFE6]">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Ledger Calculation */}
            <div className="p-4 bg-[#12110F] border border-[#2A261F] rounded-xl space-y-2.5">
              {Number(selectedSale.discount) > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-[#8D8980]">Discount:</span>
                  <span className="text-rose-400 font-mono font-medium">-{formatCurrency(selectedSale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 border-t border-[#2A261F]">
                <span className="text-sm font-semibold text-[#F3EFE6]">Total Paid:</span>
                <span className="text-xl font-bold font-mono text-[#C9A45C]">{formatCurrency(selectedSale.total_amount)}</span>
              </div>
              
              {isManagement ? (
                <div className="flex justify-between text-xs pt-1 border-t border-[#2A261F]/60">
                  <span className="text-[#8D8980]">Gross Profit:</span>
                  <span className="text-emerald-400 font-mono font-bold">+{formatCurrency(selectedSale.profit)}</span>
                </div>
              ) : (
                <div className="flex justify-between text-xs text-[#8D8980] pt-1 border-t border-[#2A261F]/60">
                  <span>Gross Profit:</span>
                  <span className="font-mono flex items-center gap-1 text-[#8D8980]">
                    <Lock className="w-3 h-3 text-[#C9A45C]" /> Hidden for staff
                  </span>
                </div>
              )}
            </div>

            {selectedSale.notes && (
              <div className="p-3 bg-[#12110F] border border-[#2A261F] rounded-xl">
                <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block mb-0.5">Notes</span>
                <p className="text-xs text-[#F3EFE6]/80">{selectedSale.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#2A261F]">
              <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
              <Button 
                onClick={() => downloadPDF(selectedSale.id, selectedSale.invoice_number)}
                icon={<Download className="w-4 h-4" />}
                className="shadow-gold"
              >
                Download Invoice PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
