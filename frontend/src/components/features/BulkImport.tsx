'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, X, FileSpreadsheet, Download, CheckCircle, XCircle, 
  AlertCircle, Loader2, FileUp, RefreshCw
} from 'lucide-react'
import Button from '@/components/ui/Button'
import api from '@/services/api'
import toast from 'react-hot-toast'

interface BulkImportProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  type: 'products' | 'customers'
}

interface ImportResult {
  success: boolean
  imported: number
  updated: number
  skipped: number
  errors: Array<{ row: number; error: string }>
  total_errors: number
  error?: string
}

export default function BulkImport({ isOpen, onClose, onSuccess, type }: BulkImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [updateExisting, setUpdateExisting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    validateAndSetFile(droppedFile)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      validateAndSetFile(selectedFile)
    }
  }

  const validateAndSetFile = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv'
    ]
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/)) {
      toast.error('Please upload an Excel (.xlsx) or CSV file')
      return
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }
    
    setFile(file)
    setResult(null)
  }

  const handleUpload = async () => {
    if (!file) return
    
    setIsUploading(true)
    setResult(null)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const endpoint = type === 'products' 
        ? `/products/import/?update_existing=${updateExisting}`
        : `/customers/import/?update_existing=${updateExisting}`
      
      const response = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      setResult(response.data)
      
      if (response.data.success) {
        toast.success(`Successfully imported ${response.data.imported} ${type}`)
        if (response.data.imported > 0 || response.data.updated > 0) {
          onSuccess()
        }
      } else {
        toast.error(response.data.error || 'Import failed')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Import failed')
      setResult({
        success: false,
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: [],
        total_errors: 0,
        error: error.response?.data?.error || 'Import failed'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    const endpoint = type === 'products' 
      ? '/products/import/template/'
      : '/customers/import/template/'
    
    window.open(`${api.defaults.baseURL}${endpoint}`, '_blank')
  }

  const resetForm = () => {
    setFile(null)
    setResult(null)
    setUpdateExisting(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-[#171613] border border-[#2A261F] rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A261F]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#C9A45C]/15 border border-[#C9A45C]/30 rounded-xl flex items-center justify-center">
                <FileUp className="w-5 h-5 text-[#C9A45C]" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold text-[#F3EFE6]">
                  Bulk Import {type.charAt(0).toUpperCase() + type.slice(1)}
                </h2>
                <p className="text-xs text-[#8D8980]">Upload structured Excel (.xlsx) or CSV catalog</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[#1F1E1A] hover:bg-[#2A261F] border border-[#2A261F] flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-[#8D8980] hover:text-[#F3EFE6]" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Download Template */}
            <div className="flex items-center justify-between p-4 bg-[#1F1E1A] border border-[#2A261F] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#F3EFE6]">Standard Import Template</p>
                  <p className="text-xs text-[#8D8980]">Pre-formatted columns with field validations</p>
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={downloadTemplate}
                icon={<Download className="w-3.5 h-3.5 text-[#C9A45C]" />}
              >
                Download
              </Button>
            </div>

            {/* File Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                isDragging 
                  ? 'border-[#C9A45C] bg-[#C9A45C]/10' 
                  : file 
                    ? 'border-emerald-500/50 bg-emerald-950/20'
                    : 'border-[#2A261F] hover:border-[#C9A45C]/40 bg-[#12110F]/60'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {file ? (
                <div className="space-y-2">
                  <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
                    <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
                  </div>
                  <p className="font-medium text-[#F3EFE6] text-sm">{file.name}</p>
                  <p className="text-xs text-[#8D8980] font-mono">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      resetForm()
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-14 h-14 bg-[#1F1E1A] border border-[#2A261F] rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6 text-[#C9A45C]" />
                  </div>
                  <p className="font-medium text-[#F3EFE6] text-sm">Drop your catalog file here</p>
                  <p className="text-xs text-[#8D8980]">or click to select from your workstation</p>
                  <p className="text-[11px] text-[#8D8980]/80">Excel (.xlsx) or CSV files up to 10MB</p>
                </div>
              )}
            </div>

            {/* Options */}
            <div className="flex items-center gap-3 p-3 bg-[#12110F] border border-[#2A261F] rounded-xl">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                  className="w-4 h-4 text-[#C9A45C] bg-[#171613] rounded border-[#2A261F] focus:ring-[#C9A45C] accent-[#C9A45C]"
                />
                <span className="text-xs text-[#F3EFE6] font-medium">
                  Update existing {type} (matches by unique barcode / identifier)
                </span>
              </label>
            </div>

            {/* Results */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border ${
                  result.success 
                    ? 'bg-emerald-950/30 border-emerald-800/40' 
                    : 'bg-rose-950/30 border-rose-800/40'
                }`}
              >
                {result.success ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-emerald-300 text-sm">Batch Ingestion Completed</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-2.5 bg-[#171613] border border-[#2A261F] rounded-lg">
                        <p className="text-xl font-bold font-mono text-emerald-400">{result.imported}</p>
                        <p className="text-[11px] text-[#8D8980]">Imported</p>
                      </div>
                      <div className="p-2.5 bg-[#171613] border border-[#2A261F] rounded-lg">
                        <p className="text-xl font-bold font-mono text-[#C9A45C]">{result.updated}</p>
                        <p className="text-[11px] text-[#8D8980]">Updated</p>
                      </div>
                      <div className="p-2.5 bg-[#171613] border border-[#2A261F] rounded-lg">
                        <p className="text-xl font-bold font-mono text-[#8D8980]">{result.skipped}</p>
                        <p className="text-[11px] text-[#8D8980]">Skipped</p>
                      </div>
                    </div>
                    
                    {result.errors.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#2A261F]">
                        <p className="text-xs font-semibold text-amber-400 mb-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{result.total_errors} validation warning(s)</span>
                        </p>
                        <div className="max-h-28 overflow-y-auto space-y-1 font-mono text-[11px]">
                          {result.errors.slice(0, 5).map((err, i) => (
                            <p key={i} className="text-amber-300/80">
                              Row {err.row}: {err.error}
                            </p>
                          ))}
                          {result.total_errors > 5 && (
                            <p className="text-amber-400/60">
                              ...and {result.total_errors - 5} more errors
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span className="text-xs text-rose-300 font-medium">{result.error}</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
              {result?.success ? (
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={resetForm}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Import Another File
                </Button>
              ) : (
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  loading={isUploading}
                  icon={<Upload className="w-3.5 h-3.5" />}
                >
                  {isUploading ? 'Ingesting Data...' : 'Start Ingestion'}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
