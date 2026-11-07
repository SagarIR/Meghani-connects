'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

type ShortcutHandler = () => void

interface Shortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  handler: ShortcutHandler
  description: string
  category: string
}

const globalShortcuts: Omit<Shortcut, 'handler'>[] = [
  // Navigation
  { key: 'g', alt: true, description: 'Go to Dashboard', category: 'Navigation' },
  { key: 'd', alt: true, description: 'Go to Dashboard', category: 'Navigation' },
  { key: 'p', alt: true, description: 'Go to Products', category: 'Navigation' },
  { key: 's', alt: true, description: 'Go to Sales/POS', category: 'Navigation' },
  { key: 'r', alt: true, description: 'Go to Repairs', category: 'Navigation' },
  { key: 'c', alt: true, description: 'Go to Customers', category: 'Navigation' },
  { key: 'e', alt: true, description: 'Go to Expenses', category: 'Navigation' },
  
  // Actions
  { key: 'n', ctrl: true, description: 'New item (context-aware)', category: 'Actions' },
  { key: 'k', ctrl: true, description: 'Open search', category: 'Actions' },
  { key: '/', description: 'Focus search', category: 'Actions' },
  { key: 'Escape', description: 'Close modal/cancel', category: 'Actions' },
  
  // Quick actions
  { key: '?', shift: true, description: 'Show shortcuts help', category: 'Help' },
]

export function useKeyboardShortcuts(customShortcuts?: Shortcut[]) {
  const router = useRouter()

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      // Allow Escape to work in inputs
      if (event.key !== 'Escape') {
        return
      }
    }

    const key = event.key.toLowerCase()
    const ctrl = event.ctrlKey || event.metaKey
    const shift = event.shiftKey
    const alt = event.altKey

    // Navigation shortcuts (Alt + key)
    if (alt && !ctrl && !shift) {
      switch (key) {
        case 'g':
        case 'd':
          event.preventDefault()
          router.push('/dashboard')
          break
        case 'p':
          event.preventDefault()
          router.push('/products')
          break
        case 's':
          event.preventDefault()
          router.push('/sales')
          break
        case 'r':
          event.preventDefault()
          router.push('/repairs')
          break
        case 'c':
          event.preventDefault()
          router.push('/customers')
          break
        case 'e':
          event.preventDefault()
          router.push('/expenses')
          break
        case 'h':
          event.preventDefault()
          router.push('/sales/history')
          break
        case 'n':
          event.preventDefault()
          router.push('/notifications')
          break
      }
    }

    // Search shortcut (Ctrl+K or /)
    if ((ctrl && key === 'k') || (key === '/' && !ctrl && !alt)) {
      event.preventDefault()
      // Dispatch custom event for search
      window.dispatchEvent(new CustomEvent('openSearch'))
    }

    // New item shortcut (Ctrl+N)
    if (ctrl && key === 'n' && !shift && !alt) {
      event.preventDefault()
      window.dispatchEvent(new CustomEvent('newItem'))
    }

    // Help shortcut (Shift+?)
    if (shift && key === '?') {
      event.preventDefault()
      window.dispatchEvent(new CustomEvent('showShortcuts'))
    }

    // Custom shortcuts
    if (customShortcuts) {
      for (const shortcut of customShortcuts) {
        if (
          shortcut.key.toLowerCase() === key &&
          !!shortcut.ctrl === ctrl &&
          !!shortcut.shift === shift &&
          !!shortcut.alt === alt
        ) {
          event.preventDefault()
          shortcut.handler()
          break
        }
      }
    }
  }, [router, customShortcuts])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return { shortcuts: globalShortcuts }
}

// Hook for listening to custom events - uses ref to avoid re-renders
export function useShortcutEvent(eventName: string, handler: () => void) {
  const handlerRef = useRef(handler)
  
  // Update ref when handler changes
  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    const listener = () => handlerRef.current()
    window.addEventListener(eventName, listener)
    return () => window.removeEventListener(eventName, listener)
  }, [eventName])
}

export { globalShortcuts }
