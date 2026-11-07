'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Wrench, Clock, User, ChevronRight } from 'lucide-react'
import { api } from '@/services/api'
import { formatDistanceToNow } from 'date-fns'
import { StatusBadge } from '@/components/ui/Badge'
import clsx from 'clsx'

interface Repair {
  id: number
  type: string
  ticket: string
  customer: string
  item: string
  status: string
  date: string
}

export default function RepairQueue() {
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRepairs()
  }, [])

  const fetchRepairs = async () => {
    try {
      const response = await api.get('/analytics/dashboard/recent-activity/')
      setRepairs(response.data.repairs || [])
    } catch (error) {
      console.error('Failed to fetch repairs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      received: 'from-blue-400 to-blue-500',
      diagnosing: 'from-yellow-400 to-yellow-500',
      repairing: 'from-orange-400 to-orange-500',
      ready_for_pickup: 'from-green-400 to-green-500',
      delivered: 'from-emerald-400 to-emerald-500',
    }
    return colors[status] || 'from-gray-400 to-gray-500'
  }

  return (
    <div className="bg-white rounded-xl lg:rounded-2xl border border-gray-100 shadow-card overflow-hidden h-full">
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-900">Repair Queue</h3>
              <p className="text-xs text-gray-500 hidden sm:block">Active repairs</p>
            </div>
          </div>
          <button className="text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
            <span className="hidden sm:inline">View all</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {loading ? (
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 sm:gap-4 animate-pulse">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-3 sm:h-4 w-20 sm:w-24 bg-gray-100 rounded mb-1.5 sm:mb-2"></div>
                  <div className="h-2.5 sm:h-3 w-24 sm:w-32 bg-gray-100 rounded"></div>
                </div>
                <div className="h-5 sm:h-6 w-16 sm:w-20 bg-gray-100 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : repairs.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <Wrench className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <p className="text-sm sm:text-base text-gray-500">No active repairs</p>
          </div>
        ) : (
          repairs.slice(0, 5).map((repair, index) => (
            <motion.div
              key={repair.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={clsx(
                  'w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg flex-shrink-0',
                  getStatusColor(repair.status)
                )}>
                  <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <p className="font-semibold text-sm sm:text-base text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                      {repair.item}
                    </p>
                    <span className="font-mono text-[10px] sm:text-xs bg-gray-100 px-1 sm:px-1.5 py-0.5 rounded">
                      #{repair.ticket}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mt-0.5">
                    <User className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{repair.customer}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <StatusBadge status={repair.status} pulse />
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-1 hidden sm:flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(repair.date), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
