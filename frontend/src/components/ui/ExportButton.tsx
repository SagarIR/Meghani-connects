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
          'inline-flex items-center gap-2 px-4 py-2.5 bg-[#171613] border border-[#2A261F] rounded-xl',
          'text-sm font-medium text-[#F3EFE6] shadow-sm',
          'hover:bg-[#1F1E1A] hover:border-[#C9A45C]/40 hover:text-[#C9A45C] transition-all duration-200',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          className
        )}
      >
        <Download className="w-4 h-4 text-[#C9A45C]" />
        <span>Export</span>
        <ChevronDown className={clsx(
          'w-4 h-4 text-[#8D8980] transition-transform',
          isOpen && 'rotate-180 text-[#C9A45C]'
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
              className="absolute right-0 mt-2 w-52 bg-[#171613] rounded-xl shadow-2xl border border-[#2A261F] py-1.5 z-20 backdrop-blur-md"
            >
              <button
                onClick={() => handleExport('excel')}
                disabled={exporting !== null}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#F3EFE6] hover:bg-[#1F1E1A] hover:text-[#C9A45C] transition-colors disabled:opacity-40"
              >
                {exporting === 'excel' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#C9A45C]" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                )}
                <span className="flex-1 text-left font-medium">Export as Excel</span>
                <span className="text-[11px] text-[#8D8980] font-mono">.xlsx</span>
              </button>
              
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting !== null}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#F3EFE6] hover:bg-[#1F1E1A] hover:text-[#C9A45C] transition-colors disabled:opacity-40"
              >
                {exporting === 'csv' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#C9A45C]" />
                ) : (
                  <FileText className="w-4 h-4 text-[#C9A45C]" />
                )}
                <span className="flex-1 text-left font-medium">Export as CSV</span>
                <span className="text-[11px] text-[#8D8980] font-mono">.csv</span>
              </button>

              <div className="border-t border-[#2A261F] mt-1 pt-1.5 px-4 py-1.5 flex items-center justify-between text-xs text-[#8D8980]">
                <span>Dataset size:</span>
                <span className="font-mono text-[#F3EFE6] font-semibold">
                  {data.length} {data.length === 1 ? 'row' : 'rows'}
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
