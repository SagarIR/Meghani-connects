'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Globe, MessageSquare, Tag, FolderTree, Gift, Image as ImageIcon, 
  Milestone, Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, 
  Clock, Phone, Mail, Calendar, Eye, ExternalLink, RefreshCw, Star, AlertCircle, Upload, UserPlus,
  Send, Sparkles
} from 'lucide-react'
import api from '@/services/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal, { ConfirmModal } from '@/components/ui/Modal'
import Badge, { StatusBadge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// Types
interface Enquiry {
  id: number
  name: string
  phone: string
  email: string
  enquiry_type: string
  preferred_date: string
  product_name: string
  message: string
  status: 'new' | 'contacted' | 'converted' | 'closed'
  notes: string
  created_at: string
}

interface Brand {
  id: number
  name: string
  slug: string
  country: string
  established: string
  tagline: string
  description: string
  hero_image: string
  is_featured: boolean
  is_active: boolean
  display_order: number
  count?: number
}

interface Category {
  id: number
  name: string
  slug: string
  tagline: string
  description: string
  image_url: string
  features: string[]
  is_active: boolean
  display_order: number
  count?: number
}

interface Offer {
  id: number
  title: string
  badge: string
  discount: string
  description: string
  code: string
  validity: string
  terms: string
  banner_image: string
  target_category: string
  is_active: boolean
  display_order: number
}

interface GalleryItem {
  id: number
  title: string
  category: string
  image_url: string
  caption: string
  details: string
  is_active: boolean
  display_order: number
}

interface MilestoneItem {
  id: number
  year: string
  title: string
  description: string
  display_order: number
}

export default function WebsiteCMSPage() {
  const [activeTab, setActiveTab] = useState<'enquiries' | 'brands' | 'categories' | 'offers' | 'gallery' | 'milestones'>('enquiries')
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // Data states
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [milestones, setMilestones] = useState<MilestoneItem[]>([])

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: number; type: string } | null>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  // Fetch data
  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'enquiries') {
        const res = await api.get('/enquiries/')
        setEnquiries(res.data.results || res.data || [])
      } else if (activeTab === 'brands') {
        const res = await api.get('/brands/')
        setBrands(res.data.results || res.data || [])
      } else if (activeTab === 'categories') {
        const res = await api.get('/categories/')
        setCategories(res.data.results || res.data || [])
      } else if (activeTab === 'offers') {
        const res = await api.get('/offers/')
        setOffers(res.data.results || res.data || [])
      } else if (activeTab === 'gallery') {
        const res = await api.get('/gallery/')
        setGallery(res.data.results || res.data || [])
      } else if (activeTab === 'milestones') {
        const res = await api.get('/milestones/')
        setMilestones(res.data.results || res.data || [])
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to load content data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setSearch('')
    fetchData()
  }, [activeTab])

  // Quick file upload helper for CMS image inputs
  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>, inputName: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB')
      return
    }
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'meghani-cms')
    
    const loadingToast = toast.loading('Uploading media asset...')
    try {
      const res = await api.post('/upload/image/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.dismiss(loadingToast)
      if (res.data?.url) {
        toast.success('Media asset uploaded')
        const el = document.querySelector(`input[name="${inputName}"]`) as HTMLInputElement
        if (el) {
          el.value = res.data.url
        }
      }
    } catch (err) {
      toast.dismiss(loadingToast)
      toast.error('Failed to upload media')
    } finally {
      if (e.target) e.target.value = ''
    }
  }

  // Status updater for enquiry
  const updateEnquiryStatus = async (id: number, newStatus: Enquiry['status'], notes?: string) => {
    try {
      const payload: any = { status: newStatus }
      if (notes !== undefined) payload.notes = notes
      await api.patch(`/enquiries/${id}/`, payload)
      toast.success(`Enquiry marked as ${newStatus}`)
      setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: newStatus, ...(notes !== undefined ? { notes } : {}) } : e))
    } catch (err) {
      toast.error('Failed to update enquiry status')
    }
  }

  // Quick Action to convert a Web Enquiry to a CRM Customer
  const handleConvertToCustomer = async (item: Enquiry) => {
    try {
      const res = await api.post(`/enquiries/${item.id}/convert_to_customer/`)
      toast.success(res.data?.message || 'Customer added to CRM!')
      setEnquiries(prev => prev.map(e => e.id === item.id ? { ...e, status: 'converted' } : e))
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to convert enquiry to customer')
    }
  }

  // Handle Delete
  const confirmDelete = async () => {
    if (!itemToDelete) return
    try {
      const endpoint = `/${itemToDelete.type}/${itemToDelete.id}/`
      await api.delete(endpoint)
      toast.success('Content entry deleted')
      setDeleteConfirmOpen(false)
      setItemToDelete(null)
      fetchData()
    } catch (err) {
      toast.error('Failed to delete content entry')
    }
  }

  // Save Modal Form Handler
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    const data: any = {}
    formData.forEach((value, key) => {
      data[key] = value
    })

    // Parse checkboxes
    if (activeTab === 'brands') {
      data.is_featured = formData.get('is_featured') === 'on'
      data.is_active = formData.get('is_active') === 'on'
      data.display_order = parseInt(data.display_order || '0', 10)
    } else if (activeTab === 'categories') {
      data.is_active = formData.get('is_active') === 'on'
      data.display_order = parseInt(data.display_order || '0', 10)
      if (typeof data.features === 'string') {
        data.features = data.features.split(',').map((s: string) => s.trim()).filter(Boolean)
      }
    } else if (activeTab === 'offers') {
      data.is_active = formData.get('is_active') === 'on'
      data.display_order = parseInt(data.display_order || '0', 10)
    } else if (activeTab === 'gallery') {
      data.is_active = formData.get('is_active') === 'on'
      data.display_order = parseInt(data.display_order || '0', 10)
    } else if (activeTab === 'milestones') {
      data.display_order = parseInt(data.display_order || '0', 10)
    }

    try {
      const endpoint = `/${activeTab}/`
      if (editingItem && editingItem.id) {
        await api.patch(`${endpoint}${editingItem.id}/`, data)
        toast.success('Content updated')
      } else {
        await api.post(endpoint, data)
        toast.success('Content published')
      }
      setIsModalOpen(false)
      setEditingItem(null)
      fetchData()
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.detail || 'Failed to save content')
    } finally {
      setSaving(false)
    }
  }

  const newEnquiriesCount = enquiries.filter(e => e.status === 'new').length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#171613] border border-[#2A261F] rounded-xl flex items-center justify-center shadow-md">
            <Globe className="w-5 h-5 text-[#C9A45C]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-serif font-bold text-[#F3EFE6] tracking-tight">Website CMS & Content</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F1E1A] text-[#C9A45C] border border-[#2A261F] font-mono">
                Storefront
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8D8980]">Manage brands, watch categories, offers, photo gallery, and website customer enquiries</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Button 
            variant="secondary" 
            onClick={fetchData} 
            icon={<RefreshCw className={clsx('w-4 h-4 text-[#C9A45C]', loading && 'animate-spin')} />}
          >
            Refresh
          </Button>
          {activeTab !== 'enquiries' && (
            <Button
              onClick={() => {
                setEditingItem(null)
                setIsModalOpen(true)
              }}
              icon={<Plus className="w-4 h-4" />}
              className="shadow-gold"
            >
              Add {activeTab.slice(0, -1)}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto border-b border-[#2A261F] gap-2 pb-1 scrollbar-hide">
        {[
          { id: 'enquiries', label: 'Customer Enquiries', icon: MessageSquare, badge: newEnquiriesCount > 0 ? newEnquiriesCount : undefined },
          { id: 'brands', label: 'Brands', icon: Tag, count: brands.length },
          { id: 'categories', label: 'Watch Categories', icon: FolderTree, count: categories.length },
          { id: 'offers', label: 'Special Offers', icon: Gift, count: offers.length },
          { id: 'gallery', label: 'Store Gallery', icon: ImageIcon, count: gallery.length },
          { id: 'milestones', label: 'Store Milestones', icon: Milestone, count: milestones.length },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap',
                isActive
                  ? 'bg-[#C9A45C] text-[#0B0B0A] border-[#C9A45C] font-bold shadow-gold'
                  : 'bg-[#171613] text-[#8D8980] border-[#2A261F] hover:text-[#F3EFE6] hover:bg-[#1F1E1A]'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Search Bar */}
      <div className="bg-[#171613] p-3.5 rounded-2xl border border-[#2A261F] shadow-xl flex items-center gap-3">
        <Search className="w-4 h-4 text-[#8D8980]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${activeTab}...`}
          className="w-full text-sm outline-none bg-transparent text-[#F3EFE6] placeholder-[#8D8980]/70"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-xs text-[#C9A45C] hover:underline">
            Clear
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="bg-[#171613] rounded-2xl border border-[#2A261F] shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#8D8980] gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#C9A45C]" />
            <p className="text-sm">Loading {activeTab} data...</p>
          </div>
        ) : (
          <>
            {/* 1. ENQUIRIES TAB */}
            {activeTab === 'enquiries' && (
              <div className="divide-y divide-[#2A261F]">
                {enquiries.length === 0 ? (
                  <div className="py-16 text-center text-[#8D8980]">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#C9A45C]" />
                    <p className="text-base font-serif font-bold text-[#F3EFE6]">No Customer Enquiries</p>
                    <p className="text-xs text-[#8D8980] mt-1">Website enquiries and watch viewing requests will appear here in real-time.</p>
                  </div>
                ) : (
                  enquiries
                    .filter(e => !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.phone.includes(search) || (e.product_name || '').toLowerCase().includes(search.toLowerCase()))
                    .map((item) => (
                      <div key={item.id} className="p-5 hover:bg-[#1F1E1A]/40 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h3 className="font-serif font-bold text-[#F3EFE6] text-base">{item.name}</h3>
                              <span className={clsx(
                                'text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border',
                                item.status === 'new' && 'bg-amber-950/40 text-amber-300 border-amber-800/40',
                                item.status === 'contacted' && 'bg-sky-950/40 text-sky-300 border-sky-800/40',
                                item.status === 'converted' && 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40',
                                item.status === 'closed' && 'bg-[#12110F] text-[#8D8980] border-[#2A261F]'
                              )}>
                                {item.status}
                              </span>
                              <span className="text-[11px] bg-[#12110F] text-[#E8D5A7] border border-[#2A261F] px-2 py-0.5 rounded font-mono">
                                {(item.enquiry_type || 'General').replace('_', ' ').toUpperCase()}
                              </span>
                              <span className="text-[11px] font-mono text-[#8D8980]">
                                {new Date(item.created_at).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-[#8D8980] flex-wrap">
                              <span className="flex items-center gap-1 font-mono text-[#F3EFE6]">
                                <Phone className="w-3.5 h-3.5 text-[#C9A45C]" />
                                {item.phone}
                              </span>
                              {item.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3.5 h-3.5 text-[#8D8980]" />
                                  {item.email}
                                </span>
                              )}
                              {item.preferred_date && (
                                <span className="flex items-center gap-1 text-[#E8D5A7] font-medium font-mono">
                                  <Calendar className="w-3.5 h-3.5 text-[#C9A45C]" />
                                  Viewing: {item.preferred_date}
                                </span>
                              )}
                              {item.product_name && (
                                <span className="text-xs bg-[#12110F] text-[#C9A45C] border border-[#2A261F] px-2 py-0.5 rounded font-medium">
                                  Watch: {item.product_name}
                                </span>
                              )}
                            </div>

                            {item.message && (
                              <p className="text-xs text-[#F3EFE6]/80 bg-[#12110F] border border-[#2A261F] p-3 rounded-xl italic">
                                &ldquo;{item.message}&rdquo;
                              </p>
                            )}

                            {/* Internal Notes input */}
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                type="text"
                                defaultValue={item.notes || ''}
                                placeholder="Add internal staff note..."
                                onBlur={(e) => {
                                  if (e.target.value !== item.notes) {
                                    updateEnquiryStatus(item.id, item.status, e.target.value)
                                  }
                                }}
                                className="text-xs bg-[#12110F] border border-[#2A261F] rounded-lg px-3 py-1.5 w-full max-w-md text-[#F3EFE6] placeholder-[#8D8980]/70 focus:border-[#C9A45C] outline-none"
                              />
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                            <select
                              value={item.status}
                              onChange={(e) => updateEnquiryStatus(item.id, e.target.value as any)}
                              className="text-xs border border-[#2A261F] rounded-lg px-2.5 py-1.5 bg-[#12110F] text-[#F3EFE6] font-medium focus:border-[#C9A45C] outline-none cursor-pointer"
                            >
                              <option value="new">Mark as New</option>
                              <option value="contacted">Mark as Contacted</option>
                              <option value="converted">Mark as Converted</option>
                              <option value="closed">Mark as Closed</option>
                            </select>

                            <a
                              href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${item.name}, thank you for contacting Meghani Watch Co. regarding your inquiry.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 rounded-lg text-xs font-semibold hover:bg-emerald-900/50 transition"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>

                            {item.status !== 'converted' && (
                              <button
                                onClick={() => handleConvertToCustomer(item)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A45C]/15 text-[#C9A45C] border border-[#C9A45C]/40 rounded-lg text-xs font-semibold hover:bg-[#C9A45C] hover:text-[#0B0B0A] transition"
                                title="Create CRM Customer record"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Add Customer</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setItemToDelete({ id: item.id, type: 'enquiries' })
                                setDeleteConfirmOpen(true)
                              }}
                              className="p-1.5 text-rose-400 hover:bg-rose-950/40 border border-[#2A261F] rounded-lg transition"
                              title="Delete Enquiry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}

            {/* 2. BRANDS TAB */}
            {activeTab === 'brands' && (
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {brands
                  .filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()) || (b.country || '').toLowerCase().includes(search.toLowerCase()))
                  .map((brand) => (
                    <div key={brand.id} className="border border-[#2A261F] rounded-2xl overflow-hidden hover:border-[#C9A45C]/40 transition flex flex-col bg-[#12110F] shadow-lg">
                      <div className="h-32 bg-[#171613] relative overflow-hidden flex items-center justify-center">
                        {brand.hero_image ? (
                          <img src={brand.hero_image} alt={brand.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-[#8D8980] text-xs">No Brand Image</div>
                        )}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                          {brand.is_featured && (
                            <span className="bg-[#C9A45C] text-[#0B0B0A] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow">
                              <Star className="w-2.5 h-2.5 fill-current" /> Featured
                            </span>
                          )}
                          <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full shadow', brand.is_active ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'bg-[#1F1E1A] text-[#8D8980]')}>
                            {brand.is_active ? 'Active' : 'Hidden'}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="font-serif font-bold text-[#F3EFE6] text-base">{brand.name}</h3>
                            <span className="text-xs font-mono text-[#8D8980]">{brand.established ? `Est. ${brand.established}` : ''}</span>
                          </div>
                          <p className="text-xs text-[#C9A45C] font-medium mt-0.5">{brand.country || 'Watch Brand'}</p>
                          {brand.tagline && <p className="text-xs text-[#8D8980] mt-1.5 italic">&ldquo;{brand.tagline}&rdquo;</p>}
                        </div>
                        <div className="mt-4 pt-3 border-t border-[#2A261F] flex items-center justify-between text-xs">
                          <span className="font-mono text-[#8D8980]">{brand.count || 0} Models</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingItem(brand)
                                setIsModalOpen(true)
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-[#C9A45C] bg-[#C9A45C]/10 hover:bg-[#C9A45C] hover:text-[#0B0B0A] border border-[#C9A45C]/30 rounded-lg transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setItemToDelete({ id: brand.id, type: 'brands' })
                                setDeleteConfirmOpen(true)
                              }}
                              className="p-1 text-rose-400 hover:bg-rose-950/40 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* 3. CATEGORIES TAB */}
            {activeTab === 'categories' && (
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {categories
                  .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.description || '').toLowerCase().includes(search.toLowerCase()))
                  .map((cat) => (
                    <div key={cat.id} className="border border-[#2A261F] rounded-2xl overflow-hidden hover:border-[#C9A45C]/40 transition flex flex-col bg-[#12110F] shadow-lg">
                      <div className="h-32 bg-[#171613] relative flex items-center justify-center">
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-[#8D8980] text-xs">No Category Image</div>
                        )}
                        <span className={clsx('absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full border', cat.is_active ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-[#1F1E1A] text-[#8D8980] border-[#2A261F]')}>
                          {cat.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-serif font-bold text-[#F3EFE6] text-base">{cat.name}</h3>
                          <p className="text-[11px] text-[#C9A45C] font-mono mt-0.5">slug: {cat.slug}</p>
                          <p className="text-xs text-[#8D8980] mt-1.5 line-clamp-2">{cat.description}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-[#2A261F] flex items-center justify-between text-xs">
                          <span className="font-mono text-[#8D8980]">{cat.count || 0} Models</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingItem(cat)
                                setIsModalOpen(true)
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-[#C9A45C] bg-[#C9A45C]/10 hover:bg-[#C9A45C] hover:text-[#0B0B0A] border border-[#C9A45C]/30 rounded-lg transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setItemToDelete({ id: cat.id, type: 'categories' })
                                setDeleteConfirmOpen(true)
                              }}
                              className="p-1 text-rose-400 hover:bg-rose-950/40 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* 4. OFFERS TAB */}
            {activeTab === 'offers' && (
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {offers
                  .filter(o => !search || o.title.toLowerCase().includes(search.toLowerCase()) || (o.code || '').toLowerCase().includes(search.toLowerCase()))
                  .map((offer) => (
                    <div key={offer.id} className="border border-[#2A261F] rounded-2xl overflow-hidden hover:border-[#C9A45C]/40 transition flex flex-col bg-[#12110F] shadow-lg">
                      <div className="h-32 bg-[#171613] relative flex items-center justify-center">
                        {offer.banner_image ? (
                          <img src={offer.banner_image} alt={offer.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-[#8D8980] text-xs">No Promo Banner</div>
                        )}
                        <span className="absolute top-2.5 left-2.5 bg-[#C9A45C] text-[#0B0B0A] text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow">
                          {offer.badge || 'Special Offer'}
                        </span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-serif font-bold text-[#F3EFE6] text-base">{offer.title}</h3>
                          <p className="text-xs font-mono font-bold text-[#C9A45C] mt-0.5">{offer.discount} OFF</p>
                          <p className="text-xs text-[#8D8980] mt-1.5">{offer.description}</p>
                          {offer.code && (
                            <div className="mt-2 inline-block px-2.5 py-1 bg-[#171613] border border-[#2A261F] rounded-lg font-mono text-xs text-[#E8D5A7]">
                              CODE: {offer.code}
                            </div>
                          )}
                        </div>
                        <div className="mt-4 pt-3 border-t border-[#2A261F] flex items-center justify-between text-xs">
                          <span className="font-mono text-[11px] text-[#8D8980]">Valid: {offer.validity || 'Ongoing'}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingItem(offer)
                                setIsModalOpen(true)
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-[#C9A45C] bg-[#C9A45C]/10 hover:bg-[#C9A45C] hover:text-[#0B0B0A] border border-[#C9A45C]/30 rounded-lg transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setItemToDelete({ id: offer.id, type: 'offers' })
                                setDeleteConfirmOpen(true)
                              }}
                              className="p-1 text-rose-400 hover:bg-rose-950/40 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* 5. GALLERY TAB */}
            {activeTab === 'gallery' && (
              <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {gallery.map((item) => (
                  <div key={item.id} className="border border-[#2A261F] rounded-2xl overflow-hidden group bg-[#12110F]">
                    <div className="h-40 relative">
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-end">
                        <p className="font-serif font-bold text-sm text-[#F3EFE6] leading-tight">{item.title}</p>
                        <p className="text-[10px] text-[#C9A45C] capitalize mt-0.5">{item.category}</p>
                      </div>
                    </div>
                    <div className="p-3 flex items-center justify-between border-t border-[#2A261F]">
                      <button
                        onClick={() => {
                          setEditingItem(item)
                          setIsModalOpen(true)
                        }}
                        className="text-xs text-[#C9A45C] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setItemToDelete({ id: item.id, type: 'gallery' })
                          setDeleteConfirmOpen(true)
                        }}
                        className="text-xs text-rose-400 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 6. MILESTONES TAB */}
            {activeTab === 'milestones' && (
              <div className="p-6 divide-y divide-[#2A261F]">
                {milestones.map((ms) => (
                  <div key={ms.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <span className="font-serif font-bold text-2xl text-[#C9A45C]">{ms.year}</span>
                      <div>
                        <h4 className="font-serif font-bold text-base text-[#F3EFE6]">{ms.title}</h4>
                        <p className="text-xs text-[#8D8980] mt-1 leading-relaxed">{ms.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingItem(ms)
                          setIsModalOpen(true)
                        }}
                        className="p-1.5 hover:bg-[#C9A45C]/15 text-[#C9A45C] rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setItemToDelete({ id: ms.id, type: 'milestones' })
                          setDeleteConfirmOpen(true)
                        }}
                        className="p-1.5 hover:bg-rose-950/40 text-rose-400 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Universal Edit / Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Edit ${activeTab.slice(0, -1)}` : `Create ${activeTab.slice(0, -1)}`}
        description={`Manage ${activeTab} content for the website`}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Brand Fields */}
          {activeTab === 'brands' && (
            <>
              <Input label="Brand Name *" name="name" defaultValue={editingItem?.name || ''} required />
              <Input label="Country of Origin" name="country" defaultValue={editingItem?.country || ''} placeholder="e.g. Switzerland" />
              <Input label="Year Established" name="established" defaultValue={editingItem?.established || ''} placeholder="e.g. 1853" />
              <Input label="Brand Tagline" name="tagline" defaultValue={editingItem?.tagline || ''} placeholder="e.g. Innovators by Tradition" />
              <div>
                <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Brand Showcase Image URL</label>
                <div className="flex gap-2">
                  <Input name="hero_image" defaultValue={editingItem?.hero_image || ''} placeholder="https://..." className="flex-1" />
                  <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-2 bg-[#1F1E1A] border border-[#2A261F] rounded-xl text-xs font-medium text-[#C9A45C] hover:border-[#C9A45C]">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQuickUpload(e, 'hero_image')} />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Brand Description</label>
                <textarea name="description" defaultValue={editingItem?.description || ''} rows={3} className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl text-xs text-[#F3EFE6] outline-none" />
              </div>
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="is_featured" defaultChecked={editingItem ? editingItem.is_featured : true} className="accent-[#C9A45C]" />
                  <span className="text-xs text-[#F3EFE6]">Featured Brand</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="is_active" defaultChecked={editingItem ? editingItem.is_active : true} className="accent-[#C9A45C]" />
                  <span className="text-xs text-[#F3EFE6]">Visible on Website</span>
                </label>
              </div>
            </>
          )}

          {/* Category Fields */}
          {activeTab === 'categories' && (
            <>
              <Input label="Category Name *" name="name" defaultValue={editingItem?.name || ''} required />
              <Input label="URL Slug *" name="slug" defaultValue={editingItem?.slug || ''} placeholder="e.g. analog-watches" required />
              <Input label="Category Tagline" name="tagline" defaultValue={editingItem?.tagline || ''} placeholder="e.g. Timeless Mechanical Craft" />
              <div>
                <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Category Image URL</label>
                <div className="flex gap-2">
                  <Input name="image_url" defaultValue={editingItem?.image_url || ''} placeholder="https://..." className="flex-1" />
                  <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-2 bg-[#1F1E1A] border border-[#2A261F] rounded-xl text-xs font-medium text-[#C9A45C] hover:border-[#C9A45C]">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQuickUpload(e, 'image_url')} />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Description</label>
                <textarea name="description" defaultValue={editingItem?.description || ''} rows={3} className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl text-xs text-[#F3EFE6] outline-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input type="checkbox" name="is_active" defaultChecked={editingItem ? editingItem.is_active : true} className="accent-[#C9A45C]" />
                <span className="text-xs text-[#F3EFE6]">Active Category</span>
              </label>
            </>
          )}

          {/* Offer Fields */}
          {activeTab === 'offers' && (
            <>
              <Input label="Offer Campaign Title *" name="title" defaultValue={editingItem?.title || ''} required />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Badge Text" name="badge" defaultValue={editingItem?.badge || 'SPECIAL OFFER'} />
                <Input label="Discount Headline" name="discount" defaultValue={editingItem?.discount || 'UP TO 20% OFF'} />
              </div>
              <Input label="Promo Voucher Code" name="code" defaultValue={editingItem?.code || 'MEGHANI1984'} />
              <Input label="Validity Window" name="validity" defaultValue={editingItem?.validity || 'Valid until 31 Dec'} />
              <div>
                <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Offer Banner Image URL</label>
                <div className="flex gap-2">
                  <Input name="banner_image" defaultValue={editingItem?.banner_image || ''} placeholder="https://..." className="flex-1" />
                  <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-2 bg-[#1F1E1A] border border-[#2A261F] rounded-xl text-xs font-medium text-[#C9A45C] hover:border-[#C9A45C]">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQuickUpload(e, 'banner_image')} />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Terms & Conditions</label>
                <textarea name="terms" defaultValue={editingItem?.terms || ''} rows={2} className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl text-xs text-[#F3EFE6] outline-none" />
              </div>
            </>
          )}

          {/* Gallery Fields */}
          {activeTab === 'gallery' && (
            <>
              <Input label="Photo Title *" name="title" defaultValue={editingItem?.title || ''} required />
              <Input label="Category" name="category" defaultValue={editingItem?.category || 'Showroom'} placeholder="e.g. Store / Repair / Vintage" />
              <div>
                <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Photo Image URL *</label>
                <div className="flex gap-2">
                  <Input name="image_url" defaultValue={editingItem?.image_url || ''} placeholder="https://..." className="flex-1" required />
                  <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-2 bg-[#1F1E1A] border border-[#2A261F] rounded-xl text-xs font-medium text-[#C9A45C] hover:border-[#C9A45C]">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQuickUpload(e, 'image_url')} />
                  </label>
                </div>
              </div>
              <Input label="Caption" name="caption" defaultValue={editingItem?.caption || ''} />
            </>
          )}

          {/* Milestone Fields */}
          {activeTab === 'milestones' && (
            <>
              <Input label="Year *" name="year" defaultValue={editingItem?.year || '1984'} required />
              <Input label="Milestone Title *" name="title" defaultValue={editingItem?.title || ''} placeholder="e.g. Foundation of Meghani Watch Co." required />
              <div>
                <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Description</label>
                <textarea name="description" defaultValue={editingItem?.description || ''} rows={3} className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl text-xs text-[#F3EFE6] outline-none" required />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#2A261F]">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} className="shadow-gold">
              {editingItem ? 'Save Changes' : 'Publish to Website'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Content Entry"
        message="Are you sure you want to delete this item from the website?"
        confirmText="Confirm Delete"
        variant="danger"
      />
    </div>
  )
}
