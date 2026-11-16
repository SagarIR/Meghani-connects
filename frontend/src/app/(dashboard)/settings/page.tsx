'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Store, Bell, Shield, Database, Upload, Save, 
  RefreshCw, Download, Check, X, Moon, Sun,
  Globe, Monitor, Printer, Clock, ChevronDown
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'
import api from '@/services/api'

interface BusinessSettings {
  id: number
  business_name: string
  tagline: string
  logo: string | null
  logo_url: string | null
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
  invoice_prefix: string
  repair_prefix: string
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
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
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
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'business', label: 'Business', icon: Store },
    { id: 'preferences', label: 'Preferences', icon: Monitor },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'backup', label: 'Backup', icon: Database },
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
      toast.success('Business settings saved!')
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
      toast.success('Preferences saved!')
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
      toast.error('Passwords do not match')
      return
    }
    if (passwordForm.new_password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    
    setSaving(true)
    try {
      await api.post('/users/change-password/', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      })
      toast.success('Password changed!')
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
      toast.success('Backup created!')
      fetchBackups()
    } catch (error) {
      toast.error('Failed to create backup')
    } finally {
      setBackupLoading(false)
    }
  }

  const handleDownloadBackup = (filename: string) => {
    window.open(`${api.defaults.baseURL}/backups/${filename}/download/`, '_blank')
  }

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm('Delete this backup?')) return
    
    try {
      await api.delete(`/backups/${filename}/delete/`)
      toast.success('Backup deleted')
      fetchBackups()
    } catch (error) {
      toast.error('Failed to delete backup')
    }
  }

  const currentTab = tabs.find(t => t.id === activeTab)
  const CurrentIcon = currentTab?.icon || User

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm lg:text-base text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Mobile Tab Selector */}
        <div className="lg:hidden">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <CurrentIcon className="w-5 h-5 text-primary-600" />
              <span className="font-medium text-gray-900">{currentTab?.label}</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showMobileMenu ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showMobileMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setShowMobileMenu(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 shrink-0">
          <motion.div 
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sticky top-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {tabs.map((tab, index) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6"
            >
              {activeTab === 'profile' && (
                <div className="space-y-4 lg:space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-6 p-4 lg:p-6 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl">
                    <div className="w-16 h-16 lg:w-24 lg:h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-2xl lg:text-3xl font-bold text-white">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-lg lg:text-xl font-bold text-gray-900">{user?.name}</h3>
                      <p className="text-sm text-gray-600 capitalize mt-1">{user?.role}</p>
                      <p className="text-xs text-gray-500 mt-1 lg:mt-2">{user?.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                    <Input label="Full Name" defaultValue={user?.name} icon={<User className="w-4 h-4" />} />
                    <Input label="Username" defaultValue={user?.username} disabled icon={<User className="w-4 h-4" />} />
                    <Input label="Email" type="email" defaultValue={user?.email} />
                    <Input label="Phone" defaultValue={user?.phone} />
                  </div>

                  <Button variant="primary" icon={<Save className="w-4 h-4" />}>Save Changes</Button>
                </div>
              )}

              {activeTab === 'business' && (
                <div className="space-y-4 lg:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">Business Settings</h2>
                    <Button variant="ghost" size="sm" onClick={fetchBusinessSettings} icon={<RefreshCw className="w-4 h-4" />}>
                      Refresh
                    </Button>
                  </div>

                  {/* Logo Upload */}
                  <div className="flex flex-col sm:flex-row items-start gap-4 lg:gap-6 p-4 lg:p-6 bg-gray-50 rounded-xl">
                    <div className="relative mx-auto sm:mx-0">
                      <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <Store className="w-8 h-8 lg:w-12 lg:h-12 text-gray-400" />
                        )}
                      </div>
                      <label className="absolute -bottom-2 -right-2 w-7 h-7 lg:w-8 lg:h-8 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors">
                        <Upload className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-white" />
                        <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                      </label>
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="font-semibold text-gray-900">Business Logo</h3>
                      <p className="text-sm text-gray-500 mt-1">Upload your logo for invoices</p>
                      <p className="text-xs text-gray-400 mt-1 lg:mt-2">Recommended: 500x500px, PNG/JPG</p>
                    </div>
                  </div>
                  
                  {/* Business Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                    <Input 
                      label="Business Name" 
                      value={businessSettings?.business_name || ''} 
                      onChange={(e) => setBusinessSettings(prev => prev ? {...prev, business_name: e.target.value} : null)}
                    />
                    <Input 
                      label="Tagline" 
                      value={businessSettings?.tagline || ''} 
                      onChange={(e) => setBusinessSettings(prev => prev ? {...prev, tagline: e.target.value} : null)}
                    />
                    <Input 
                      label="Phone" 
                      value={businessSettings?.phone || ''} 
                      onChange={(e) => setBusinessSettings(prev => prev ? {...prev, phone: e.target.value} : null)}
                    />
                    <Input 
                      label="Email" 
                      type="email" 
                      value={businessSettings?.email || ''} 
                      onChange={(e) => setBusinessSettings(prev => prev ? {...prev, email: e.target.value} : null)}
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-3 lg:space-y-4">
                    <h3 className="font-medium text-gray-700">Address</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                      <Input 
                        label="Address Line 1" 
                        value={businessSettings?.address_line1 || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, address_line1: e.target.value} : null)}
                      />
                      <Input 
                        label="City" 
                        value={businessSettings?.city || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, city: e.target.value} : null)}
                      />
                      <Input 
                        label="State" 
                        value={businessSettings?.state || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, state: e.target.value} : null)}
                      />
                      <Input 
                        label="Pincode" 
                        value={businessSettings?.pincode || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, pincode: e.target.value} : null)}
                      />
                    </div>
                  </div>

                  {/* Tax Info */}
                  <div className="space-y-3 lg:space-y-4">
                    <h3 className="font-medium text-gray-700">Tax Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                      <Input 
                        label="GSTIN" 
                        value={businessSettings?.gst_number || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, gst_number: e.target.value} : null)}
                        placeholder="22AAAAA0000A1Z5"
                      />
                      <Input 
                        label="PAN" 
                        value={businessSettings?.pan_number || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, pan_number: e.target.value} : null)}
                        placeholder="AAAAA0000A"
                      />
                    </div>
                  </div>

                  {/* Public Website & Concierge Information */}
                  <div className="space-y-3 lg:space-y-4 pt-4 border-t border-gray-100">
                    <h3 className="font-medium text-amber-800 flex items-center gap-2">
                      <span>Public Website & Showroom Timings</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                      <Input 
                        label="WhatsApp Concierge Number (with country code)" 
                        value={businessSettings?.whatsapp_number || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, whatsapp_number: e.target.value} : null)}
                        placeholder="919106680191"
                      />
                      <Input 
                        label="Landmark / Navigation Plus Code" 
                        value={businessSettings?.landmark || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, landmark: e.target.value} : null)}
                        placeholder="Near Abhilasha Char Rasta"
                      />
                      <Input 
                        label="Weekday Opening Hours" 
                        value={businessSettings?.opening_hours_weekdays || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, opening_hours_weekdays: e.target.value} : null)}
                        placeholder="10:00 AM – 9:00 PM (Mon – Sat)"
                      />
                      <Input 
                        label="Sunday Opening Hours" 
                        value={businessSettings?.opening_hours_sunday || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, opening_hours_sunday: e.target.value} : null)}
                        placeholder="11:00 AM – 8:00 PM (Sun)"
                      />
                      <Input 
                        label="Google Maps URL" 
                        value={businessSettings?.google_maps_url || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, google_maps_url: e.target.value} : null)}
                        placeholder="https://maps.app.goo.gl/..."
                      />
                      <Input 
                        label="Google Maps Embed Iframe Src" 
                        value={businessSettings?.google_maps_embed_src || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, google_maps_embed_src: e.target.value} : null)}
                        placeholder="https://maps.google.com/maps?q=..."
                      />
                      <Input 
                        label="Instagram URL" 
                        value={businessSettings?.instagram_url || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, instagram_url: e.target.value} : null)}
                        placeholder="https://instagram.com/meghaniwatchco"
                      />
                      <Input 
                        label="Facebook URL" 
                        value={businessSettings?.facebook_url || ''} 
                        onChange={(e) => setBusinessSettings(prev => prev ? {...prev, facebook_url: e.target.value} : null)}
                        placeholder="https://facebook.com/meghaniwatchco"
                      />
                    </div>
                  </div>

                  {/* Public Legal Policies */}
                  <div className="space-y-3 lg:space-y-4 pt-4 border-t border-gray-100">
                    <h3 className="font-medium text-gray-700">Public Website Policies</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                        <textarea
                          rows={3}
                          value={businessSettings?.terms_and_conditions || ''}
                          onChange={(e) => setBusinessSettings(prev => prev ? {...prev, terms_and_conditions: e.target.value} : null)}
                          className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:border-amber-500 focus:outline-none"
                          placeholder="Store terms, warranty policies, repair conditions..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Privacy Policy</label>
                        <textarea
                          rows={3}
                          value={businessSettings?.privacy_policy || ''}
                          onChange={(e) => setBusinessSettings(prev => prev ? {...prev, privacy_policy: e.target.value} : null)}
                          className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:border-amber-500 focus:outline-none"
                          placeholder="Customer data confidentiality and privacy commitment..."
                        />
                      </div>
                    </div>
                  </div>

                  <Button variant="primary" onClick={handleBusinessSettingsSave} loading={saving} icon={<Save className="w-4 h-4" />}>
                    Save Business Settings
                  </Button>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-4 lg:space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">User Preferences</h2>
                  
                  {/* Theme */}
                  <div className="space-y-3 lg:space-y-4">
                    <h3 className="font-medium text-gray-700">Appearance</h3>
                    <div className="grid grid-cols-3 gap-2 lg:gap-4">
                      {[
                        { id: 'light', label: 'Light', icon: Sun },
                        { id: 'dark', label: 'Dark', icon: Moon },
                        { id: 'system', label: 'System', icon: Monitor },
                      ].map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => setPreferences(prev => prev ? {...prev, theme: theme.id} : null)}
                          className={`p-3 lg:p-4 rounded-lg lg:rounded-xl border-2 transition-all ${
                            preferences?.theme === theme.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <theme.icon className={`w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1 lg:mb-2 ${
                            preferences?.theme === theme.id ? 'text-primary-600' : 'text-gray-400'
                          }`} />
                          <p className={`text-xs lg:text-sm font-medium ${
                            preferences?.theme === theme.id ? 'text-primary-600' : 'text-gray-600'
                          }`}>{theme.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div className="space-y-3 lg:space-y-4">
                    <h3 className="font-medium text-gray-700">Language</h3>
                    <div className="grid grid-cols-3 gap-2 lg:gap-4">
                      {[
                        { id: 'en', label: 'English' },
                        { id: 'hi', label: 'Hindi' },
                        { id: 'gu', label: 'Gujarati' },
                      ].map((lang) => (
                        <button
                          key={lang.id}
                          onClick={() => setPreferences(prev => prev ? {...prev, language: lang.id} : null)}
                          className={`p-3 lg:p-4 rounded-lg lg:rounded-xl border-2 transition-all ${
                            preferences?.language === lang.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Globe className={`w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1 lg:mb-2 ${
                            preferences?.language === lang.id ? 'text-primary-600' : 'text-gray-400'
                          }`} />
                          <p className={`text-xs lg:text-sm font-medium ${
                            preferences?.language === lang.id ? 'text-primary-600' : 'text-gray-600'
                          }`}>{lang.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* POS Settings */}
                  <div className="space-y-3 lg:space-y-4">
                    <h3 className="font-medium text-gray-700">POS Settings</h3>
                    <div className="flex items-center justify-between p-3 lg:p-4 bg-gray-50 rounded-lg lg:rounded-xl">
                      <div className="flex items-center gap-2 lg:gap-3">
                        <Printer className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-sm lg:text-base text-gray-900">Auto Print Receipt</p>
                          <p className="text-xs lg:text-sm text-gray-500 hidden sm:block">Print after sale</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={preferences?.auto_print_receipt || false}
                          onChange={(e) => setPreferences(prev => prev ? {...prev, auto_print_receipt: e.target.checked} : null)}
                        />
                        <div className="w-10 h-5 lg:w-11 lg:h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 lg:after:h-5 lg:after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>

                  <Button variant="primary" onClick={handlePreferencesSave} loading={saving} icon={<Save className="w-4 h-4" />}>
                    Save Preferences
                  </Button>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-4 lg:space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
                  
                  <div className="space-y-3 lg:space-y-4">
                    <h3 className="font-medium text-gray-700">Notification Channels</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                      {[
                        { key: 'enable_email', label: 'Email' },
                        { key: 'enable_sms', label: 'SMS' },
                        { key: 'enable_whatsapp', label: 'WhatsApp' },
                      ].map((channel) => (
                        <div key={channel.key} className="p-3 lg:p-4 bg-gray-50 rounded-lg lg:rounded-xl">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm lg:text-base text-gray-900">{channel.label}</p>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={(businessSettings as any)?.[channel.key] || false}
                                onChange={(e) => setBusinessSettings(prev => prev ? {...prev, [channel.key]: e.target.checked} : null)}
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-3 lg:space-y-4">
                    <h3 className="font-medium text-gray-700">Your Notifications</h3>
                    {[
                      { key: 'notify_low_stock', label: 'Low Stock Alerts' },
                      { key: 'notify_new_repair', label: 'New Repair Tickets' },
                      { key: 'notify_repair_ready', label: 'Repair Ready' },
                      { key: 'notify_daily_summary', label: 'Daily Summary' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-3 lg:p-4 bg-gray-50 rounded-lg lg:rounded-xl">
                        <p className="font-medium text-sm lg:text-base text-gray-900">{item.label}</p>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={(preferences as any)?.[item.key] || false}
                            onChange={(e) => setPreferences(prev => prev ? {...prev, [item.key]: e.target.checked} : null)}
                          />
                          <div className="w-10 h-5 lg:w-11 lg:h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 lg:after:h-5 lg:after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
                    <Button variant="primary" onClick={handleBusinessSettingsSave} loading={saving} icon={<Save className="w-4 h-4" />}>
                      Save Channel Settings
                    </Button>
                    <Button variant="secondary" onClick={handlePreferencesSave} loading={saving} icon={<Save className="w-4 h-4" />}>
                      Save Preferences
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-4 lg:space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
                  
                  <div className="p-3 lg:p-4 bg-yellow-50 border border-yellow-200 rounded-lg lg:rounded-xl">
                    <p className="text-xs lg:text-sm text-yellow-700">Enter your current password to change it.</p>
                  </div>
                  
                  <div className="space-y-3 lg:space-y-4 max-w-md">
                    <Input 
                      label="Current Password" 
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm(prev => ({...prev, current_password: e.target.value}))}
                    />
                    <Input 
                      label="New Password" 
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm(prev => ({...prev, new_password: e.target.value}))}
                    />
                    <Input 
                      label="Confirm New Password" 
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm(prev => ({...prev, confirm_password: e.target.value}))}
                      error={passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password ? 'Passwords do not match' : undefined}
                    />
                  </div>

                  <Button 
                    variant="primary"
                    onClick={handlePasswordChange}
                    loading={saving}
                    disabled={!passwordForm.current_password || !passwordForm.new_password || passwordForm.new_password !== passwordForm.confirm_password}
                    icon={<Shield className="w-4 h-4" />}
                  >
                    Change Password
                  </Button>
                </div>
              )}

              {activeTab === 'backup' && (
                <div className="space-y-4 lg:space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Backup & Restore</h2>
                  
                  <div className="p-3 lg:p-4 bg-blue-50 border border-blue-200 rounded-lg lg:rounded-xl">
                    <div className="flex items-start gap-2 lg:gap-3">
                      <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm lg:text-base text-blue-800">Automatic Backups</p>
                        <p className="text-xs lg:text-sm text-blue-600 mt-0.5 lg:mt-1">Backups are created daily at 2:00 AM IST.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
                    <Button variant="primary" onClick={handleBackup} loading={backupLoading} icon={<Database className="w-4 h-4" />}>
                      Create Backup Now
                    </Button>
                    {backups.length > 0 && (
                      <Button variant="secondary" onClick={() => handleDownloadBackup(backups[0].filename)} icon={<Download className="w-4 h-4" />}>
                        Download Latest
                      </Button>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-4 lg:pt-6">
                    <h3 className="font-medium text-gray-900 mb-3 lg:mb-4">Recent Backups ({backups.length})</h3>
                    {backups.length === 0 ? (
                      <div className="text-center py-6 lg:py-8 text-gray-500">
                        <Database className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-2 lg:mb-3 text-gray-300" />
                        <p className="text-sm lg:text-base">No backups yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {backups.slice(0, 10).map((backup, i) => (
                          <motion.div 
                            key={backup.filename} 
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 lg:p-4 bg-gray-50 rounded-lg lg:rounded-xl"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <div className="flex items-center gap-3 lg:gap-4">
                              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Check className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm lg:text-base text-gray-900">
                                  {new Date(backup.created_at).toLocaleString()}
                                </p>
                                <p className="text-xs lg:text-sm text-gray-500">{backup.size_mb} MB</p>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-11 sm:ml-0">
                              <Button variant="ghost" size="sm" icon={<Download className="w-4 h-4" />} onClick={() => handleDownloadBackup(backup.filename)}>
                                <span className="hidden sm:inline">Download</span>
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" icon={<X className="w-4 h-4" />} onClick={() => handleDeleteBackup(backup.filename)} />
                            </div>
                          </motion.div>
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
