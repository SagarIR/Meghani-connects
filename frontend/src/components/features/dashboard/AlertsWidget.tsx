'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, Package, Clock, Shield, Cake, 
  ChevronRight, Bell, RefreshCw, X
} from 'lucide-react'
import { api } from '@/services/api'
import Badge from '@/components/ui/Badge'
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
      alerts.low_stock.length +
      alerts.overdue_repairs.length +
      alerts.expiring_warranties.length +
      alerts.birthdays_today.length
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    return `${diffDays} days`
  }

  const tabs = [
    { 
      id: 'stock', 
      label: 'Low Stock', 
      icon: Package, 
      count: alerts?.low_stock.length || 0,
      color: 'text-red-600',
      bg: 'bg-red-100'
    },
    { 
      id: 'warranty', 
      label: 'Warranties', 
      icon: Shield, 
      count: alerts?.expiring_warranties.length || 0,
      color: 'text-orange-600',
      bg: 'bg-orange-100'
    },
    { 
      id: 'repairs', 
      label: 'Overdue', 
      icon: Clock, 
      count: alerts?.overdue_repairs.length || 0,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100'
    },
    { 
      id: 'birthdays', 
      label: 'Birthdays', 
      icon: Cake, 
      count: alerts?.birthdays_today.length || 0,
      color: 'text-pink-600',
      bg: 'bg-pink-100'
    },
  ]

  if (loading) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-card p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const totalAlerts = getTotalAlerts()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-card overflow-hidden"
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            totalAlerts > 0 ? 'bg-red-100' : 'bg-green-100'
          )}>
            <Bell className={clsx('w-5 h-5', totalAlerts > 0 ? 'text-red-600' : 'text-green-600')} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Alerts & Notifications</h3>
            <p className="text-sm text-gray-500">
              {totalAlerts > 0 ? `${totalAlerts} items need attention` : 'All clear!'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {totalAlerts > 0 && (
            <span className="w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {totalAlerts > 9 ? '9+' : totalAlerts}
            </span>
          )}
          <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Tabs */}
            <div className="flex border-t border-b border-gray-100 overflow-x-auto scrollbar-hide">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={clsx(
                      'flex-1 min-w-[80px] flex flex-col items-center gap-1 py-3 px-2 transition-colors relative',
                      activeTab === tab.id ? 'bg-gray-50' : 'hover:bg-gray-50'
                    )}
                  >
                    <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', tab.bg)}>
                      <Icon className={clsx('w-4 h-4', tab.color)} />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={clsx(
                        'absolute top-2 right-2 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center',
                        tab.bg, tab.color
                      )}>
                        {tab.count}
                      </span>
                    )}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Alert List */}
            <div className="p-4 sm:p-5 max-h-64 overflow-y-auto">
              {/* Low Stock */}
              {activeTab === 'stock' && (
                <div className="space-y-2">
                  {alerts?.low_stock.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-4">No low stock items</p>
                  ) : (
                    alerts?.low_stock.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.brand || 'Unbranded'}</p>
                        </div>
                        <Badge variant="danger">{item.stock} left</Badge>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Warranties */}
              {activeTab === 'warranty' && (
                <div className="space-y-2">
                  {alerts?.expiring_warranties.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-4">No expiring warranties</p>
                  ) : (
                    alerts?.expiring_warranties.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.product__name}</p>
                          <p className="text-xs text-gray-500">{item.customer__name}</p>
                        </div>
                        <Badge variant="warning">{formatDate(item.expiry_date)}</Badge>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Overdue Repairs */}
              {activeTab === 'repairs' && (
                <div className="space-y-2">
                  {alerts?.overdue_repairs.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-4">No overdue repairs</p>
                  ) : (
                    alerts?.overdue_repairs.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.ticket_number}</p>
                          <p className="text-xs text-gray-500">{item.customer__name} - {item.item_type}</p>
                        </div>
                        <Badge variant="warning">{formatDate(item.expected_delivery)}</Badge>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Birthdays */}
              {activeTab === 'birthdays' && (
                <div className="space-y-2">
                  {alerts?.birthdays_today.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-4">No birthdays today</p>
                  ) : (
                    alerts?.birthdays_today.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.phone}</p>
                        </div>
                        <Badge variant="info">Birthday!</Badge>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
