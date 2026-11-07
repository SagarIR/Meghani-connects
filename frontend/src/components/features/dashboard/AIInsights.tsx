'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, TrendingUp, TrendingDown, AlertTriangle, 
  CheckCircle, Info, Brain, ChevronRight, RefreshCw
} from 'lucide-react'
import { api } from '@/services/api'
import clsx from 'clsx'

interface Insight {
  type: 'positive' | 'warning' | 'critical' | 'info'
  category?: string
  title: string
  message: string
  metric?: string
}

interface AIInsightsData {
  insights: Insight[]
  quick_stats: {
    todays_sales: number
    todays_profit: number
    pending_repairs: number
    new_customers_week: number
    inventory_health: number
    alerts_count: number
  }
  forecast?: {
    predicted_total: number
    average_daily: number
  }
  inventory_health?: {
    health_score: number
    out_of_stock: number
    low_stock: number
    reorder_needed: number
  }
  profit_prediction?: {
    predicted_net_profit: number
    is_profitable: boolean
    profit_margin_percent: number
  }
}

const typeStyles: Record<string, { bg: string; border: string; iconBg: string; icon: React.ReactNode }> = {
  positive: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-500',
    icon: <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-500',
    icon: <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
  },
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconBg: 'bg-red-500',
    icon: <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-500',
    icon: <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
  },
}

export default function AIInsights() {
  const [data, setData] = useState<AIInsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const response = await api.get('/analytics/ai/insights/?type=widget')
      setData(response.data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch AI insights:', err)
      setError('Unable to load insights')
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
      <div className="bg-white rounded-xl lg:rounded-2xl border border-gray-100 shadow-card overflow-hidden h-full">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg sm:rounded-xl flex items-center justify-center animate-pulse">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="animate-pulse">
              <div className="h-3 sm:h-4 w-20 sm:w-24 bg-gray-200 rounded mb-1"></div>
              <div className="h-2.5 sm:h-3 w-24 sm:w-32 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 sm:h-16 bg-gray-100 rounded-lg sm:rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl lg:rounded-2xl border border-gray-100 shadow-card overflow-hidden h-full">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-900">AI Insights</h3>
              <p className="text-xs text-gray-500 hidden sm:block">Powered by analytics</p>
            </div>
          </div>
        </div>
        <div className="p-6 sm:p-8 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
          </div>
          <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">{error || 'No insights available'}</p>
          <button 
            onClick={() => fetchInsights(true)}
            className="text-primary-600 text-xs sm:text-sm font-medium hover:text-primary-700 inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl lg:rounded-2xl border border-gray-100 shadow-card overflow-hidden h-full">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div 
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.8 }}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </motion.div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-900">AI Insights</h3>
              <p className="text-xs text-gray-500 hidden sm:block">Powered by analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
              onClick={() => fetchInsights(true)}
              disabled={refreshing}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={clsx('w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400', refreshing && 'animate-spin')} />
            </button>
            <span className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:py-1 bg-emerald-100 rounded-full">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-emerald-700">Live</span>
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        {/* Forecast Card */}
        {data.profit_prediction && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx(
              'p-3 sm:p-4 rounded-lg sm:rounded-xl border',
              data.profit_prediction.is_profitable 
                ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-200' 
                : 'bg-gradient-to-r from-red-50 to-red-100/50 border-red-200'
            )}
          >
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">Next Month Forecast</span>
              {data.profit_prediction.is_profitable ? (
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              )}
            </div>
            <p className={clsx(
              'text-lg sm:text-2xl font-bold',
              data.profit_prediction.is_profitable ? 'text-emerald-700' : 'text-red-700'
            )}>
              {formatCurrency(data.profit_prediction.predicted_net_profit)}
            </p>
            <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
              <span className={clsx(
                'text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded',
                data.profit_prediction.is_profitable ? 'bg-emerald-200 text-emerald-700' : 'bg-red-200 text-red-700'
              )}>
                {data.profit_prediction.profit_margin_percent}% margin
              </span>
            </div>
          </motion.div>
        )}

        {/* Inventory Health */}
        {data.inventory_health && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">Inventory Health</span>
              <span className={clsx(
                'text-xs sm:text-sm font-bold',
                data.inventory_health.health_score >= 80 ? 'text-emerald-600' :
                data.inventory_health.health_score >= 50 ? 'text-amber-600' : 'text-red-600'
              )}>
                {data.inventory_health.health_score}%
              </span>
            </div>
            <div className="w-full h-2 sm:h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${data.inventory_health.health_score}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={clsx(
                  'h-full rounded-full',
                  data.inventory_health.health_score >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                  data.inventory_health.health_score >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 
                  'bg-gradient-to-r from-red-400 to-red-500'
                )}
              />
            </div>
            {(data.inventory_health.out_of_stock > 0 || data.inventory_health.reorder_needed > 0) && (
              <div className="flex gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-[10px] sm:text-xs flex-wrap">
                {data.inventory_health.out_of_stock > 0 && (
                  <span className="text-red-600 font-medium">{data.inventory_health.out_of_stock} out of stock</span>
                )}
                {data.inventory_health.reorder_needed > 0 && (
                  <span className="text-amber-600 font-medium">{data.inventory_health.reorder_needed} need reorder</span>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Insights List */}
        <div className="space-y-1.5 sm:space-y-2">
          <AnimatePresence>
            {data.insights.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-3 sm:py-4"
              >
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500 mx-auto mb-1.5 sm:mb-2" />
                <p className="text-xs sm:text-sm text-gray-600 font-medium">All systems running smoothly</p>
              </motion.div>
            ) : (
              data.insights.slice(0, 4).map((insight, index) => {
                const style = typeStyles[insight.type] || typeStyles.info
                return (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className={clsx(
                      'p-2.5 sm:p-3 rounded-lg sm:rounded-xl border flex items-start gap-2 sm:gap-3 cursor-pointer hover:shadow-md transition-shadow',
                      style.bg,
                      style.border
                    )}
                  >
                    <div className={clsx('w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0', style.iconBg)}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900">{insight.title}</p>
                      <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 line-clamp-1">{insight.message}</p>
                    </div>
                    {insight.metric && (
                      <span className="text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap flex-shrink-0">
                        {insight.metric}
                      </span>
                    )}
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>

        {/* View More */}
        {data.insights.length > 4 && (
          <button className="w-full py-2 sm:py-2.5 text-center text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg sm:rounded-xl transition-colors flex items-center justify-center gap-1">
            View all {data.insights.length} insights
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
