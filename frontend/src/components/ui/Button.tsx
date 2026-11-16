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
      bg-gradient-to-r from-primary-600 to-primary-500 text-white 
      shadow-lg shadow-primary-500/25
      hover:from-primary-500 hover:to-primary-400 
      hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5
      focus:ring-primary-500
    `,
    secondary: `
      bg-white text-gray-700 border border-gray-200 shadow-sm
      hover:bg-gray-50 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5
      focus:ring-gray-400
    `,
    danger: `
      bg-gradient-to-r from-danger-600 to-danger-500 text-white 
      shadow-lg shadow-danger-500/25
      hover:from-danger-500 hover:to-danger-400 
      hover:shadow-xl hover:shadow-danger-500/30 hover:-translate-y-0.5
      focus:ring-danger-500
    `,
    success: `
      bg-gradient-to-r from-success-600 to-success-500 text-white 
      shadow-lg shadow-success-500/25
      hover:from-success-500 hover:to-success-400 
      hover:shadow-xl hover:shadow-success-500/30 hover:-translate-y-0.5
      focus:ring-success-500
    `,
    ghost: `
      bg-transparent text-gray-600 
      hover:bg-gray-100 hover:text-gray-900
      focus:ring-gray-400
    `,
    outline: `
      bg-transparent text-primary-600 border-2 border-primary-600
      hover:bg-primary-50 hover:-translate-y-0.5
      focus:ring-primary-500
    `,
    luxury: `
      bg-gradient-to-r from-[#C9A04F] to-[#DFC17B] text-[#101010] font-bold shadow-lg shadow-[#C9A04F]/20
      hover:from-[#DFC17B] hover:to-[#C9A04F] hover:shadow-xl hover:shadow-[#C9A04F]/30 hover:-translate-y-0.5
      focus:ring-[#C9A04F]
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
