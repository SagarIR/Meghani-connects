'use client'

import { useEffect, useState } from 'react'
import { Search, Calendar, Download, Eye, ShoppingCart } from 'lucide-react'
import { api } from '@/services/api'
import { Sale } from '@/types'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Link from 'next/link'

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  })
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    fetchSales()
  }, [dateRange])

  const fetchSales = async () => {
    try {
      let url = '/sales/?'
      if (dateRange.start) url += `start_date=${dateRange.start}&`
      if (dateRange.end) url += `end_date=${dateRange.end}&`
      
      const response = await api.get(url)
      setSales(response.data.results || response.data)
    } catch (error) {
      console.error('Failed to fetch sales:', error)
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
    }
  }

  const downloadPDF = async (saleId: number, invoiceNumber: string) => {
    try {
      const response = await api.get(`/sales/${saleId}/invoice/pdf/`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `invoice_${invoiceNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download PDF:', error)
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
    })
  }

  const paymentBadges: Record<string, 'success' | 'info' | 'warning' | 'default'> = {
    cash: 'success',
    upi: 'info',
    card: 'warning',
    mixed: 'default',
  }

  const filteredSales = sales.filter(sale =>
    sale.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    sale.customer_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
          <p className="text-gray-500 mt-1">View all past transactions</p>
        </div>
        <Link href="/sales">
          <Button>
            <ShoppingCart className="w-4 h-4 mr-2" />
            New Sale
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Sales Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="card text-center py-12">
          <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No sales found</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSales.map((sale: any) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-primary-600">{sale.invoice_number}</td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900">{sale.customer_name || 'Walk-in'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900">{formatDate(sale.sale_date)}</p>
                    <p className="text-sm text-gray-500">{formatTime(sale.sale_date)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={paymentBadges[sale.payment_mode]}>
                      {sale.payment_mode.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">
                    {formatCurrency(sale.total_amount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => viewSaleDetail(sale.id)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => downloadPDF(sale.id, sale.invoice_number)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sale Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Invoice: ${selectedSale?.invoice_number}`}
        size="lg"
      >
        {selectedSale && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{selectedSale.customer_name || 'Walk-in'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{formatDate(selectedSale.sale_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Mode</p>
                <Badge variant={paymentBadges[selectedSale.payment_mode]}>
                  {selectedSale.payment_mode.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created By</p>
                <p className="font-medium">{selectedSale.created_by_name}</p>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Items</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Price</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedSale.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-gray-500">{item.product_brand}</p>
                        </td>
                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              {selectedSale.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="text-red-600">-{formatCurrency(selectedSale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary-600">{formatCurrency(selectedSale.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Profit</span>
                <span>+{formatCurrency(selectedSale.profit)}</span>
              </div>
            </div>

            {selectedSale.notes && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-gray-700">{selectedSale.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Close</Button>
              <Button onClick={() => downloadPDF(selectedSale.id, selectedSale.invoice_number)}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
