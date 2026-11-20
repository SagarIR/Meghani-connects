'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { 
  LayoutDashboard, ShoppingCart, Package, Wrench, 
  Users, Wallet, BarChart3, Settings, Watch, LogOut, 
  History, Bell, ChevronRight, X, Globe, Shield, ShieldCheck, User as UserIcon, Sparkles, Truck
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface NavItem {
  name: string
  href: string
  icon: any
  badge?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Store Operations',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'POS Terminal', href: '/sales', icon: ShoppingCart },
      { name: 'Sales History', href: '/sales/history', icon: History },
      { name: 'Products & Inventory', href: '/products', icon: Package },
      { name: 'Purchasing & Ledger', href: '/purchasing', icon: Truck },
      { name: 'Watch Repairs', href: '/repairs', icon: Wrench },
    ]
  },
  {
    title: 'Customers & Finance',
    items: [
      { name: 'Customers & CRM', href: '/customers', icon: Users },
      { name: 'Warranties & Claims', href: '/warranties', icon: ShieldCheck },
      { name: 'Store Expenses', href: '/expenses', icon: Wallet },
      { name: 'AI & Business Intelligence', href: '/analytics', icon: Sparkles, badge: 'AI 360' },
      { name: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
    ]
  },
  {
    title: 'Website & Settings',
    items: [
      { name: 'Website CMS', href: '/website-cms', icon: Globe },
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Store Settings', href: '/settings', icon: Settings },
    ]
  }
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  const roleLabel = user?.role ? user.role.toUpperCase() : 'STAFF'

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Shell */}
      <aside 
        className={clsx(
          'fixed left-0 top-0 bottom-0 w-72 bg-[#0E0D0B] border-r border-[#2A261F] flex flex-col z-50 shadow-2xl',
          'transform transition-transform duration-300 ease-out select-none',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-[#2A261F] bg-[#0B0B0A]">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1C1B17] to-[#12110F] border border-[#C9A45C]/40 flex items-center justify-center shadow-lg group-hover:border-[#C9A45C] transition-colors">
                <Watch className="w-5 h-5 text-[#C9A45C]" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0B0B0A]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-serif text-lg font-bold text-[#F3EFE6] tracking-wide group-hover:text-[#C9A45C] transition-colors">
                  Meghani
                </h1>
                <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-[#C9A45C]/15 text-[#C9A45C] font-semibold tracking-wider">
                  360
                </span>
              </div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-[#8D8980]">
                Watch Co. • Est. 1984
              </p>
            </div>
          </Link>
          
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A] transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-thin">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#8D8980]/70 mb-2">
                {section.title}
              </p>
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && item.href !== '/sales' && pathname.startsWith(`${item.href}/`)) || (item.href === '/sales' && pathname === '/sales')
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={handleNavClick}
                    className={clsx(
                      'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium',
                      isActive
                        ? 'bg-[#1F1E1A] text-[#F3EFE6] border-l-2 border-[#C9A45C] font-semibold pl-3.5 shadow-sm'
                        : 'text-[#8D8980] hover:bg-[#171613] hover:text-[#F3EFE6]'
                    )}
                  >
                    {/* Active highlight glow */}
                    {isActive && (
                      <motion.div
                        layoutId="activeSidebarPill"
                        className="absolute inset-0 bg-gradient-to-r from-[#C9A45C]/10 to-transparent rounded-xl pointer-events-none"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                      />
                    )}

                    <div className={clsx(
                      'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-[#2A261F] text-[#C9A45C] shadow-sm'
                        : 'bg-[#141311] text-[#8D8980] group-hover:text-[#F3EFE6] group-hover:bg-[#1F1E1A]'
                    )}>
                      <item.icon className="w-4 h-4" />
                    </div>

                    <span className="flex-1 truncate tracking-tight">{item.name}</span>

                    <ChevronRight className={clsx(
                      'w-3.5 h-3.5 transition-all duration-200',
                      isActive ? 'opacity-100 text-[#C9A45C]' : 'opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 text-[#8D8980]'
                    )} />
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Staff Profile & Session Footer */}
        <div className="p-3 border-t border-[#2A261F] bg-[#0B0B0A]">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#141311] border border-[#2A261F]/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#2A261F] border border-[#C9A45C]/30 flex items-center justify-center text-xs font-bold text-[#C9A45C] flex-shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#F3EFE6] truncate leading-tight">
                  {user?.name || user?.username || 'Staff User'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#C9A45C]">
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[#8D8980] hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-800/40 transition-colors flex-shrink-0"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
