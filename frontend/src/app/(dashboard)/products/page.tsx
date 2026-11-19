'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, Package, Edit, Trash2, Eye, Filter, 
  Grid3X3, List, SortAsc, Tag, Box, Sparkles, Upload,
  Image as ImageIcon, Sliders, ArrowRight, Loader2, CheckCircle2,
  Watch, ShieldCheck, AlertTriangle, Lock
} from 'lucide-react'
import { api } from '@/services/api'
import { Product } from '@/types'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import Badge, { StatusBadge } from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Modal, { ConfirmModal } from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import SortableHeader, { SortDirection } from '@/components/ui/SortableHeader'
import { useDebounce } from '@/hooks/useDebounce'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import ExportButton from '@/components/ui/ExportButton'
import BulkImport from '@/components/features/BulkImport'
import { productExportColumns } from '@/utils/export'

const schema = yup.object({
  name: yup.string().required('Product name is required'),
  brand: yup.string(),
  category: yup.string().required('Category is required'),
  cost_price: yup.number().required('Cost price is required').min(0),
  selling_price: yup.number().required('Selling price is required').min(0),
  stock: yup.number().required('Stock is required').min(0),
  barcode: yup.string().nullable(),
  supplier_name: yup.string(),
  description: yup.string(),
  warranty_months: yup.number().min(0).default(0),
  is_featured: yup.boolean().default(false),
  is_new_arrival: yup.boolean().default(false),
  price_visible: yup.boolean().default(true),
  image: yup.string().nullable(),
  movement: yup.string(),
  caseDiameter: yup.string(),
  caseMaterial: yup.string(),
  glass: yup.string(),
  waterResistance: yup.string(),
  strapMaterial: yup.string(),
})

type FormData = yup.InferType<typeof schema>

const categories = [
  { value: 'analog', label: 'Analog Watch' },
  { value: 'digital', label: 'Digital Watch' },
  { value: 'smart', label: 'Smartwatch' },
  { value: 'wall', label: 'Wall Clock' },
  { value: 'accessory', label: 'Accessories' },
]

