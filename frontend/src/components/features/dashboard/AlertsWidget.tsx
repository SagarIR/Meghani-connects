'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, Package, Clock, Shield, Cake, 
  ChevronRight, Bell, ChevronDown, CheckCircle2
} from 'lucide-react'
import { api } from '@/services/api'
import clsx from 'clsx'

interface LowStockItem {
  id: number
  name: string
  stock: number
  brand: string
}

interface OverdueRepair {
  id: number
  ticket_number: string
  customer__name: string
  item_type: string
  expected_delivery: string
}

interface ExpiringWarranty {
  id: number
  product__name: string
  customer__name: string
  expiry_date: string
}

interface BirthdayCustomer {
  id: number
  name: string
  phone: string
}

interface AlertsData {
  low_stock: LowStockItem[]
  overdue_repairs: OverdueRepair[]
  expiring_warranties: ExpiringWarranty[]
  birthdays_today: BirthdayCustomer[]
}

export default function AlertsWidget() {
  const [alerts, setAlerts] = useState<AlertsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'stock' | 'warranty' | 'repairs' | 'birthdays'>('stock')
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/analytics/alerts/')
      setAlerts(response.data)
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTotalAlerts = () => {
    if (!alerts) return 0
    return (
      (alerts.low_stock?.length || 0) +
      (alerts.overdue_repairs?.length || 0) +
      (alerts.expiring_warranties?.length || 0) +
      (alerts.birthdays_today?.length || 0)
    )
  }

  const tabs = [
    { 
      id: 'stock', 
      label: 'Low Stock', 
      icon: Package, 
      count: alerts?.low_stock?.length || 0,
      pill: 'bg-red-950/60 text-red-300 border-red-800/50'
    },
    { 
      id: 'repairs', 
      label: 'Overdue Repairs', 
      icon: Clock, 
      count: alerts?.overdue_repairs?.length || 0,
      pill: 'bg-amber-950/60 text-amber-300 border-amber-800/50'
    },
    { 
      id: 'warranty', 
      label: 'Warranties', 
      icon: Shield, 
      count: alerts?.expiring_warranties?.length || 0,
      pill: 'bg-sky-950/60 text-sky-300 border-sky-800/50'
    },
    { 
      id: 'birthdays', 
      label: 'Customer Birthdays', 
      icon: Cake, 
      count: alerts?.birthdays_today?.length || 0,
      pill: 'bg-purple-950/60 text-purple-300 border-purple-800/50'
    },
  ]

  if (loading) {
    return (
      <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-4 sm:p-5 shadow-xl">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-[#1F1E1A] rounded w-40"></div>
          <div className="h-10 bg-[#1F1E1A] rounded-xl"></div>
        </div>
      </div>
    )
  }

  const totalAlerts = getTotalAlerts()

  return (
    <div className="bg-[#171613] rounded-2xl border border-[#2A261F] shadow-xl overflow-hidden">
      {/* Accordion Header */}
      <div 
        className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-[#1F1E1A]/50 transition-colors select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border',
            totalAlerts > 0 ? 'bg-amber-950/60 border-amber-800/50 text-amber-400' : 'bg-emerald-950/60 border-emerald-800/50 text-emerald-400'
          )}>
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm sm:text-base text-[#F3EFE6]">Store Action Alerts</h3>
            <p className="text-[11px] font-mono text-[#8D8980]">
              {totalAlerts > 0 ? `${totalAlerts} items require attention` : 'All inventory and repairs are up to date'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {totalAlerts > 0 && (
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#C9A45C]/20 border border-[#C9A45C]/40 text-[#C9A45C]">
              {totalAlerts} Active
            </span>
          )}
          <ChevronDown className={clsx('w-4 h-4 text-[#8D8980] transition-transform duration-200', isExpanded && 'rotate-180')} />
        </div>
      </div>

      {/* Accordion Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Filter Tabs */}
            <div className="flex border-t border-b border-[#2A261F] bg-[#12110F] overflow-x-auto scrollbar-hide">
              {tabs.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={clsx(
                      'flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-3 transition-colors border-b-2 text-xs font-medium',
                      isActive 
                        ? 'border-[#C9A45C] text-[#C9A45C] bg-[#1F1E1A]/80 font-bold' 
                        : 'border-transparent text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#171613]'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    <span className={clsx('text-[10px] font-mono px-1.5 py-0.2 rounded-full border', tab.pill)}>
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Alert Items List */}
            <div className="p-4 sm:p-5 max-h-60 overflow-y-auto divide-y divide-[#2A261F]/60">
              {activeTab === 'stock' && (
                alerts?.low_stock && alerts.low_stock.length > 0 ? (
                  <div className="space-y-2">
                    {alerts.low_stock.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 text-xs">
                        <div>
                          <p className="font-semibold text-[#F3EFE6]">{item.name}</p>
                          <p className="text-[11px] text-[#8D8980]">{item.brand || 'Store'}</p>
                        </div>
                        <span className="font-mono text-red-400 bg-red-950/60 border border-red-800/40 px-2 py-0.5 rounded-full font-bold">
                          Stock: {item.stock} left
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-xs text-[#8D8980]">No low stock alerts</p>
                )
              )}

              {activeTab === 'repairs' && (
                alerts?.overdue_repairs && alerts.overdue_repairs.length > 0 ? (
                  <div className="space-y-2">
                    {alerts.overdue_repairs.map((r) => (
                      <div key={r.id} className="flex items-center justify-between py-2 text-xs">
                        <div>
                          <p className="font-semibold text-[#F3EFE6]">{r.ticket_number} • {r.item_type}</p>
                          <p className="text-[11px] text-[#8D8980]">Customer: {r.customer__name || 'Walk-in'}</p>
                        </div>
                        <span className="font-mono text-amber-300 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded-full">
                          Due: {r.expected_delivery || 'Immediate'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-xs text-[#8D8980]">All repair tickets are on schedule</p>
                )
              )}

              {activeTab === 'warranty' && (
                alerts?.expiring_warranties && alerts.expiring_warranties.length > 0 ? (
                  <div className="space-y-2">
                    {alerts.expiring_warranties.map((w) => (
                      <div key={w.id} className="flex items-center justify-between py-2 text-xs">
                        <div>
                          <p className="font-semibold text-[#F3EFE6]">{w.product__name}</p>
                          <p className="text-[11px] text-[#8D8980]">Customer: {w.customer__name}</p>
                        </div>
                        <span className="font-mono text-sky-300 bg-sky-950/60 border border-sky-800/40 px-2 py-0.5 rounded-full">
                          Expires: {w.expiry_date}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-xs text-[#8D8980]">No warranty expirations this week</p>
                )
              )}

              {activeTab === 'birthdays' && (
                alerts?.birthdays_today && alerts.birthdays_today.length > 0 ? (
                  <div className="space-y-2">
                    {alerts.birthdays_today.map((b) => (
                      <div key={b.id} className="flex items-center justify-between py-2 text-xs">
                        <div>
                          <p className="font-semibold text-[#F3EFE6]">{b.name}</p>
                          <p className="text-[11px] font-mono text-[#8D8980]">{b.phone}</p>
                        </div>
                        <span className="font-mono text-purple-300 bg-purple-950/60 border border-purple-800/40 px-2.5 py-0.5 rounded-full font-bold">
                          Birthday Today!
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-xs text-[#8D8980]">No customer birthdays today</p>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
