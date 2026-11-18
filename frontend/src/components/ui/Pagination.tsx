'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import clsx from 'clsx'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  showPageSizeSelector?: boolean
  className?: string
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSizeSelector = true,
  className,
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const showPages = 5 // Max pages to show
    
    if (totalPages <= showPages + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      if (currentPage > 3) {
        pages.push('...')
      }
      
      // Show pages around current
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i)
        }
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...')
      }
      
      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  if (totalPages <= 1 && !showPageSizeSelector) return null

  return (
    <div className={clsx('flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-3 text-[#8D8980]', className)}>
      {/* Items info */}
      <div className="text-sm order-2 sm:order-1">
        Showing <span className="font-semibold text-[#F3EFE6]">{startItem}</span> to{' '}
        <span className="font-semibold text-[#F3EFE6]">{endItem}</span> of{' '}
        <span className="font-semibold text-[#C9A45C]">{totalItems}</span> results
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2 order-1 sm:order-2">
        {/* Page size selector */}
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2 mr-4">
            <span className="text-xs font-medium uppercase tracking-wider hidden sm:inline">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2.5 py-1 text-xs border border-[#2A261F] rounded-lg bg-[#1F1E1A] text-[#F3EFE6] focus:ring-1 focus:ring-[#C9A45C] focus:border-[#C9A45C] outline-none"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Page navigation */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {/* First page */}
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className={clsx(
                'p-1.5 rounded-lg transition-colors',
                currentPage === 1
                  ? 'text-[#8D8980]/30 cursor-not-allowed'
                  : 'text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A]'
              )}
              title="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Previous page */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={clsx(
                'p-1.5 rounded-lg transition-colors',
                currentPage === 1
                  ? 'text-[#8D8980]/30 cursor-not-allowed'
                  : 'text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A]'
              )}
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => (
                typeof page === 'number' ? (
                  <button
                    key={index}
                    onClick={() => onPageChange(page)}
                    className={clsx(
                      'min-w-[32px] h-8 px-2 text-xs font-semibold rounded-lg transition-colors',
                      page === currentPage
                        ? 'bg-gradient-to-r from-[#C9A45C] to-[#E8D5A7] text-[#0B0B0A] shadow-sm'
                        : 'text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A]'
                    )}
                  >
                    {page}
                  </button>
                ) : (
                  <span key={index} className="px-1 text-[#8D8980]/50 text-xs">
                    {page}
                  </span>
                )
              ))}
            </div>

            {/* Next page */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={clsx(
                'p-1.5 rounded-lg transition-colors',
                currentPage === totalPages
                  ? 'text-[#8D8980]/30 cursor-not-allowed'
                  : 'text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A]'
              )}
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last page */}
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={clsx(
                'p-1.5 rounded-lg transition-colors',
                currentPage === totalPages
                  ? 'text-[#8D8980]/30 cursor-not-allowed'
                  : 'text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A]'
              )}
              title="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
