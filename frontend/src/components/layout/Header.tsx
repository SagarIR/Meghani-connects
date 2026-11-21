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
import { usePreferences } from '@/context/PreferencesContext'
import clsx from 'clsx'

interface HeaderProps {
  onOpenSidebar?: () => void
}

export default function Header({ onOpenSidebar }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { t } = usePreferences()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Dynamic route translation metadata
  const getRouteMeta = () => {
    switch (pathname) {
      case '/dashboard':
        return { title: t('routeDashboardTitle', 'Store Dashboard'), category: t('catOverview', 'Overview') }
      case '/sales':
        return { title: t('routePOSTitle', 'Point of Sale (POS)'), category: t('catSales', 'Sales') }
      case '/sales/history':
        return { title: t('routeSalesHistoryTitle', 'Sales History & Invoices'), category: t('catSales', 'Sales') }
      case '/products':
        return { title: t('routeProductsTitle', 'Watch Catalog & Inventory'), category: t('catInventory', 'Inventory') }
      case '/repairs':
        return { title: t('routeRepairsTitle', 'Watch Repairs & Service'), category: t('catService', 'Service') }
      case '/customers':
        return { title: t('routeCustomersTitle', 'Customers & CRM'), category: t('catCustomers', 'Customers') }
      case '/expenses':
        return { title: t('routeExpensesTitle', 'Store Expenses'), category: t('catFinance', 'Finance') }
      case '/reports':
        return { title: t('routeReportsTitle', 'Reports & Analytics'), category: t('catReports', 'Reports') }
      case '/website-cms':
        return { title: t('routeWebsiteCMSTitle', 'Website Content Management'), category: t('catWebsite', 'Website') }
      case '/notifications':
        return { title: t('routeNotificationsTitle', 'Customer Notifications'), category: t('catMessages', 'Messages') }
      case '/settings':
        return { title: t('routeSettingsTitle', 'Store Settings'), category: t('catSettings', 'Settings') }
      default:
        return {
          title: pathname.split('/').filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' / ') || t('storeManagement', 'Store Management'),
          category: 'Meghani 360'
        }
    }
  }

  const currentRoute = getRouteMeta()

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

  const getRoleLabel = () => {
    const r = user?.role?.toLowerCase()
    if (r === 'admin') return t('roleAdmin', 'ADMIN')
    if (r === 'manager') return t('roleManager', 'MANAGER')
    if (r === 'cashier') return t('roleCashier', 'CASHIER')
    if (r === 'technician') return t('roleTechnician', 'TECHNICIAN')
    return t('roleStaff', 'STAFF')
  }

  const roleLabel = getRoleLabel()

  return (
    <header className="h-16 lg:h-20 bg-[#0E0D0B]/95 backdrop-blur-md border-b border-[#2A261F] px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 select-none transition-colors">
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
            <span>{t('openPOS', 'Open POS')}</span>
          </Link>
        )}

        {/* Global Search Button */}
        <button
          onClick={triggerSearch}
          className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#171613] hover:bg-[#1F1E1A] border border-[#2A261F] hover:border-[#C9A45C]/40 rounded-xl transition-all group"
          title={`${t('search', 'Search')} (Ctrl + K)`}
        >
          <Search className="w-4 h-4 text-[#8D8980] group-hover:text-[#C9A45C] transition-colors" />
          <span className="text-xs text-[#8D8980] hidden sm:inline">{t('searchStore', 'Search store...')}</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#12110F] border border-[#2A261F] rounded text-[10px] text-[#8D8980] font-mono group-hover:text-[#C9A45C]">
            {t('ctrlK', 'Ctrl K')}
          </kbd>
        </button>

        {/* Keyboard Shortcuts Button */}
        <button
          onClick={triggerShortcuts}
          className="p-2 sm:px-2.5 sm:py-2 bg-[#171613] hover:bg-[#1F1E1A] border border-[#2A261F] hover:border-[#C9A45C]/40 rounded-xl transition-all text-[#8D8980] hover:text-[#C9A45C]"
          title={`${t('keyboardShortcuts', 'Keyboard shortcuts')} (Shift + ?)`}
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Notifications Shortcut */}
        <Link
          href="/notifications"
          className="relative p-2 sm:px-2.5 sm:py-2 bg-[#171613] hover:bg-[#1F1E1A] border border-[#2A261F] hover:border-[#C9A45C]/40 rounded-xl transition-all text-[#8D8980] hover:text-[#C9A45C]"
          title={t('customerNotifications', 'Customer Notifications')}
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
                {user?.name || user?.username || 'Staff'}
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
                    {t('dashboard', 'Dashboard')}
                  </Link>
                  <Link
                    href="/sales"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A] transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4 text-[#C9A45C]" />
                    {t('posTerminal', 'POS Terminal')}
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A] transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#C9A45C]" />
                    {t('storeSettings', 'Store Settings')}
                  </Link>
                  <Link
                    href="/"
                    target="_blank"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center justify-between px-4 py-2 text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A] transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <ExternalLink className="w-4 h-4 text-[#C9A45C]" />
                      {t('viewWebsite', 'View Website')}
                    </span>
                    <span className="text-[10px] text-[#8D8980]/70 font-mono">{t('liveBadge', 'Live')}</span>
                  </Link>
                </div>

                <div className="border-t border-[#2A261F] pt-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      logout()
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-500 hover:text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('logout', 'Sign Out')}
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
