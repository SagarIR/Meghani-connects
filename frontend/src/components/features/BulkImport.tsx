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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <FileUp className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Bulk Import {type.charAt(0).toUpperCase() + type.slice(1)}
                </h2>
                <p className="text-sm text-gray-500">Upload Excel or CSV file</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Download Template */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">Download Template</p>
                  <p className="text-sm text-blue-600">Use our template for correct format</p>
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={downloadTemplate}
                icon={<Download className="w-4 h-4" />}
              >
                Template
              </Button>
            </div>

            {/* File Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                isDragging 
                  ? 'border-primary-500 bg-primary-50' 
                  : file 
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
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
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      resetForm()
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-700">Drop your file here</p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                  <p className="text-xs text-gray-400">Excel (.xlsx) or CSV files up to 10MB</p>
                </div>
              )}
            </div>

            {/* Options */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  Update existing {type} (match by barcode)
                </span>
              </label>
            </div>

            {/* Results */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl ${
                  result.success ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                {result.success ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Import Complete</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                        <p className="text-xs text-gray-500">Imported</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{result.updated}</p>
                        <p className="text-xs text-gray-500">Updated</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-2xl font-bold text-gray-600">{result.skipped}</p>
                        <p className="text-xs text-gray-500">Skipped</p>
                      </div>
                    </div>
                    
                    {result.errors.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-orange-700 mb-2">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          {result.total_errors} errors found
                        </p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {result.errors.slice(0, 5).map((err, i) => (
                            <p key={i} className="text-xs text-orange-600">
                              Row {err.row}: {err.error}
                            </p>
                          ))}
                          {result.total_errors > 5 && (
                            <p className="text-xs text-orange-600">
                              ...and {result.total_errors - 5} more errors
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800">{result.error}</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
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
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Import More
                </Button>
              ) : (
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  loading={isUploading}
                  icon={<Upload className="w-4 h-4" />}
                >
                  {isUploading ? 'Importing...' : 'Import'}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
