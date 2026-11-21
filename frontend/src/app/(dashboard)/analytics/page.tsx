'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, PackageSearch, AlertTriangle, Users, Sparkles, 
  ShieldCheck, RefreshCw, Calendar, ArrowUpRight, ArrowDownRight, 
  CheckCircle2, XCircle, Clock, Search, Filter, ShieldAlert,
  ChevronRight, Info, Layers, BarChart3, DollarSign, Send,
  HelpCircle, Eye, AlertCircle, Award, Compass, PieChart as PieChartIcon
} from 'lucide-react'
import { 
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { usePreferences } from '@/context/PreferencesContext'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import clsx from 'clsx'
import toast from 'react-hot-toast'

type ActiveTab = 'forecasting' | 'reorder' | 'abc' | 'anomalies' | 'crm' | 'assistant' | 'audit'

const LUXURY_PALETTE = ['#C9A45C', '#10b981', '#E8D5A7', '#38bdf8', '#fbbf24', '#f43f5e']

export default function AnalyticsSuitePage() {
  const { user } = useAuth()
  const { t } = usePreferences()
  const isManager = user?.role === 'admin' || user?.role === 'manager'

  const [activeTab, setActiveTab] = useState<ActiveTab>('forecasting')
  const [loading, setLoading] = useState(false)

  // 1. Forecasting State
  const [forecastHorizon, setForecastHorizon] = useState<30 | 60 | 90>(30)
  const [forecastData, setForecastData] = useState<any>(null)

  // 2. Smart Reorder State
  const [reorderData, setReorderData] = useState<any>(null)
  const [reorderFilter, setReorderFilter] = useState('pending')
  const [selectedReorderExplanation, setSelectedReorderExplanation] = useState<any>(null)

  // 3. ABC Classification State
  const [abcData, setAbcData] = useState<any>(null)
  const [abcSearch, setAbcSearch] = useState('')
  const [abcClassFilter, setAbcClassFilter] = useState('all')

  // 4. Anomaly Radar State
  const [anomalyData, setAnomalyData] = useState<any>(null)
  const [anomalyFilter, setAnomalyFilter] = useState('open')

  // 5. CRM Intelligence State
  const [crmData, setCrmData] = useState<any>(null)

  // 6. AI Business Assistant State
  const [assistantQuery, setAssistantQuery] = useState('')
  const [assistantLoading, setAssistantLoading] = useState(false)
  const [assistantConversation, setAssistantConversation] = useState<any[]>([])

  // 7. Audit Timeline State
  const [auditData, setAuditData] = useState<any>(null)

  // Initial Data Fetch
  useEffect(() => {
    if (activeTab === 'forecasting') fetchForecast()
    if (activeTab === 'reorder') fetchReorder()
    if (activeTab === 'abc') fetchAbc()
    if (activeTab === 'anomalies') fetchAnomalies()
    if (activeTab === 'crm') fetchCrm()
    if (activeTab === 'audit') fetchAudit()
  }, [activeTab, forecastHorizon, reorderFilter, anomalyFilter])

  // --- API FETCHERS ---

  const fetchForecast = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/analytics/ai/forecast/advanced/?horizon=${forecastHorizon}`)
      setForecastData(res.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load sales forecast')
    } finally {
      setLoading(false)
    }
  }

  const fetchReorder = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/analytics/ai/reorder/?status=${reorderFilter}`)
      setReorderData(res.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load reorder recommendations')
    } finally {
      setLoading(false)
    }
  }

  const handleReorderAction = async (id: number, action: 'approve' | 'reject' | 'snooze', notes = '') => {
    try {
      await api.post('/analytics/ai/reorder/action/', {
        recommendation_id: id,
        action,
        notes
      })
      toast.success(`Restock recommendation ${action}d`)
      fetchReorder()
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to ${action} recommendation`)
    }
  }

  const fetchAbc = async () => {
    setLoading(true)
    try {
      const res = await api.get('/analytics/ai/abc-classification/')
      setAbcData(res.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load ABC inventory classification')
    } finally {
      setLoading(false)
    }
  }

  const handleRecalculateAbc = async () => {
    setLoading(true)
    try {
      await api.post('/analytics/ai/abc-classification/refresh/', {})
      toast.success('ABC Inventory Classification refreshed')
      fetchAbc()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to refresh ABC classification')
    } finally {
      setLoading(false)
    }
  }

  const fetchAnomalies = async () => {
    setLoading(true)
    try {
      const res = await api.get('/analytics/ai/anomalies/?status=${anomalyFilter}')
      setAnomalyData(res.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load unusual activity alerts')
    } finally {
      setLoading(false)
    }
  }

  const handleAnomalyAction = async (id: number, action: 'resolve' | 'dismiss', notes = '') => {
    try {
      await api.post('/analytics/ai/anomalies/action/', {
        anomaly_id: id,
        action,
        notes
      })
      toast.success(`Alert marked as ${action}d`)
      fetchAnomalies()
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to ${action} alert`)
    }
  }

  const fetchCrm = async () => {
    setLoading(true)
    try {
      const res = await api.get('/analytics/ai/crm-intelligence/')
      setCrmData(res.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load customer insights')
    } finally {
      setLoading(false)
    }
  }

  const fetchAudit = async () => {
    setLoading(true)
    try {
      const res = await api.get('/analytics/audit-timeline/')
      setAuditData(res.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load activity log')
    } finally {
      setLoading(false)
    }
  }

  const handleAskAssistant = async (promptQuery?: string) => {
    const q = promptQuery || assistantQuery
    if (!q.trim()) return

    const userMessage = { sender: 'user', text: q, timestamp: new Date().toLocaleTimeString() }
    setAssistantConversation((prev) => [...prev, userMessage])
    setAssistantQuery('')
    setAssistantLoading(true)

    try {
      const res = await api.post('/analytics/ai/assistant/', { query: q })
      const aiMessage = {
        sender: 'ai',
        data: res.data,
        timestamp: new Date().toLocaleTimeString()
      }
      setAssistantConversation((prev) => [...prev, aiMessage])
    } catch (err: any) {
      toast.error('AI Assistant could not process question')
    } finally {
      setAssistantLoading(false)
    }
  }

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt || 0)
  }

  return (
    <div className="space-y-6 lg:space-y-8 text-[#F3EFE6] pb-12">
      {/* Header */}
      <div className="bg-[#171613] border border-[#2A261F] rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#C9A45C] uppercase bg-[#C9A45C]/10 px-2 py-0.5 rounded border border-[#C9A45C]/20">
              MEGHANI 360 BUSINESS INTELLIGENCE
            </span>
            <span className="text-[#8D8980]">•</span>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Models
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F3EFE6] tracking-wide">
            {t('aiIntelligence', 'Store Analytics & AI Insights')}
          </h1>
          <p className="text-xs sm:text-sm text-[#8D8980] mt-1 max-w-2xl font-sans">
            {t('stockSalesInsights', 'Sales forecasts, restock recommendations, ABC inventory classification, unusual activity alerts, and AI store assistant.')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (activeTab === 'forecasting') fetchForecast()
              if (activeTab === 'reorder') fetchReorder()
              if (activeTab === 'abc') fetchAbc()
              if (activeTab === 'anomalies') fetchAnomalies()
              if (activeTab === 'crm') fetchCrm()
              if (activeTab === 'audit') fetchAudit()
              toast.success('Analytics refreshed')
            }}
            loading={loading}
            icon={<RefreshCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} />}
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Navigation Segmented Controls */}
      <div className="flex overflow-x-auto gap-2 border-b border-[#2A261F] pb-2 scrollbar-none">
        {[
          { id: 'forecasting', label: 'Sales Forecasting', icon: TrendingUp },
          { id: 'reorder', label: 'Smart Reordering', icon: PackageSearch, count: reorderData?.summary?.critical },
          { id: 'abc', label: 'ABC Inventory', icon: PieChartIcon },
          { id: 'anomalies', label: 'Activity Alerts', icon: AlertTriangle, count: anomalyData?.counts_by_severity?.critical },
          { id: 'crm', label: 'Customer Insights', icon: Users },
          { id: 'assistant', label: 'Store AI Assistant', icon: Sparkles },
          { id: 'audit', label: 'Activity Log', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap',
                isActive
                  ? 'bg-gradient-to-r from-[#C9A45C]/20 to-[#E8D5A7]/10 text-[#C9A45C] border border-[#C9A45C]/40 shadow-sm'
                  : 'text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A] border border-transparent'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-mono flex items-center justify-center">
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SALES FORECASTING */}
      {/* ========================================================= */}
      {activeTab === 'forecasting' && (
        <div className="space-y-6">
          {/* Horizon Selector & Meta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#171613] p-4 rounded-2xl border border-[#2A261F]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#8D8980]">FORECAST HORIZON:</span>
              {[30, 60, 90].map((h) => (
                <button
                  key={h}
                  onClick={() => setForecastHorizon(h as any)}
                  className={clsx(
                    'px-3 py-1 rounded-lg text-xs font-mono transition-colors',
                    forecastHorizon === h
                      ? 'bg-[#C9A45C] text-[#0B0B0A] font-bold shadow'
                      : 'bg-[#1F1E1A] text-[#8D8980] hover:text-[#F3EFE6]'
                  )}
                >
                  {h} Days
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-[#8D8980]">
              <span>Engine: <strong className="text-[#C9A45C]">{forecastData?.model_used || 'Detecting...'}</strong></span>
              <span>•</span>
              <span>Holdout Accuracy: <strong className="text-emerald-400">{forecastData?.evaluation_metrics?.accuracy_score || 0}%</strong></span>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#171613] border border-[#2A261F] rounded-2xl p-5 shadow-lg">
              <p className="text-xs font-mono text-[#8D8980] uppercase">Predicted Revenue ({forecastHorizon}d)</p>
              <h3 className="font-serif text-2xl font-bold text-[#F3EFE6] mt-1">
                {formatCurrency(forecastData?.predicted_total_revenue || 0)}
              </h3>
              <p className="text-[11px] font-mono text-[#8D8980] mt-1">
                Band: {formatCurrency(forecastData?.predicted_lower_bound || 0)} – {formatCurrency(forecastData?.predicted_upper_bound || 0)}
              </p>
            </div>

            <div className="bg-[#171613] border border-[#2A261F] rounded-2xl p-5 shadow-lg">
              <p className="text-xs font-mono text-[#8D8980] uppercase">Predicted Volume</p>
              <h3 className="font-serif text-2xl font-bold text-[#C9A45C] mt-1">
                {forecastData?.predicted_total_volume || 0} Units
              </h3>
              <p className="text-[11px] font-mono text-[#8D8980] mt-1">
                Daily Run Rate: ~{forecastData?.daily_average_revenue ? formatCurrency(forecastData.daily_average_revenue) : '₹0'} / day
              </p>
            </div>

            <div className="bg-[#171613] border border-[#2A261F] rounded-2xl p-5 shadow-lg">
              <p className="text-xs font-mono text-[#8D8980] uppercase">MoM Trend vs Past Actuals</p>
              <div className="flex items-center gap-2 mt-1">
                <h3 className="font-serif text-2xl font-bold text-[#F3EFE6]">
                  {forecastData?.comparison_with_past?.growth_percentage || 0}%
                </h3>
                {forecastData?.comparison_with_past?.trend_direction === 'up' ? (
                  <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-amber-400" />
                )}
              </div>
              <p className="text-[11px] font-mono text-[#8D8980] mt-1">
                Past {forecastHorizon}d Actual: {formatCurrency(forecastData?.comparison_with_past?.past_period_revenue || 0)}
              </p>
            </div>

            <div className="bg-[#171613] border border-[#2A261F] rounded-2xl p-5 shadow-lg">
              <p className="text-xs font-mono text-[#8D8980] uppercase">Peak Sales Day</p>
              <h3 className="font-serif text-2xl font-bold text-amber-300 mt-1">
                {forecastData?.patterns?.peak_day || 'Saturday'}
              </h3>
              <p className="text-[11px] font-mono text-[#8D8980] mt-1">
                Weekend Multiplier: <strong className="text-[#C9A45C]">{forecastData?.patterns?.weekend_multiplier || 1.0}x</strong> vs Weekdays
              </p>
            </div>
          </div>

          {/* Data Limitations Warning Banner if Sparse */}
          {forecastData?.data_limitation_notice && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Model Limitation & Transparency Notice:</strong>
                <p className="mt-0.5 text-amber-200/90">{forecastData.data_limitation_notice}</p>
              </div>
            </div>
          )}

          {/* Forecast Trend Chart */}
          <div className="bg-[#171613] border border-[#2A261F] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#F3EFE6]">Predicted Sales Velocity & Confidence Bands</h3>
                <p className="text-xs font-mono text-[#8D8980]">Daily projection with 90% uncertainty intervals</p>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData?.daily_predictions || []}>
                  <defs>
                    <linearGradient id="predictedRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A45C" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#C9A45C" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A261F" />
                  <XAxis dataKey="date" stroke="#8D8980" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#8D8980" tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#171613', borderColor: '#2A261F', borderRadius: '12px', color: '#F3EFE6' }}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Predicted Revenue']}
                  />
                  <Area type="monotone" dataKey="upper_bound" stroke="#E8D5A7" strokeDasharray="4 4" fill="transparent" name="Upper Bound" />
                  <Area type="monotone" dataKey="predicted_revenue" stroke="#C9A45C" strokeWidth={2.5} fillOpacity={1} fill="url(#predictedRev)" name="Forecast" />
                  <Area type="monotone" dataKey="lower_bound" stroke="#8D8980" strokeDasharray="4 4" fill="transparent" name="Lower Bound" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Day of Week Distribution Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#171613] border border-[#2A261F] rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#F3EFE6]">Day-of-Week Sales Pattern</h3>
              <p className="text-xs font-mono text-[#8D8980]">Historical average daily revenue across the week</p>
              
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(forecastData?.patterns?.day_of_week_distribution || {}).map(([day, avg]) => ({ day, avg }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A261F" />
                    <XAxis dataKey="day" stroke="#8D8980" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#8D8980" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#171613', borderColor: '#2A261F', borderRadius: '12px' }}
                      formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Average Revenue']}
                    />
                    <Bar dataKey="avg" fill="#C9A45C" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#171613] border border-[#2A261F] rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#F3EFE6]">Weekly Forecast Rollup</h3>
              <p className="text-xs font-mono text-[#8D8980]">Projected weekly milestones for inventory planning</p>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {(forecastData?.weekly_summary || []).map((w: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#1F1E1A] border border-[#2A261F]">
                    <div>
                      <p className="text-xs font-bold text-[#F3EFE6]">{w.week_number}</p>
                      <p className="text-[10px] font-mono text-[#8D8980]">{w.start_date} to {w.end_date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-[#C9A45C]">{formatCurrency(w.predicted_revenue)}</p>
                      <p className="text-[10px] font-mono text-[#8D8980]">{w.predicted_volume} watches</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: SMART REORDERING */}
      {/* ========================================================= */}
      {activeTab === 'reorder' && (
        <div className="space-y-6">
          {/* Reorder Status Filter & Priority Counters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#171613] p-4 rounded-2xl border border-[#2A261F]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#8D8980]">FILTER:</span>
              {['pending', 'approved', 'rejected', 'snoozed', 'all'].map((st) => (
                <button
                  key={st}
                  onClick={() => setReorderFilter(st)}
                  className={clsx(
                    'px-3 py-1 rounded-lg text-xs font-mono capitalize transition-colors',
                    reorderFilter === st
                      ? 'bg-[#C9A45C] text-[#0B0B0A] font-bold shadow'
                      : 'bg-[#1F1E1A] text-[#8D8980] hover:text-[#F3EFE6]'
                  )}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> Critical: {reorderData?.summary?.critical || 0}
              </span>
              <span>•</span>
              <span className="text-amber-400">High: {reorderData?.summary?.high || 0}</span>
              <span>•</span>
              <span className="text-emerald-400">Approved: {reorderData?.summary?.approved || 0}</span>
            </div>
          </div>

          {/* Mathematical ROP Banner */}
          <div className="p-4 rounded-xl bg-[#1F1E1A] border border-[#C9A45C]/30 text-xs text-[#E8D5A7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#C9A45C]" />
              <span>
                <strong>Restock Formula:</strong> Reorder Point (ROP) = (Average Daily Sales × Lead Time) + Safety Stock.
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#8D8980] hidden md:inline">
              Requires manager approval before creating purchase orders
            </span>
          </div>

          {/* Recommendations Table / Cards */}
          <div className="bg-[#171613] border border-[#2A261F] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#12110F] text-[#8D8980] uppercase font-mono border-b border-[#2A261F]">
                  <tr>
                    <th className="py-3.5 px-4">Watch / Brand</th>
                    <th className="py-3.5 px-3">Current Stock</th>
                    <th className="py-3.5 px-3">Daily Sales</th>
                    <th className="py-3.5 px-3">Reorder Point</th>
                    <th className="py-3.5 px-3">Stockout Date</th>
                    <th className="py-3.5 px-3">Suggested Order</th>
                    <th className="py-3.5 px-3">Urgency</th>
                    <th className="py-3.5 px-4 text-right">Manager Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A261F]/60">
                  {(reorderData?.recommendations || []).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#8D8980]">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="font-serif text-sm">No reorder recommendations matching current filter.</p>
                        <p className="text-xs font-mono mt-1">Inventory levels satisfy current safety stock thresholds.</p>
                      </td>
                    </tr>
                  ) : (
                    reorderData.recommendations.map((r: any) => (
                      <tr key={r.id} className="hover:bg-[#1F1E1A]/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-serif font-bold text-[#F3EFE6]">{r.product_name}</p>
                          <p className="text-[10px] font-mono text-[#8D8980]">{r.brand} • {r.category}</p>
                        </td>
                        <td className="py-3.5 px-3 font-mono">
                          <span className={clsx(r.current_stock <= 2 ? 'text-red-400 font-bold' : 'text-[#F3EFE6]')}>
                            {r.current_stock} units
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-[#8D8980]">
                          {r.daily_velocity} / day
                        </td>
                        <td className="py-3.5 px-3 font-mono font-semibold text-[#C9A45C]">
                          {r.reorder_point} units
                        </td>
                        <td className="py-3.5 px-3 font-mono">
                          {r.estimated_stockout_date || 'N/A'}
                          <span className="block text-[10px] text-[#8D8980]">({r.days_of_stock} days left)</span>
                        </td>
                        <td className="py-3.5 px-3 font-mono">
                          <span className="font-bold text-[#F3EFE6]">{r.suggested_quantity} units</span>
                          <span className="block text-[10px] text-[#8D8980]">Est: {formatCurrency(r.estimated_cost)}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <Badge
                            variant={r.urgency === 'critical' ? 'danger' : r.urgency === 'high' ? 'warning' : 'primary'}
                            size="sm"
                          >
                            {r.urgency.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedReorderExplanation(r)}
                              className="p-1.5 rounded-lg bg-[#1F1E1A] text-[#8D8980] hover:text-[#C9A45C] hover:bg-[#282620] transition-colors"
                              title="View Calculation Details"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>

                            {r.status === 'pending' && isManager && (
                              <>
                                <button
                                  onClick={() => handleReorderAction(r.id, 'approve')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/60 transition-colors text-[11px] font-bold"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReorderAction(r.id, 'reject', 'Supplier MOQ not met')}
                                  className="px-2 py-1 rounded-lg bg-red-950/70 text-red-300 border border-red-800/40 hover:bg-red-900/60 transition-colors text-[11px]"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleReorderAction(r.id, 'snooze', 'Snoozed 7 days')}
                                  className="px-2 py-1 rounded-lg bg-[#1F1E1A] text-[#8D8980] hover:text-[#F3EFE6] transition-colors text-[11px]"
                                >
                                  Snooze
                                </button>
                              </>
                            )}

                            {r.status !== 'pending' && (
                              <span className="text-[11px] font-mono uppercase text-[#8D8980] px-2 py-0.5 rounded bg-[#1F1E1A]">
                                {r.status}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Explanation Modal */}
          {selectedReorderExplanation && (
            <Modal
              isOpen={Boolean(selectedReorderExplanation)}
              onClose={() => setSelectedReorderExplanation(null)}
              title="Mathematical Reorder Explanation"
            >
              <div className="space-y-4 text-xs text-[#F3EFE6]">
                <div className="p-4 rounded-xl bg-[#1F1E1A] border border-[#2A261F] space-y-2">
                  <h4 className="font-serif font-bold text-sm text-[#C9A45C]">
                    {selectedReorderExplanation.product_name}
                  </h4>
                  <p className="text-xs text-[#8D8980] leading-relaxed">
                    {selectedReorderExplanation.reason}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-[#171613] border border-[#2A261F]">
                    <span className="text-[10px] font-mono text-[#8D8980]">DAILY VELOCITY</span>
                    <p className="font-mono font-bold text-sm text-[#F3EFE6] mt-0.5">
                      {selectedReorderExplanation.daily_velocity} units/day
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#171613] border border-[#2A261F]">
                    <span className="text-[10px] font-mono text-[#8D8980]">SAFETY STOCK</span>
                    <p className="font-mono font-bold text-sm text-[#F3EFE6] mt-0.5">
                      {selectedReorderExplanation.safety_stock} units
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#171613] border border-[#2A261F]">
                    <span className="text-[10px] font-mono text-[#8D8980]">REORDER POINT</span>
                    <p className="font-mono font-bold text-sm text-[#C9A45C] mt-0.5">
                      {selectedReorderExplanation.reorder_point} units
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#171613] border border-[#2A261F]">
                    <span className="text-[10px] font-mono text-[#8D8980]">RECOMMENDED ORDER</span>
                    <p className="font-mono font-bold text-sm text-emerald-400 mt-0.5">
                      {selectedReorderExplanation.suggested_quantity} units
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="secondary" size="sm" onClick={() => setSelectedReorderExplanation(null)}>
                    Dismiss
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ABC INVENTORY CLASSIFICATION */}
      {/* ========================================================= */}
      {activeTab === 'abc' && (
        <div className="space-y-6">
          {/* Overview & Recalculate */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#171613] p-4 rounded-2xl border border-[#2A261F]">
            <div>
              <h3 className="font-serif font-bold text-base text-[#F3EFE6]">Pareto ABC Stock Classification</h3>
              <p className="text-xs font-mono text-[#8D8980]">
                Class A: Top ~80% cumulative revenue • Class B: Next ~15% • Class C: Bottom ~5%
              </p>
            </div>

            {isManager && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleRecalculateAbc}
                loading={loading}
                icon={<RefreshCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} />}
              >
                Recalculate Snapshot
              </Button>
            )}
          </div>

          {/* Class Metrics Distribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#171613] border border-emerald-900/40 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                  CLASS A
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  {abcData?.revenue_percentage_by_class?.A || 0}% Revenue
                </span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#F3EFE6] mt-2">
                {abcData?.class_counts?.A || 0} Products
              </h3>
              <p className="text-xs font-mono text-[#8D8980] mt-1">
                Total: {formatCurrency(abcData?.revenue_by_class?.A || 0)}
              </p>
            </div>

            <div className="bg-[#171613] border border-amber-900/40 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-950 text-amber-300 border border-amber-800">
                  CLASS B
                </span>
                <span className="text-xs font-mono text-amber-400">
                  {abcData?.revenue_percentage_by_class?.B || 0}% Revenue
                </span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#F3EFE6] mt-2">
                {abcData?.class_counts?.B || 0} Products
              </h3>
              <p className="text-xs font-mono text-[#8D8980] mt-1">
                Total: {formatCurrency(abcData?.revenue_by_class?.B || 0)}
              </p>
            </div>

            <div className="bg-[#171613] border border-[#2A261F] rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-[#1F1E1A] text-[#8D8980] border border-[#2A261F]">
                  CLASS C
                </span>
                <span className="text-xs font-mono text-[#8D8980]">
                  {abcData?.revenue_percentage_by_class?.C || 0}% Revenue
                </span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#F3EFE6] mt-2">
                {abcData?.class_counts?.C || 0} Products
              </h3>
              <p className="text-xs font-mono text-[#8D8980] mt-1">
                Total: {formatCurrency(abcData?.revenue_by_class?.C || 0)}
              </p>
            </div>

            <div className="bg-[#171613] border border-[#2A261F] rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-[#1F1E1A] text-[#8D8980] border border-[#2A261F]">
                  UNCLASSIFIED
                </span>
                <span className="text-xs font-mono text-[#8D8980]">0% Sales</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#8D8980] mt-2">
                {abcData?.class_counts?.unclassified || 0} Products
              </h3>
              <p className="text-xs font-mono text-[#8D8980] mt-1">Zero sales in evaluation window</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8D8980] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search watches by name or brand..."
                value={abcSearch}
                onChange={(e) => setAbcSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#171613] border border-[#2A261F] rounded-xl text-xs text-[#F3EFE6] focus:border-[#C9A45C] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5">
              {['all', 'A', 'B', 'C', 'unclassified'].map((cls) => (
                <button
                  key={cls}
                  onClick={() => setAbcClassFilter(cls)}
                  className={clsx(
                    'px-3 py-2 rounded-xl text-xs font-mono uppercase transition-colors',
                    abcClassFilter === cls
                      ? 'bg-[#C9A45C] text-[#0B0B0A] font-bold'
                      : 'bg-[#171613] border border-[#2A261F] text-[#8D8980] hover:text-[#F3EFE6]'
                  )}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Products Classification Table */}
          <div className="bg-[#171613] border border-[#2A261F] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#12110F] text-[#8D8980] uppercase font-mono border-b border-[#2A261F]">
                  <tr>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Watch</th>
                    <th className="py-3 px-3">Revenue Contribution</th>
                    <th className="py-3 px-3">Cumulative %</th>
                    <th className="py-3 px-3">Units Sold</th>
                    <th className="py-3 px-3">Gross Margin</th>
                    <th className="py-3 px-4 text-right">Stock Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A261F]/60">
                  {((abcData?.products || []) as any[])
                    .filter((p) => {
                      const matchesSearch = p.name.toLowerCase().includes(abcSearch.toLowerCase()) ||
                        p.brand.toLowerCase().includes(abcSearch.toLowerCase())
                      const matchesClass = abcClassFilter === 'all' || p.classification === abcClassFilter
                      return matchesSearch && matchesClass
                    })
                    .slice(0, 30)
                    .map((p) => (
                      <tr key={p.product_id} className="hover:bg-[#1F1E1A]/40 transition-colors">
                        <td className="py-3 px-4">
                          <span
                            className={clsx(
                              'px-2 py-0.5 rounded font-mono font-bold text-xs',
                              p.classification === 'A'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : p.classification === 'B'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : p.classification === 'C'
                                ? 'bg-[#1F1E1A] text-[#8D8980] border border-[#2A261F]'
                                : 'bg-[#1F1E1A] text-slate-500 border border-slate-800'
                            )}
                          >
                            {p.classification.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-serif font-bold text-[#F3EFE6]">{p.name}</p>
                          <p className="text-[10px] font-mono text-[#8D8980]">{p.brand} • Stock: {p.current_stock}</p>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#C9A45C]">
                          {formatCurrency(p.revenue_contribution)}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#8D8980]">
                          {p.cumulative_percentage}%
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {p.sales_volume} units
                        </td>
                        <td className="py-3 px-3 font-mono text-emerald-400">
                          {formatCurrency(p.gross_profit_contribution)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#8D8980]">
                          {formatCurrency(p.inventory_value)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: ANOMALY RADAR */}
      {/* ========================================================= */}
      {activeTab === 'anomalies' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#171613] p-4 rounded-2xl border border-[#2A261F]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#8D8980]">STATUS:</span>
              {['open', 'resolved', 'dismissed', 'all'].map((st) => (
                <button
                  key={st}
                  onClick={() => setAnomalyFilter(st)}
                  className={clsx(
                    'px-3 py-1 rounded-lg text-xs font-mono capitalize transition-colors',
                    anomalyFilter === st
                      ? 'bg-[#C9A45C] text-[#0B0B0A] font-bold shadow'
                      : 'bg-[#1F1E1A] text-[#8D8980] hover:text-[#F3EFE6]'
                  )}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-red-400">Critical: {anomalyData?.counts_by_severity?.critical || 0}</span>
              <span>•</span>
              <span className="text-amber-400">High: {anomalyData?.counts_by_severity?.high || 0}</span>
              <span>•</span>
              <span className="text-sky-400">Total Logged: {anomalyData?.total_count || 0}</span>
            </div>
          </div>

          {/* Anomaly Principle Callout */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/30 text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Operational Safety Principle:</strong> Anomaly signals represent investigation alerts for managers. Transactions and normal operations are never automatically blocked.
              </span>
            </div>
          </div>

          {/* Anomaly Cards List */}
          <div className="space-y-3">
            {(anomalyData?.anomalies || []).length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#171613] border border-[#2A261F] text-[#8D8980]">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="font-serif text-sm">No Activity Alerts</p>
                <p className="text-xs font-mono mt-1">No unusual transactions or stock discrepancies detected.</p>
              </div>
            ) : (
              anomalyData.anomalies.map((a: any) => (
                <div
                  key={a.id}
                  className="bg-[#171613] border border-[#2A261F] hover:border-[#C9A45C]/40 rounded-2xl p-5 shadow-lg transition-colors space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2A261F]/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <Badge
                        variant={a.severity === 'critical' ? 'danger' : a.severity === 'high' ? 'warning' : 'info'}
                        size="sm"
                      >
                        {a.severity.toUpperCase()}
                      </Badge>
                      <h4 className="font-serif font-bold text-sm text-[#F3EFE6]">{a.category_display}</h4>
                      {a.invoice_number && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1F1E1A] text-[#C9A45C]">
                          Inv: {a.invoice_number}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-[#8D8980]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{a.detected_at}</span>
                      <span className="px-2 py-0.5 rounded bg-[#1F1E1A] capitalize text-[#F3EFE6]">{a.status}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#E8D5A7] leading-relaxed">
                    {a.explanation}
                  </p>

                  <div className="p-3 rounded-xl bg-[#1F1E1A] border border-[#2A261F] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#8D8980] block">Recommended Action:</span>
                      <span className="text-[#8D8980]">{a.recommended_action}</span>
                    </div>

                    {a.status === 'open' && isManager && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAnomalyAction(a.id, 'resolve', 'Investigation verified by manager')}
                        >
                          Mark Resolved
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAnomalyAction(a.id, 'dismiss', 'Expected retail variation')}
                        >
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: CUSTOMER INSIGHTS */}
      {/* ========================================================= */}
      {activeTab === 'crm' && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#171613] border border-[#2A261F] rounded-2xl p-5 shadow-lg">
              <p className="text-xs font-mono text-[#8D8980] uppercase">Repeat Purchase Rate</p>
              <h3 className="font-serif text-2xl font-bold text-emerald-400 mt-1">
                {crmData?.repeat_purchase_rate || 0}%
              </h3>
              <p className="text-[11px] font-mono text-[#8D8980] mt-1">
                {crmData?.repeat_buyers || 0} repeat buyers / {crmData?.active_buyers || 0} active
              </p>
            </div>

            <div className="bg-[#171613] border border-[#2A261F] rounded-2xl p-5 shadow-lg">
              <p className="text-xs font-mono text-[#8D8980] uppercase">High-Value Customers</p>
              <h3 className="font-serif text-2xl font-bold text-[#C9A45C] mt-1">
                {crmData?.high_value_vip_count || 0} Customers
              </h3>
              <p className="text-[11px] font-mono text-[#8D8980] mt-1">
                Lifetime spend ≥ ₹50,000 threshold
              </p>
            </div>

            <div className="bg-[#171613] border border-[#2A261F] rounded-2xl p-5 shadow-lg">
              <p className="text-xs font-mono text-[#8D8980] uppercase">Loyalty Points Issued</p>
              <h3 className="font-serif text-2xl font-bold text-[#F3EFE6] mt-1">
                {(crmData?.total_loyalty_points_outstanding || 0).toLocaleString()} pts
              </h3>
              <p className="text-[11px] font-mono text-[#8D8980] mt-1">
                Redeemable value: {formatCurrency((crmData?.total_loyalty_points_outstanding || 0) * 0.5)}
              </p>
            </div>

            <div className="bg-[#171613] border border-[#2A261F] rounded-2xl p-5 shadow-lg">
              <p className="text-xs font-mono text-[#8D8980] uppercase">Inactive Customers</p>
              <h3 className="font-serif text-2xl font-bold text-amber-400 mt-1">
                {crmData?.inactive_clients_count || 0} Customers
              </h3>
              <p className="text-[11px] font-mono text-[#8D8980] mt-1">
                No orders in past 90+ days
              </p>
            </div>
          </div>

          {/* Inactive Customer Outreach List */}
          <div className="bg-[#171613] border border-[#2A261F] rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#F3EFE6]">Customer Re-Engagement</h3>
              <p className="text-xs font-mono text-[#8D8980]">Customers with no purchases in the last 90+ days</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#12110F] text-[#8D8980] uppercase font-mono border-b border-[#2A261F]">
                  <tr>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Total Spend</th>
                    <th className="py-3 px-3">Loyalty Points</th>
                    <th className="py-3 px-3">Last Order Date</th>
                    <th className="py-3 px-3">Days Inactive</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A261F]/60">
                  {(crmData?.inactive_clients_outreach || []).map((c: any) => (
                    <tr key={c.id} className="hover:bg-[#1F1E1A]/40 transition-colors">
                      <td className="py-3 px-4 font-serif font-bold text-[#F3EFE6]">{c.name}</td>
                      <td className="py-3 px-3 font-mono text-[#8D8980]">{c.phone}</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#C9A45C]">{formatCurrency(c.total_spent)}</td>
                      <td className="py-3 px-3 font-mono">{c.loyalty_points} pts</td>
                      <td className="py-3 px-3 font-mono text-[#8D8980]">{c.last_purchase_date || 'N/A'}</td>
                      <td className="py-3 px-3 font-mono text-amber-400 font-semibold">{c.days_inactive}d</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            const msg = `Dear ${c.name}, Meghani Watch Co. (Vadodara) would love to welcome you back. Visit our store to explore our latest watch arrivals!`
                            window.open(`https://wa.me/91${c.phone}?text=${encodeURIComponent(msg)}`, '_blank')
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#C9A45C]/15 text-[#C9A45C] border border-[#C9A45C]/40 hover:bg-[#C9A45C]/25 text-[11px] font-bold"
                        >
                          WhatsApp Message
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: AI BUSINESS ASSISTANT */}
      {/* ========================================================= */}
      {activeTab === 'assistant' && (
        <div className="bg-[#171613] border border-[#2A261F] rounded-2xl p-6 shadow-2xl flex flex-col h-[650px]">
          <div className="border-b border-[#2A261F] pb-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C9A45C]/15 border border-[#C9A45C]/40 flex items-center justify-center text-[#C9A45C]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#F3EFE6]">Store AI Assistant</h3>
                <p className="text-xs font-mono text-[#8D8980]">
                  Ask questions about sales, restock needs, revenue, and store performance
                </p>
              </div>
            </div>

            <Badge variant="luxury" size="sm">
              {user?.role?.toUpperCase() || 'STAFF'} SESSION
            </Badge>
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              "What were today's total sales?",
              "Which products need restocking?",
              "What are expected sales next month?",
              "Which watch brands generate highest revenue?",
              "What is our gross profit and margin?",
              "Which products are moving slowly?"
            ].map((p, i) => (
              <button
                key={i}
                onClick={() => handleAskAssistant(p)}
                className="text-[11px] px-3 py-1 rounded-lg bg-[#1F1E1A] border border-[#2A261F] text-[#8D8980] hover:text-[#C9A45C] hover:border-[#C9A45C]/40 transition-colors text-left"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
            {assistantConversation.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-[#8D8980] space-y-2">
                <Compass className="w-8 h-8 text-[#C9A45C]/50" />
                <p className="font-serif text-sm text-[#F3EFE6]">How can I help you today?</p>
                <p className="text-xs max-w-sm">
                  Click any suggested prompt above or type a question about sales, inventory, or forecasts.
                </p>
              </div>
            ) : (
              assistantConversation.map((msg, idx) => (
                <div key={idx} className={clsx('flex', msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.sender === 'user' ? (
                    <div className="max-w-md p-3.5 rounded-2xl bg-[#C9A45C] text-[#0B0B0A] font-medium text-xs shadow">
                      {msg.text}
                      <span className="block text-[9px] text-[#0B0B0A]/70 text-right mt-1">{msg.timestamp}</span>
                    </div>
                  ) : (
                    <div className="max-w-xl p-4 rounded-2xl bg-[#1F1E1A] border border-[#2A261F] space-y-2 text-xs shadow-lg">
                      <div className="flex items-center justify-between gap-2 border-b border-[#2A261F]/60 pb-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#171613] text-[#C9A45C] border border-[#C9A45C]/30">
                          {msg.data.badge}
                        </span>
                        <span className="text-[10px] font-mono text-[#8D8980]">{msg.data.reporting_date}</span>
                      </div>
                      <h4 className="font-serif font-bold text-sm text-[#F3EFE6]">{msg.data.title}</h4>
                      <p className="text-xs text-[#E8D5A7] whitespace-pre-line leading-relaxed">{msg.data.message}</p>
                      {msg.data.limitations_note && (
                        <p className="text-[10px] font-mono text-[#8D8980] border-t border-[#2A261F] pt-2">
                          Note: {msg.data.limitations_note}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
            {assistantLoading && (
              <div className="flex justify-start">
                <div className="p-3.5 rounded-2xl bg-[#1F1E1A] border border-[#2A261F] text-xs text-[#8D8980] flex items-center gap-2 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-[#C9A45C] animate-spin" />
                  <span>Analyzing store data...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleAskAssistant()
            }}
            className="flex items-center gap-2 pt-2 border-t border-[#2A261F]"
          >
            <input
              type="text"
              placeholder="Ask about today's sales, restocking needs, forecast, margins..."
              value={assistantQuery}
              onChange={(e) => setAssistantQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl text-xs text-[#F3EFE6] focus:border-[#C9A45C] focus:outline-none"
            />
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={assistantLoading || !assistantQuery.trim()}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Ask
            </Button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: OPERATIONAL AUDIT TIMELINE */}
      {/* ========================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-[#171613] border border-[#2A261F] rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#F3EFE6]">Activity Log & Audit Trail</h3>
            <p className="text-xs font-mono text-[#8D8980]">
              Log of staff actions and store events
            </p>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-2">
            {(auditData?.timeline || []).length === 0 ? (
              <p className="text-xs text-[#8D8980] text-center py-8">No recent audit log records.</p>
            ) : (
              auditData.timeline.map((log: any) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-[#1F1E1A] border border-[#2A261F] flex items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#F3EFE6]">{log.user}</span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#171613] text-[#C9A45C]">
                        {log.action_display}
                      </span>
                      {log.linked_anomaly_id && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                          ANOMALY LINKED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#8D8980]">{log.message}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-mono text-[#8D8980] block">{log.timestamp}</span>
                    {log.ip_address && (
                      <span className="text-[9px] font-mono text-slate-500">IP: {log.ip_address}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
