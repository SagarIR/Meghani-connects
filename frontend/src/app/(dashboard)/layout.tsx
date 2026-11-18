'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import GlobalSearch from '@/components/ui/GlobalSearch'
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { Watch } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Close sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Initialize keyboard shortcuts
  useKeyboardShortcuts()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0B0A] text-[#F3EFE6]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#171613] border border-[#C9A45C]/40 rounded-2xl flex items-center justify-center shadow-2xl shadow-[#C9A45C]/10">
            <Watch className="w-8 h-8 lg:w-10 lg:h-10 text-[#C9A45C]" />
          </div>
          <motion.div
            className="absolute inset-0 rounded-2xl bg-[#C9A45C]/20 border border-[#C9A45C]/50"
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-center"
        >
          <p className="font-serif text-lg lg:text-xl font-bold text-[#F3EFE6] tracking-wide">Meghani Connect 360</p>
          <p className="text-xs uppercase tracking-widest text-[#8D8980] mt-1">Authenticating Operational Session...</p>
          <div className="mt-3 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 bg-[#C9A45C] rounded-full"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#0B0B0A] text-[#F3EFE6]">
      {/* Global Modals & Listeners */}
      <GlobalSearch />
      <KeyboardShortcutsModal />
      
      {/* Persistent / Responsive Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Workspace */}
      <div className="lg:ml-72 min-h-screen flex flex-col bg-[#0B0B0A]">
        {/* Universal Top Navigation Header */}
        <Header onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Page Content Body */}
        <main className="flex-1 p-3 sm:p-5 lg:p-7 xl:p-8">
          <ErrorBoundary>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
