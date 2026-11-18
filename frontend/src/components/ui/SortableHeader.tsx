'use client'

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import clsx from 'clsx'

export type SortDirection = 'asc' | 'desc' | null

interface SortableHeaderProps {
  label: string
  field: string
  currentSort: string
  currentDirection: SortDirection
  onSort: (field: string, direction: SortDirection) => void
  className?: string
}

export default function SortableHeader({
  label,
  field,
  currentSort,
  currentDirection,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = currentSort === field

  const handleClick = () => {
    if (!isActive) {
      onSort(field, 'asc')
    } else if (currentDirection === 'asc') {
      onSort(field, 'desc')
    } else {
      onSort(field, null)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={clsx(
        'flex items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-wider transition-colors group',
        isActive ? 'text-[#C9A45C]' : 'text-[#8D8980] hover:text-[#F3EFE6]',
        className
      )}
    >
      {label}
      <span className={clsx(
        'transition-opacity',
        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
      )}>
        {!isActive || currentDirection === null ? (
          <ArrowUpDown className="w-3.5 h-3.5" />
        ) : currentDirection === 'asc' ? (
          <ArrowUp className="w-3.5 h-3.5" />
        ) : (
          <ArrowDown className="w-3.5 h-3.5" />
        )}
      </span>
    </button>
  )
}
