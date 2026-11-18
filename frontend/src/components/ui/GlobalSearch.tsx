'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, X, Package, Users, ShoppingCart, Wrench, 
  Clock, ArrowRight, Command, Loader2
} from 'lucide-react'
import { api } from '@/services/api'
import { useShortcutEvent } from '@/hooks/useKeyboardShortcuts'
import clsx from 'clsx'

interface SearchResult {
  id: number
  type: 'product' | 'customer' | 'sale' | 'repair'
  title: string
  subtitle: string
  meta?: string
}

const typeConfig = {
  product: { icon: Package, color: 'text-[#C9A45C]', bg: 'bg-[#C9A45C]/15 border border-[#C9A45C]/30', label: 'Product' },
  customer: { icon: Users, color: 'text-amber-400', bg: 'bg-amber-950/60 border border-amber-800/40', label: 'Customer' },
  sale: { icon: ShoppingCart, color: 'text-emerald-400', bg: 'bg-emerald-950/60 border border-emerald-800/40', label: 'Sale' },
  repair: { icon: Wrench, color: 'text-sky-400', bg: 'bg-sky-950/60 border border-sky-800/40', label: 'Repair' },
}

const quickActions = [
  { label: 'New Sale', href: '/sales', icon: ShoppingCart, shortcut: 'Alt+S' },
  { label: 'Add Product', href: '/products', icon: Package, shortcut: 'Alt+P' },
  { label: 'New Customer', href: '/customers', icon: Users, shortcut: 'Alt+C' },
  { label: 'New Repair', href: '/repairs', icon: Wrench, shortcut: 'Alt+R' },
]

