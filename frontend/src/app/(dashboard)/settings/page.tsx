'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Store, Bell, Shield, Database, Upload, Save, 
  RefreshCw, Download, Check, X, Moon, Sun,
  Globe, Monitor, Printer, Clock, ChevronDown, Lock,
  Watch, Building, Sparkles
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { usePreferences } from '@/context/PreferencesContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'
import api from '@/services/api'
import clsx from 'clsx'

interface BusinessSettings {
  id: number
  business_name: string
  tagline: string
  logo: string | null
  logo_url: string | null
  currency_code?: string
  currency_symbol?: string
  country?: string
  timezone?: string
  phone: string
  alternate_phone: string
  email: string
  website: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  pincode: string
  gst_number: string
  pan_number: string
  default_tax_rate?: number
  invoice_prefix: string
  repair_prefix: string
  po_prefix?: string
  invoice_footer: string
  terms_and_conditions: string
  privacy_policy?: string
  whatsapp_number?: string
  landmark?: string
  opening_hours_weekdays?: string
  opening_hours_sunday?: string
  google_maps_url?: string
  google_maps_embed_src?: string
  instagram_url?: string
  facebook_url?: string
  loyalty_points_per_100: number
  loyalty_redemption_rate: number
  low_stock_threshold: number
  enable_whatsapp: boolean
  enable_sms: boolean
  enable_email: boolean
  updated_at: string
}

interface UserPreferences {
  id: number
  theme: string
  language: string
  notify_low_stock: boolean
  notify_new_repair: boolean
  notify_repair_ready: boolean
  notify_daily_summary: boolean
  default_dashboard_period: string
  auto_print_receipt: boolean
  default_payment_mode: string
  updated_at: string
}

