'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '@/services/api'
import { Language, translations } from '@/i18n/translations'
import toast from 'react-hot-toast'

export type ThemeMode = 'dark' | 'light' | 'system'
export type PaymentModePref = 'cash' | 'upi' | 'card'
export type DashboardPeriodPref = 'today' | 'week' | 'month'

interface PreferencesContextType {
  theme: ThemeMode
  language: Language
  autoPrintReceipt: boolean
  defaultPaymentMode: PaymentModePref
  defaultDashboardPeriod: DashboardPeriodPref
  notifyLowStock: boolean
  notifyNewRepair: boolean
  notifyRepairReady: boolean
  notifyDailySummary: boolean
  saving: boolean
  setTheme: (theme: ThemeMode) => void
  setLanguage: (lang: Language) => void
  setAutoPrintReceipt: (val: boolean) => void
  setDefaultPaymentMode: (mode: PaymentModePref) => void
  setDefaultDashboardPeriod: (period: DashboardPeriodPref) => void
  setNotifyLowStock: (val: boolean) => void
  setNotifyNewRepair: (val: boolean) => void
  setNotifyRepairReady: (val: boolean) => void
  setNotifyDailySummary: (val: boolean) => void
  savePreferences: (overrides?: any) => Promise<boolean>
  t: (key: string, defaultText?: string) => string
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark')
  const [language, setLanguageState] = useState<Language>('en')
  const [autoPrintReceipt, setAutoPrintReceipt] = useState<boolean>(true)
  const [defaultPaymentMode, setDefaultPaymentMode] = useState<PaymentModePref>('cash')
  const [defaultDashboardPeriod, setDefaultDashboardPeriod] = useState<DashboardPeriodPref>('today')
  const [notifyLowStock, setNotifyLowStock] = useState<boolean>(true)
  const [notifyNewRepair, setNotifyNewRepair] = useState<boolean>(true)
  const [notifyRepairReady, setNotifyRepairReady] = useState<boolean>(true)
  const [notifyDailySummary, setNotifyDailySummary] = useState<boolean>(false)
  const [saving, setSaving] = useState(false)

  // Apply theme to DOM
  const applyThemeToDOM = (selectedTheme: ThemeMode) => {
    if (typeof window === 'undefined') return
    const root = document.documentElement
    let effectiveTheme = selectedTheme

    if (selectedTheme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      effectiveTheme = systemDark ? 'dark' : 'light'
    }

    if (effectiveTheme === 'light') {
      root.setAttribute('data-theme', 'light')
      root.classList.add('light')
      root.classList.remove('dark')
    } else {
      root.setAttribute('data-theme', 'dark')
      root.classList.add('dark')
      root.classList.remove('light')
    }
  }

  // Initial load from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    const savedTheme = localStorage.getItem('meghani_theme') as ThemeMode | null
    const savedLang = localStorage.getItem('meghani_lang') as Language | null
    const savedAutoPrint = localStorage.getItem('meghani_auto_print')
    const savedPayMode = localStorage.getItem('meghani_pay_mode') as PaymentModePref | null
    const savedDashPeriod = localStorage.getItem('meghani_dash_period') as DashboardPeriodPref | null

    if (savedTheme) {
      setThemeState(savedTheme)
      applyThemeToDOM(savedTheme)
    } else {
      applyThemeToDOM('dark')
    }

    if (savedLang) {
      setLanguageState(savedLang)
    }

    if (savedAutoPrint !== null) {
      setAutoPrintReceipt(savedAutoPrint === 'true')
    }

    if (savedPayMode) {
      setDefaultPaymentMode(savedPayMode)
    }

    if (savedDashPeriod) {
      setDefaultDashboardPeriod(savedDashPeriod)
    }

