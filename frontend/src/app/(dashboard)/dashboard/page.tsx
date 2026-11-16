'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, ShoppingCart, Wrench, AlertTriangle, 
  IndianRupee, Package, Clock, RefreshCw, ChevronRight
} from 'lucide-react'
import { api } from '@/services/api'
import StatsCard from '@/components/features/dashboard/StatsCard'
import RecentSales from '@/components/features/dashboard/RecentSales'
import RepairQueue from '@/components/features/dashboard/RepairQueue'
import SalesChart from '@/components/features/dashboard/SalesChart'
import AIInsights from '@/components/features/dashboard/AIInsights'
import AlertsWidget from '@/components/features/dashboard/AlertsWidget'
import clsx from 'clsx'

interface DashboardStats {
  today: {
    sales: number
    profit: number
    transactions: number
  }
  month: {
    sales: number
    profit: number
    transactions: number
  }
  alerts: {
    pending_repairs: number
    low_stock_items: number
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const response = await api.get('/analytics/dashboard/stats/')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Skeleton loader */}
        <div className="animate-pulse">
          <div className="h-8 sm:h-10 w-48 sm:w-64 bg-gray-200 rounded-xl mb-2"></div>
          <div className="h-4 sm:h-5 w-64 sm:w-96 bg-gray-100 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 sm:h-36 bg-gray-100 rounded-xl sm:rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{greeting}!</h1>
          </div>
          <p className="text-sm sm:text-base text-gray-500 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Here&apos;s what&apos;s happening with your business today</span>
            <span className="sm:hidden">Today&apos;s overview</span>
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-200 
                   rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 
                   hover:border-gray-300 transition-all duration-200 shadow-sm"
        >
          <RefreshCw className={clsx('w-3.5 h-3.5 sm:w-4 sm:h-4', refreshing && 'animate-spin')} />
          Refresh
        </motion.button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatsCard
          title="Today's Sales"
          value={formatCurrency(stats?.today.sales || 0)}
          icon={<IndianRupee className="w-5 h-5 sm:w-6 sm:h-6" />}
          trend={{ value: 12, isPositive: true }}
          color="blue"
          delay={0}
        />
        <StatsCard
          title="Today's Profit"
          value={formatCurrency(stats?.today.profit || 0)}
          icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />}
          trend={{ value: 8, isPositive: true }}
          color="green"
          delay={0.1}
        />
        <StatsCard
          title="Pending Repairs"
          value={stats?.alerts.pending_repairs?.toString() || '0'}
          icon={<Wrench className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="orange"
          delay={0.2}
        />
        <StatsCard
          title="Low Stock"
          value={stats?.alerts.low_stock_items?.toString() || '0'}
          icon={<AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="red"
          delay={0.3}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-xl lg:rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-card"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Sales Trend</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Last 30 days performance</p>
            </div>
            <button className="self-start sm:self-auto inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-700">
              View details
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
          <div className="h-48 sm:h-64 lg:h-auto">
            <SalesChart />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-white rounded-xl lg:rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-card"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Monthly Summary</h3>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              This Month
            </span>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg sm:rounded-xl cursor-pointer transition-all"
            >
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                  {formatCurrency(stats?.month.sales || 0)}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-lg sm:rounded-xl cursor-pointer transition-all"
            >
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Profit</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                  {formatCurrency(stats?.month.profit || 0)}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-lg sm:rounded-xl cursor-pointer transition-all"
            >
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                  {stats?.month.transactions || 0}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Alerts Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <AlertsWidget />
      </motion.div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <RecentSales />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          <RepairQueue />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.9 }}
          className="md:col-span-2 lg:col-span-1"
        >
          <AIInsights />
        </motion.div>
      </div>
    </div>
  )
}
