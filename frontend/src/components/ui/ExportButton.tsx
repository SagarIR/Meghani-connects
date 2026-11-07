'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FileSpreadsheet, FileText, ChevronDown, Loader2 } from 'lucide-react'
import { exportToCSV, exportToExcel } from '@/utils/export'
import clsx from 'clsx'

interface ExportColumn {
  key: string
  header: string
  transform?: (value: any, row: any) => string | number
}

interface ExportButtonProps {
  data: any[]
  columns: ExportColumn[]
  filename: string
  disabled?: boolean
  className?: string
}

export default function ExportButton({
  data,
  columns,
  filename,
  disabled = false,
  className
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [exporting, setExporting] = useState<'csv' | 'excel' | null>(null)

  const handleExport = async (format: 'csv' | 'excel') => {
    if (data.length === 0) return

    setExporting(format)
    
    // Small delay for UI feedback
    await new Promise(resolve => setTimeout(resolve, 300))

    try {
      if (format === 'csv') {
        exportToCSV(data, columns, filename)
      } else {
        exportToExcel(data, columns, filename)
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(null)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || data.length === 0}
        className={clsx(
          'inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl',
          'text-sm font-medium text-gray-700 shadow-sm',
          'hover:bg-gray-50 hover:border-gray-300 transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
      >
        <Download className="w-4 h-4" />
        Export
        <ChevronDown className={clsx(
          'w-4 h-4 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)} 
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20"
            >
              <button
                onClick={() => handleExport('excel')}
                disabled={exporting !== null}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {exporting === 'excel' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                )}
                <span className="flex-1 text-left">Export as Excel</span>
                <span className="text-xs text-gray-400">.xlsx</span>
              </button>
              
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting !== null}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {exporting === 'csv' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <FileText className="w-4 h-4 text-blue-600" />
                )}
                <span className="flex-1 text-left">Export as CSV</span>
                <span className="text-xs text-gray-400">.csv</span>
              </button>

              <div className="border-t border-gray-100 mt-1 pt-1 px-4 py-2">
                <p className="text-xs text-gray-400">
                  {data.length} {data.length === 1 ? 'record' : 'records'}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