    // Attempt to sync from backend API
    const loadBackendPrefs = async () => {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token')
        if (!token) return
        const res = await api.get('/settings/preferences/')
        const data = res.data
        if (data) {
          if (data.theme) {
            setThemeState(data.theme)
            applyThemeToDOM(data.theme)
            localStorage.setItem('meghani_theme', data.theme)
          }
          if (data.language) {
            setLanguageState(data.language)
            localStorage.setItem('meghani_lang', data.language)
          }
          if (data.auto_print_receipt !== undefined) {
            setAutoPrintReceipt(data.auto_print_receipt)
            localStorage.setItem('meghani_auto_print', String(data.auto_print_receipt))
          }
          if (data.default_payment_mode) {
            setDefaultPaymentMode(data.default_payment_mode)
            localStorage.setItem('meghani_pay_mode', data.default_payment_mode)
          }
          if (data.default_dashboard_period) {
            setDefaultDashboardPeriod(data.default_dashboard_period)
            localStorage.setItem('meghani_dash_period', data.default_dashboard_period)
          }
          if (data.notify_low_stock !== undefined) setNotifyLowStock(data.notify_low_stock)
          if (data.notify_new_repair !== undefined) setNotifyNewRepair(data.notify_new_repair)
          if (data.notify_repair_ready !== undefined) setNotifyRepairReady(data.notify_repair_ready)
          if (data.notify_daily_summary !== undefined) setNotifyDailySummary(data.notify_daily_summary)
        }
      } catch (err) {
        // Silently use localStorage fallback
      }
    }

    loadBackendPrefs()

    // Listen to OS theme changes if on system
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const current = localStorage.getItem('meghani_theme')
      if (current === 'system') {
        applyThemeToDOM('system')
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
    applyThemeToDOM(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('meghani_theme', newTheme)
    }
  }

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('meghani_lang', newLang)
    }
  }

  const handleSetAutoPrint = (val: boolean) => {
    setAutoPrintReceipt(val)
    if (typeof window !== 'undefined') {
      localStorage.setItem('meghani_auto_print', String(val))
    }
  }

  const handleSetPayMode = (mode: PaymentModePref) => {
    setDefaultPaymentMode(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('meghani_pay_mode', mode)
    }
  }

  const handleSetDashPeriod = (period: DashboardPeriodPref) => {
    setDefaultDashboardPeriod(period)
    if (typeof window !== 'undefined') {
      localStorage.setItem('meghani_dash_period', period)
    }
  }

  // Translation function
  const t = (key: string, defaultText?: string): string => {
    const langDict = translations[language] || translations.en
    return langDict[key] || translations.en[key] || defaultText || key
  }

  // Persistent save to backend API
  const savePreferences = async (overrides: any = {}): Promise<boolean> => {
    setSaving(true)
    const payload = {
      theme: overrides.theme || theme,
      language: overrides.language || language,
      auto_print_receipt: overrides.auto_print_receipt !== undefined ? overrides.auto_print_receipt : autoPrintReceipt,
      default_payment_mode: overrides.default_payment_mode || defaultPaymentMode,
      default_dashboard_period: overrides.default_dashboard_period || defaultDashboardPeriod,
      notify_low_stock: overrides.notify_low_stock !== undefined ? overrides.notify_low_stock : notifyLowStock,
      notify_new_repair: overrides.notify_new_repair !== undefined ? overrides.notify_new_repair : notifyNewRepair,
      notify_repair_ready: overrides.notify_repair_ready !== undefined ? overrides.notify_repair_ready : notifyRepairReady,
      notify_daily_summary: overrides.notify_daily_summary !== undefined ? overrides.notify_daily_summary : notifyDailySummary,
    }

    // Immediately save locally
    if (payload.theme) setTheme(payload.theme)
    if (payload.language) setLanguage(payload.language)
    if (payload.auto_print_receipt !== undefined) handleSetAutoPrint(payload.auto_print_receipt)
    if (payload.default_payment_mode) handleSetPayMode(payload.default_payment_mode)
    if (payload.default_dashboard_period) handleSetDashPeriod(payload.default_dashboard_period)

    try {
      await api.patch('/settings/preferences/', payload)
      toast.success(
        language === 'gu'
          ? 'પસંદગીઓ સફળતાપૂર્વક સાચવવામાં આવી!'
          : language === 'hi'
          ? 'प्राथमिकताएं सफलतापूर्वक सहेजी गईं!'
          : 'App preferences saved successfully!'
      )
      return true
    } catch (error: any) {
      console.warn('API sync warning (saved locally in browser):', error)
      toast.success(
        language === 'gu'
          ? 'પસંદગીઓ બ્રાઉઝરમાં સાચવવામાં આવી!'
          : language === 'hi'
          ? 'प्राथमिकताएं ब्राउज़र में सहेजी गईं!'
          : 'Preferences updated and saved locally!'
      )
      return true
    } finally {
      setSaving(false)
    }
  }

  return (
    <PreferencesContext.Provider
      value={{
        theme,
        language,
        autoPrintReceipt,
        defaultPaymentMode,
        defaultDashboardPeriod,
        notifyLowStock,
        notifyNewRepair,
        notifyRepairReady,
        notifyDailySummary,
        saving,
        setTheme,
        setLanguage,
        setAutoPrintReceipt: handleSetAutoPrint,
        setDefaultPaymentMode: handleSetPayMode,
        setDefaultDashboardPeriod: handleSetDashPeriod,
        setNotifyLowStock,
        setNotifyNewRepair,
        setNotifyRepairReady,
        setNotifyDailySummary,
        savePreferences,
        t,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}
