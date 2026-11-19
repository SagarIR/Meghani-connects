'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, ShoppingCart, Wrench, AlertTriangle, 
  IndianRupee, Package, Clock, RefreshCw, ChevronRight,
  Plus, Users, Sparkles, Shield
} from 'lucide-react'
import Link from 'next/link'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
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
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening'

  const isManagement = user?.role === 'admin' || user?.role === 'manager'

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
      <div className="space-y-6">
        <div className="h-24 bg-[#171613] border border-[#2A261F] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[#171613] border border-[#2A261F] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 lg:space-y-8 text-[#F3EFE6]">
      {/* Executive Welcome & Live Operational Status */}
      <div className="bg-[#171613] border border-[#2A261F] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#C9A45C]">
              Vadodara Store
            </span>
            <span className="text-[#8D8980]">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Register
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F3EFE6] tracking-wide">
            {greeting}, {user?.name || user?.username || 'Staff'}
          </h1>
          <p className="text-xs sm:text-sm text-[#8D8980] mt-0.5">
            Overview of today&apos;s sales, store transactions, and watch repair queue.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <Link
            href="/sales"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C9A45C] via-[#DFC17B] to-[#C9A45C] text-[#0B0B0A] font-bold text-xs shadow-md shadow-[#C9A45C]/20 hover:brightness-105 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Open POS (F4)</span>
          </Link>
          <Link
            href="/repairs"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1F1E1A] hover:bg-[#282620] border border-[#2A261F] hover:border-[#C9A45C]/40 text-[#F3EFE6] text-xs font-medium transition-all"
          >
            <Wrench className="w-3.5 h-3.5 text-[#C9A45C]" />
            <span>New Repair Ticket</span>
          </Link>
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-[#1F1E1A] hover:bg-[#282620] border border-[#2A261F] text-[#8D8980] hover:text-[#F3EFE6] transition-all"
            title="Refresh dashboard stats"
          >
            <RefreshCw className={clsx('w-4 h-4', refreshing && 'animate-spin text-[#C9A45C]')} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatsCard
          title="Today's Total Sales"
          value={formatCurrency(stats?.today.sales || 0)}
          icon={<IndianRupee className="w-5 h-5" />}
          trend={{ value: 12, isPositive: true }}
          color="gold"
          delay={0}
        />
        <StatsCard
          title="Gross Profit"
          value={isManagement ? formatCurrency(stats?.today.profit || 0) : 'Confidential'}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={isManagement ? { value: 8, isPositive: true } : undefined}
          color="green"
          delay={0.1}
        />
        <StatsCard
          title="Watch Repairs Queue"
          value={stats?.alerts.pending_repairs?.toString() || '0'}
          icon={<Wrench className="w-5 h-5" />}
          color="orange"
          delay={0.2}
        />
        <StatsCard
          title="Low Stock Items"
          value={stats?.alerts.low_stock_items?.toString() || '0'}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
          delay={0.3}
        />
      </div>

      {/* Performance Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* 30-Day Sales Trend Chart */}
        <div className="lg:col-span-2 bg-[#171613] rounded-2xl border border-[#2A261F] p-4 sm:p-6 shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C9A45C]" />
                <h3 className="font-serif font-bold text-base sm:text-lg text-[#F3EFE6]">30-Day Sales Trend</h3>
              </div>
              <p className="text-xs text-[#8D8980] mt-0.5">Daily sales revenue and transaction volume</p>
            </div>
            <Link
              href="/reports"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#C9A45C] hover:text-[#E8D5A7] transition-colors"
            >
              <span>View full reports</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="h-56 sm:h-64 lg:h-72">
            <SalesChart />
          </div>
        </div>

        {/* Monthly Summary Ledger */}
        <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-4 sm:p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#F3EFE6]">Monthly Sales Summary</h3>
              <p className="text-xs text-[#8D8980]">Current month sales and profit metrics</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#C9A45C] bg-[#C9A45C]/15 border border-[#C9A45C]/30 px-2.5 py-1 rounded-full uppercase">
              This Month
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-[#12110F] border border-[#2A261F] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8D8980]">Total Sales</p>
                <p className="font-serif text-xl sm:text-2xl font-bold text-[#F3EFE6] mt-0.5">
                  {formatCurrency(stats?.month.sales || 0)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#1F1E1A] border border-[#C9A45C]/40 flex items-center justify-center text-[#C9A45C]">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>

            <div className="p-3.5 bg-[#12110F] border border-[#2A261F] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8D8980]">Gross Profit</p>
                <p className="font-serif text-xl sm:text-2xl font-bold text-emerald-400 mt-0.5">
                  {isManagement ? formatCurrency(stats?.month.profit || 0) : 'Hidden for Staff'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="p-3.5 bg-[#12110F] border border-[#2A261F] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8D8980]">Total Transactions</p>
                <p className="font-serif text-xl sm:text-2xl font-bold text-[#F3EFE6] mt-0.5">
                  {stats?.month.transactions || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#1F1E1A] border border-[#2A261F] flex items-center justify-center text-[#8D8980]">
                <Package className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Alerts Drawer */}
      <AlertsWidget />

      {/* Bottom Activity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <RecentSales />
        <RepairQueue />
        <div className="md:col-span-2 lg:col-span-1">
          <AIInsights />
        </div>
      </div>
    </div>
  )
}