export default function GlobalSearch() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useShortcutEvent('openSearch', () => {
    setIsOpen(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  })

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const [products, customers, sales, repairs] = await Promise.allSettled([
        api.get(`/products/?search=${searchQuery}&limit=5`),
        api.get(`/customers/?search=${searchQuery}&limit=5`),
        api.get(`/sales/?search=${searchQuery}&limit=5`),
        api.get(`/repairs/?search=${searchQuery}&limit=5`),
      ])

      const allResults: SearchResult[] = []

      if (products.status === 'fulfilled') {
        const data = products.value.data.results || products.value.data
        data.slice(0, 3).forEach((p: any) => {
          allResults.push({
            id: p.id,
            type: 'product',
            title: p.name,
            subtitle: p.brand || 'No brand',
            meta: `₹${p.selling_price?.toLocaleString('en-IN')}`,
          })
        })
      }

      if (customers.status === 'fulfilled') {
        const data = customers.value.data.results || customers.value.data
        data.slice(0, 3).forEach((c: any) => {
          allResults.push({
            id: c.id,
            type: 'customer',
            title: c.name,
            subtitle: c.phone || c.email || 'No contact',
            meta: c.loyalty_points ? `${c.loyalty_points} pts` : undefined,
          })
        })
      }

      if (sales.status === 'fulfilled') {
        const data = sales.value.data.results || sales.value.data
        data.slice(0, 3).forEach((s: any) => {
          allResults.push({
            id: s.id,
            type: 'sale',
            title: `Invoice #${s.invoice_number}`,
            subtitle: s.customer_name || 'Walk-in',
            meta: `₹${s.total_amount?.toLocaleString('en-IN')}`,
          })
        })
      }

      if (repairs.status === 'fulfilled') {
        const data = repairs.value.data.results || repairs.value.data
        data.slice(0, 3).forEach((r: any) => {
          allResults.push({
            id: r.id,
            type: 'repair',
            title: `Ticket #${r.ticket_number}`,
            subtitle: r.customer_name || r.item_type,
            meta: r.status,
          })
        })
      }

      setResults(allResults)
      setSelectedIndex(0)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, performSearch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = results.length > 0 ? results.length : quickActions.length

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % totalItems)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems)
        break
      case 'Enter':
        e.preventDefault()
        if (results.length > 0) {
          handleResultClick(results[selectedIndex])
        } else if (quickActions[selectedIndex]) {
          router.push(quickActions[selectedIndex].href)
          setIsOpen(false)
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  const handleResultClick = (result: SearchResult) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))

    const routes: Record<string, string> = {
      product: '/products',
      customer: '/customers',
      sale: '/sales/history',
      repair: '/repairs',
    }
    router.push(`${routes[result.type]}?id=${result.id}`)
    setIsOpen(false)
    setQuery('')
  }

  const handleClose = () => {
    setIsOpen(false)
    setQuery('')
    setResults([])
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 pt-[10vh] sm:pt-[15vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-[#171613] text-[#F3EFE6] border border-[#2A261F] rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-[#2A261F] bg-[#12110F]/80">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#C9A45C] flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search products, customers, transactions, repairs..."
                  className="flex-1 text-base sm:text-lg text-[#F3EFE6] placeholder-[#8D8980] bg-transparent outline-none min-w-0"
                  autoFocus
                />
                {loading && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#C9A45C] animate-spin flex-shrink-0" />}
                <button onClick={handleClose} className="p-1.5 text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A] rounded-lg sm:hidden">
                  <X className="w-5 h-5" />
                </button>
                <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-[#1F1E1A] border border-[#2A261F] rounded-lg text-xs text-[#8D8980] flex-shrink-0">
                  <span>ESC</span>
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[50vh] sm:max-h-[50vh] overflow-y-auto">
                {query && results.length > 0 ? (
                  <div className="p-2 space-y-1">
                    <p className="px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Results</p>
                    {results.map((result, index) => {
                      const config = typeConfig[result.type]
                      const Icon = config.icon
                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleResultClick(result)}
                          className={clsx(
                            'w-full flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-colors text-left border',
                            selectedIndex === index 
                              ? 'bg-[#1F1E1A] border-[#C9A45C]/40 text-[#F3EFE6]' 
                              : 'bg-transparent border-transparent hover:bg-[#1F1E1A]/60'
                          )}
                        >
                          <div className={clsx('w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0', config.bg)}>
                            <Icon className={clsx('w-4 h-4 sm:w-5 sm:h-5', config.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base text-[#F3EFE6] truncate">{result.title}</p>
                            <p className="text-xs sm:text-sm text-[#8D8980] truncate">{result.subtitle}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={clsx('text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full', config.bg, config.color)}>
                              {config.label}
                            </span>
                            {result.meta && (
                              <p className="text-xs sm:text-sm font-semibold text-[#C9A45C] mt-0.5 sm:mt-1 font-mono">{result.meta}</p>
                            )}
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8D8980] hidden sm:block flex-shrink-0" />
                        </button>
                      )
                    })}
                  </div>
                ) : query && !loading ? (
                  <div className="p-6 sm:p-8 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-[#1F1E1A] border border-[#2A261F] rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                      <Search className="w-6 h-6 sm:w-8 sm:h-8 text-[#8D8980]" />
                    </div>
                    <p className="text-sm sm:text-base text-[#F3EFE6]">No results for &ldquo;{query}&rdquo;</p>
                    <p className="text-xs sm:text-sm text-[#8D8980] mt-1">Try searching by model, brand, customer name or phone</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {recentSearches.length > 0 && (
                      <div className="mb-3 sm:mb-4">
                        <p className="px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-[#8D8980] uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#C9A45C]" />
                          Recent Queries
                        </p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 px-2 sm:px-3">
                          {recentSearches.map((term) => (
                            <button
                              key={term}
                              onClick={() => setQuery(term)}
                              className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#1F1E1A] border border-[#2A261F] hover:border-[#C9A45C]/40 rounded-lg text-xs sm:text-sm text-[#F3EFE6] transition-colors"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Quick Actions</p>
                      {quickActions.map((action, index) => (
                        <button
                          key={action.label}
                          onClick={() => {
                            router.push(action.href)
                            setIsOpen(false)
                          }}
                          className={clsx(
                            'w-full flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-colors text-left border',
                            selectedIndex === index && !query 
                              ? 'bg-[#1F1E1A] border-[#C9A45C]/40 text-[#F3EFE6]' 
                              : 'bg-transparent border-transparent hover:bg-[#1F1E1A]/60'
                          )}
                        >
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#141311] border border-[#2A261F] rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 text-[#C9A45C]">
                            <action.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <span className="flex-1 font-medium text-sm sm:text-base text-[#F3EFE6]">{action.label}</span>
                          <kbd className="hidden sm:block px-2 py-1 bg-[#12110F] border border-[#2A261F] rounded-lg text-xs text-[#8D8980] font-mono flex-shrink-0">
                            {action.shortcut}
                          </kbd>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="hidden sm:flex p-3 bg-[#12110F] border-t border-[#2A261F] items-center justify-between text-xs text-[#8D8980]">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-[#1F1E1A] border border-[#2A261F] rounded text-xs text-[#F3EFE6]">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-[#1F1E1A] border border-[#2A261F] rounded text-xs text-[#F3EFE6]">↓</kbd>
                    <span className="ml-1">Navigate</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-[#1F1E1A] border border-[#2A261F] rounded text-xs text-[#F3EFE6]">↵</kbd>
                    <span className="ml-1">Select</span>
                  </span>
                </div>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-[#1F1E1A] border border-[#2A261F] rounded text-xs text-[#C9A45C]">Ctrl + K</kbd>
                  <span>Quick Access</span>
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
