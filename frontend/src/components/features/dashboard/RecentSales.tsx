'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, User, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/services/api'

interface Sale {
  id: number
  type: string
  invoice: string
  customer: string
  amount: number
  date: string
}

export default function RecentSales() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentSales()
  }, [])

  const fetchRecentSales = async () => {
    try {
      const response = await api.get('/analytics/dashboard/recent-activity/')
      setSales(response.data.sales || [])
    } catch (error) {
      console.error('Failed to fetch recent sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="bg-[#171613] rounded-2xl border border-[#2A261F] shadow-xl overflow-hidden h-full flex flex-col">
      <div className="p-4 sm:p-5 border-b border-[#2A261F] bg-[#12110F]/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-[#F3EFE6]">Recent Transactions</h3>
              <p className="text-[11px] font-mono text-[#8D8980]">Latest register activity</p>
            </div>
          </div>
          <Link href="/sales/history" className="text-xs font-semibold text-[#C9A45C] hover:text-[#E8D5A7] flex items-center gap-1 transition-colors">
            <span>Audit all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="divide-y divide-[#2A261F]/60 flex-1">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 bg-[#1F1E1A] rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-24 bg-[#1F1E1A] rounded"></div>
                  <div className="h-2.5 w-16 bg-[#1F1E1A] rounded"></div>
                </div>
                <div className="h-4 w-14 bg-[#1F1E1A] rounded"></div>
              </div>
            ))}
          </div>
        ) : sales.length === 0 ? (
          <div className="p-6 text-center text-[#8D8980]">
            <p className="text-xs">No recent transactions recorded today</p>
          </div>
        ) : (
          sales.slice(0, 5).map((sale, index) => (
            <motion.div
              key={sale.id || index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-3.5 hover:bg-[#1F1E1A]/60 transition-colors flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#1F1E1A] border border-[#2A261F] flex items-center justify-center text-xs font-bold text-[#C9A45C] flex-shrink-0">
                  {sale.customer ? sale.customer.charAt(0).toUpperCase() : 'W'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-[#F3EFE6] truncate group-hover:text-[#C9A45C] transition-colors">
                    {sale.customer || 'Walk-in Client'}
                  </p>
                  <p className="text-[11px] font-mono text-[#8D8980]">
                    {sale.invoice}
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs sm:text-sm font-bold text-[#C9A45C] flex-shrink-0">
                {formatCurrency(sale.amount)}
              </span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
