'use client'

import clsx from 'clsx'

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'gray' | 'outline' | 'info' | 'default' | 'luxury'
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
  pulse?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}

const variants = {
  primary: 'bg-[#C9A45C]/15 text-[#C9A45C] border-[#C9A45C]/30',
  success: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50',
  warning: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
  danger: 'bg-red-950/60 text-red-300 border-red-800/50',
  gray: 'bg-[#1F1E1A] text-[#8D8980] border-[#2A261F]',
  outline: 'bg-transparent border-[#2A261F] text-[#8D8980]',
  info: 'bg-sky-950/60 text-sky-300 border-sky-800/50',
  default: 'bg-[#1F1E1A] text-[#F3EFE6] border-[#2A261F]',
  luxury: 'bg-gradient-to-r from-[#C9A45C]/20 to-[#E8D5A7]/10 text-[#C9A45C] border-[#C9A45C]/40 shadow-sm shadow-[#C9A45C]/10',
}

const dotColors = {
  primary: 'bg-[#C9A45C]',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
  gray: 'bg-[#8D8980]',
  outline: 'bg-[#8D8980]',
  info: 'bg-sky-400',
  default: 'bg-[#8D8980]',
  luxury: 'bg-[#C9A45C]',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
}

export default function Badge({
  variant = 'gray',
  size = 'md',
  dot = false,
  pulse = false,
  icon,
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-semibold rounded-full border transition-all duration-200',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span className={clsx(
              'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
              dotColors[variant]
            )} />
          )}
          <span className={clsx(
            'relative inline-flex rounded-full h-2 w-2',
            dotColors[variant]
          )} />
        </span>
      )}
      {icon && <span className="w-3.5 h-3.5">{icon}</span>}
      {children}
    </span>
  )
}

// Status Badge - Pre-configured for common statuses
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'processing' | string
  pulse?: boolean
  className?: string
}

const statusConfig: Record<string, { variant: BadgeProps['variant']; label: string; dot: boolean }> = {
  active: { variant: 'success', label: 'Active', dot: true },
  inactive: { variant: 'gray', label: 'Inactive', dot: true },
  pending: { variant: 'warning', label: 'Pending', dot: true },
  completed: { variant: 'success', label: 'Completed', dot: false },
  cancelled: { variant: 'danger', label: 'Cancelled', dot: false },
  processing: { variant: 'primary', label: 'Processing', dot: true },
  received: { variant: 'primary', label: 'Received', dot: true },
  diagnosing: { variant: 'warning', label: 'Diagnosing', dot: true },
  repairing: { variant: 'warning', label: 'Repairing', dot: true },
  ready_for_pickup: { variant: 'success', label: 'Ready', dot: true },
  delivered: { variant: 'success', label: 'Delivered', dot: false },
}

export function StatusBadge({ status, pulse = false, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { variant: 'gray', label: status, dot: false }
  
  return (
    <Badge
      variant={config.variant}
      dot={config.dot}
      pulse={pulse && config.dot}
      className={className}
    >
      {config.label}
    </Badge>
  )
}

// Number Badge - For showing counts
interface NumberBadgeProps {
  count: number
  max?: number
  variant?: BadgeProps['variant']
  className?: string
}

export function NumberBadge({ count, max = 99, variant = 'danger', className }: NumberBadgeProps) {
  if (count === 0) return null
  
  const displayCount = count > max ? `${max}+` : count.toString()
  
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full',
        variant === 'danger' && 'bg-danger-500 text-white',
        variant === 'primary' && 'bg-primary-500 text-white',
        variant === 'success' && 'bg-success-500 text-white',
        variant === 'warning' && 'bg-warning-500 text-white',
        className
      )}
    >
      {displayCount}
    </span>
  )
}