export default function SettingsPage() {
  const { user } = useAuth()
  const {
    theme: prefTheme,
    language: prefLang,
    autoPrintReceipt: prefAutoPrint,
    defaultPaymentMode: prefPayMode,
    defaultDashboardPeriod: prefDashPeriod,
    setTheme: setContextTheme,
    setLanguage: setContextLang,
    setAutoPrintReceipt: setContextAutoPrint,
    setDefaultPaymentMode: setContextPayMode,
    setDefaultDashboardPeriod: setContextDashPeriod,
    savePreferences: saveContextPrefs,
    saving: prefSaving,
    t,
  } = usePreferences()

  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      })
    }
  }, [user])

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [backups, setBackups] = useState<any[]>([])
  const [backupLoading, setBackupLoading] = useState(false)

  const tabs = [
    { id: 'profile', label: t('userProfile', 'User Profile'), icon: User },
    { id: 'business', label: t('storeProfile', 'Store Profile'), icon: Store },
    { id: 'preferences', label: t('appPreferences', 'App Preferences'), icon: Monitor },
    { id: 'notifications', label: t('notificationChannels', 'Notification Channels'), icon: Bell },
    { id: 'security', label: t('securityPassword', 'Security & Password'), icon: Shield },
    { id: 'backup', label: t('databaseBackups', 'Database Backups'), icon: Database },
  ]

  useEffect(() => {
    fetchBusinessSettings()
    fetchUserPreferences()
    fetchBackups()
  }, [])

  const fetchBusinessSettings = async () => {
    try {
      const response = await api.get('/settings/business/')
      setBusinessSettings(response.data)
      if (response.data.logo_url) {
        setLogoPreview(response.data.logo_url)
      }
    } catch (error) {
      console.log('No business settings found')
    }
  }

  const fetchUserPreferences = async () => {
    try {
      const response = await api.get('/settings/preferences/')
      setPreferences(response.data)
    } catch (error) {
      console.log('No user preferences found')
    }
  }

  const handleProfileSave = async () => {
    setSaving(true)
    try {
      await api.patch('/users/update_profile/', profileForm)
      toast.success(
        prefLang === 'gu'
          ? 'પ્રોફાઇલ સફળતાપૂર્વક સાચવવામાં આવી!'
          : prefLang === 'hi'
          ? 'प्रोफ़ाइल सफलतापूर्वक सहेजी गई!'
          : 'User profile updated successfully!'
      )
    } catch (error: any) {
      toast.error(error.response?.data?.detail || error.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleBusinessSettingsSave = async () => {
    if (!businessSettings) return
    
    setSaving(true)
    try {
      const formData = new FormData()
      Object.entries(businessSettings).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'id' && key !== 'logo' && key !== 'logo_url' && key !== 'updated_at') {
          formData.append(key, String(value))
        }
      })
      if (logoFile) {
        formData.append('logo', logoFile)
      }
      
      const response = await api.patch('/settings/business/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      setBusinessSettings(response.data)
      toast.success('Store settings saved successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handlePreferencesSave = async () => {
    if (!preferences) return
    
    setSaving(true)
    try {
      const response = await api.patch('/settings/preferences/', preferences)
      setPreferences(response.data)
      toast.success('Preferences saved successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match')
      return
    }
    if (passwordForm.new_password.length < 8) {
      toast.error('Password must contain at least 8 characters')
      return
    }
    
    setSaving(true)
    try {
      await api.post('/users/change-password/', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      })
      toast.success('Password changed successfully')
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const fetchBackups = async () => {
    try {
      const response = await api.get('/backups/')
      setBackups(response.data.backups || [])
    } catch (error) {
      console.log('Failed to fetch backups')
    }
  }

  const handleBackup = async () => {
    setBackupLoading(true)
    try {
      await api.post('/backups/')
      toast.success('Database backup created successfully!')
      fetchBackups()
    } catch (error) {
      toast.error('Failed to create backup snapshot')
    } finally {
      setBackupLoading(false)
    }
  }

  const handleDownloadBackup = (filename: string) => {
    window.open(`${api.defaults.baseURL}/backups/${filename}/download/`, '_blank')
  }

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) return
    
    try {
      await api.delete(`/backups/${filename}/delete/`)
      toast.success('Backup deleted successfully')
      fetchBackups()
    } catch (error) {
      toast.error('Failed to delete backup')
    }
  }

  const currentTab = tabs.find(t => t.id === activeTab)
  const CurrentIcon = currentTab?.icon || User

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-[#171613] border border-[#2A261F] rounded-xl flex items-center justify-center shadow-md">
          <Store className="w-5 h-5 text-[#C9A45C]" />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#F3EFE6] tracking-tight">{t('storeSystemSettings', 'Store & System Settings')}</h1>
          <p className="text-xs sm:text-sm text-[#8D8980]">{t('manageStoreDetails', 'Manage store details, invoice settings, tax details, security, and backups')}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mobile Tab Selector */}
        <div className="lg:hidden">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="w-full flex items-center justify-between p-4 bg-[#171613] rounded-2xl border border-[#2A261F] shadow-md"
          >
            <div className="flex items-center gap-3">
              <CurrentIcon className="w-5 h-5 text-[#C9A45C]" />
              <span className="font-serif font-semibold text-sm text-[#F3EFE6]">{currentTab?.label}</span>
            </div>
            <ChevronDown className={clsx('w-4 h-4 text-[#8D8980] transition-transform', showMobileMenu && 'rotate-180')} />
          </button>
          
          <AnimatePresence>
            {showMobileMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 bg-[#171613] rounded-2xl border border-[#2A261F] shadow-xl overflow-hidden divide-y divide-[#2A261F]"
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setShowMobileMenu(false); }}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-3 text-xs transition-colors',
                      activeTab === tab.id
                        ? 'bg-[#C9A45C]/15 text-[#C9A45C] font-bold'
                        : 'text-[#8D8980] hover:bg-[#1F1E1A] hover:text-[#F3EFE6]'
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Sidebar Navigation */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-2 space-y-1 shadow-xl sticky top-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-semibold text-left',
                  activeTab === tab.id
                    ? 'bg-[#C9A45C] text-[#0B0B0A] shadow-gold font-bold'
                    : 'text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A]'
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Settings Card */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="bg-[#171613] rounded-2xl border border-[#2A261F] p-6 lg:p-8 shadow-xl"
            >
              {/* TAB 1: Profile */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-[#F3EFE6]">{t('userProfileTitle', 'User Profile')}</h2>
                    <p className="text-xs text-[#8D8980] mt-0.5">{t('userProfileSubtitle', 'Your account information and role permissions')}</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-5 p-6 bg-[#12110F] border border-[#2A261F] rounded-2xl">
                    <div className="w-20 h-20 bg-[#171613] border border-[#C9A45C]/40 rounded-2xl flex items-center justify-center font-serif font-bold text-2xl text-[#C9A45C] flex-shrink-0 shadow-gold">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="text-center sm:text-left">
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <h3 className="text-lg font-serif font-bold text-[#F3EFE6]">{user?.name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A45C]/20 border border-[#C9A45C]/40 text-[#C9A45C] uppercase">
                          {user?.role}
                        </span>
                      </div>
                      <p className="text-xs text-[#8D8980] font-mono mt-1">{user?.email || 'staff@meghaniwatch.com'}</p>
                      <p className="text-[11px] text-[#8D8980] mt-1">{t('roleAccountDesc', 'Meghani Watch Co. Vadodara • Staff Account')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input 
                      label={t('fullName', 'Full Name')} 
                      value={profileForm.name} 
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      icon={<User className="w-4 h-4 text-[#8D8980]" />} 
                    />
                    <Input 
                      label={t('username', 'Username')} 
                      defaultValue={user?.username} 
                      disabled 
                      icon={<Lock className="w-4 h-4 text-[#C9A45C]" />} 
                    />
                    <Input 
                      label={t('email', 'Email')} 
                      type="email" 
                      value={profileForm.email} 
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <Input 
                      label={t('phoneNumber', 'Phone Number')} 
                      value={profileForm.phone} 
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>

                  <Button onClick={handleProfileSave} loading={saving} icon={<Save className="w-4 h-4" />} className="shadow-gold">
                    {t('saveProfile', 'Save Profile Changes')}
                  </Button>
                </div>
              )}

              {/* TAB 2: Business Settings */}
              {activeTab === 'business' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-serif font-bold text-[#F3EFE6]">{t('storeDetailsBranding', 'Store Details & Branding')}</h2>
                      <p className="text-xs text-[#8D8980] mt-0.5">{t('storeDetailsSubtitle', 'Information shown on invoices, receipts, and website')}</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={fetchBusinessSettings} icon={<RefreshCw className="w-3.5 h-3.5" />}>
                      {t('reload', 'Reload')}
                    </Button>
                  </div>

                  {/* Logo Upload */}
                  <div className="flex flex-col sm:flex-row items-start gap-5 p-5 bg-[#12110F] border border-[#2A261F] rounded-2xl">
                    <div className="relative mx-auto sm:mx-0">
                      <div className="w-28 h-28 bg-[#171613] rounded-2xl border-2 border-dashed border-[#2A261F] flex items-center justify-center overflow-hidden">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                          <Store className="w-10 h-10 text-[#8D8980]" />
                        )}
                      </div>
                      <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#C9A45C] hover:bg-[#E8D5A7] text-[#0B0B0A] rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors">
                        <Upload className="w-4 h-4" />
                        <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                      </label>
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="font-serif font-bold text-[#F3EFE6] text-base">{t('storeLogo', 'Store Logo')}</h3>
                      <p className="text-xs text-[#8D8980] mt-1">{t('storeLogoDesc', 'Displayed on printed receipts and PDF invoices')}</p>
                      <p className="text-[11px] text-[#8D8980] mt-2 font-mono">{t('logoRecommendDesc', 'PNG / WEBP format recommended (transparent background)')}</p>
                    </div>
                  </div>
                  
                  {/* Business Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input 
                      label={t('storeName', 'Store / Business Name')} 
                      value={businessSettings?.business_name || ''} 
                      onChange={(e) => setBusinessSettings(prev => prev ? {...prev, business_name: e.target.value} : null)}
                    />
                    <Input 
                      label={t('storeTagline', 'Store Tagline')} 
                      value={businessSettings?.tagline || ''} 
                      onChange={(e) => setBusinessSettings(prev => prev ? {...prev, tagline: e.target.value} : null)}
                    />
                    <Input 
                      label={t('storePhone', 'Store Phone Number')} 
                      value={businessSettings?.phone || ''} 
                      onChange={(e) => setBusinessSettings(prev => prev ? {...prev, phone: e.target.value} : null)}
                    />
                    <Input 
                      label={t('storeEmail', 'Store Email')} 
                      type="email" 
                      value={businessSettings?.email || ''} 
                      onChange={(e) => setBusinessSettings(prev => prev ? {...prev, email: e.target.value} : null)}
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-3 pt-3 border-t border-[#2A261F]">
                    <span className="text-xs font-semibold text-[#C9A45C] uppercase tracking-wider block">{t('storeAddress', 'Store Address')}</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input 
                        label={t('addressLine1', 'Address Line 1')} 
                        value={businessSettings?.address_line1 || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, address_line1: e.target.value} : null)}
                      />
                      <Input 
                        label={t('city', 'City')} 
                        value={businessSettings?.city || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, city: e.target.value} : null)}
                      />
                      <Input 
                        label={t('state', 'State')} 
                        value={businessSettings?.state || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, state: e.target.value} : null)}
                      />
                      <Input 
                        label={t('pincode', 'Pincode')} 
                        value={businessSettings?.pincode || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, pincode: e.target.value} : null)}
                      />
                    </div>
                  </div>

                  {/* Currency & Localization */}
                  <div className="space-y-3 pt-3 border-t border-[#2A261F]">
                    <span className="text-xs font-semibold text-[#C9A45C] uppercase tracking-wider block">{t('currencyLocalization', 'Currency & Localization')}</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Input 
                        label={t('currencyCode', 'Currency Code')} 
                        value={businessSettings?.currency_code || 'INR'} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, currency_code: e.target.value} : null)}
                        placeholder="INR"
                      />
                      <Input 
                        label={t('currencySymbol', 'Currency Symbol')} 
                        value={businessSettings?.currency_symbol || '₹'} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, currency_symbol: e.target.value} : null)}
                        placeholder="₹"
                      />
                      <Input 
                        label={t('country', 'Country')} 
                        value={businessSettings?.country || 'India'} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, country: e.target.value} : null)}
                        placeholder="India"
                      />
                      <Input 
                        label={t('timezone', 'Timezone')} 
                        value={businessSettings?.timezone || 'Asia/Kolkata'} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, timezone: e.target.value} : null)}
                        placeholder="Asia/Kolkata"
                      />
                    </div>
                  </div>

                  {/* Tax & Invoice Prefixes */}
                  <div className="space-y-3 pt-3 border-t border-[#2A261F]">
                    <span className="text-xs font-semibold text-[#C9A45C] uppercase tracking-wider block">{t('taxDocumentPrefixes', 'Tax Details & Document Prefixes')}</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Input 
                        label={t('gstinNumber', 'GSTIN Number')} 
                        value={businessSettings?.gst_number || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, gst_number: e.target.value} : null)}
                        placeholder="24AAAAA0000A1Z5"
                      />
                      <Input 
                        label={t('panNumber', 'Permanent Account Number (PAN)')} 
                        value={businessSettings?.pan_number || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, pan_number: e.target.value} : null)}
                        placeholder="AAAAA0000A"
                      />
                      <Input 
                        label={t('defaultTaxRate', 'Default GST Rate (%)')} 
                        type="number"
                        step="0.01"
                        value={businessSettings?.default_tax_rate !== undefined ? businessSettings.default_tax_rate : '18.00'} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, default_tax_rate: parseFloat(e.target.value) || 0} : null)}
                        placeholder="18.00"
                      />
                      <Input 
                        label={t('invoicePrefix', 'Sales Invoice Prefix')} 
                        value={businessSettings?.invoice_prefix || 'INV'} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, invoice_prefix: e.target.value} : null)}
                      />
                      <Input 
                        label={t('repairPrefix', 'Repair Ticket Prefix')} 
                        value={businessSettings?.repair_prefix || 'REP'} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, repair_prefix: e.target.value} : null)}
                      />
                      <Input 
                        label={t('poPrefix', 'Purchase Order Prefix')} 
                        value={businessSettings?.po_prefix || 'PO'} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, po_prefix: e.target.value} : null)}
                      />
                    </div>
                  </div>

                  {/* Hours & WhatsApp */}
                  <div className="space-y-3 pt-3 border-t border-[#2A261F]">
                    <span className="text-xs font-semibold text-[#C9A45C] uppercase tracking-wider block">{t('storeHoursContact', 'Store Hours & Contact')}</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input 
                        label={t('weekdayOpeningHours', 'Weekday Opening Hours')} 
                        value={businessSettings?.opening_hours_weekdays || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, opening_hours_weekdays: e.target.value} : null)}
                        placeholder="10:00 AM – 9:00 PM (Mon – Sat)"
                      />
                      <Input 
                        label={t('sundayOpeningHours', 'Sunday Opening Hours')} 
                        value={businessSettings?.opening_hours_sunday || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, opening_hours_sunday: e.target.value} : null)}
                        placeholder="11:00 AM – 8:00 PM (Sun)"
                      />
                      <Input 
                        label={t('whatsappNumber', 'WhatsApp Support Number')} 
                        value={businessSettings?.whatsapp_number || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, whatsapp_number: e.target.value} : null)}
                        placeholder="919106680191"
                      />
                      <Input 
                        label={t('landmark', 'Prominent Landmark')} 
                        value={businessSettings?.landmark || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, landmark: e.target.value} : null)}
                        placeholder="Near Abhilasha Char Rasta"
                      />
                    </div>
                  </div>

                  <Button onClick={handleBusinessSettingsSave} loading={saving} icon={<Save className="w-4 h-4" />} className="shadow-gold">
                    {t('saveStoreSettings', 'Save Store Settings')}
                  </Button>
                </div>
              )}

              {/* TAB 3: Terminal Preferences */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-[#F3EFE6]">{t('appPreferences', 'App Preferences')}</h2>
                    <p className="text-xs text-[#8D8980] mt-0.5">{t('preferencesSubtitle', 'Theme, language, and receipt printing settings')}</p>
                  </div>
                  
                  {/* Theme */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-[#C9A45C] uppercase tracking-wider block">{t('theme', 'Theme')}</span>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'dark', label: t('darkMode', 'Dark Mode (Luxury)'), icon: Moon },
                        { id: 'system', label: t('systemDefault', 'System Default'), icon: Monitor },
                        { id: 'light', label: t('lightMode', 'Light Mode'), icon: Sun },
                      ].map((th) => (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => setContextTheme(th.id as any)}
                          className={clsx(
                            'p-4 rounded-xl border text-center transition-all cursor-pointer',
                            prefTheme === th.id
                              ? 'border-[#C9A45C] bg-[#C9A45C]/15 text-[#C9A45C] font-bold shadow-gold ring-1 ring-[#C9A45C]'
                              : 'border-[#2A261F] bg-[#12110F] text-[#8D8980] hover:text-[#F3EFE6] hover:border-[#C9A45C]/40'
                          )}
                        >
                          <th.icon className="w-5 h-5 mx-auto mb-2 text-[#C9A45C]" />
                          <span className="text-xs">{th.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div className="space-y-3 pt-3 border-t border-[#2A261F]">
                    <span className="text-xs font-semibold text-[#C9A45C] uppercase tracking-wider block">{t('language', 'Language')}</span>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'en', label: 'English (UK / Global)' },
                        { id: 'gu', label: 'Gujarati (ગુજરાતી)' },
                        { id: 'hi', label: 'Hindi (हिंदी)' },
                      ].map((lang) => (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => setContextLang(lang.id as any)}
                          className={clsx(
                            'p-3.5 rounded-xl border text-center transition-all text-xs cursor-pointer',
                            prefLang === lang.id
                              ? 'border-[#C9A45C] bg-[#C9A45C]/15 text-[#C9A45C] font-bold shadow-gold ring-1 ring-[#C9A45C]'
                              : 'border-[#2A261F] bg-[#12110F] text-[#8D8980] hover:text-[#F3EFE6] hover:border-[#C9A45C]/40'
                          )}
                        >
                          <Globe className="w-4 h-4 mx-auto mb-1 text-[#C9A45C]" />
                          <span>{lang.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* POS Printing */}
                  <div className="space-y-3 pt-3 border-t border-[#2A261F]">
                    <span className="text-xs font-semibold text-[#C9A45C] uppercase tracking-wider block">{t('receiptPrinting', 'Receipt Printing')}</span>
                    <div className="flex items-center justify-between p-4 bg-[#12110F] border border-[#2A261F] rounded-xl">
                      <div className="flex items-center gap-3">
                        <Printer className="w-5 h-5 text-[#C9A45C]" />
                        <div>
                          <p className="font-semibold text-sm text-[#F3EFE6]">{t('autoPrintReceipt', 'Auto-Print Receipt on Checkout')}</p>
                          <p className="text-xs text-[#8D8980]">{t('autoPrintDesc', 'Automatically open print dialog when a sale is completed')}</p>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 accent-[#C9A45C] cursor-pointer" 
                        checked={prefAutoPrint}
                        onChange={(e) => setContextAutoPrint(e.target.checked)}
                      />
                    </div>
                  </div>

                  {/* Payment Mode & Dashboard Period */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#2A261F]">
                    <div>
                      <span className="text-xs font-semibold text-[#C9A45C] uppercase tracking-wider block mb-2">{t('defaultPaymentMode', 'Default Payment Mode')}</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'cash', label: t('cash', 'Cash') },
                          { id: 'upi', label: t('upi', 'UPI') },
                          { id: 'card', label: t('card', 'Card') },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setContextPayMode(m.id as any)}
                            className={clsx(
                              'py-2 px-3 rounded-lg border text-xs font-medium transition cursor-pointer',
                              prefPayMode === m.id
                                ? 'border-[#C9A45C] bg-[#C9A45C]/20 text-[#C9A45C] font-bold'
                                : 'border-[#2A261F] bg-[#12110F] text-[#8D8980]'
                            )}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-[#C9A45C] uppercase tracking-wider block mb-2">{t('defaultDashboardPeriod', 'Default Dashboard Period')}</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'today', label: t('today', 'Today') },
                          { id: 'week', label: t('thisWeek', 'This Week') },
                          { id: 'month', label: t('thisMonth', 'This Month') },
                        ].map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setContextDashPeriod(p.id as any)}
                            className={clsx(
                              'py-2 px-3 rounded-lg border text-xs font-medium transition cursor-pointer',
                              prefDashPeriod === p.id
                                ? 'border-[#C9A45C] bg-[#C9A45C]/20 text-[#C9A45C] font-bold'
                                : 'border-[#2A261F] bg-[#12110F] text-[#8D8980]'
                            )}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button onClick={() => saveContextPrefs()} loading={prefSaving} icon={<Save className="w-4 h-4" />} className="shadow-gold">
                    {t('savePreferences', 'Save Preferences')}
                  </Button>
                </div>
              )}

              {/* TAB 4: Notifications */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-[#F3EFE6]">{t('notificationChannelsTitle', 'Notification Channels & Alerts')}</h2>
                    <p className="text-xs text-[#8D8980] mt-0.5">{t('notificationChannelsSubtitle', 'Configure customer messaging channels and store alert triggers')}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-[#C9A45C] uppercase tracking-wider block">{t('customerMessageChannels', 'Customer Message Channels')}</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { key: 'enable_whatsapp', label: 'WhatsApp API' },
                        { key: 'enable_email', label: 'Email' },
                        { key: 'enable_sms', label: 'Transactional SMS' },
                      ].map((channel) => (
                        <div key={channel.key} className="p-4 bg-[#12110F] border border-[#2A261F] rounded-xl flex items-center justify-between">
                          <span className="font-medium text-xs text-[#F3EFE6]">{channel.label}</span>
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 accent-[#C9A45C]" 
                            checked={(businessSettings as any)?.[channel.key] || false}
                            onChange={(e) => setBusinessSettings(prev => prev ? {...prev, [channel.key]: e.target.checked} : null)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-3 border-t border-[#2A261F]">
                    <span className="text-xs font-semibold text-[#C9A45C] uppercase tracking-wider block">{t('inAppAlertTriggers', 'In-App Alert Triggers')}</span>
                    {[
                      { key: 'notify_low_stock', label: t('lowStock', 'Low Stock Alerts') },
                      { key: 'notify_new_repair', label: t('newRepairTicket', 'New Watch Repair Ticket Logged') },
                      { key: 'notify_repair_ready', label: t('readyForCollection', 'Watch Ready for Customer Pickup') },
                      { key: 'notify_daily_summary', label: t('monthlySalesSummary', 'End-of-Day Sales Summary') },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-3.5 bg-[#12110F] border border-[#2A261F] rounded-xl">
                        <span className="text-xs text-[#F3EFE6] font-medium">{item.label}</span>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 accent-[#C9A45C]" 
                          checked={(preferences as any)?.[item.key] || false}
                          onChange={(e) => setPreferences(prev => prev ? {...prev, [item.key]: e.target.checked} : null)}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button onClick={handleBusinessSettingsSave} loading={saving} icon={<Save className="w-4 h-4" />} className="shadow-gold">
                      {t('saveChannels', 'Save Channels')}
                    </Button>
                    <Button variant="secondary" onClick={handlePreferencesSave} loading={saving}>
                      {t('saveTriggers', 'Save Triggers')}
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 5: Security */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-[#F3EFE6]">{t('securityPasswordTitle', 'Security & Password')}</h2>
                    <p className="text-xs text-[#8D8980] mt-0.5">{t('securityPasswordSubtitle', 'Change your login password')}</p>
                  </div>
                  
                  <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl text-xs text-amber-300">
                    <p>{t('enterCurrentPasswordDesc', 'Enter your current password followed by your new password.')}</p>
                  </div>
                  
                  <div className="space-y-4 max-w-md">
                    <Input 
                      label={t('currentPassword', 'Current Password')} 
                      type="password"
                      placeholder="••••••••••••"
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm(prev => ({...prev, current_password: e.target.value}))}
                    />
                    <Input 
                      label={t('newPassword', 'New Password')} 
                      type="password"
                      placeholder="••••••••••••"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm(prev => ({...prev, new_password: e.target.value}))}
                    />
                    <Input 
                      label={t('confirmPassword', 'Confirm New Password')} 
                      type="password"
                      placeholder="••••••••••••"
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm(prev => ({...prev, confirm_password: e.target.value}))}
                      error={passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password ? t('passwordsDoNotMatch', 'Passwords do not match') : undefined}
                    />
                  </div>

                  <Button 
                    onClick={handlePasswordChange}
                    loading={saving}
                    disabled={!passwordForm.current_password || !passwordForm.new_password || passwordForm.new_password !== passwordForm.confirm_password}
                    icon={<Shield className="w-4 h-4" />}
                    className="shadow-gold"
                  >
                    {t('changePassword', 'Change Password')}
                  </Button>
                </div>
              )}

              {/* TAB 6: Backup & Database Archiving */}
              {activeTab === 'backup' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-[#F3EFE6]">{t('databaseBackupsTitle', 'Database Backups')}</h2>
                    <p className="text-xs text-[#8D8980] mt-0.5">{t('databaseBackupsSubtitle', 'Create database backups for safe data storage and recovery')}</p>
                  </div>
                  
                  <div className="p-4 bg-sky-950/20 border border-sky-800/40 rounded-xl flex items-start gap-3 text-xs text-sky-300">
                    <Clock className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sky-200">{t('autoDailyBackupsActive', 'Automated Daily Backups Active')}</p>
                      <p className="text-[#8D8980] mt-0.5">{t('autoDailyBackupsDesc', 'Database backups are created daily at 02:00 AM IST.')}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleBackup} loading={backupLoading} icon={<Database className="w-4 h-4" />} className="shadow-gold">
                      {t('createBackupNow', 'Create Backup Now')}
                    </Button>
                    {backups.length > 0 && (
                      <Button variant="secondary" onClick={() => handleDownloadBackup(backups[0].filename)} icon={<Download className="w-4 h-4 text-[#C9A45C]" />}>
                        {t('downloadMostRecent', 'Download Most Recent')}
                      </Button>
                    )}
                  </div>

                  <div className="pt-4 border-t border-[#2A261F]">
                    <h3 className="font-serif font-bold text-base text-[#F3EFE6] mb-3">{t('storedBackups', 'Stored Backups')} ({backups.length})</h3>
                    {backups.length === 0 ? (
                      <div className="text-center py-8 text-[#8D8980] bg-[#12110F] border border-[#2A261F] rounded-xl">
                        <Database className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#C9A45C]" />
                        <p className="text-xs">{t('noBackupsCreated', 'No backups created yet.')}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {backups.slice(0, 8).map((backup) => (
                          <div 
                            key={backup.filename} 
                            className="flex items-center justify-between p-3.5 bg-[#12110F] border border-[#2A261F] rounded-xl text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-950/40 border border-emerald-800/40 rounded-lg flex items-center justify-center text-emerald-400">
                                <Check className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-mono font-bold text-[#F3EFE6]">{backup.filename}</p>
                                <p className="text-[11px] text-[#8D8980] font-mono">{backup.size_mb} MB • {new Date(backup.created_at).toLocaleString()}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button variant="secondary" size="sm" onClick={() => handleDownloadBackup(backup.filename)} icon={<Download className="w-3.5 h-3.5" />}>
                                {t('download', 'Download')}
                              </Button>
                              <button 
                                onClick={() => handleDeleteBackup(backup.filename)}
                                className="p-2 text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                                title={t('delete', 'Delete Backup')}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
