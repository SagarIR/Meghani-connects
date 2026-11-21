'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Wrench, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/services/api'
import { usePreferences } from '@/context/PreferencesContext'
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
  const { t } = usePreferences()
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

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase()
    if (s === 'ready' || s === 'ready_for_pickup') {
      return { label: t('statusReady', 'Ready'), pill: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/40' }
    }
    if (s === 'in_repair' || s === 'repairing') {
      return { label: t('statusInRepair', 'In Repair'), pill: 'bg-amber-950/70 text-amber-300 border-amber-800/40' }
    }
    if (s === 'delivered') {
      return { label: t('statusDelivered', 'Delivered'), pill: 'bg-sky-950/70 text-sky-300 border-sky-800/40' }
    }
    return { label: t('statusReceived', 'Received'), pill: 'bg-[#1F1E1A] text-[#8D8980] border-[#2A261F]' }
  }

  return (
    <div className="bg-[#171613] rounded-2xl border border-[#2A261F] shadow-xl overflow-hidden h-full flex flex-col">
      <div className="p-4 sm:p-5 border-b border-[#2A261F] bg-[#12110F]/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-[#F3EFE6]">{t('watchRepairsTitle', 'Watch Repairs')}</h3>
              <p className="text-[11px] font-mono text-[#8D8980]">{t('activeWatchRepairs', 'Active watch repairs')}</p>
            </div>
          </div>
          <Link href="/repairs" className="text-xs font-semibold text-[#C9A45C] hover:text-[#E8D5A7] flex items-center gap-1 transition-colors">
            <span>{t('viewAllRepairs', 'View all repairs')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="divide-y divide-[#2A261F]/60 flex-1">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 bg-[#1F1E1A] rounded-lg"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-20 bg-[#1F1E1A] rounded"></div>
                  <div className="h-2.5 w-24 bg-[#1F1E1A] rounded"></div>
                </div>
                <div className="h-5 w-16 bg-[#1F1E1A] rounded"></div>
              </div>
            ))}
          </div>
        ) : repairs.length === 0 ? (
          <div className="p-6 text-center text-[#8D8980]">
            <p className="text-xs">{t('noPendingRepairs', 'No pending watch repairs')}</p>
          </div>
        ) : (
          repairs.slice(0, 5).map((repair, index) => {
            const badge = getStatusBadge(repair.status)
            return (
              <motion.div
                key={repair.id || index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-3.5 hover:bg-[#1F1E1A]/60 transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#F3EFE6] group-hover:text-[#C9A45C] transition-colors">
                      {repair.ticket}
                    </span>
                    <span className="text-[10px] text-[#8D8980] truncate">• {repair.item}</span>
                  </div>
                  <p className="text-xs text-[#8D8980] truncate mt-0.5">
                    {repair.customer || t('walkInCustomer', 'Walk-in Customer')}
                  </p>
                </div>
                <span className={clsx('text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold flex-shrink-0', badge.pill)}>
                  {badge.label}
                </span>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
