'use client'

import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, Package, Wrench, Wallet, Users, Download, Calendar, FileText } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { api } from '@/services/api'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

type ReportType = 'sales' | 'products' | 'repairs' | 'expenses' | 'customers' | 'inventory'

const reportConfig = {
  sales: { title: 'Sales Summary', icon: TrendingUp, color: '#3b82f6' },
  products: { title: 'Product Performance', icon: Package, color: '#10b981' },
  repairs: { title: 'Repair Income', icon: Wrench, color: '#f59e0b' },
  expenses: { title: 'Expense Report', icon: Wallet, color: '#ef4444' },
  customers: { title: 'Customer Loyalty', icon: Users, color: '#8b5cf6' },
  inventory: { title: 'Inventory Status', icon: BarChart3, color: '#06b6d4' },
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('sales')
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchReport()
  }, [activeReport, dateRange])

  const fetchReport = async () => {
    setLoading(true)
    try {
      let url = `/analytics/reports/${activeReport}/`
      if (activeReport !== 'inventory') {
        url += `?start_date=${dateRange.start}&end_date=${dateRange.end}`
      }
      const response = await api.get(url)
      setReportData(response.data)
    } catch (error) {
      console.error('Failed to fetch report:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const response = await api.get(`/analytics/reports/${activeReport}/export/${format}/`, {
        responseType: 'blob',
        params: { start_date: dateRange.start, end_date: dateRange.end }
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const ext = format === 'excel' ? 'xlsx' : format
      link.setAttribute('download', `${activeReport}_report.${ext}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Failed to download:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">View detailed business reports</p>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {(Object.keys(reportConfig) as ReportType[]).map((type) => {
          const config = reportConfig[type]
          const Icon = config.icon
          return (
            <button
              key={type}
              onClick={() => setActiveReport(type)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                activeReport === type
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={{ backgroundColor: activeReport === type ? config.color : undefined }}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{config.title}</span>
              <span className="sm:hidden">{config.title.split(' ')[0]}</span>
            </button>
          )
        })}
      </div>

      {/* Date Range & Export */}
      <div className="card">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <Calendar className="w-5 h-5 text-gray-400 hidden sm:block" />
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              />
              <span className="text-gray-500 text-center text-sm">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            <Button variant="secondary" size="sm" onClick={() => downloadReport('csv')} className="flex-shrink-0">
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={() => downloadReport('excel')} className="flex-shrink-0">
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> Excel
            </Button>
            <Button variant="secondary" size="sm" onClick={() => downloadReport('pdf')} className="flex-shrink-0">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48 sm:h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : reportData ? (
        <div className="space-y-4 sm:space-y-6">
          {/* Sales Report */}
          {activeReport === 'sales' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                <div className="card text-center p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Total Sales</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">{formatCurrency(reportData.summary?.total_sales || 0)}</p>
                </div>
                <div className="card text-center p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Total Profit</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">{formatCurrency(reportData.summary?.total_profit || 0)}</p>
                </div>
                <div className="card text-center p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Transactions</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{reportData.summary?.transaction_count || 0}</p>
                </div>
                <div className="card text-center p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Avg. Sale</p>
                  <p className="text-lg sm:text-2xl font-bold text-purple-600">{formatCurrency(reportData.summary?.average_sale || 0)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2 card p-3 sm:p-4">
                  <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Daily Sales Trend</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={reportData.daily_data || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="sales" stroke="#3b82f6" name="Sales" strokeWidth={2} />
                      <Line type="monotone" dataKey="profit" stroke="#10b981" name="Profit" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="card p-3 sm:p-4">
                  <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">By Payment Mode</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={Object.entries(reportData.by_payment_mode || {}).map(([key, value]) => ({ name: key.toUpperCase(), value }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {Object.keys(reportData.by_payment_mode || {}).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* Products Report */}
          {activeReport === 'products' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="card p-3 sm:p-4">
                  <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Top Selling Products</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={(reportData.top_sellers || []).slice(0, 5)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="product__name" type="category" width={80} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => v} />
                      <Bar dataKey="sold" fill="#10b981" name="Units Sold" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="card p-3 sm:p-4">
                  <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Revenue by Category</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={Object.entries(reportData.by_category || {}).map(([key, value]: [string, any]) => ({ name: key, value: value.revenue }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        dataKey="value"
                        label={({ name }) => name}
                        labelLine={false}
                      >
                        {Object.keys(reportData.by_category || {}).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card p-3 sm:p-4">
                <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Slow Moving Products (No Sales)</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                  {(reportData.slow_movers || []).map((product: any) => (
                    <div key={product.id} className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{product.name}</p>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{product.brand}</p>
                      <p className="text-xs sm:text-sm">Stock: {product.stock}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Repairs Report */}
          {activeReport === 'repairs' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                <div className="card text-center p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Total Repairs</p>
                  <p className="text-lg sm:text-2xl font-bold text-orange-600">{reportData.summary?.total_repairs || 0}</p>
                </div>
                <div className="card text-center p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Revenue</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">{formatCurrency(reportData.summary?.total_revenue || 0)}</p>
                </div>
                <div className="card text-center p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Completed</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">{reportData.summary?.completed || 0}</p>
                </div>
                <div className="card text-center p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Pending</p>
                  <p className="text-lg sm:text-2xl font-bold text-yellow-600">{reportData.summary?.pending || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="card p-3 sm:p-4">
                  <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">By Status</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={Object.entries(reportData.by_status || {}).map(([key, value]) => ({ name: key, value }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        dataKey="value"
                        label
                        labelLine={false}
                      >
                        {Object.keys(reportData.by_status || {}).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="card p-3 sm:p-4">
                  <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">By Item Type</h3>
                  <div className="space-y-2 sm:space-y-3 max-h-56 overflow-y-auto">
                    {(reportData.by_item_type || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-sm sm:text-base truncate mr-2">{item.item_type}</span>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-sm sm:text-base">{item.count} repairs</p>
                          <p className="text-xs sm:text-sm text-green-600">{formatCurrency(item.revenue || 0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Expenses Report */}
          {activeReport === 'expenses' && (
            <>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="card text-center p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Total Expenses</p>
                  <p className="text-base sm:text-2xl font-bold text-red-600">{formatCurrency(reportData.summary?.total_expenses || 0)}</p>
                </div>
                <div className="card text-center p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Sales Profit</p>
                  <p className="text-base sm:text-2xl font-bold text-green-600">{formatCurrency(reportData.summary?.sales_profit || 0)}</p>
                </div>
                <div className="card text-center p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Net Profit</p>
                  <p className={`text-base sm:text-2xl font-bold ${(reportData.summary?.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(reportData.summary?.net_profit || 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="card p-3 sm:p-4">
                  <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Expenses by Category</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={Object.entries(reportData.by_category || {}).map(([key, value]: [string, any]) => ({ name: key, value: value.total }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        dataKey="value"
                        label
                        labelLine={false}
                      >
                        {Object.keys(reportData.by_category || {}).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="card p-3 sm:p-4">
                  <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Daily Expenses</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={reportData.daily_data || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Bar dataKey="total" fill="#ef4444" name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* Customers Report */}
          {activeReport === 'customers' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                <div className="card text-center p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Total</p>
                  <p className="text-lg sm:text-2xl font-bold text-purple-600">{reportData.summary?.total_customers || 0}</p>
                </div>
                <div className="card text-center p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">New</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">{reportData.summary?.new_customers || 0}</p>
                </div>
                <div className="card text-center p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Repeat</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">{reportData.summary?.repeat_rate || 0}%</p>
                </div>
                <div className="card text-center p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Points</p>
                  <p className="text-lg sm:text-2xl font-bold text-yellow-600">{reportData.summary?.total_loyalty_points || 0}</p>
                </div>
              </div>

              <div className="card p-3 sm:p-4">
                <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Top Customers by Spending</h3>
                <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <table className="w-full min-w-[400px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-2 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-2 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Phone</th>
                        <th className="px-2 sm:px-4 py-2 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Spent</th>
                        <th className="px-2 sm:px-4 py-2 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(reportData.top_customers || []).map((customer: any, idx: number) => (
                        <tr key={customer.id}>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{idx + 1}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm">{customer.name}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-500 text-xs sm:text-sm hidden sm:table-cell">{customer.phone}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-bold text-green-600 text-xs sm:text-sm">{formatCurrency(customer.spent)}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm">{customer.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Inventory Report */}
          {activeReport === 'inventory' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                <div className="card text-center p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Products</p>
                  <p className="text-lg sm:text-2xl font-bold text-cyan-600">{reportData.summary?.total_products || 0}</p>
                </div>
                <div className="card text-center p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Stock Value</p>
                  <p className="text-base sm:text-2xl font-bold text-blue-600">{formatCurrency(reportData.summary?.stock_cost_value || 0)}</p>
                </div>
                <div className="card text-center p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Low Stock</p>
                  <p className="text-lg sm:text-2xl font-bold text-yellow-600">{reportData.summary?.low_stock_count || 0}</p>
                </div>
                <div className="card text-center p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Out of Stock</p>
                  <p className="text-lg sm:text-2xl font-bold text-red-600">{reportData.summary?.out_of_stock_count || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="card p-3 sm:p-4">
                  <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Stock by Category</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={Object.entries(reportData.by_category || {}).map(([key, value]: [string, any]) => ({ category: key, stock: value.stock, value: value.value }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="stock" fill="#06b6d4" name="Units" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="card p-3 sm:p-4">
                  <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    Low Stock Alert
                  </h3>
                  <div className="space-y-2 max-h-56 sm:max-h-64 overflow-y-auto">
                    {(reportData.low_stock_items || []).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-2 sm:p-3 bg-yellow-50 rounded-lg">
                        <div className="min-w-0 mr-2">
                          <p className="font-medium text-sm sm:text-base truncate">{item.name}</p>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">{item.brand}</p>
                        </div>
                        <Badge variant="warning">{item.stock} left</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="card text-center py-10 sm:py-12">
          <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-sm sm:text-base text-gray-500">No data available</p>
        </div>
      )}
    </div>
  )
}