export default function ProductsPage() {
  const { user } = useAuth()
  const isManagement = user?.role === 'admin' || user?.role === 'manager'

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  
  // Sorting state
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  // Debounce search
  const debouncedSearch = useDebounce(search, 300)
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Tab and form state
  type FormTab = 'general' | 'media' | 'specs'
  const [activeModalTab, setActiveModalTab] = useState<FormTab>('general')
  const [availableBrands, setAvailableBrands] = useState<{ id: number; name: string }[]>([])
  const [isCustomBrand, setIsCustomBrand] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { category: 'analog', stock: 0, warranty_months: 24, cost_price: 0, selling_price: 0 }
  })

  // Watched form values for live preview
  const watchedCost = watch('cost_price') || 0
  const watchedSelling = watch('selling_price') || 0
  const watchedImage = watch('image') || ''
  const liveProfit = Number(watchedSelling) - Number(watchedCost)
  const liveMargin = Number(watchedCost) > 0 ? ((liveProfit / Number(watchedCost)) * 100).toFixed(1) : '0'

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      const res = await api.get('/brands/')
      const items = Array.isArray(res.data) ? res.data : (res.data?.results || [])
      setAvailableBrands(items)
    } catch (e) {
      console.error('Failed to fetch brands:', e)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, category, sortField, sortDirection])

  useEffect(() => {
    fetchProducts()
  }, [debouncedSearch, category, currentPage, pageSize, sortField, sortDirection])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (category) params.append('category', category)
      params.append('page', currentPage.toString())
      params.append('page_size', pageSize.toString())
      
      if (sortField && sortDirection) {
        const ordering = sortDirection === 'desc' ? `-${sortField}` : sortField
        params.append('ordering', ordering)
      }
      
      const response = await api.get(`/products/?${params.toString()}`)
      const data = response.data
      
      if (data.results) {
        setProducts(data.results)
        setTotalItems(data.count || 0)
        setTotalPages(Math.ceil((data.count || 0) / pageSize))
      } else {
        setProducts(data)
        setTotalItems(data.length)
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSort = useCallback((field: string, direction: SortDirection) => {
    setSortField(field)
    setSortDirection(direction)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }, [])

  const openAddModal = () => {
    setSelectedProduct(null)
    setActiveModalTab('general')
    setIsCustomBrand(false)
    setShowUrlInput(false)
    reset({
      category: 'analog',
      stock: 0,
      warranty_months: 24,
      name: '',
      brand: availableBrands[0]?.name || '',
      barcode: '',
      supplier_name: '',
      description: '',
      cost_price: 0,
      selling_price: 0,
      is_featured: false,
      is_new_arrival: false,
      price_visible: true,
      image: '',
      movement: '',
      caseDiameter: '',
      caseMaterial: '',
      glass: '',
      waterResistance: '',
      strapMaterial: ''
    })
    setShowFormModal(true)
  }

  const openEditModal = (product: Product) => {
    setSelectedProduct(product)
    setActiveModalTab('general')
    const brandMatches = availableBrands.some(b => b.name.toLowerCase() === (product.brand || '').toLowerCase())
    setIsCustomBrand(!brandMatches && Boolean(product.brand))
    setShowUrlInput(Boolean(product.image?.startsWith('http')))
    reset({
      ...product,
      is_featured: product.is_featured ?? false,
      is_new_arrival: product.is_new_arrival ?? false,
      price_visible: product.price_visible ?? true,
      movement: product.specifications?.movement || '',
      caseDiameter: product.specifications?.caseDiameter || '',
      caseMaterial: product.specifications?.caseMaterial || '',
      glass: product.specifications?.glass || '',
      waterResistance: product.specifications?.waterResistance || '',
      strapMaterial: product.specifications?.strapMaterial || '',
    })
    setShowFormModal(true)
  }

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'meghani-products')

    setIsUploadingImage(true)
    try {
      const res = await api.post('/upload/image/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (res.data?.url) {
        setValue('image', res.data.url)
        toast.success('Image uploaded successfully')
      } else {
        toast.error('Upload did not return an image URL')
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      toast.error(err.response?.data?.error || 'Failed to upload image')
    } finally {
      setIsUploadingImage(false)
      if (e.target) e.target.value = ''
    }
  }

  const onFormError = (formErrors: any) => {
    if (formErrors.name || formErrors.cost_price || formErrors.selling_price || formErrors.stock || formErrors.category) {
      setActiveModalTab('general')
      toast.error('Please complete required fields in General & Pricing')
    }
  }

  const openViewModal = (product: Product) => {
    setSelectedProduct(product)
    setShowViewModal(true)
  }

  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product)
    setShowDeleteModal(true)
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const specs: Record<string, string> = { ...(selectedProduct?.specifications || {}) }
      if (data.movement) specs.movement = data.movement
      if (data.caseDiameter) specs.caseDiameter = data.caseDiameter
      if (data.caseMaterial) specs.caseMaterial = data.caseMaterial
      if (data.glass) specs.glass = data.glass
      if (data.waterResistance) specs.waterResistance = data.waterResistance
      if (data.strapMaterial) specs.strapMaterial = data.strapMaterial

      const payload: any = {
        name: data.name,
        brand: data.brand || '',
        category: data.category,
        cost_price: data.cost_price,
        selling_price: data.selling_price,
        stock: data.stock,
        barcode: data.barcode || null,
        supplier_name: data.supplier_name || '',
        description: data.description || '',
        warranty_months: data.warranty_months || 0,
        is_featured: Boolean(data.is_featured),
        is_new_arrival: Boolean(data.is_new_arrival),
        price_visible: Boolean(data.price_visible),
        image: data.image || null,
        specifications: specs
      }

      if (selectedProduct) {
        await api.patch(`/products/${selectedProduct.id}/`, payload)
        toast.success('Watch updated successfully')
      } else {
        await api.post('/products/', payload)
        toast.success('Watch added successfully')
      }
      setShowFormModal(false)
      fetchProducts()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save watch')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedProduct) return
    try {
      await api.delete(`/products/${selectedProduct.id}/`)
      toast.success('Watch deleted successfully')
      setShowDeleteModal(false)
      fetchProducts()
    } catch (error) {
      toast.error('Failed to delete watch')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#171613] border border-[#2A261F] rounded-xl flex items-center justify-center shadow-md">
              <Package className="w-5 h-5 text-[#C9A45C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-serif font-bold text-[#F3EFE6] tracking-tight">Watch Catalog & Inventory</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F1E1A] text-[#C9A45C] border border-[#2A261F] font-mono">
                  {totalItems} items
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#8D8980]">Manage watches, clocks, accessories & stock inventory</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <ExportButton 
            data={products} 
            columns={productExportColumns} 
            filename={`meghani_inventory_${new Date().toISOString().split('T')[0]}`}
          />
          <Button 
            variant="secondary" 
            onClick={() => setShowImportModal(true)} 
            icon={<Upload className="w-4 h-4 text-[#C9A45C]" />}
            className="hidden sm:inline-flex"
          >
            Import CSV
          </Button>
          <Button 
            onClick={openAddModal} 
            icon={<Plus className="w-4 h-4" />} 
            className="flex-1 sm:flex-none shadow-gold"
          >
            <span>Add Watch</span>
          </Button>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-4 shadow-xl">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D8980] group-focus-within:text-[#C9A45C] transition-colors" />
            <input
              type="text"
              placeholder="Search by watch name, brand, model, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl 
                       text-[#F3EFE6] placeholder-[#8D8980]/70 text-sm
                       focus:border-[#C9A45C] focus:ring-1 focus:ring-[#C9A45C]
                       transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-2.5">
            {/* Category Filter */}
            <div className="w-48">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl 
                         text-[#F3EFE6] text-sm focus:border-[#C9A45C] focus:ring-1 focus:ring-[#C9A45C]
                         outline-none cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-[#171613] text-[#F3EFE6]">{cat.label}</option>
                ))}
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-[#12110F] border border-[#2A261F] rounded-xl p-1 flex-shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={clsx(
                  'p-2 rounded-lg transition-all',
                  viewMode === 'grid' 
                    ? 'bg-[#C9A45C] text-[#0B0B0A] shadow-sm font-semibold' 
                    : 'text-[#8D8980] hover:text-[#F3EFE6]'
                )}
                title="Grid View"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={clsx(
                  'p-2 rounded-lg transition-all hidden sm:block',
                  viewMode === 'list' 
                    ? 'bg-[#C9A45C] text-[#0B0B0A] shadow-sm font-semibold' 
                    : 'text-[#8D8980] hover:text-[#F3EFE6]'
                )}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-[#171613] rounded-2xl border border-[#2A261F] p-4 animate-pulse">
              <div className="h-44 bg-[#1F1E1A] rounded-xl mb-4"></div>
              <div className="h-3 w-20 bg-[#1F1E1A] rounded mb-2"></div>
              <div className="h-5 w-36 bg-[#1F1E1A] rounded mb-3"></div>
              <div className="h-6 w-24 bg-[#1F1E1A] rounded"></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#171613] rounded-2xl border border-[#2A261F] p-12 text-center"
        >
          <div className="w-16 h-16 mx-auto bg-[#1F1E1A] border border-[#2A261F] rounded-2xl flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-[#8D8980]" />
          </div>
          <h3 className="text-lg font-serif font-bold text-[#F3EFE6] mb-1">No Watches Found</h3>
          <p className="text-sm text-[#8D8980] mb-6">Try changing your search or add a new watch to inventory.</p>
          <Button onClick={openAddModal} icon={<Plus className="w-4 h-4" />}>
            Add Watch to Inventory
          </Button>
        </motion.div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence>
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
                className="group bg-[#171613] rounded-2xl border border-[#2A261F] hover:border-[#C9A45C]/50 overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Product Image Canvas */}
                  <div className="relative h-48 bg-[#12110F] border-b border-[#2A261F] flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Watch className="w-10 h-10 text-[#2A261F] group-hover:text-[#C9A45C]/50 transition-colors" />
                        <span className="text-[11px] text-[#8D8980]">No photo</span>
                      </div>
                    )}
                    
                    {/* Category pill */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 bg-[#0B0B0A]/85 backdrop-blur-md border border-[#2A261F] rounded-full text-[10px] font-medium text-[#E8D5A7]">
                        {categories.find(c => c.value === product.category)?.label || product.category}
                      </span>
                    </div>

                    {/* Stock status pill */}
                    <div className="absolute top-3 right-3">
                      {product.stock <= 0 ? (
                        <span className="px-2 py-0.5 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-full text-[10px] font-semibold">
                          Out of Stock
                        </span>
                      ) : product.is_low_stock || product.stock <= 3 ? (
                        <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-800 text-amber-300 rounded-full text-[10px] font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Low ({product.stock})</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-full text-[10px] font-mono">
                          {product.stock} in stock
                        </span>
                      )}
                    </div>

                    {/* Floating quick action buttons */}
                    <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openViewModal(product)}
                        className="p-2 bg-[#171613]/90 hover:bg-[#C9A45C] hover:text-[#0B0B0A] text-[#F3EFE6] border border-[#2A261F] rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-2 bg-[#171613]/90 hover:bg-[#C9A45C] hover:text-[#0B0B0A] text-[#F3EFE6] border border-[#2A261F] rounded-lg transition-colors"
                        title="Edit Record"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Product Metadata */}
                  <div className="p-4">
                    <p className="text-xs font-semibold text-[#C9A45C] uppercase tracking-wider mb-1 truncate">
                      {product.brand || 'Watch'}
                    </p>
                    <h3 className="font-serif font-bold text-[#F3EFE6] text-base line-clamp-1 group-hover:text-[#E8D5A7] transition-colors">
                      {product.name}
                    </h3>
                    {product.barcode && (
                      <p className="text-[11px] font-mono text-[#8D8980] mt-0.5 truncate">
                        SKU: {product.barcode}
                      </p>
                    )}
                    
                    {/* Pricing Grid */}
                    <div className="mt-4 pt-3 border-t border-[#2A261F] flex items-end justify-between">
                      <div>
                        <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Selling Price</span>
                        <p className="text-xl font-bold font-mono text-[#C9A45C]">{formatCurrency(product.selling_price)}</p>
                      </div>

                      {/* RBAC Protected Cost / Profit */}
                      <div className="text-right">
                        <span className="text-[10px] text-[#8D8980] uppercase tracking-wider block">Cost / Profit</span>
                        {isManagement ? (
                          <div>
                            <p className="text-xs font-mono text-[#8D8980]">
                              CP: {formatCurrency(product.cost_price)}
                            </p>
                            <p className="text-xs font-mono font-semibold text-emerald-400">
                              +{formatCurrency(product.profit_margin || (product.selling_price - product.cost_price))}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1 text-[11px] text-[#8D8980] font-mono">
                            <Lock className="w-3 h-3 text-[#C9A45C]" />
                            <span>Confidential</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock Bar & Actions */}
                <div className="px-4 pb-4 pt-2 border-t border-[#2A261F]/60">
                  <div className="flex items-center justify-between text-xs text-[#8D8980] mb-1.5">
                    <span>Stock Level</span>
                    <span className="font-mono text-[#F3EFE6] font-medium">{product.stock} units</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#12110F] rounded-full overflow-hidden border border-[#2A261F]">
                    <div 
                      className={clsx(
                        'h-full rounded-full transition-all',
                        product.stock > 10 ? 'bg-emerald-500' :
                        product.stock > 3 ? 'bg-amber-500' : 'bg-rose-500'
                      )}
                      style={{ width: `${Math.min((product.stock / 25) * 100, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-2">
                    <button
                      onClick={() => openViewModal(product)}
                      className="flex-1 py-1.5 text-xs text-[#8D8980] hover:text-[#F3EFE6] bg-[#1F1E1A] hover:bg-[#2A261F] border border-[#2A261F] rounded-lg transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => openEditModal(product)}
                      className="flex-1 py-1.5 text-xs text-[#C9A45C] hover:text-[#0B0B0A] bg-[#C9A45C]/10 hover:bg-[#C9A45C] border border-[#C9A45C]/30 rounded-lg transition-colors font-medium"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* Table View */
        <div className="bg-[#171613] rounded-2xl border border-[#2A261F] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-[#12110F] border-b border-[#2A261F]">
                <tr>
                  <th className="px-5 py-3.5 text-left">
                    <SortableHeader label="Watch & Brand" field="name" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-left">
                    <SortableHeader label="Category" field="category" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-right">
                    <SortableHeader label="Selling Price" field="selling_price" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-right">
                    <span className="text-xs font-semibold text-[#8D8980] uppercase tracking-wider">
                      {isManagement ? 'Cost / Profit' : 'Profit Access'}
                    </span>
                  </th>
                  <th className="px-4 py-3.5 text-center">
                    <SortableHeader label="Stock" field="stock" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A261F]">
                {products.map((product, index) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-[#1F1E1A] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-[#12110F] border border-[#2A261F] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {product.image ? (
                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Watch className="w-5 h-5 text-[#8D8980]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-serif font-bold text-[#F3EFE6] text-sm truncate">{product.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-medium text-[#C9A45C]">{product.brand || 'Unbranded'}</span>
                            {product.barcode && (
                              <span className="text-[11px] font-mono text-[#8D8980]">| {product.barcode}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 bg-[#1F1E1A] border border-[#2A261F] text-[#E8D5A7] rounded-full text-xs">
                        {categories.find(c => c.value === product.category)?.label || product.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <p className="font-mono font-bold text-[#C9A45C] text-sm">{formatCurrency(product.selling_price)}</p>
                      {product.warranty_months ? (
                        <p className="text-[10px] text-[#8D8980]">{product.warranty_months}M Warranty</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {isManagement ? (
                        <div>
                          <p className="text-xs font-mono text-[#8D8980]">CP: {formatCurrency(product.cost_price)}</p>
                          <p className="text-xs font-mono font-medium text-emerald-400">
                            +{formatCurrency(product.profit_margin || (product.selling_price - product.cost_price))}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 text-xs text-[#8D8980] font-mono">
                          <Lock className="w-3 h-3 text-[#C9A45C]" />
                          <span>Masked</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span className={clsx(
                          'font-mono font-bold text-sm',
                          product.stock > 10 ? 'text-emerald-400' :
                          product.stock > 3 ? 'text-amber-400' : 'text-rose-400'
                        )}>
                          {product.stock}
                        </span>
                        {product.stock <= 3 && (
                          <Badge variant="warning" size="sm">Low</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => openViewModal(product)} 
                          className="p-1.5 hover:bg-[#2A261F] text-[#8D8980] hover:text-[#F3EFE6] rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openEditModal(product)} 
                          className="p-1.5 hover:bg-[#C9A45C]/15 text-[#C9A45C] rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {isManagement && (
                          <button 
                            onClick={() => openDeleteModal(product)} 
                            className="p-1.5 hover:bg-rose-950/40 text-rose-400 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && products.length > 0 && (
        <div className="bg-[#171613] rounded-xl border border-[#2A261F] p-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}

      {/* Add / Edit Timepiece Modal */}
      <Modal 
        isOpen={showFormModal} 
        onClose={() => setShowFormModal(false)} 
        title={selectedProduct ? 'Edit Watch' : 'Add New Watch'}
        description={selectedProduct ? `Editing details for ${selectedProduct.name}` : 'Add a new watch or product to inventory'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit, onFormError)} className="space-y-4">
          {/* Modal Tabs Header */}
          <div className="flex items-center gap-1.5 p-1 bg-[#12110F] border border-[#2A261F] rounded-xl">
            <button
              type="button"
              onClick={() => setActiveModalTab('general')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all",
                activeModalTab === 'general'
                  ? "bg-[#C9A45C] text-[#0B0B0A] shadow-md"
                  : "text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A]"
              )}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>1. General & Pricing</span>
              {(errors.name || errors.cost_price || errors.selling_price || errors.stock || errors.category) && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveModalTab('media')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all",
                activeModalTab === 'media'
                  ? "bg-[#C9A45C] text-[#0B0B0A] shadow-md"
                  : "text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A]"
              )}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>2. Product Photo</span>
              {watchedImage && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveModalTab('specs')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all",
                activeModalTab === 'specs'
                  ? "bg-[#C9A45C] text-[#0B0B0A] shadow-md"
                  : "text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A]"
              )}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>3. Technical Specifications</span>
            </button>
          </div>

          {/* TAB 1: General & Pricing */}
          {activeModalTab === 'general' && (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="sm:col-span-2">
                  <Input 
                    label="Watch Name *" 
                    placeholder="e.g. Tissot PRX Powermatic 80 Blue Dial" 
                    {...register('name')} 
                    error={errors.name?.message} 
                  />
                </div>

                {/* Brand Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-[#F3EFE6]">Brand</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomBrand(!isCustomBrand)
                        if (isCustomBrand) {
                          setValue('brand', availableBrands[0]?.name || '')
                        } else {
                          setValue('brand', '')
                        }
                      }}
                      className="text-xs text-[#C9A45C] hover:underline font-semibold"
                    >
                      {isCustomBrand ? "Select from list" : "+ Custom Brand"}
                    </button>
                  </div>
                  {isCustomBrand ? (
                    <Input 
                      placeholder="Type custom brand name" 
                      {...register('brand')} 
                    />
                  ) : (
                    <select
                      {...register('brand')}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomBrand(true)
                          setValue('brand', '')
                        } else {
                          setValue('brand', e.target.value)
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-sm text-[#F3EFE6]"
                    >
                      <option value="">Select a brand...</option>
                      {availableBrands.map((b) => (
                        <option key={b.id || b.name} value={b.name} className="bg-[#171613]">{b.name}</option>
                      ))}
                      <option value="__custom__" className="bg-[#171613] text-[#C9A45C]">+ Enter custom brand...</option>
                    </select>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Category *</label>
                  <select 
                    {...register('category')} 
                    className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-sm text-[#F3EFE6]"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value} className="bg-[#171613]">{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Barcode & Reference */}
                <div>
                  <Input 
                    label="Barcode / SKU Number" 
                    placeholder="Scan barcode or enter SKU" 
                    {...register('barcode')} 
                  />
                </div>

                {/* Supplier Name */}
                <div>
                  <Input 
                    label="Supplier / Vendor" 
                    placeholder="e.g. Swatch Group India Ltd" 
                    {...register('supplier_name')} 
                  />
                </div>

                {/* Cost Price - RBAC Protected */}
                <div>
                  <Input 
                    label="Cost Price (₹) *" 
                    type="number" 
                    step="any"
                    placeholder="0" 
                    disabled={!isManagement}
                    {...register('cost_price')} 
                    error={errors.cost_price?.message} 
                  />
                  {!isManagement && (
                    <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Cost price editing requires Manager permissions
                    </p>
                  )}
                </div>

                {/* Selling Price */}
                <div>
                  <Input 
                    label="Selling Price (₹) *" 
                    type="number" 
                    step="any"
                    placeholder="0" 
                    {...register('selling_price')} 
                    error={errors.selling_price?.message} 
                  />
                </div>

                {/* Real-time Profit & Margin Pill (Visible to Management) */}
                {isManagement && (
                  <div className="sm:col-span-2 p-3 bg-[#12110F] border border-[#2A261F] rounded-xl flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#8D8980]">Calculated Profit:</span>
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        "text-xs font-bold font-mono px-2.5 py-1 rounded-md border",
                        liveProfit >= 0 
                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/50" 
                          : "bg-rose-950/40 text-rose-400 border-rose-800/50"
                      )}>
                        Profit: {formatCurrency(liveProfit)}
                      </span>
                      <span className="text-xs font-mono text-[#8D8980]">
                        Markup: <strong className="text-[#F3EFE6]">{liveMargin}%</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Stock Quantity */}
                <div>
                  <Input 
                    label="Stock Quantity *" 
                    type="number" 
                    placeholder="0" 
                    {...register('stock')} 
                    error={errors.stock?.message} 
                  />
                </div>

                {/* Warranty */}
                <div>
                  <Input 
                    label="Warranty (Months)" 
                    type="number" 
                    placeholder="24" 
                    {...register('warranty_months')} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Photo & Story */}
          {activeModalTab === 'media' && (
            <div className="space-y-4 pt-1">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#F3EFE6]">Watch Photo</label>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-xs text-[#C9A45C] hover:underline font-medium"
                  >
                    {showUrlInput ? "Upload local file" : "Paste external web link"}
                  </button>
                </div>

                {showUrlInput ? (
                  <div className="space-y-1.5">
                    <Input 
                      placeholder="https://images.example.com/tissot-prx.webp" 
                      {...register('image')} 
                    />
                    <p className="text-xs text-[#8D8980]">Direct link to product photo.</p>
                  </div>
                ) : (
                  <div>
                    {watchedImage ? (
                      <div className="p-4 border border-[#2A261F] rounded-2xl bg-[#12110F] flex items-center gap-4">
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#171613] border border-[#2A261F] flex-shrink-0">
                          <img 
                            src={watchedImage} 
                            alt="Product preview" 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none'
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#F3EFE6]">Photo Attached</p>
                          <p className="text-xs text-[#8D8980] truncate mt-0.5 font-mono">{watchedImage}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1F1E1A] border border-[#2A261F] hover:border-[#C9A45C]/40 rounded-lg text-xs font-semibold text-[#F3EFE6] transition-all">
                              <Upload className="w-3.5 h-3.5 text-[#C9A45C]" />
                              <span>Replace</span>
                              <input 
                                type="file" 
                                accept="image/png,image/jpeg,image/webp,image/avif" 
                                className="hidden" 
                                onChange={handleImageFileChange}
                                disabled={isUploadingImage}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setValue('image', '')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-950/40 border border-rose-800/40 rounded-lg text-xs font-semibold text-rose-300 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label className={clsx(
                        "border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all",
                        isUploadingImage 
                          ? "bg-[#C9A45C]/10 border-[#C9A45C] pointer-events-none" 
                          : "border-[#2A261F] bg-[#12110F]/60 hover:bg-[#12110F] hover:border-[#C9A45C]/50"
                      )}>
                        <input 
                          type="file" 
                          accept="image/png,image/jpeg,image/webp,image/avif" 
                          className="hidden" 
                          onChange={handleImageFileChange}
                          disabled={isUploadingImage}
                        />
                        {isUploadingImage ? (
                          <div className="py-2 flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 text-[#C9A45C] animate-spin" />
                            <p className="text-sm font-semibold text-[#C9A45C]">Uploading photo...</p>
                            <p className="text-xs text-[#8D8980]">Please wait...</p>
                          </div>
                        ) : (
                          <div className="py-2 flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-[#1F1E1A] border border-[#2A261F] flex items-center justify-center text-[#C9A45C] mb-1">
                              <Upload className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="text-sm font-bold text-[#C9A45C] hover:underline">Click to upload photo</span>
                              <span className="text-sm text-[#8D8980]"> or drag and drop</span>
                            </div>
                            <p className="text-xs text-[#8D8980]/80">PNG, JPG, WEBP or AVIF up to 5MB</p>
                          </div>
                        )}
                      </label>
                    )}
                  </div>
                )}
              </div>

              {/* Product Description */}
              <div>
                <label className="block text-xs font-semibold text-[#F3EFE6] mb-1.5">Description</label>
                <textarea 
                  {...register('description')} 
                  rows={4} 
                  placeholder="Enter watch description, materials, dial color, and features..."
                  className="w-full px-3.5 py-3 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-sm text-[#F3EFE6] resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: Website & Specs */}
          {activeModalTab === 'specs' && (
            <div className="space-y-4 pt-1">
              {/* Public Website Visibility Settings */}
              <div className="p-4 bg-[#12110F] border border-[#2A261F] rounded-xl space-y-3">
                <div>
                  <p className="text-xs font-bold text-[#C9A45C] uppercase tracking-wider">Website Display Badges</p>
                  <p className="text-xs text-[#8D8980] mt-0.5">Control how this watch is featured on the public website.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-start gap-3 p-3 bg-[#171613] border border-[#2A261F] rounded-xl cursor-pointer hover:border-[#C9A45C]/40 transition-colors">
                    <input 
                      type="checkbox" 
                      {...register('is_featured')} 
                      className="w-4 h-4 mt-0.5 accent-[#C9A45C]" 
                    />
                    <div>
                      <p className="text-xs font-bold text-[#F3EFE6]">Featured</p>
                      <p className="text-[11px] text-[#8D8980] mt-0.5">Show on homepage carousel</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-[#171613] border border-[#2A261F] rounded-xl cursor-pointer hover:border-[#C9A45C]/40 transition-colors">
                    <input 
                      type="checkbox" 
                      {...register('is_new_arrival')} 
                      className="w-4 h-4 mt-0.5 accent-[#C9A45C]" 
                    />
                    <div>
                      <p className="text-xs font-bold text-[#F3EFE6]">New Arrival</p>
                      <p className="text-[11px] text-[#8D8980] mt-0.5">Show as new arrival</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-[#171613] border border-[#2A261F] rounded-xl cursor-pointer hover:border-[#C9A45C]/40 transition-colors">
                    <input 
                      type="checkbox" 
                      {...register('price_visible')} 
                      className="w-4 h-4 mt-0.5 accent-[#C9A45C]" 
                    />
                    <div>
                      <p className="text-xs font-bold text-[#F3EFE6]">Display Price</p>
                      <p className="text-[11px] text-[#8D8980] mt-0.5">Uncheck for Price On Request</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="p-4 bg-[#12110F] border border-[#2A261F] rounded-xl space-y-3">
                <div>
                  <p className="text-xs font-bold text-[#E8D5A7] uppercase tracking-wider">Technical Specifications</p>
                  <p className="text-xs text-[#8D8980] mt-0.5">Specifications displayed on product details and receipts.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Input label="Movement" placeholder="e.g. Automatic / Quartz" {...register('movement')} />
                  <Input label="Case Diameter" placeholder="e.g. 40.5 mm" {...register('caseDiameter')} />
                  <Input label="Case Material" placeholder="e.g. Stainless Steel" {...register('caseMaterial')} />
                  <Input label="Glass / Crystal" placeholder="e.g. Sapphire Crystal / Mineral Glass" {...register('glass')} />
                  <Input label="Water Resistance" placeholder="e.g. 100m / 10 ATM" {...register('waterResistance')} />
                  <Input label="Strap / Belt" placeholder="e.g. Stainless Steel / Leather" {...register('strapMaterial')} />
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-[#2A261F]">
            <div className="text-xs text-[#8D8980]">
              <span>Section: </span>
              <strong className="text-[#C9A45C]">
                {activeModalTab === 'general' ? '1. General & Pricing' : activeModalTab === 'media' ? '2. Product Photo' : '3. Technical Specifications'}
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setShowFormModal(false)}
              >
                Cancel
              </Button>

              {activeModalTab !== 'specs' && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (activeModalTab === 'general') setActiveModalTab('media')
                    else if (activeModalTab === 'media') setActiveModalTab('specs')
                  }}
                  className="flex items-center gap-1"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}

              <Button 
                type="submit" 
                loading={isSubmitting}
                className="shadow-gold"
              >
                {selectedProduct ? 'Update Watch' : 'Save Watch'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Inspect View Modal */}
      <Modal 
        isOpen={showViewModal} 
        onClose={() => setShowViewModal(false)} 
        title="Watch Details" 
        size="md"
      >
        {selectedProduct && (
          <div className="space-y-5">
            {/* Header banner */}
            <div className="flex items-start gap-4 p-3.5 bg-[#12110F] border border-[#2A261F] rounded-xl">
              <div className="w-20 h-20 bg-[#171613] border border-[#2A261F] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                {selectedProduct.image ? (
                  <img src={selectedProduct.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Watch className="w-8 h-8 text-[#C9A45C]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-[#C9A45C] uppercase tracking-wider">{selectedProduct.brand || 'Watch'}</span>
                <h3 className="text-lg font-serif font-bold text-[#F3EFE6] leading-tight truncate">{selectedProduct.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-full bg-[#1F1E1A] text-[#E8D5A7] border border-[#2A261F] text-[11px]">
                    {categories.find(c => c.value === selectedProduct.category)?.label || selectedProduct.category}
                  </span>
                  {selectedProduct.barcode && (
                    <span className="text-[11px] font-mono text-[#8D8980]">SKU: {selectedProduct.barcode}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Financial & Stock Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-[#12110F] border border-[#2A261F] rounded-xl">
              <div>
                <p className="text-[10px] text-[#8D8980] uppercase tracking-wider">Selling Price</p>
                <p className="font-mono font-bold text-[#C9A45C] text-base">{formatCurrency(selectedProduct.selling_price)}</p>
              </div>

              <div>
                <p className="text-[10px] text-[#8D8980] uppercase tracking-wider">Current Stock</p>
                <p className="font-mono font-bold text-[#F3EFE6] text-base">{selectedProduct.stock} units</p>
              </div>

              <div>
                <p className="text-[10px] text-[#8D8980] uppercase tracking-wider">Warranty</p>
                <p className="font-mono font-medium text-[#F3EFE6] text-sm">{selectedProduct.warranty_months} months</p>
              </div>

              {isManagement ? (
                <>
                  <div>
                    <p className="text-[10px] text-[#8D8980] uppercase tracking-wider">Cost Price</p>
                    <p className="font-mono text-sm text-[#8D8980]">{formatCurrency(selectedProduct.cost_price)}</p>
                  </div>

                  <div>
                    <p className="text-[10px] text-[#8D8980] uppercase tracking-wider">Gross Profit</p>
                    <p className="font-mono font-bold text-emerald-400 text-sm">
                      +{formatCurrency(selectedProduct.profit_margin || (selectedProduct.selling_price - selectedProduct.cost_price))}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-[#8D8980] uppercase tracking-wider">Supplier</p>
                    <p className="text-xs text-[#F3EFE6] truncate">{selectedProduct.supplier_name || 'Direct'}</p>
                  </div>
                </>
              ) : (
                <div className="col-span-3 p-2 bg-[#1F1E1A] rounded-lg border border-[#2A261F] flex items-center gap-2 text-xs text-[#8D8980]">
                  <Lock className="w-3.5 h-3.5 text-[#C9A45C]" />
                  <span>Cost price and profit are protected under Staff role permissions.</span>
                </div>
              )}
            </div>

            {/* Specifications List */}
            {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 && (
              <div className="p-4 bg-[#12110F] border border-[#2A261F] rounded-xl space-y-2">
                <p className="text-xs font-semibold text-[#E8D5A7] uppercase tracking-wider">Technical Specifications</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                    value ? (
                      <div key={key} className="p-2 bg-[#171613] rounded border border-[#2A261F]">
                        <span className="text-[#8D8980] capitalize block text-[10px]">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-medium text-[#F3EFE6]">{String(value)}</span>
                      </div>
                    ) : null
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {selectedProduct.description && (
              <div className="p-3.5 bg-[#12110F] border border-[#2A261F] rounded-xl">
                <p className="text-xs font-semibold text-[#8D8980] uppercase tracking-wider mb-1">Product Description</p>
                <p className="text-xs text-[#F3EFE6]/80 leading-relaxed">{selectedProduct.description}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#2A261F]">
              <Button variant="secondary" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
              <Button 
                onClick={() => { 
                  setShowViewModal(false)
                  openEditModal(selectedProduct)
                }}
              >
                <Edit className="w-4 h-4 mr-1.5" />
                Edit Watch
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Watch"
        message={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
        confirmText="Delete Watch"
        variant="danger"
      />

      {/* Bulk Import Modal */}
      <BulkImport
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          fetchProducts()
          setShowImportModal(false)
        }}
        type="products"
      />
    </div>
  )
}
