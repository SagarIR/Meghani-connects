'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Search, Bell, User, ChevronDown, Settings, LogOut, 
  Keyboard, Menu, ShoppingCart, Shield, Sparkles, ExternalLink, Watch
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import clsx from 'clsx'

const routeTitles: Record<string, { title: string; category: string }> = {
  '/dashboard': { title: 'Store Dashboard', category: 'Overview' },
  '/sales': { title: 'Point of Sale (POS)', category: 'Sales' },
  '/sales/history': { title: 'Sales History & Invoices', category: 'Sales' },
  '/products': { title: 'Watch Catalog & Inventory', category: 'Inventory' },
  '/repairs': { title: 'Watch Repairs & Service', category: 'Service' },
  '/customers': { title: 'Customers & CRM', category: 'Customers' },
  '/expenses': { title: 'Store Expenses', category: 'Finance' },
  '/reports': { title: 'Reports & Analytics', category: 'Reports' },
  '/website-cms': { title: 'Website Content Management', category: 'Website' },
  '/notifications': { title: 'Customer Notifications', category: 'Messages' },
  '/settings': { title: 'Store Settings', category: 'Settings' },
}

interface HeaderProps {
  onOpenSidebar?: () => void
}

export default function Header({ onOpenSidebar }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Current route metadata
  const currentRoute = routeTitles[pathname] || {
    title: pathname.split('/').filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' / ') || 'Store Management',
    category: 'Meghani 360'
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const triggerSearch = () => {
    window.dispatchEvent(new CustomEvent('openSearch'))
  }

  const triggerShortcuts = () => {
    window.dispatchEvent(new CustomEvent('showShortcuts'))
  }

  const roleLabel = user?.role ? user.role.toUpperCase() : 'STAFF'

  return (
    <header className="h-16 lg:h-20 bg-[#0E0D0B]/95 backdrop-blur-md border-b border-[#2A261F] px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left - Hamburger (Mobile) + Breadcrumb Context */}
      <div className="flex items-center gap-3 min-w-0">
        {onOpenSidebar && (
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-xl text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A] border border-[#2A261F] transition-colors"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Brand identity on mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-[#1F1E1A] border border-[#C9A45C]/40 flex items-center justify-center">
            <Watch className="w-4 h-4 text-[#C9A45C]" />
          </div>
          <span className="font-serif font-bold text-base text-[#F3EFE6]">Meghani</span>
        </div>

        {/* Desktop Breadcrumb Hierarchy */}
        <div className="hidden lg:block min-w-0">
          <div className="flex items-center gap-2 text-xs font-mono text-[#8D8980] tracking-wider uppercase mb-0.5">
            <span>Meghani Connect 360</span>
            <span className="text-[#C9A45C]/60">•</span>
            <span className="text-[#C9A45C] font-semibold">{currentRoute.category}</span>
          </div>
          <h1 className="text-xl xl:text-2xl font-serif font-bold text-[#F3EFE6] tracking-wide truncate">
            {currentRoute.title}
          </h1>
        </div>
      </div>

      {/* Right - Global Actions, Shortcuts, Role & User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Launch POS Button */}
        {pathname !== '/sales' && (
          <Link
            href="/sales"
            className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#C9A45C] via-[#DFC17B] to-[#C9A45C] text-[#0B0B0A] text-xs font-bold tracking-wide shadow-md shadow-[#C9A45C]/20 hover:brightness-105 transition-all"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Open POS</span>
          </Link>
        )}

        {/* Global Search Button */}
        <button
          onClick={triggerSearch}
          className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#171613] hover:bg-[#1F1E1A] border border-[#2A261F] hover:border-[#C9A45C]/40 rounded-xl transition-all group"
          title="Search (Ctrl + K)"
        >
          <Search className="w-4 h-4 text-[#8D8980] group-hover:text-[#C9A45C] transition-colors" />
          <span className="text-xs text-[#8D8980] hidden sm:inline">Search store...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#12110F] border border-[#2A261F] rounded text-[10px] text-[#8D8980] font-mono group-hover:text-[#C9A45C]">
            Ctrl K
          </kbd>
        </button>

        {/* Keyboard Shortcuts Button */}
        <button
          onClick={triggerShortcuts}
          className="p-2 sm:px-2.5 sm:py-2 bg-[#171613] hover:bg-[#1F1E1A] border border-[#2A261F] hover:border-[#C9A45C]/40 rounded-xl transition-all text-[#8D8980] hover:text-[#C9A45C]"
          title="Keyboard shortcuts (Shift + ?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Notifications Shortcut */}
        <Link
          href="/notifications"
          className="relative p-2 sm:px-2.5 sm:py-2 bg-[#171613] hover:bg-[#1F1E1A] border border-[#2A261F] hover:border-[#C9A45C]/40 rounded-xl transition-all text-[#8D8980] hover:text-[#C9A45C]"
          title="Customer Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#C9A45C] rounded-full ring-2 ring-[#0E0D0B]" />
        </Link>

        {/* User Profile & Role Indicator */}
        <div className="relative ml-1" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 sm:pl-2.5 sm:pr-3 bg-[#171613] hover:bg-[#1F1E1A] border border-[#2A261F] hover:border-[#C9A45C]/40 rounded-xl transition-all"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#2A261F] to-[#171613] border border-[#C9A45C]/50 flex items-center justify-center text-xs font-bold text-[#C9A45C]">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="font-semibold text-xs text-[#F3EFE6] leading-tight truncate max-w-[100px]">
                {user?.name || user?.username || 'Staff Member'}
              </p>
              <span className="text-[10px] font-mono text-[#C9A45C] font-semibold tracking-wider">
                {roleLabel}
              </span>
            </div>
            <ChevronDown className={clsx(
              'w-3.5 h-3.5 text-[#8D8980] transition-transform duration-200',
              showUserMenu && 'rotate-180'
            )} />
          </button>

          {/* User Menu Dropdown */}
          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-64 bg-[#171613] text-[#F3EFE6] rounded-xl shadow-2xl border border-[#2A261F] py-2 z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-[#2A261F] bg-[#12110F]/60">
                  <div className="flex items-center justify-between">
                    <p className="font-serif font-bold text-sm text-[#F3EFE6] truncate">
                      {user?.name || user?.username}
                    </p>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#C9A45C]/20 text-[#C9A45C] border border-[#C9A45C]/30">
                      {roleLabel}
                    </span>
                  </div>
                  <p className="text-xs text-[#8D8980] truncate mt-0.5">{user?.email || 'Staff Member'}</p>
                </div>

                <div className="py-1 text-xs font-medium">
                  <Link
                    href="/dashboard"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A] transition-colors"
                  >
                    <Watch className="w-4 h-4 text-[#C9A45C]" />
                    Dashboard
                  </Link>
                  <Link
                    href="/sales"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A] transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4 text-[#C9A45C]" />
                    POS Terminal
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A] transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#C9A45C]" />
                    Store Settings
                  </Link>
                  <Link
                    href="/"
                    target="_blank"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center justify-between px-4 py-2 text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A] transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <ExternalLink className="w-4 h-4 text-[#C9A45C]" />
                      View Website
                    </span>
                    <span className="text-[10px] text-[#8D8980]/70">Live</span>
                  </Link>
                </div>

                <div className="border-t border-[#2A261F] pt-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      logout()
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
