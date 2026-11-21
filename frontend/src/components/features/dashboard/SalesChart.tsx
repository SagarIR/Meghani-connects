'use client'

import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '@/services/api'
import { usePreferences } from '@/context/PreferencesContext'
import { format } from 'date-fns'

interface SalesData {
  date: string
  sales: number
  profit: number
  count: number
}

export default function SalesChart() {
  const { t, theme } = usePreferences()
  const [data, setData] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChartData()
  }, [])

  const fetchChartData = async () => {
    try {
      const response = await api.get('/analytics/dashboard/sales-chart/?days=30')
      setData(response.data)
    } catch (error) {
      console.error('Failed to fetch chart data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}K`
    }
    return `₹${value}`
  }

  if (loading) {
    return (
      <div className="h-48 sm:h-64 lg:h-80 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-10 h-10 bg-[#1F1E1A] rounded-xl border border-[#2A261F]"></div>
          <div className="w-24 h-3 bg-[#1F1E1A] rounded"></div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-48 sm:h-64 lg:h-80 flex items-center justify-center text-center text-[#8D8980]">
        <div>
          <p className="text-sm font-semibold text-[#F3EFE6]">{t('noSalesRecordsFound', 'No Sales Records Found')}</p>
          <p className="text-xs mt-1">{t('salesChartEmptyDesc', 'Transactions logged via the POS terminal will appear here')}</p>
        </div>
      </div>
    )
  }

  const formattedData = data.map(item => ({
    ...item,
    formattedDate: format(new Date(item.date), 'MMM d'),
  }))

  const isLight = theme === 'light'
  const gridStroke = isLight ? '#DFD7C5' : '#2A261F'
  const textStroke = isLight ? '#5C574F' : '#8D8980'

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#171613] border border-[#2A261F] rounded-xl shadow-2xl p-3 text-xs">
          <p className="font-mono text-[11px] text-[#8D8980] uppercase tracking-wider mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-[#8D8980]">
                <span className="w-2 h-2 rounded-full bg-[#C9A45C]" /> {t('salesLabel', 'Sales:')}
              </span>
              <span className="font-mono font-bold text-[#F3EFE6]">
                ₹{payload[0]?.value?.toLocaleString('en-IN')}
              </span>
            </div>
            {payload[1] && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-[#8D8980]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> {t('profitLabel', 'Profit:')}
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  ₹{payload[1]?.value?.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-48 sm:h-64 lg:h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="goldSalesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C9A45C" stopOpacity={isLight ? 0.25 : 0.35}/>
              <stop offset="95%" stopColor="#C9A45C" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="emeraldMarginGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={isLight ? 0.2 : 0.25}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
          <XAxis 
            dataKey="formattedDate" 
            stroke={textStroke} 
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke={textStroke} 
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="sales" 
            stroke="#C9A45C" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#goldSalesGradient)" 
          />
          <Area 
            type="monotone" 
            dataKey="profit" 
            stroke="#10b981" 
            strokeWidth={1.5}
            fillOpacity={1} 
            fill="url(#emeraldMarginGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
