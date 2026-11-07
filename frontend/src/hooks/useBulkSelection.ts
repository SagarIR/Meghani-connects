'use client'

import { useState, useCallback } from 'react'

interface UseBulkSelectionProps<T> {
  items: T[]
  getItemId: (item: T) => number | string
}

export function useBulkSelection<T>({ items, getItemId }: UseBulkSelectionProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)

  const isSelected = useCallback((item: T) => {
    return selectedIds.has(getItemId(item))
  }, [selectedIds, getItemId])

  const toggle = useCallback((item: T, shiftKey = false) => {
    const id = getItemId(item)
    const currentIndex = items.findIndex(i => getItemId(i) === id)
    
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      
      // Handle shift+click for range selection
      if (shiftKey && lastSelectedIndex !== null && currentIndex !== lastSelectedIndex) {
        const start = Math.min(lastSelectedIndex, currentIndex)
        const end = Math.max(lastSelectedIndex, currentIndex)
        
        for (let i = start; i <= end; i++) {
          newSet.add(getItemId(items[i]))
        }
      } else {
        // Toggle single item
        if (newSet.has(id)) {
          newSet.delete(id)
        } else {
          newSet.add(id)
        }
      }
      
      return newSet
    })
    
    setLastSelectedIndex(currentIndex)
  }, [items, getItemId, lastSelectedIndex])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(getItemId)))
  }, [items, getItemId])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
    setLastSelectedIndex(null)
  }, [])

  const toggleAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      deselectAll()
    } else {
      selectAll()
    }
  }, [selectedIds.size, items.length, selectAll, deselectAll])

  const getSelectedItems = useCallback(() => {
    return items.filter(item => selectedIds.has(getItemId(item)))
  }, [items, selectedIds, getItemId])

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isSelected,
    toggle,
    selectAll,
    deselectAll,
    toggleAll,
    getSelectedItems,
    isAllSelected: selectedIds.size === items.length && items.length > 0,
    isPartiallySelected: selectedIds.size > 0 && selectedIds.size < items.length,
  }
}
