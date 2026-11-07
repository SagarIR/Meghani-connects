'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { 
  LayoutDashboard, ShoppingCart, Package, Wrench, 
  Users, Wallet, BarChart3, Settings, Watch, LogOut, 
  History, Bell, Sparkles, ChevronRight, X
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: 'from-blue-500 to-blue-600' },
  { name: 'POS / Sales', href: '/sales', icon: ShoppingCart, color: 'from-green-500 to-emerald-600' },
  { name: 'Sales History', href: '/sales/history', icon: History, color: 'from-teal-500 to-teal-600' },
  { name: 'Products', href: '/products', icon: Package, color: 'from-purple-500 to-purple-600' },
  { name: 'Repairs', href: '/repairs', icon: Wrench, color: 'from-orange-500 to-orange-600' },
  { name: 'Customers', href: '/customers', icon: Users, color: 'from-pink-500 to-pink-600' },
  { name: 'Expenses', href: '/expenses', icon: Wallet, color: 'from-red-500 to-red-600' },
  { name: 'Reports', href: '/reports', icon: BarChart3, color: 'from-indigo-500 to-indigo-600' },
  { name: 'Notifications', href: '/notifications', icon: Bell, color: 'from-amber-500 to-amber-600' },
  { name: 'Settings', href: '/settings', icon: Settings, color: 'from-gray-500 to-gray-600' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { logout } = useAuth()

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={clsx(
          'fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-gray-100 flex flex-col z-50 shadow-soft',
          'transform transition-transform duration-300 ease-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-16 lg:h-20 flex items-center justify-between px-4 lg:px-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
                <Watch className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                <Sparkles className="w-1.5 h-1.5 lg:w-2 lg:h-2 text-white" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-lg lg:text-xl text-gray-900 tracking-tight">Meghani</h1>
              <p className="text-xs font-medium text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">
                Connect 360
              </p>
            </div>
          </div>
          
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navigation.map((item, index) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`))
            
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
              >
                <Link
                  href={item.href}
                  onClick={handleNavClick}
                  className={clsx(
                    'group relative flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-primary-50 to-primary-100/50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 lg:h-8 bg-gradient-to-b from-primary-500 to-primary-600 rounded-r-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}

                  {/* Icon with gradient background on active */}
                  <div className={clsx(
                    'relative flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-lg transition-all duration-200',
                    isActive
                      ? `bg-gradient-to-br ${item.color} shadow-lg`
                      : 'bg-gray-100 group-hover:bg-gray-200'
                  )}>
                    <item.icon className={clsx(
                      'w-4 h-4 lg:w-5 lg:h-5 transition-all duration-200',
                      isActive 
                        ? 'text-white' 
                        : 'text-gray-500 group-hover:text-gray-700 group-hover:scale-110'
                    )} />
                  </div>

                  {/* Label */}
                  <span className={clsx(
                    'text-sm lg:text-base font-medium transition-all duration-200',
                    isActive ? 'font-semibold' : 'group-hover:translate-x-1'
                  )}>
                    {item.name}
                  </span>

                  {/* Arrow on hover */}
                  <ChevronRight className={clsx(
                    'w-4 h-4 ml-auto transition-all duration-200 opacity-0 -translate-x-2',
                    'group-hover:opacity-100 group-hover:translate-x-0',
                    isActive && 'opacity-100 translate-x-0 text-primary-500'
                  )} />
                </Link>
              </motion.div>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-3 lg:p-4 border-t border-gray-100">
          {/* Pro badge - hidden on mobile for space */}
          <div className="hidden lg:block mb-4 p-4 bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 rounded-xl text-white">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Pro Features</span>
            </div>
            <p className="text-xs opacity-90">AI-powered insights active</p>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="group w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 text-gray-600 rounded-xl
                     transition-all duration-200
                     hover:bg-red-50 hover:text-red-600"
          >
            <div className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 bg-gray-100 rounded-lg 
                          group-hover:bg-red-100 transition-colors duration-200">
              <LogOut className="w-4 h-4 lg:w-5 lg:h-5 group-hover:scale-110 transition-transform duration-200" />
            </div>
            <span className="text-sm lg:text-base font-medium group-hover:translate-x-1 transition-transform duration-200">
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}
