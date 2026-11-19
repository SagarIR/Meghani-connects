'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Keyboard, Command } from 'lucide-react'
import { useShortcutEvent } from '@/hooks/useKeyboardShortcuts'

const shortcuts = [
  {
    category: 'Navigation',
    items: [
      { keys: ['Alt', 'D'], description: 'Go to Dashboard' },
      { keys: ['Alt', 'P'], description: 'Go to Products' },
      { keys: ['Alt', 'S'], description: 'Go to Sales/POS' },
      { keys: ['Alt', 'R'], description: 'Go to Repairs' },
      { keys: ['Alt', 'C'], description: 'Go to Customers' },
      { keys: ['Alt', 'E'], description: 'Go to Expenses' },
    ]
  },
  {
    category: 'Actions',
    items: [
      { keys: ['Ctrl', 'K'], description: 'Open search' },
      { keys: ['/'], description: 'Focus search' },
      { keys: ['Ctrl', 'N'], description: 'New item' },
      { keys: ['Ctrl', 'S'], description: 'Save' },
      { keys: ['Esc'], description: 'Close / Cancel' },
    ]
  },
  {
    category: 'Bulk Actions',
    items: [
      { keys: ['Ctrl', 'A'], description: 'Select all' },
      { keys: ['Shift', 'Click'], description: 'Select range' },
      { keys: ['Delete'], description: 'Delete selected' },
    ]
  },
  {
    category: 'Help',
    items: [
      { keys: ['Shift', '?'], description: 'Show shortcuts' },
    ]
  },
]

export default function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false)

  useShortcutEvent('showShortcuts', () => setIsOpen(true))

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-[#171613] text-[#F3EFE6] border border-[#2A261F] rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#2A261F] bg-[#12110F]/80 flex-shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1F1E1A] border border-[#C9A45C]/40 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 text-[#C9A45C]">
                    <Keyboard className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold font-serif text-[#F3EFE6] tracking-wide">Keyboard Shortcuts</h2>
                    <p className="text-xs sm:text-sm text-[#8D8980] hidden sm:block">Quick keyboard shortcuts for daily store operations</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 sm:p-2 text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A] rounded-lg sm:rounded-xl transition-colors"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {shortcuts.map((section) => (
                    <div key={section.category}>
                      <h3 className="text-xs sm:text-sm font-semibold text-[#C9A45C] uppercase tracking-wider mb-2 sm:mb-3">
                        {section.category}
                      </h3>
                      <div className="space-y-1.5 sm:space-y-2">
                        {section.items.map((shortcut, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between py-1.5 sm:py-2 px-2.5 sm:px-3 bg-[#1F1E1A] border border-[#2A261F] rounded-lg"
                          >
                            <span className="text-xs sm:text-sm text-[#F3EFE6]">{shortcut.description}</span>
                            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                              {shortcut.keys.map((key, i) => (
                                <span key={i} className="flex items-center">
                                  <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#12110F] border border-[#2A261F] rounded-md text-[10px] sm:text-xs font-mono text-[#C9A45C] shadow-sm">
                                    {key === 'Ctrl' && typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? (
                                      <Command className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline" />
                                    ) : (
                                      key
                                    )}
                                  </kbd>
                                  {i < shortcut.keys.length - 1 && (
                                    <span className="text-[#8D8980] mx-0.5 sm:mx-1 text-[10px] sm:text-xs">+</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 sm:p-4 bg-[#12110F] border-t border-[#2A261F] flex-shrink-0">
                <p className="text-center text-xs sm:text-sm text-[#8D8980]">
                  Press <kbd className="px-1.5 py-0.5 bg-[#1F1E1A] border border-[#2A261F] rounded text-[#C9A45C] font-mono text-xs">Shift + ?</kbd> anywhere to toggle this guide &bull; <kbd className="px-1.5 py-0.5 bg-[#1F1E1A] border border-[#2A261F] rounded text-[#8D8980] font-mono text-xs">Esc</kbd> to close
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
