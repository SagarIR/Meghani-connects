'use client'

import { useEffect, useState, useMemo } from 'react'
import { 
  BarChart3, TrendingUp, Package, Wrench, Wallet, Users, Download, 
  Calendar, FileText, Lock, ShieldCheck, ArrowUpRight, DollarSign,
  PieChart as PieChartIcon, Layers
} from 'lucide-react'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import clsx from 'clsx'
import toast from 'react-hot-toast'

type ReportType = 'sales' | 'products' | 'repairs' | 'expenses' | 'customers' | 'inventory'

const reportConfig = {
  sales: { title: 'Sales & Revenue', icon: TrendingUp },
  products: { title: 'Product Sales', icon: Package },
  repairs: { title: 'Watch Repair Income', icon: Wrench },
  expenses: { title: 'Store Expenses', icon: Wallet },
  customers: { title: 'Customer & Loyalty', icon: Users },
  inventory: { title: 'Stock & Inventory Value', icon: BarChart3 },
}

const LUXURY_PALETTE = ['#C9A45C', '#10b981', '#E8D5A7', '#38bdf8', '#fbbf24', '#f43f5e']

export default function ReportsPage() {
  const { user } = useAuth()
  const isManagement = user?.role === 'admin' || user?.role === 'manager'

  const [activeReport, setActiveReport] = useState<ReportType>('sales')
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null)
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
      toast.error('Failed to compile report metrics')
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = async (format: 'csv' | 'excel' | 'pdf') => {
    setDownloadingFormat(format)
    try {
      const response = await api.get(`/analytics/reports/${activeReport}/export/${format}/`, {
        responseType: 'blob',
        params: { start_date: dateRange.start, end_date: dateRange.end }
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const ext = format === 'excel' ? 'xlsx' : format
      link.setAttribute('download', `Meghani_${activeReport}_report_${new Date().toISOString().split('T')[0]}.${ext}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success(`${format.toUpperCase()} report exported successfully`)
    } catch (error) {
      console.error('Failed to download report:', error)
      toast.error(`Failed to export ${format.toUpperCase()} report`)
    } finally {
      setDownloadingFormat(null)
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#171613] border border-[#2A261F] rounded-xl flex items-center justify-center shadow-md">
            <BarChart3 className="w-5 h-5 text-[#C9A45C]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-serif font-bold text-[#F3EFE6] tracking-tight">Reports & Analytics</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F1E1A] text-[#C9A45C] border border-[#2A261F] font-mono">
                Real-Time
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8D8980]">Sales performance, product trends, repairs, expenses, and inventory reports</p>
          </div>
        </div>

        {/* Date Filter & Export Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeReport !== 'inventory' && (
            <div className="flex items-center gap-2 bg-[#171613] border border-[#2A261F] rounded-xl px-3 py-1.5 shadow-sm">
              <Calendar className="w-4 h-4 text-[#C9A45C] flex-shrink-0" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="bg-transparent text-xs text-[#F3EFE6] font-mono outline-none cursor-pointer"
              />
              <span className="text-xs text-[#8D8980]">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="bg-transparent text-xs text-[#F3EFE6] font-mono outline-none cursor-pointer"
              />
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => downloadReport('excel')}
              loading={downloadingFormat === 'excel'}
              className="text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Excel
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => downloadReport('csv')}
              loading={downloadingFormat === 'csv'}
              className="text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-[#C9A45C]" /> CSV
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => downloadReport('pdf')}
              loading={downloadingFormat === 'pdf'}
              className="text-xs"
            >
              <FileText className="w-3.5 h-3.5 mr-1 text-rose-400" /> PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {(Object.keys(reportConfig) as ReportType[]).map((type) => {
          const config = reportConfig[type]
          const Icon = config.icon
          const isActive = activeReport === type

          return (
            <button
              key={type}
              onClick={() => setActiveReport(type)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all text-xs whitespace-nowrap border',
                isActive
                  ? 'bg-[#C9A45C] text-[#0B0B0A] border-[#C9A45C] font-bold shadow-gold'
                  : 'bg-[#171613] text-[#8D8980] border-[#2A261F] hover:text-[#F3EFE6] hover:bg-[#1F1E1A]'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{config.title}</span>
            </button>
          )
        })}
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-16 text-center">
          <div className="w-8 h-8 border-2 border-[#C9A45C] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-[#8D8980]">Loading report data...</p>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* TAB 1: Sales & Revenue */}
          {activeReport === 'sales' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
                  <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block">Total Sales</span>
                  <p className="text-xl sm:text-2xl font-bold font-mono text-[#C9A45C] mt-1">
                    {formatCurrency(reportData.summary?.total_sales || 0)}
                  </p>
                </div>

                <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
                  <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block">Gross Profit</span>
                  {isManagement ? (
                    <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">
                      +{formatCurrency(reportData.summary?.total_profit || 0)}
                    </p>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-[#8D8980] font-mono">
                      <Lock className="w-3.5 h-3.5 text-[#C9A45C]" />
                      <span>Hidden for Staff</span>
                    </div>
                  )}
                </div>

                <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
                  <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block">Total Invoices</span>
                  <p className="text-xl sm:text-2xl font-bold font-mono text-[#F3EFE6] mt-1">
                    {reportData.summary?.transaction_count || 0}
                  </p>
                </div>

                <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
                  <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block">Average Sale</span>
                  <p className="text-xl sm:text-2xl font-bold font-mono text-[#E8D5A7] mt-1">
                    {formatCurrency(reportData.summary?.average_sale || 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#171613] rounded-2xl border border-[#2A261F] p-5 shadow-xl">
                  <h3 className="font-serif font-bold text-base text-[#F3EFE6] mb-4">Daily Sales & Profit Trend</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={reportData.daily_data || []}>
                        <CartesianGrid stroke="#2A261F" strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#8D8980" 
                          tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} 
                          tick={{ fontSize: 10 }} 
                        />
                        <YAxis stroke="#8D8980" tick={{ fontSize: 10 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#171613', borderColor: '#2A261F', borderRadius: '12px', color: '#F3EFE6' }}
                          formatter={(v: number) => formatCurrency(v)} 
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Line type="monotone" dataKey="sales" stroke="#C9A45C" name="Sales" strokeWidth={2.5} dot={false} />
                        {isManagement && (
                          <Line type="monotone" dataKey="profit" stroke="#10b981" name="Profit" strokeWidth={2} dot={false} />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-5 shadow-xl">
                  <h3 className="font-serif font-bold text-base text-[#F3EFE6] mb-4">Payment Method Breakdown</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(reportData.by_payment_mode || {}).map(([key, value]) => ({ name: key.toUpperCase(), value }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          dataKey="value"
                        >
                          {Object.keys(reportData.by_payment_mode || {}).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={LUXURY_PALETTE[index % LUXURY_PALETTE.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#171613', borderColor: '#2A261F', borderRadius: '12px', color: '#F3EFE6' }}
                          formatter={(v: number) => formatCurrency(v)} 
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: Product Sales */}
          {activeReport === 'products' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-5 shadow-xl">
                  <h3 className="font-serif font-bold text-base text-[#F3EFE6] mb-4">Top Selling Watches</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(reportData.top_sellers || []).slice(0, 5)} layout="vertical">
                        <CartesianGrid stroke="#2A261F" strokeDasharray="3 3" />
                        <XAxis type="number" stroke="#8D8980" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="product__name" type="category" width={110} stroke="#8D8980" tick={{ fontSize: 10 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#171613', borderColor: '#2A261F', borderRadius: '12px', color: '#F3EFE6' }}
                        />
                        <Bar dataKey="sold" fill="#C9A45C" name="Units Sold" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-5 shadow-xl">
                  <h3 className="font-serif font-bold text-base text-[#F3EFE6] mb-4">Revenue by Category</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(reportData.by_category || {}).map(([key, value]: [string, any]) => ({ name: key, value: value.revenue }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          dataKey="value"
                        >
                          {Object.keys(reportData.by_category || {}).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={LUXURY_PALETTE[index % LUXURY_PALETTE.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#171613', borderColor: '#2A261F', borderRadius: '12px', color: '#F3EFE6' }}
                          formatter={(v: number) => formatCurrency(v)} 
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Slow Moving Stock */}
              <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-5 shadow-xl">
                <h3 className="font-serif font-bold text-base text-[#F3EFE6] mb-3">Slow-Moving Stock (No Sales in Period)</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {(reportData.slow_movers || []).map((product: any) => (
                    <div key={product.id} className="p-3 bg-[#12110F] border border-[#2A261F] rounded-xl">
                      <p className="font-medium text-sm text-[#F3EFE6] truncate">{product.name}</p>
                      <p className="text-xs text-[#C9A45C] mt-0.5 truncate">{product.brand}</p>
                      <span className="text-[11px] font-mono text-[#8D8980] block mt-1">Stock: {product.stock} units</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TAB 3: Watch Repair Income */}
          {activeReport === 'repairs' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
                  <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block">Repair Tickets</span>
                  <p className="text-xl sm:text-2xl font-bold font-mono text-[#F3EFE6] mt-1">{reportData.summary?.total_repairs || 0}</p>
                </div>
                <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
                  <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block">Repair Revenue</span>
                  <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">{formatCurrency(reportData.summary?.total_revenue || 0)}</p>
                </div>
                <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
                  <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block">Completed Repairs</span>
                  <p className="text-xl sm:text-2xl font-bold font-mono text-sky-400 mt-1">{reportData.summary?.completed || 0}</p>
                </div>
                <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
                  <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block">Repairs in Progress</span>
                  <p className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-1">{reportData.summary?.pending || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-5 shadow-xl">
                  <h3 className="font-serif font-bold text-base text-[#F3EFE6] mb-4">Tickets by Status</h3>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(reportData.by_status || {}).map(([key, value]) => ({ name: key.toUpperCase(), value }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          dataKey="value"
                        >
                          {Object.keys(reportData.by_status || {}).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={LUXURY_PALETTE[index % LUXURY_PALETTE.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#171613', borderColor: '#2A261F', borderRadius: '12px', color: '#F3EFE6' }} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-5 shadow-xl">
                  <h3 className="font-serif font-bold text-base text-[#F3EFE6] mb-4">Revenue by Item Type</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(reportData.by_item_type || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-[#12110F] border border-[#2A261F] rounded-xl text-xs">
                        <span className="font-medium text-[#F3EFE6]">{item.item_type}</span>
                        <div className="text-right">
                          <p className="font-mono text-[#8D8980]">{item.count} repairs</p>
                          <p className="font-mono font-bold text-emerald-400">{formatCurrency(item.revenue || 0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 4: Expenses & Overheads */}
          {activeReport === 'expenses' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg text-center">
                  <span className="text-xs text-[#8D8980] uppercase tracking-wider block">Operating Expenses</span>
                  <p className="text-2xl font-bold font-mono text-rose-400 mt-1">{formatCurrency(reportData.summary?.total_expenses || 0)}</p>
                </div>
                <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg text-center">
                  <span className="text-xs text-[#8D8980] uppercase tracking-wider block">Sales Gross Profit</span>
                  {isManagement ? (
                    <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{formatCurrency(reportData.summary?.sales_profit || 0)}</p>
                  ) : (
                    <p className="text-xs font-mono text-[#8D8980] mt-3">Hidden for Staff</p>
                  )}
                </div>
                <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg text-center">
                  <span className="text-xs text-[#8D8980] uppercase tracking-wider block">Net Profit</span>
                  {isManagement ? (
                    <p className={`text-2xl font-bold font-mono mt-1 ${(reportData.summary?.net_profit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(reportData.summary?.net_profit || 0)}
                    </p>
                  ) : (
                    <p className="text-xs font-mono text-[#8D8980] mt-3">Hidden for Staff</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-5 shadow-xl">
                  <h3 className="font-serif font-bold text-base text-[#F3EFE6] mb-4">Expenses by Category</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(reportData.by_category || {}).map(([key, value]: [string, any]) => ({ name: key.toUpperCase(), value: value.total }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          dataKey="value"
                        >
                          {Object.keys(reportData.by_category || {}).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={LUXURY_PALETTE[index % LUXURY_PALETTE.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#171613', borderColor: '#2A261F', borderRadius: '12px', color: '#F3EFE6' }}
                          formatter={(v: number) => formatCurrency(v)} 
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-5 shadow-xl">
                  <h3 className="font-serif font-bold text-base text-[#F3EFE6] mb-4">Daily Expenses</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.daily_data || []}>
                        <CartesianGrid stroke="#2A261F" strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#8D8980" 
                          tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} 
                          tick={{ fontSize: 10 }} 
                        />
                        <YAxis stroke="#8D8980" tick={{ fontSize: 10 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#171613', borderColor: '#2A261F', borderRadius: '12px', color: '#F3EFE6' }}
                          formatter={(v: number) => formatCurrency(v)} 
                        />
                        <Bar dataKey="total" fill="#f43f5e" name="Expenses" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 5: Customers & Loyalty */}
          {activeReport === 'customers' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
                  <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block">Total Customers</span>
                  <p className="text-2xl font-bold font-mono text-[#F3EFE6] mt-1">{reportData.summary?.total_customers || 0}</p>
                </div>
                <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
                  <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block">New Customers</span>
                  <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{reportData.summary?.new_customers || 0}</p>
                </div>
                <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
                  <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block">Repeat Customer Rate</span>
                  <p className="text-2xl font-bold font-mono text-[#C9A45C] mt-1">{reportData.summary?.repeat_rate || 0}%</p>
                </div>
                <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
                  <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block">Total Loyalty Points</span>
                  <p className="text-2xl font-bold font-mono text-[#E8D5A7] mt-1">{(reportData.summary?.total_loyalty_points || 0).toLocaleString()} pts</p>
                </div>
              </div>

              <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-5 shadow-xl">
                <h3 className="font-serif font-bold text-base text-[#F3EFE6] mb-4">Top Customers by Total Spend</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[550px]">
                    <thead className="bg-[#12110F] border-b border-[#2A261F] text-[#8D8980]">
                      <tr>
                        <th className="px-4 py-2.5 text-left">#</th>
                        <th className="px-4 py-2.5 text-left">Customer Name</th>
                        <th className="px-4 py-2.5 text-left">Phone</th>
                        <th className="px-4 py-2.5 text-right">Total Spend</th>
                        <th className="px-4 py-2.5 text-right">Loyalty Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A261F]">
                      {(reportData.top_customers || []).map((customer: any, idx: number) => (
                        <tr key={customer.id} className="hover:bg-[#1F1E1A]">
                          <td className="px-4 py-3 font-mono text-[#8D8980]">{idx + 1}</td>
                          <td className="px-4 py-3 font-serif font-bold text-[#F3EFE6]">{customer.name}</td>
                          <td className="px-4 py-3 font-mono text-[#8D8980]">{customer.phone}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-[#C9A45C]">{formatCurrency(customer.spent)}</td>
                          <td className="px-4 py-3 text-right font-mono text-[#E8D5A7]">{customer.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 6: Stock & Inventory Value */}
          {activeReport === 'inventory' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
                  <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block">Total Products</span>
                  <p className="text-2xl font-bold font-mono text-[#F3EFE6] mt-1">{reportData.summary?.total_products || 0}</p>
                </div>
                <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
                  <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block">Total Stock Value</span>
                  {isManagement ? (
                    <p className="text-xl sm:text-2xl font-bold font-mono text-[#C9A45C] mt-1">
                      {formatCurrency(reportData.summary?.stock_cost_value || 0)}
                    </p>
                  ) : (
                    <p className="text-xs font-mono text-[#8D8980] mt-3">Hidden for Staff</p>
                  )}
                </div>
                <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
                  <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block">Low Stock Items</span>
                  <p className="text-2xl font-bold font-mono text-amber-400 mt-1">{reportData.summary?.low_stock_count || 0}</p>
                </div>
                <div className="bg-[#171613] rounded-2xl p-4 border border-[#2A261F] shadow-lg">
                  <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block">Out of Stock Items</span>
                  <p className="text-2xl font-bold font-mono text-rose-400 mt-1">{reportData.summary?.out_of_stock_count || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-5 shadow-xl">
                  <h3 className="font-serif font-bold text-base text-[#F3EFE6] mb-4">Stock Distribution by Category</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(reportData.by_category || {}).map(([key, value]: [string, any]) => ({ category: key, stock: value.stock }))}>
                        <CartesianGrid stroke="#2A261F" strokeDasharray="3 3" />
                        <XAxis dataKey="category" stroke="#8D8980" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#8D8980" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#171613', borderColor: '#2A261F', borderRadius: '12px', color: '#F3EFE6' }} />
                        <Bar dataKey="stock" fill="#C9A45C" name="Stock Units" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-5 shadow-xl">
                  <h3 className="font-serif font-bold text-base text-[#F3EFE6] mb-4">Low Stock Reorder Alerts</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {(reportData.low_stock_items || []).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-[#12110F] border border-[#2A261F] rounded-xl text-xs">
                        <div className="min-w-0">
                          <p className="font-medium text-[#F3EFE6] truncate">{item.name}</p>
                          <p className="text-[11px] text-[#C9A45C] mt-0.5">{item.brand}</p>
                        </div>
                        <span className="font-mono font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
                          {item.stock} in stock
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-16 text-center">
          <p className="text-sm text-[#8D8980]">No report records retrieved for the selected parameters.</p>
        </div>
      )}
    </div>
  )
}
