'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, Package, Edit, Trash2, Eye, Filter, 
  Grid3X3, List, SortAsc, Tag, Box, Sparkles, Upload
} from 'lucide-react'
import { api } from '@/services/api'
import { Product } from '@/types'
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
})

type FormData = yup.InferType<typeof schema>

const categories = [
  { value: 'analog', label: 'Analog Watch', icon: '⌚' },
  { value: 'digital', label: 'Digital Watch', icon: '🕐' },
  { value: 'smart', label: 'Smart Watch', icon: '📱' },
  { value: 'wall', label: 'Wall Clock', icon: '🕰️' },
  { value: 'accessory', label: 'Accessory', icon: '💎' },
]

export default function ProductsPage() {
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { category: 'analog', stock: 0, warranty_months: 0 }
  })

  // Reset to page 1 when filters change
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
    reset({ category: 'analog', stock: 0, warranty_months: 0, name: '', brand: '', barcode: '', supplier_name: '', description: '', cost_price: 0, selling_price: 0 })
    setShowFormModal(true)
  }

  const openEditModal = (product: Product) => {
    setSelectedProduct(product)
    reset(product)
    setShowFormModal(true)
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
      if (selectedProduct) {
        await api.patch(`/products/${selectedProduct.id}/`, data)
        toast.success('Product updated successfully')
      } else {
        await api.post('/products/', data)
        toast.success('Product created successfully')
      }
      setShowFormModal(false)
      fetchProducts()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Operation failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedProduct) return
    try {
      await api.delete(`/products/${selectedProduct.id}/`)
      toast.success('Product deleted')
      setShowDeleteModal(false)
      fetchProducts()
    } catch (error) {
      toast.error('Failed to delete product')
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 flex-shrink-0">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-500 text-xs sm:text-sm">Manage your product inventory</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 sm:gap-3"
        >
          <ExportButton 
            data={products} 
            columns={productExportColumns} 
            filename={`products_${new Date().toISOString().split('T')[0]}`}
          />
          <Button 
            variant="secondary" 
            onClick={() => setShowImportModal(true)} 
            icon={<Upload className="w-4 h-4" />}
            className="hidden sm:flex"
          >
            Import
          </Button>
          <Button onClick={openAddModal} icon={<Plus className="w-4 h-4" />} className="flex-1 sm:flex-none">
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </motion.div>
      </div>

      {/* Filters & Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-4 shadow-card"
      >
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex-1 relative group">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl 
                       text-gray-900 placeholder-gray-400 text-sm sm:text-base
                       focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                       transition-all duration-200 outline-none"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Category Filter */}
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl 
                         focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                         transition-all duration-200 outline-none cursor-pointer text-sm sm:text-base"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg sm:rounded-xl p-0.5 sm:p-1 flex-shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={clsx(
                  'p-2 sm:p-2.5 rounded-md sm:rounded-lg transition-all duration-200',
                  viewMode === 'grid' 
                    ? 'bg-white shadow-sm text-primary-600' 
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={clsx(
                  'p-2 sm:p-2.5 rounded-md sm:rounded-lg transition-all duration-200 hidden sm:block',
                  viewMode === 'list' 
                    ? 'bg-white shadow-sm text-primary-600' 
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Products */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-5 animate-pulse">
              <div className="h-28 sm:h-40 bg-gray-100 rounded-lg sm:rounded-xl mb-3 sm:mb-4"></div>
              <div className="h-3 sm:h-4 w-16 sm:w-20 bg-gray-100 rounded mb-2"></div>
              <div className="h-4 sm:h-5 w-24 sm:w-32 bg-gray-100 rounded mb-2 sm:mb-3"></div>
              <div className="h-5 sm:h-6 w-20 sm:w-24 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-10 sm:p-16 text-center shadow-card"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
            <Package className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No products found</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-6">Start by adding your first product to the inventory</p>
          <Button onClick={openAddModal} icon={<Plus className="w-4 h-4" />}>
            Add Your First Product
          </Button>
        </motion.div>
      ) : viewMode === 'grid' || (typeof window !== 'undefined' && window.innerWidth < 768) ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          <AnimatePresence>
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="group bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                {/* Product Image */}
                <div className="relative h-28 sm:h-44 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 sm:gap-2">
                      <Package className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300" />
                      <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">No image</span>
                    </div>
                  )}
                  
                  {/* Category badge */}
                  <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                    <span className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] sm:text-xs font-medium text-gray-700 shadow-sm">
                      {categories.find(c => c.value === product.category)?.label || product.category}
                    </span>
                  </div>

                  {/* Quick actions */}
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex gap-1 sm:gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-1.5 sm:p-2 bg-white/90 backdrop-blur-sm rounded-md sm:rounded-lg text-gray-600 hover:text-primary-600 hover:bg-white shadow-sm transition-all"
                    >
                      <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>

                  {/* Low stock indicator */}
                  {product.is_low_stock && (
                    <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3">
                      <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-warning-500/90 backdrop-blur-sm rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium text-white flex items-center gap-1 sm:gap-1.5">
                        <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span className="hidden sm:inline">Low Stock -</span> {product.stock} left
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-3 sm:p-5">
                  <p className="text-xs sm:text-sm font-medium text-primary-600 mb-0.5 sm:mb-1 truncate">{product.brand || 'Unbranded'}</p>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-1 group-hover:text-primary-600 transition-colors">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-end justify-between mt-2 sm:mt-4">
                    <div>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(product.selling_price)}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 line-through hidden sm:block">{formatCurrency(product.cost_price)}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-success-600">
                        +{formatCurrency(product.profit_margin || 0)}
                      </p>
                      <p className="text-xs text-gray-500">profit</p>
                    </div>
                  </div>

                  {/* Stock bar */}
                  <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs sm:text-sm mb-1 sm:mb-2">
                      <span className="text-gray-500">Stock</span>
                      <span className="font-semibold text-gray-900">{product.stock}</span>
                    </div>
                    <div className="w-full h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={clsx(
                          'h-full rounded-full transition-all',
                          product.stock > 20 ? 'bg-success-500' :
                          product.stock > 5 ? 'bg-warning-500' : 'bg-danger-500'
                        )}
                        style={{ width: `${Math.min((product.stock / 50) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Delete button - hidden on mobile */}
                  <button
                    onClick={() => openDeleteModal(product)}
                    className="hidden sm:block mt-4 w-full py-2.5 text-sm font-medium text-gray-500 hover:text-danger-600 hover:bg-danger-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4 inline mr-1.5" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* List/Table View - Hidden on mobile, shown on md+ */
        <div className="hidden md:block bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <SortableHeader label="Product" field="name" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <SortableHeader label="Category" field="category" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <SortableHeader label="Price" field="selling_price" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <SortableHeader label="Stock" field="stock" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product, index) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {product.image ? (
                            <img src={product.image} alt="" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Package className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{product.name}</p>
                          <p className="text-xs text-gray-500 truncate">{product.brand || 'Unbranded'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="gray">{product.category}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 text-sm">{formatCurrency(product.selling_price)}</p>
                      <p className="text-xs text-success-600">+{formatCurrency(product.profit_margin || 0)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          'font-semibold text-sm',
                          product.stock > 10 ? 'text-gray-900' : 'text-danger-600'
                        )}>
                          {product.stock}
                        </span>
                        {product.is_low_stock && <Badge variant="warning">Low</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openViewModal(product)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => openEditModal(product)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => openDeleteModal(product)} className="p-1.5 hover:bg-danger-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4 text-danger-500" />
                        </button>
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl border border-gray-100 shadow-sm"
        >
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </motion.div>
      )}

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={showFormModal} 
        onClose={() => setShowFormModal(false)} 
        title={selectedProduct ? 'Edit Product' : 'Add New Product'}
        description={selectedProduct ? 'Update product information' : 'Fill in the product details below'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
            <Input label="Product Name" placeholder="Enter product name" {...register('name')} error={errors.name?.message} />
            <Input label="Brand" placeholder="Enter brand name" {...register('brand')} />
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Category</label>
              <select {...register('category')} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm sm:text-base">
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <Input label="Barcode" placeholder="Scan or enter barcode" {...register('barcode')} />
            <Input label="Cost Price" type="number" placeholder="0" {...register('cost_price')} error={errors.cost_price?.message} />
            <Input label="Selling Price" type="number" placeholder="0" {...register('selling_price')} error={errors.selling_price?.message} />
            <Input label="Stock Quantity" type="number" placeholder="0" {...register('stock')} error={errors.stock?.message} />
            <Input label="Warranty (Months)" type="number" placeholder="0" {...register('warranty_months')} />
            <Input label="Supplier" placeholder="Supplier name" {...register('supplier_name')} className="sm:col-span-2" />
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Description</label>
              <textarea 
                {...register('description')} 
                rows={3} 
                placeholder="Product description..."
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all resize-none text-sm sm:text-base"
              />
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-5 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setShowFormModal(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
              {selectedProduct ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Product Details" size="md">
        {selectedProduct && (
          <div className="space-y-4 sm:space-y-6">
            {/* Product header */}
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                {selectedProduct.image ? (
                  <img src={selectedProduct.image} alt="" className="w-full h-full object-cover rounded-xl sm:rounded-2xl" />
                ) : (
                  <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-primary-600">{selectedProduct.brand || 'Unbranded'}</p>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{selectedProduct.name}</h3>
                <Badge variant="gray" className="mt-1 sm:mt-2">{selectedProduct.category}</Badge>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase mb-0.5 sm:mb-1">Cost</p>
                <p className="font-bold text-gray-900 text-sm sm:text-base">{formatCurrency(selectedProduct.cost_price)}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase mb-0.5 sm:mb-1">Selling</p>
                <p className="font-bold text-gray-900 text-sm sm:text-base">{formatCurrency(selectedProduct.selling_price)}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase mb-0.5 sm:mb-1">Stock</p>
                <p className="font-bold text-gray-900 text-sm sm:text-base">{selectedProduct.stock} units</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase mb-0.5 sm:mb-1">Profit</p>
                <p className="font-bold text-success-600 text-sm sm:text-base">{formatCurrency(selectedProduct.profit_margin || 0)}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase mb-0.5 sm:mb-1">Warranty</p>
                <p className="font-bold text-gray-900 text-sm sm:text-base">{selectedProduct.warranty_months} months</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase mb-0.5 sm:mb-1">Barcode</p>
                <p className="font-bold text-gray-900 font-mono text-xs sm:text-base truncate">{selectedProduct.barcode || '-'}</p>
              </div>
            </div>

            {selectedProduct.description && (
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase mb-1 sm:mb-2">Description</p>
                <p className="text-gray-700 text-sm sm:text-base">{selectedProduct.description}</p>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowViewModal(false)} className="w-full sm:w-auto">Close</Button>
              <Button onClick={() => { setShowViewModal(false); openEditModal(selectedProduct); }} className="w-full sm:w-auto">
                <Edit className="w-4 h-4 mr-1 sm:mr-2" />
                Edit
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
        title="Delete Product"
        message={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
        confirmText="Delete"
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
