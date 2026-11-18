'use client'

import { forwardRef, useState } from 'react'
import clsx from 'clsx'
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: string
  hint?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  success,
  hint,
  icon,
  iconPosition = 'left',
  type = 'text',
  className,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'

  const inputStyles = clsx(
    `w-full px-4 py-2.5 bg-[#12110F] border rounded-xl text-[#F3EFE6] placeholder-[#8D8980]
     transition-all duration-200 ease-out
     focus:outline-none focus:ring-1 focus:ring-offset-0
     disabled:bg-[#1A1916] disabled:text-[#8D8980]/50 disabled:cursor-not-allowed`,
    icon && iconPosition === 'left' && 'pl-11',
    icon && iconPosition === 'right' && 'pr-11',
    isPassword && 'pr-11',
    error && 'border-red-500/80 focus:ring-red-500/20 focus:border-red-500 text-red-200',
    success && 'border-emerald-500/80 focus:ring-emerald-500/20 focus:border-emerald-500',
    !error && !success && 'border-[#2A261F] focus:ring-[#C9A45C]/25 focus:border-[#C9A45C] hover:border-[#3D372E]',
    className
  )

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-[#8D8980] uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}

      <div className="relative group">
        {icon && iconPosition === 'left' && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8D8980] group-focus-within:text-[#C9A45C] transition-colors">
            {icon}
          </span>
        )}

        <input
          ref={ref}
          type={isPassword && showPassword ? 'text' : type}
          className={inputStyles}
          {...props}
        />

        {icon && iconPosition === 'right' && !isPassword && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8D8980] group-focus-within:text-[#C9A45C] transition-colors">
            {icon}
          </span>
        )}

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8D8980] hover:text-[#F3EFE6] transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}

        {error && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-danger-500">
            <AlertCircle className="w-5 h-5" />
          </span>
        )}

        {success && !error && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-success-500">
            <CheckCircle className="w-5 h-5" />
          </span>
        )}
      </div>

      {(error || success || hint) && (
        <p className={clsx(
          'mt-1.5 text-sm',
          error && 'text-danger-600',
          success && !error && 'text-success-600',
          !error && !success && 'text-gray-500'
        )}>
          {error || success || hint}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  options,
  className,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={clsx(
          `w-full px-4 py-3 bg-white border rounded-xl text-gray-900
           transition-all duration-200 ease-out appearance-none cursor-pointer
           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
           hover:border-gray-300
           disabled:bg-gray-50 disabled:cursor-not-allowed`,
          error ? 'border-danger-500' : 'border-gray-200',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-sm text-danger-600">{error}</p>
      )}
    </div>
  )
})

Select.displayName = 'Select'

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  className,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={clsx(
          `w-full px-4 py-3 bg-white border rounded-xl text-gray-900 placeholder-gray-400
           transition-all duration-200 ease-out resize-none
           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
           hover:border-gray-300
           disabled:bg-gray-50 disabled:cursor-not-allowed`,
          error ? 'border-danger-500' : 'border-gray-200',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-danger-600">{error}</p>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'
