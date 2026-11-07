'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Bell, User, ChevronDown, Settings, LogOut, 
  Moon, Sun, HelpCircle, Keyboard, X, Command
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import clsx from 'clsx'

interface HeaderProps {
  title?: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { user, logout } = useAuth()
  const [showSearch, setShowSearch] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
        setTimeout(() => searchRef.current?.focus(), 100)
      }
      if (e.key === 'Escape') {
        setShowSearch(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const notifications = [
    { id: 1, title: 'New order received', message: 'Order #1234 from Rajesh Kumar', time: '5m ago', unread: true },
    { id: 2, title: 'Low stock alert', message: 'Titan Watch Model X is running low', time: '1h ago', unread: true },
    { id: 3, title: 'Repair completed', message: 'Ticket #567 is ready for pickup', time: '2h ago', unread: false },
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <>
      <header className="h-20 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-30">
        {/* Left - Title */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {title && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
          )}
        </motion.div>

        {/* Right - Actions */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3"
        >
          {/* Search Button */}
          <button
            onClick={() => setShowSearch(true)}
            className="group flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 
                     rounded-xl transition-all duration-200 border border-gray-200"
          >
            <Search className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            <span className="text-sm text-gray-400 hidden sm:block">Search...</span>
            <kbd className="hidden sm:flex items-center gap-0.5 px-2 py-1 bg-white rounded-md text-xs text-gray-400 border border-gray-200">
              <Command className="w-3 h-3" />K
            </kbd>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 bg-gray-50 hover:bg-gray-100 rounded-xl 
                       transition-all duration-200 hover:scale-105"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 text-white 
                               text-xs font-bold rounded-full flex items-center justify-center
                               animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={clsx(
                          'p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors',
                          notification.unread && 'bg-primary-50/50'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {notification.unread && (
                            <span className="w-2 h-2 mt-2 bg-primary-500 rounded-full" />
                          )}
                          <div className={clsx(!notification.unread && 'ml-5')}>
                            <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-gray-50">
                    <button className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 pr-4 bg-gray-50 hover:bg-gray-100 
                       rounded-xl transition-all duration-200"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 
                            rounded-xl flex items-center justify-center text-white font-semibold shadow-lg">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="font-semibold text-sm text-gray-900">{user?.username || 'Admin'}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <ChevronDown className={clsx(
                'w-4 h-4 text-gray-400 transition-transform duration-200',
                showUserMenu && 'rotate-180'
              )} />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50"
                >
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">{user?.username || 'Admin'}</p>
                    <p className="text-sm text-gray-500">{user?.email || 'admin@meghani.com'}</p>
                  </div>

                  <div className="py-2">
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <User className="w-4 h-4" />
                      My Profile
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <HelpCircle className="w-4 h-4" />
                      Help Center
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <Keyboard className="w-4 h-4" />
                      Keyboard Shortcuts
                    </button>
                  </div>

                  <div className="border-t border-gray-100 pt-2">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </header>

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowSearch(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search products, customers, repairs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 text-gray-900 placeholder-gray-400 outline-none text-lg"
                  />
                  <kbd className="px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-500">ESC</kbd>
                </div>
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">Start typing to search...</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
