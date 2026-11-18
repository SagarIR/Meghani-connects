'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, TrendingUp, AlertTriangle, 
  CheckCircle, Info, RefreshCw
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
}

const typeStyles: Record<string, { pill: string; icon: React.ReactNode }> = {
  positive: {
    pill: 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/40',
    icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
  },
  warning: {
    pill: 'bg-amber-950/70 text-amber-300 border border-amber-800/40',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
  },
  critical: {
    pill: 'bg-red-950/70 text-red-300 border border-red-800/40',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
  },
  info: {
    pill: 'bg-[#1F1E1A] text-[#C9A45C] border border-[#C9A45C]/30',
    icon: <Sparkles className="w-3.5 h-3.5 text-[#C9A45C]" />
  },
}

export default function AIInsights() {
  const [data, setData] = useState<AIInsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const response = await api.get('/analytics/ai/insights/?type=widget')
      setData(response.data)
    } catch (err) {
      console.error('Failed to fetch AI insights:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  return (
    <div className="bg-[#171613] rounded-2xl border border-[#2A261F] shadow-xl overflow-hidden h-full flex flex-col">
      <div className="p-4 sm:p-5 border-b border-[#2A261F] bg-[#12110F]/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#C9A45C]/15 border border-[#C9A45C]/40 flex items-center justify-center text-[#C9A45C]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm sm:text-base text-[#F3EFE6]">Predictive Velocity</h3>
            <p className="text-[11px] font-mono text-[#8D8980]">Stock turnover & trend analysis</p>
          </div>
        </div>
        <button
          onClick={() => fetchInsights(true)}
          disabled={refreshing}
          className="p-1.5 rounded-lg text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A] transition-colors"
          title="Refresh insights"
        >
          <RefreshCw className={clsx('w-3.5 h-3.5', refreshing && 'animate-spin')} />
        </button>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-14 bg-[#1F1E1A] rounded-xl"></div>
            <div className="h-14 bg-[#1F1E1A] rounded-xl"></div>
          </div>
        ) : data?.insights && data.insights.length > 0 ? (
          data.insights.slice(0, 3).map((insight, idx) => {
            const style = typeStyles[insight.type] || typeStyles.info
            return (
              <div
                key={idx}
                className="p-3 bg-[#12110F] border border-[#2A261F] rounded-xl text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {style.icon}
                    <span className="font-serif font-bold text-[#F3EFE6]">{insight.title}</span>
                  </div>
                  {insight.category && (
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#1F1E1A] text-[#8D8980]">
                      {insight.category}
                    </span>
                  )}
                </div>
                <p className="text-[#8D8980] leading-relaxed text-[11px]">{insight.message}</p>
              </div>
            )
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#8D8980]">
            <TrendingUp className="w-8 h-8 text-[#2A261F] mb-2" />
            <p className="text-xs font-semibold text-[#F3EFE6]">Velocity Forecasting Stable</p>
            <p className="text-[11px] text-[#8D8980] mt-0.5">Timepiece turnover is tracking according to historical demand</p>
          </div>
        )}
      </div>
    </div>
  )
}
