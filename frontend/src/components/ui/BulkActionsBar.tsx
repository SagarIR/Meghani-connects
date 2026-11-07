'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Download, Edit, Check, XCircle } from 'lucide-react'
import Button from './Button'

interface BulkAction {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'danger' | 'secondary'
  loading?: boolean
}

interface BulkActionsBarProps {
  selectedCount: number
  totalCount: number
  onDeselectAll: () => void
  onSelectAll: () => void
  actions: BulkAction[]
  isAllSelected: boolean
}

export default function BulkActionsBar({
  selectedCount,
  totalCount,
  onDeselectAll,
  onSelectAll,
  actions,
  isAllSelected,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
      >
        <div className="bg-gray-900 text-white rounded-2xl shadow-2xl flex items-center gap-4 px-6 py-4">
          {/* Selection info */}
          <div className="flex items-center gap-3 pr-4 border-r border-gray-700">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">{selectedCount} selected</p>
              <button 
                onClick={isAllSelected ? onDeselectAll : onSelectAll}
                className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
              >
                {isAllSelected ? 'Deselect all' : `Select all ${totalCount}`}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                  ${action.variant === 'danger' 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                    : action.variant === 'secondary'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          {/* Close button */}
          <button
            onClick={onDeselectAll}
            className="ml-2 p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Pre-built actions
export const bulkDeleteAction = (onClick: () => void, loading?: boolean): BulkAction => ({
  id: 'delete',
  label: 'Delete',
  icon: <Trash2 className="w-4 h-4" />,
  onClick,
  variant: 'danger',
  loading,
})

export const bulkExportAction = (onClick: () => void): BulkAction => ({
  id: 'export',
  label: 'Export',
  icon: <Download className="w-4 h-4" />,
  onClick,
  variant: 'secondary',
})

export const bulkEditAction = (onClick: () => void): BulkAction => ({
  id: 'edit',
  label: 'Edit',
  icon: <Edit className="w-4 h-4" />,
  onClick,
  variant: 'primary',
})
