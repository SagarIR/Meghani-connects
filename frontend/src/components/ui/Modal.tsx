'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] sm:max-w-[90vw] max-h-[90vh]',
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
            onClick={closeOnOverlayClick ? onClose : undefined}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ 
                duration: 0.25, 
                ease: [0.16, 1, 0.3, 1]
              }}
              className={clsx(
                'relative bg-[#171613] text-[#F3EFE6] border border-[#2A261F] shadow-2xl w-full overflow-hidden',
                'rounded-t-2xl sm:rounded-2xl',
                'max-h-[90vh] sm:max-h-[85vh]',
                sizeClasses[size],
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-start justify-between p-4 sm:p-6 border-b border-[#2A261F] bg-[#12110F]/70">
                  <div className="pr-4">
                    {title && (
                      <h3 className="text-lg sm:text-xl font-bold text-[#F3EFE6] font-display tracking-wide">{title}</h3>
                    )}
                    {description && (
                      <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-[#8D8980]">{description}</p>
                    )}
                  </div>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-1.5 sm:p-2 -mr-1 sm:-mr-2 -mt-0.5 sm:-mt-1 text-[#8D8980] hover:text-[#F3EFE6] 
                               hover:bg-[#1F1E1A] rounded-lg sm:rounded-xl transition-all duration-200
                               focus:outline-none focus:ring-1 focus:ring-[#C9A45C]"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-4 sm:p-6 max-h-[calc(90vh-120px)] sm:max-h-[calc(85vh-200px)] overflow-y-auto">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

// Confirmation Modal
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmModalProps) {
  const iconColors = {
    danger: 'bg-red-950/80 text-red-400 border border-red-800/60',
    warning: 'bg-amber-950/80 text-amber-400 border border-amber-800/60',
    info: 'bg-[#C9A45C]/20 text-[#C9A45C] border border-[#C9A45C]/40',
  }

  const buttonColors = {
    danger: 'bg-red-950/80 text-red-200 border border-red-800/60 hover:bg-red-900',
    warning: 'bg-amber-950/80 text-amber-200 border border-amber-800/60 hover:bg-amber-900',
    info: 'bg-gradient-to-r from-[#C9A45C] to-[#E8D5A7] text-[#0B0B0A] font-bold hover:brightness-105',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="text-center">
        <div className={clsx(
          'w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full flex items-center justify-center mb-3 sm:mb-4',
          iconColors[variant]
        )}>
          <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-[#F3EFE6] font-display mb-1.5 sm:mb-2">{title}</h3>
        <p className="text-xs sm:text-sm text-[#8D8980] mb-4 sm:mb-6">{message}</p>

        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1F1E1A] text-[#F3EFE6] text-sm font-medium rounded-lg sm:rounded-xl
                     hover:bg-[#282620] border border-[#2A261F] transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={clsx(
              'flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-semibold rounded-lg sm:rounded-xl transition-all shadow-md disabled:opacity-50',
              buttonColors[variant]
            )}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
