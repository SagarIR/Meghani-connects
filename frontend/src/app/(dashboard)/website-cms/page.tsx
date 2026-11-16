'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Globe, MessageSquare, Tag, FolderTree, Gift, Image as ImageIcon, 
  Milestone, Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, 
  Clock, Phone, Mail, Calendar, Eye, ExternalLink, RefreshCw, Star, AlertCircle, Upload
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
      toast.error('Failed to load data')
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
      toast.error('Image must be under 5MB')
      return
    }
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'meghani-cms')
    
    const loadingToast = toast.loading('Uploading image...')
    try {
      const res = await api.post('/upload/image/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.dismiss(loadingToast)
      if (res.data?.url) {
        toast.success('Image uploaded successfully')
        const el = document.querySelector(`input[name="${inputName}"]`) as HTMLInputElement
        if (el) {
          el.value = res.data.url
        }
      }
    } catch (err) {
      toast.dismiss(loadingToast)
      toast.error('Failed to upload image')
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
      toast.error('Failed to update enquiry')
    }
  }

  // Handle Delete
  const confirmDelete = async () => {
    if (!itemToDelete) return
    try {
      const endpoint = `/${itemToDelete.type}/${itemToDelete.id}/`
      await api.delete(endpoint)
      toast.success('Item deleted successfully')
      setDeleteConfirmOpen(false)
      setItemToDelete(null)
      fetchData()
    } catch (err) {
      toast.error('Failed to delete item')
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
        toast.success('Updated successfully')
      } else {
        await api.post(endpoint, data)
        toast.success('Created successfully')
      }
      setIsModalOpen(false)
      setEditingItem(null)
      fetchData()
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.detail || 'Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  const newEnquiriesCount = enquiries.filter(e => e.status === 'new').length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-7 h-7 text-amber-600" />
            <h1 className="text-2xl font-bold text-gray-900">Website Content Management (CMS)</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage public website brands, categories, offers, gallery, milestones, and customer leads directly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={fetchData} icon={<RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />}>
            Refresh
          </Button>
          {activeTab !== 'enquiries' && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingItem(null)
                setIsModalOpen(true)
              }}
            >
              Add {activeTab.slice(0, -1)}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto border-b border-gray-200 bg-white rounded-t-xl px-4 pt-2 gap-2 shadow-sm">
        {[
          { id: 'enquiries', label: 'Customer Enquiries', icon: MessageSquare, badge: newEnquiriesCount > 0 ? newEnquiriesCount : undefined },
          { id: 'brands', label: 'Brands Portfolio', icon: Tag, count: brands.length },
          { id: 'categories', label: 'Watch Categories', icon: FolderTree, count: categories.length },
          { id: 'offers', label: 'Offers & Privileges', icon: Gift, count: offers.length },
          { id: 'gallery', label: 'Boutique Gallery', icon: ImageIcon, count: gallery.length },
          { id: 'milestones', label: 'Heritage Milestones', icon: Milestone, count: milestones.length },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                isActive
                  ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-lg'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg'
              )}
            >
              <Icon className={clsx('w-4 h-4', isActive ? 'text-amber-600' : 'text-gray-400')} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${activeTab}...`}
          className="w-full text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-xs text-gray-400 hover:text-gray-600">
            Clear
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm">Loading {activeTab} data...</p>
          </div>
        ) : (
          <>
            {/* 1. ENQUIRIES TAB */}
            {activeTab === 'enquiries' && (
              <div className="divide-y divide-gray-100">
                {enquiries.length === 0 ? (
                  <div className="py-16 text-center text-gray-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-base font-medium text-gray-700">No customer enquiries yet</p>
                    <p className="text-xs text-gray-400">Submissions from the public Contact & Viewing forms will appear here in real-time.</p>
                  </div>
                ) : (
                  enquiries
                    .filter(e => !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.phone.includes(search) || e.product_name.toLowerCase().includes(search.toLowerCase()))
                    .map((item) => (
                      <div key={item.id} className="p-5 hover:bg-gray-50/60 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-semibold text-gray-900 text-base">{item.name}</h3>
                              <span className={clsx(
                                'text-xs px-2.5 py-0.5 rounded-full font-medium uppercase tracking-wide',
                                item.status === 'new' && 'bg-amber-100 text-amber-800 border border-amber-300',
                                item.status === 'contacted' && 'bg-blue-100 text-blue-800 border border-blue-300',
                                item.status === 'converted' && 'bg-green-100 text-green-800 border border-green-300',
                                item.status === 'closed' && 'bg-gray-100 text-gray-700 border border-gray-300'
                              )}>
                                {item.status}
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {item.enquiry_type.replace('_', ' ').toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(item.created_at).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap pt-1">
                              <span className="flex items-center gap-1 font-mono">
                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                {item.phone}
                              </span>
                              {item.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                                  {item.email}
                                </span>
                              )}
                              {item.preferred_date && (
                                <span className="flex items-center gap-1 text-amber-700 font-medium">
                                  <Calendar className="w-3.5 h-3.5" />
                                  Date: {item.preferred_date}
                                </span>
                              )}
                              {item.product_name && (
                                <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-medium">
                                  Watch: {item.product_name}
                                </span>
                              )}
                            </div>

                            {item.message && (
                              <p className="text-sm text-gray-700 bg-gray-50 border border-gray-100 p-2.5 rounded-lg mt-2 italic">
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
                                className="text-xs border border-gray-200 rounded px-2.5 py-1 w-full max-w-md focus:border-amber-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                            <select
                              value={item.status}
                              onChange={(e) => updateEnquiryStatus(item.id, e.target.value as any)}
                              className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white font-medium focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="new">Mark as New</option>
                              <option value="contacted">Mark as Contacted</option>
                              <option value="converted">Mark as Converted</option>
                              <option value="closed">Mark as Closed</option>
                            </select>

                            <a
                              href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${item.name}, thank you for contacting Meghani Watch Co. regarding your watch inquiry.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 shadow-2xs transition"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>

                            <button
                              onClick={() => {
                                setItemToDelete({ id: item.id, type: 'enquiries' })
                                setDeleteConfirmOpen(true)
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold transition"
                              title="Delete Lead"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Delete</span>
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
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {brands
                  .filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.country.toLowerCase().includes(search.toLowerCase()))
                  .map((brand) => (
                    <div key={brand.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition flex flex-col bg-white">
                      <div className="h-28 bg-gray-100 relative overflow-hidden">
                        {brand.hero_image ? (
                          <img src={brand.hero_image} alt={brand.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Hero Image</div>
                        )}
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          {brand.is_featured && (
                            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow">
                              <Star className="w-3 h-3 fill-white" /> Featured
                            </span>
                          )}
                          <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full shadow', brand.is_active ? 'bg-green-600 text-white' : 'bg-gray-400 text-white')}>
                            {brand.is_active ? 'Active' : 'Hidden'}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 text-base">{brand.name}</h3>
                            <span className="text-xs text-gray-500">{brand.established ? `Est. ${brand.established}` : ''}</span>
                          </div>
                          <p className="text-xs text-amber-700 font-medium">{brand.country}</p>
                          {brand.tagline && <p className="text-xs text-gray-600 mt-1 italic">&ldquo;{brand.tagline}&rdquo;</p>}
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                          <span className="font-medium text-gray-600">{brand.count || 0} Watches</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingItem(brand)
                                setIsModalOpen(true)
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-lg shadow-2xs transition-all"
                              title="Edit Brand"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                setItemToDelete({ id: brand.id, type: 'brands' })
                                setDeleteConfirmOpen(true)
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all"
                              title="Delete Brand"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Delete</span>
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
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories
                  .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()))
                  .map((cat) => (
                    <div key={cat.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition flex flex-col bg-white">
                      <div className="h-28 bg-gray-100 relative">
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                        )}
                        <span className={clsx('absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow text-white', cat.is_active ? 'bg-green-600' : 'bg-gray-400')}>
                          {cat.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">{cat.name}</h3>
                          <p className="text-xs text-gray-400 font-mono">slug: {cat.slug}</p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{cat.description}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                          <span className="font-medium text-gray-600">{cat.count || 0} Watches</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingItem(cat)
                                setIsModalOpen(true)
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-lg shadow-2xs transition-all"
                              title="Edit Category"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                setItemToDelete({ id: cat.id, type: 'categories' })
                                setDeleteConfirmOpen(true)
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Delete</span>
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
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {offers
                  .filter(o => !search || o.title.toLowerCase().includes(search.toLowerCase()) || o.code.toLowerCase().includes(search.toLowerCase()))
                  .map((offer) => (
                    <div key={offer.id} className="border border-amber-200 bg-amber-50/30 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                            {offer.badge}
                          </span>
                          <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full text-white', offer.is_active ? 'bg-green-600' : 'bg-gray-400')}>
                            {offer.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mt-2">{offer.title}</h3>
                        <p className="text-2xl font-extrabold text-amber-600 mt-1">{offer.discount}</p>
                        <p className="text-xs text-gray-600 mt-2">{offer.description}</p>
                        {offer.code && (
                          <div className="mt-3 p-2 bg-white border border-dashed border-amber-300 rounded text-center">
                            <span className="text-xs text-gray-400">Coupon Code: </span>
                            <span className="font-mono font-bold text-gray-900 text-sm">{offer.code}</span>
                          </div>
                        )}
                        <p className="text-[11px] text-gray-400 mt-2">Validity: {offer.validity}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-end gap-2 text-xs">
                        <button
                          onClick={() => {
                            setEditingItem(offer)
                            setIsModalOpen(true)
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-lg shadow-2xs transition-all"
                          title="Edit Offer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setItemToDelete({ id: offer.id, type: 'offers' })
                            setDeleteConfirmOpen(true)
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all"
                          title="Delete Offer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* 5. GALLERY TAB */}
            {activeTab === 'gallery' && (
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {gallery
                  .filter(g => !search || g.title.toLowerCase().includes(search.toLowerCase()) || g.category.toLowerCase().includes(search.toLowerCase()))
                  .map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden group bg-white shadow-sm flex flex-col justify-between">
                      <div className="aspect-square bg-gray-100 relative overflow-hidden">
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                      </div>
                      <div className="p-3">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">{item.title}</h4>
                        {item.caption && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.caption}</p>}
                        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                          <button
                            onClick={() => {
                              setEditingItem(item)
                              setIsModalOpen(true)
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-2xs transition-all"
                            title="Edit Gallery Photo"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setItemToDelete({ id: item.id, type: 'gallery' })
                              setDeleteConfirmOpen(true)
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all"
                            title="Delete Gallery Photo"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* 6. MILESTONES TAB */}
            {activeTab === 'milestones' && (
              <div className="divide-y divide-gray-100 p-4">
                {milestones.map((m) => (
                  <div key={m.id} className="py-4 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-extrabold text-amber-600 font-mono">{m.year}</span>
                        <h3 className="font-bold text-gray-900 text-base">{m.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{m.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setEditingItem(m)
                          setIsModalOpen(true)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-lg shadow-2xs transition-all"
                        title="Edit Milestone"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          setItemToDelete({ id: m.id, type: 'milestones' })
                          setDeleteConfirmOpen(true)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all"
                        title="Delete Milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingItem(null)
        }}
        title={`${editingItem ? 'Edit' : 'Add New'} ${activeTab.slice(0, -1).toUpperCase()}`}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* BRAND FORM */}
          {activeTab === 'brands' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Brand Name *</label>
                <Input name="name" defaultValue={editingItem?.name || ''} required placeholder="e.g. Rolex" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Country of Origin</label>
                  <Input name="country" defaultValue={editingItem?.country || ''} placeholder="e.g. Switzerland" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Established Year</label>
                  <Input name="established" defaultValue={editingItem?.established || ''} placeholder="e.g. 1905" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tagline</label>
                <Input name="tagline" defaultValue={editingItem?.tagline || ''} placeholder="e.g. A Crown for Every Achievement" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700">Hero Banner Image</label>
                  <label className="cursor-pointer inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleQuickUpload(e, 'hero_image')}
                    />
                  </label>
                </div>
                <Input name="hero_image" defaultValue={editingItem?.hero_image || ''} placeholder="https://... or click Upload File above" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingItem?.description || ''}
                  rows={3}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:border-amber-500 focus:outline-none"
                  placeholder="Brand history and horological heritage..."
                />
              </div>
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                  <input type="checkbox" name="is_featured" defaultChecked={editingItem?.is_featured ?? true} className="rounded text-amber-600" />
                  Show in Featured Brands
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                  <input type="checkbox" name="is_active" defaultChecked={editingItem?.is_active ?? true} className="rounded text-amber-600" />
                  Active on Public Site
                </label>
              </div>
            </>
          )}

          {/* CATEGORY FORM */}
          {activeTab === 'categories' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category Name *</label>
                <Input name="name" defaultValue={editingItem?.name || ''} required placeholder="e.g. Tourbillon Masterpieces" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">URL Slug (leave blank to auto-generate)</label>
                <Input name="slug" defaultValue={editingItem?.slug || ''} placeholder="tourbillon" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tagline</label>
                <Input name="tagline" defaultValue={editingItem?.tagline || ''} placeholder="Gravity-Defying Precision" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700">Cover Image</label>
                  <label className="cursor-pointer inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleQuickUpload(e, 'image_url')}
                    />
                  </label>
                </div>
                <Input name="image_url" defaultValue={editingItem?.image_url || ''} placeholder="https://... or click Upload File above" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Key Features (comma-separated)</label>
                <Input name="features" defaultValue={editingItem?.features ? (Array.isArray(editingItem.features) ? editingItem.features.join(', ') : editingItem.features) : ''} placeholder="Swiss Escapement, Open-Heart Dial, Hand-Finished" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingItem?.description || ''}
                  rows={2}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                  <input type="checkbox" name="is_active" defaultChecked={editingItem?.is_active ?? true} className="rounded text-amber-600" />
                  Active on Public Site
                </label>
              </div>
            </>
          )}

          {/* OFFER FORM */}
          {activeTab === 'offers' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Offer Title *</label>
                <Input name="title" defaultValue={editingItem?.title || ''} required placeholder="e.g. Diwali Horology Special" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Badge Text</label>
                  <Input name="badge" defaultValue={editingItem?.badge || 'LIMITED PRIVILEGE'} placeholder="LIMITED" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Discount Headline *</label>
                  <Input name="discount" defaultValue={editingItem?.discount || ''} required placeholder="15% Off or Free Straps" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Coupon Code (optional)</label>
                  <Input name="code" defaultValue={editingItem?.code || ''} placeholder="MEGHANI15" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Validity Period</label>
                  <Input name="validity" defaultValue={editingItem?.validity || ''} placeholder="Valid till Nov 30" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingItem?.description || ''}
                  rows={2}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:border-amber-500 focus:outline-none"
                  placeholder="Offer details and inclusions..."
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700">Banner Image</label>
                  <label className="cursor-pointer inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleQuickUpload(e, 'banner_image')}
                    />
                  </label>
                </div>
                <Input name="banner_image" defaultValue={editingItem?.banner_image || ''} placeholder="https://... or click Upload File above" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Terms & Conditions</label>
                <Input name="terms" defaultValue={editingItem?.terms || ''} placeholder="Applicable on select Swiss automatics" />
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                  <input type="checkbox" name="is_active" defaultChecked={editingItem?.is_active ?? true} className="rounded text-amber-600" />
                  Active Offer
                </label>
              </div>
            </>
          )}

          {/* GALLERY FORM */}
          {activeTab === 'gallery' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Image Title *</label>
                <Input name="title" defaultValue={editingItem?.title || ''} required placeholder="e.g. Master Atelier Watchmaker" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    defaultValue={editingItem?.category || 'boutique'}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="boutique">The Vadodara Boutique</option>
                    <option value="craftsmanship">Craftsmanship & Movements</option>
                    <option value="timepieces">Iconic Timepieces</option>
                    <option value="heritage">Horological Heritage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Display Order</label>
                  <Input name="display_order" type="number" defaultValue={editingItem?.display_order || '0'} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700">Gallery Image *</label>
                  <label className="cursor-pointer inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleQuickUpload(e, 'image_url')}
                    />
                  </label>
                </div>
                <Input name="image_url" defaultValue={editingItem?.image_url || ''} required placeholder="https://... or click Upload File above" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Caption / Subtitle</label>
                <Input name="caption" defaultValue={editingItem?.caption || ''} placeholder="Precision diagnostic testing..." />
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                  <input type="checkbox" name="is_active" defaultChecked={editingItem?.is_active ?? true} className="rounded text-amber-600" />
                  Display in Public Gallery
                </label>
              </div>
            </>
          )}

          {/* MILESTONE FORM */}
          {activeTab === 'milestones' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Year *</label>
                  <Input name="year" defaultValue={editingItem?.year || ''} required placeholder="1984" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Milestone Title *</label>
                  <Input name="title" defaultValue={editingItem?.title || ''} required placeholder="The Foundation in Vadodara" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Historical Description</label>
                <textarea
                  name="description"
                  defaultValue={editingItem?.description || ''}
                  rows={3}
                  required
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:border-amber-500 focus:outline-none"
                  placeholder="Detail the significance of this milestone in the brand journey..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Order</label>
                <Input name="display_order" type="number" defaultValue={editingItem?.display_order || '0'} />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsModalOpen(false)
                setEditingItem(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={saving}
            >
              Save {activeTab.slice(0, -1)}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Delete"
        message="Are you sure you want to delete this item? This action will remove it from the public website immediately."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
