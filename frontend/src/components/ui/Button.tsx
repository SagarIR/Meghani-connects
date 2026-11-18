'use client'

import { forwardRef } from 'react'
import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline' | 'luxury'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  isLoading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  isLoading,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
  disabled,
  ...props
}, ref) => {
  const isButtonLoading = loading || isLoading || false
  const baseStyles = `
    relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none
    active:scale-[0.98]
  `

  const variants = {
    primary: `
      bg-gradient-to-r from-[#C9A45C] via-[#DFC17B] to-[#C9A45C] text-[#0B0B0A] font-bold 
      shadow-md shadow-[#C9A45C]/20 border border-[#C9A45C]/40
      hover:brightness-105 hover:shadow-lg hover:shadow-[#C9A45C]/30 hover:-translate-y-0.5
      focus:ring-[#C9A45C]
    `,
    secondary: `
      bg-[#1F1E1A] text-[#F3EFE6] border border-[#2A261F] shadow-sm
      hover:bg-[#282620] hover:border-[#C9A45C]/50 hover:text-[#C9A45C] hover:shadow-md hover:-translate-y-0.5
      focus:ring-[#C9A45C]/30
    `,
    danger: `
      bg-red-950/60 text-red-300 border border-red-800/60 shadow-lg shadow-red-950/40
      hover:bg-red-900/60 hover:text-red-100 hover:shadow-xl hover:-translate-y-0.5
      focus:ring-red-500/40
    `,
    success: `
      bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 shadow-lg shadow-emerald-950/40
      hover:bg-emerald-900/60 hover:text-emerald-100 hover:shadow-xl hover:-translate-y-0.5
      focus:ring-emerald-500/40
    `,
    ghost: `
      bg-transparent text-[#8D8980] 
      hover:bg-[#1F1E1A] hover:text-[#F3EFE6]
      focus:ring-[#C9A45C]/20
    `,
    outline: `
      bg-transparent text-[#C9A45C] border border-[#C9A45C]/60
      hover:bg-[#C9A45C]/10 hover:border-[#C9A45C] hover:-translate-y-0.5
      focus:ring-[#C9A45C]
    `,
    luxury: `
      bg-gradient-to-r from-[#C9A45C] via-[#DFC17B] to-[#C9A45C] text-[#0B0B0A] font-bold shadow-lg shadow-[#C9A45C]/25 border border-[#C9A45C]
      hover:brightness-110 hover:shadow-xl hover:shadow-[#C9A45C]/35 hover:-translate-y-0.5
      focus:ring-[#C9A45C]
    `,
  }

  const sizes = {
    sm: 'px-3.5 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  }

  return (
    <button
      ref={ref}
      disabled={disabled || isButtonLoading}
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {isButtonLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="transition-transform group-hover:scale-110">{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="transition-transform group-hover:scale-110">{icon}</span>
          )}
        </>
      )}
    </button>
  )
})

Button.displayName = 'Button'

export default Button
