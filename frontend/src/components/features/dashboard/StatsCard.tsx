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
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'pink'
  delay?: number
}

const colorStyles = {
  blue: {
    bg: 'from-blue-500 to-blue-600',
    light: 'bg-blue-100',
    text: 'text-blue-600',
    shadow: 'shadow-blue-500/25',
  },
  green: {
    bg: 'from-emerald-500 to-emerald-600',
    light: 'bg-emerald-100',
    text: 'text-emerald-600',
    shadow: 'shadow-emerald-500/25',
  },
  orange: {
    bg: 'from-orange-500 to-orange-600',
    light: 'bg-orange-100',
    text: 'text-orange-600',
    shadow: 'shadow-orange-500/25',
  },
  red: {
    bg: 'from-red-500 to-red-600',
    light: 'bg-red-100',
    text: 'text-red-600',
    shadow: 'shadow-red-500/25',
  },
  purple: {
    bg: 'from-purple-500 to-purple-600',
    light: 'bg-purple-100',
    text: 'text-purple-600',
    shadow: 'shadow-purple-500/25',
  },
  pink: {
    bg: 'from-pink-500 to-pink-600',
    light: 'bg-pink-100',
    text: 'text-pink-600',
    shadow: 'shadow-pink-500/25',
  },
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  color = 'blue',
  delay = 0 
}: StatsCardProps) {
  const styles = colorStyles[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative group bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-card hover:shadow-card-hover 
                 border border-gray-100 transition-all duration-300 overflow-hidden"
    >
      {/* Background decoration */}
      <div className={clsx(
        'absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 rounded-full opacity-5 -translate-y-1/2 translate-x-1/2',
        `bg-gradient-to-br ${styles.bg}`
      )} />
      
      {/* Hover glow effect */}
      <div className={clsx(
        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
        'bg-gradient-to-r from-transparent via-primary-50/50 to-transparent'
      )} />

      <div className="relative flex items-start justify-between gap-2">
        <div className="space-y-1 sm:space-y-3 min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide truncate">
            {title}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <motion.span 
              className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.2 }}
            >
              {value}
            </motion.span>
            {trend && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.3 }}
                className={clsx(
                  'inline-flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm font-semibold',
                  trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                ) : (
                  <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
                {trend.value}%
              </motion.span>
            )}
          </div>
        </div>

        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={clsx(
            'w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0',
            `bg-gradient-to-br ${styles.bg}`,
            `shadow-lg ${styles.shadow}`
          )}
        >
          <span className="text-white">{icon}</span>
        </motion.div>
      </div>

      {/* Bottom progress bar (visual) */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-gray-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 1, delay: delay + 0.2, ease: "easeOut" }}
          className={clsx('h-full', `bg-gradient-to-r ${styles.bg}`)}
        />
      </div>
    </motion.div>
  )
}
