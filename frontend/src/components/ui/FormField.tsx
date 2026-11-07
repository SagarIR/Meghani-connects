'use client'

import { forwardRef, useState } from 'react'
import clsx from 'clsx'
import { Eye, EyeOff, AlertCircle, CheckCircle, Info, Loader2 } from 'lucide-react'

// Enhanced Input with loading and better validation states
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: string
  hint?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  loading?: boolean
  required?: boolean
  showRequiredIndicator?: boolean
  helperText?: string
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(({
  label,
  error,
  success,
  hint,
  icon,
  iconPosition = 'left',
  type = 'text',
  loading = false,
  required = false,
  showRequiredIndicator = true,
  helperText,
  className,
  disabled,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused] = useState(false)
  const isPassword = type === 'password'

  const inputStyles = clsx(
    `w-full px-4 py-3 bg-white border rounded-xl text-gray-900 placeholder-gray-400
     transition-all duration-200 ease-out
     focus:outline-none focus:ring-2 focus:ring-offset-0
     disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed`,
    icon && iconPosition === 'left' && 'pl-11',
    icon && iconPosition === 'right' && 'pr-11',
    isPassword && 'pr-11',
    (loading || error || success) && 'pr-11',
    error && 'border-red-500 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30',
    success && !error && 'border-green-500 focus:ring-green-500/20 focus:border-green-500 bg-green-50/30',
    !error && !success && 'border-gray-200 focus:ring-primary-500/20 focus:border-primary-500 hover:border-gray-300',
    className
  )

  return (
    <div className="w-full">
      {label && (
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && showRequiredIndicator && (
            <span className="text-red-500">*</span>
          )}
          {helperText && (
            <span className="relative group ml-1">
              <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {helperText}
              </span>
            </span>
          )}
        </label>
      )}

      <div className="relative group">
        {icon && iconPosition === 'left' && (
          <span className={clsx(
            'absolute left-4 top-1/2 -translate-y-1/2 transition-colors',
            focused ? 'text-primary-500' : 'text-gray-400'
          )}>
            {icon}
          </span>
        )}

        <input
          ref={ref}
          type={isPassword && showPassword ? 'text' : type}
          className={inputStyles}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled || loading}
          required={required}
          {...props}
        />

        {icon && iconPosition === 'right' && !isPassword && !loading && !error && !success && (
          <span className={clsx(
            'absolute right-4 top-1/2 -translate-y-1/2 transition-colors',
            focused ? 'text-primary-500' : 'text-gray-400'
          )}>
            {icon}
          </span>
        )}

        {isPassword && !loading && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}

        {loading && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </span>
        )}

        {error && !loading && !isPassword && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
            <AlertCircle className="w-5 h-5" />
          </span>
        )}

        {success && !error && !loading && !isPassword && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
            <CheckCircle className="w-5 h-5" />
          </span>
        )}
      </div>

      {(error || success || hint) && (
        <p className={clsx(
          'mt-1.5 text-sm flex items-center gap-1',
          error && 'text-red-600',
          success && !error && 'text-green-600',
          !error && !success && 'text-gray-500'
        )}>
          {error && <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
          {success && !error && <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />}
          {error || success || hint}
        </p>
      )}
    </div>
  )
})

FormInput.displayName = 'FormInput'

// Enhanced Select with loading state
interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string; disabled?: boolean }[]
  loading?: boolean
  required?: boolean
  placeholder?: string
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(({
  label,
  error,
  options,
  loading = false,
  required = false,
  placeholder = 'Select an option',
  className,
  disabled,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={clsx(
            `w-full px-4 py-3 bg-white border rounded-xl text-gray-900
             transition-all duration-200 ease-out appearance-none cursor-pointer
             focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
             hover:border-gray-300
             disabled:bg-gray-50 disabled:cursor-not-allowed`,
            error ? 'border-red-500 bg-red-50/30' : 'border-gray-200',
            loading && 'pr-12',
            className
          )}
          disabled={disabled || loading}
          required={required}
          {...props}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        
        {loading && (
          <span className="absolute right-10 top-1/2 -translate-y-1/2 text-primary-500">
            <Loader2 className="w-4 h-4 animate-spin" />
          </span>
        )}
        
        {/* Dropdown arrow */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  )
})

FormSelect.displayName = 'FormSelect'

// Enhanced Textarea with character count
interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  loading?: boolean
  required?: boolean
  showCharCount?: boolean
  maxCharacters?: number
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(({
  label,
  error,
  hint,
  loading = false,
  required = false,
  showCharCount = false,
  maxCharacters,
  className,
  value,
  disabled,
  ...props
}, ref) => {
  const charCount = typeof value === 'string' ? value.length : 0
  const isOverLimit = maxCharacters ? charCount > maxCharacters : false

  return (
    <div className="w-full">
      {label && (
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <textarea
          ref={ref}
          value={value}
          className={clsx(
            `w-full px-4 py-3 bg-white border rounded-xl text-gray-900 placeholder-gray-400
             transition-all duration-200 ease-out resize-none
             focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
             hover:border-gray-300
             disabled:bg-gray-50 disabled:cursor-not-allowed`,
            error || isOverLimit ? 'border-red-500 bg-red-50/30' : 'border-gray-200',
            className
          )}
          disabled={disabled || loading}
          required={required}
          {...props}
        />
        
        {loading && (
          <span className="absolute right-4 top-4 text-primary-500">
            <Loader2 className="w-4 h-4 animate-spin" />
          </span>
        )}
      </div>
      
      <div className="flex items-center justify-between mt-1.5">
        {(error || hint) && (
          <p className={clsx(
            'text-sm flex items-center gap-1',
            error ? 'text-red-600' : 'text-gray-500'
          )}>
            {error && <AlertCircle className="w-3.5 h-3.5" />}
            {error || hint}
          </p>
        )}
        
        {showCharCount && (
          <p className={clsx(
            'text-xs ml-auto',
            isOverLimit ? 'text-red-600 font-medium' : 'text-gray-400'
          )}>
            {charCount}{maxCharacters && ` / ${maxCharacters}`}
          </p>
        )}
      </div>
    </div>
  )
})

FormTextarea.displayName = 'FormTextarea'

// Checkbox with improved styling
interface FormCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  description?: string
  error?: string
}

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(({
  label,
  description,
  error,
  className,
  ...props
}, ref) => {
  return (
    <div className="relative">
      <label className={clsx(
        'flex items-start gap-3 cursor-pointer group',
        props.disabled && 'cursor-not-allowed opacity-60',
        className
      )}>
        <div className="relative flex items-center justify-center w-5 h-5 mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            className={clsx(
              'w-5 h-5 border-2 rounded transition-all cursor-pointer appearance-none',
              'checked:bg-primary-600 checked:border-primary-600',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-0',
              error ? 'border-red-500' : 'border-gray-300 group-hover:border-gray-400'
            )}
            {...props}
          />
          {/* Checkmark */}
          <svg
            className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </label>
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1 ml-8">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  )
})

FormCheckbox.displayName = 'FormCheckbox'

// Form section with title and description
interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={clsx('space-y-4', className)}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

// Form row for inline fields
interface FormRowProps {
  children: React.ReactNode
  className?: string
}

export function FormRow({ children, className }: FormRowProps) {
  return (
    <div className={clsx('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
      {children}
    </div>
  )
}
