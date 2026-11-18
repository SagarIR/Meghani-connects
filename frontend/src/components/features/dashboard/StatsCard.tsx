'use client'

import { motion } from 'framer-motion'
import clsx from 'clsx'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gold'
  delay?: number
}

const colorStyles = {
  gold: {
    iconBg: 'bg-[#C9A45C]/15 border-[#C9A45C]/40 text-[#C9A45C]',
    bar: 'bg-gradient-to-r from-[#C9A45C] to-[#E8D5A7]',
  },
  blue: {
    iconBg: 'bg-sky-950/60 border-sky-800/40 text-sky-400',
    bar: 'bg-gradient-to-r from-sky-500 to-sky-400',
  },
  green: {
    iconBg: 'bg-emerald-950/60 border-emerald-800/40 text-emerald-400',
    bar: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
  },
  orange: {
    iconBg: 'bg-amber-950/60 border-amber-800/40 text-amber-400',
    bar: 'bg-gradient-to-r from-amber-500 to-amber-400',
  },
  red: {
    iconBg: 'bg-red-950/60 border-red-800/40 text-red-400',
    bar: 'bg-gradient-to-r from-red-500 to-red-400',
  },
  purple: {
    iconBg: 'bg-purple-950/60 border-purple-800/40 text-purple-400',
    bar: 'bg-gradient-to-r from-purple-500 to-purple-400',
  },
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  color = 'gold',
  delay = 0 
}: StatsCardProps) {
  const styles = colorStyles[color] || colorStyles.gold

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="relative group bg-[#171613] rounded-2xl p-4 sm:p-5 border border-[#2A261F] hover:border-[#C9A45C]/40 transition-all duration-300 shadow-xl overflow-hidden"
    >
      {/* Background subtle radial glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-radial-gradient from-[#C9A45C]/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs font-semibold text-[#8D8980] uppercase tracking-wider truncate">
            {title}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <span className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-[#F3EFE6] tracking-tight truncate">
              {value}
            </span>
            {trend && (
              <span
                className={clsx(
                  'inline-flex items-center gap-0.5 text-xs font-mono font-bold',
                  trend.isPositive ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {trend.value}%
              </span>
            )}
          </div>
        </div>

        <div className={clsx(
          'w-10 h-10 sm:w-11 sm:h-11 rounded-xl border flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105',
          styles.iconBg
        )}>
          {icon}
        </div>
      </div>

      {/* Elegant bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2A261F]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.8, delay: delay + 0.1, ease: "easeOut" }}
          className={clsx('h-full opacity-60 group-hover:opacity-100 transition-opacity', styles.bar)}
        />
      </div>
    </motion.div>
  )
}
