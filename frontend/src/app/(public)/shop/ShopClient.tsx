'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  Watch,
  RotateCcw,
  ChevronDown
} from 'lucide-react';
import {
  PublicProduct,
  ProductCategory,
  AvailabilityStatus
} from '@/types/public';
import {
  PUBLIC_BRANDS,
  PUBLIC_CATEGORIES,
  getPublicProducts,
  ProductFilterParams
} from '@/services/publicCatalogue';
import ProductCard from '@/components/public/ProductCard';

const luxuryEase = [0.16, 1, 0.3, 1] as const;

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search and filter states initialized from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('category') || ''
  );
  const [selectedBrand, setSelectedBrand] = useState<string>(
    searchParams.get('brand') || ''
  );
  const [selectedAvailability, setSelectedAvailability] = useState<string>(
    searchParams.get('availability') || ''
  );
  const [sortBy, setSortBy] = useState<ProductFilterParams['sort']>(
    (searchParams.get('sort') as any) || 'featured'
  );
  const [minPrice, setMinPrice] = useState<string>(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState<string>(searchParams.get('maxPrice') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Sync state when URL params change
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('category') || '');
    setSelectedBrand(searchParams.get('brand') || '');
    setSelectedAvailability(searchParams.get('availability') || '');
    if (searchParams.get('sort')) {
      setSortBy(searchParams.get('sort') as any);
    }
  }, [searchParams]);

  // Fetch products
  useEffect(() => {
    let isCancelled = false;

    async function loadProducts() {
      setLoading(true);
      try {
        const res = await getPublicProducts({
          category: selectedCategory || undefined,
          brand: selectedBrand || undefined,
          availability: (selectedAvailability as AvailabilityStatus) || undefined,
          search: search || undefined,
          sort: sortBy,
          minPrice: minPrice ? parseFloat(minPrice) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
          page: currentPage,
          pageSize: 12,
        });

        if (!isCancelled) {
          setProducts(res.results);
          setTotalCount(res.count);
          setTotalPages(res.totalPages);
        }
      } catch (err) {
        console.error('Error loading catalogue:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      isCancelled = true;
    };
  }, [
    selectedCategory,
    selectedBrand,
    selectedAvailability,
    search,
    sortBy,
    minPrice,
    maxPrice,
    currentPage
  ]);

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedBrand('');
    setSelectedAvailability('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('featured');
    setCurrentPage(1);
    router.push('/shop');
  };

  const hasActiveFilters = Boolean(
    search || selectedCategory || selectedBrand || selectedAvailability || minPrice || maxPrice
  );

  return (
    <div>
      <div className="py-4 border-b border-[#2A261F] flex justify-end">
        <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-[#171613] border border-[#2A261F] rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#0B0B0A] text-[#C9A45C] shadow-sm'
                    : 'text-[#8D8980] hover:text-[#F3EFE6]'
                }`}
                aria-label="Grid View"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#0B0B0A] text-[#C9A45C] shadow-sm'
                    : 'text-[#8D8980] hover:text-[#F3EFE6]'
                }`}
                aria-label="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Filter Trigger Button */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden px-4 py-2 rounded-lg bg-[#171613] border border-[#2A261F] text-xs font-semibold uppercase tracking-wider text-[#F3EFE6] flex items-center gap-2 hover:border-[#C9A45C]/50 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#C9A45C]" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Sort Row */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Quick Search Input */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-[#8D8980] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by watch name, ref, or model..."
              className="w-full bg-[#171613] border border-[#2A261F] focus:border-[#C9A45C] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#F3EFE6] placeholder-[#8D8980]/60 focus:outline-none transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D8980] hover:text-[#F3EFE6]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
            <span className="text-[#8D8980] hidden sm:inline">Sort:</span>
            <div className="relative w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto appearance-none bg-[#171613] border border-[#2A261F] text-[#F3EFE6] py-2.5 pl-4 pr-10 rounded-xl focus:border-[#C9A45C] focus:outline-none text-xs font-medium cursor-pointer"
              >
                <option value="featured">Featured Curations</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#8D8980] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-3">
            <span className="text-[11px] text-[#8D8980] uppercase tracking-wider font-semibold mr-1">
              Active Filters:
            </span>

            <AnimatePresence>
              {selectedCategory && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#171613] border border-[#C9A45C]/40 text-[#E8D5A7]"
                >
                  <span>Category: {selectedCategory}</span>
                  <button
                    onClick={() => setSelectedCategory('')}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              )}

              {selectedBrand && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#171613] border border-[#C9A45C]/40 text-[#E8D5A7]"
                >
                  <span>Brand: {selectedBrand}</span>
                  <button
                    onClick={() => setSelectedBrand('')}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              )}

              {selectedAvailability && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#171613] border border-[#C9A45C]/40 text-[#E8D5A7]"
                >
                  <span>Status: {selectedAvailability.replace('_', ' ')}</span>
                  <button
                    onClick={() => setSelectedAvailability('')}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              )}

              {search && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#171613] border border-[#C9A45C]/40 text-[#E8D5A7]"
                >
                  <span>Search: &ldquo;{search}&rdquo;</span>
                  <button onClick={() => setSearch('')} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              )}
            </AnimatePresence>

            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-xs text-[#8D8980] hover:text-[#C9A45C] transition-colors ml-2 font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
          </div>
        )}

      {/* Catalogue Layout: Sidebar + Product Grid */}
      <div className="py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block space-y-6 bg-[#171613] p-6 rounded-2xl border border-[#2A261F] h-fit">
          <div className="flex items-center justify-between pb-4 border-b border-[#2A261F]">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#F3EFE6] flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#C9A45C]" />
              Refine Curations
            </span>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-[11px] text-[#C9A45C] hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <h4 className="text-xs font-bold text-[#F3EFE6] uppercase tracking-wider mb-3">
              Timepiece Category
            </h4>
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setCurrentPage(1);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                  !selectedCategory
                    ? 'bg-[#C9A45C] text-[#0B0B0A] font-bold shadow-sm'
                    : 'text-[#8D8980] hover:bg-white/[0.03] hover:text-[#F3EFE6]'
                }`}
              >
                <span>All Categories</span>
              </button>
              {PUBLIC_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id === selectedCategory ? '' : cat.id);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    selectedCategory === cat.id
                      ? 'bg-[#C9A45C] text-[#0B0B0A] font-bold shadow-sm'
                      : 'text-[#8D8980] hover:bg-white/[0.03] hover:text-[#F3EFE6]'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-75">{cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div className="pt-4 border-t border-[#2A261F]">
            <h4 className="text-xs font-bold text-[#F3EFE6] uppercase tracking-wider mb-3">
              Authorized Brands
            </h4>
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setSelectedBrand('');
                  setCurrentPage(1);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  !selectedBrand
                    ? 'bg-[#C9A45C] text-[#0B0B0A] font-bold shadow-sm'
                    : 'text-[#8D8980] hover:bg-white/[0.03] hover:text-[#F3EFE6]'
                }`}
              >
                All Brands
              </button>
              {PUBLIC_BRANDS.map((brand) => (
                <button
                  key={brand.slug}
                  onClick={() => {
                    setSelectedBrand(brand.name === selectedBrand ? '' : brand.name);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    selectedBrand === brand.name
                      ? 'bg-[#C9A45C] text-[#0B0B0A] font-bold shadow-sm'
                      : 'text-[#8D8980] hover:bg-white/[0.03] hover:text-[#F3EFE6]'
                  }`}
                >
                  <span>{brand.name}</span>
                  <span className="text-[10px] opacity-75">{brand.country}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Availability Filter */}
          <div className="pt-4 border-t border-[#2A261F]">
            <h4 className="text-xs font-bold text-[#F3EFE6] uppercase tracking-wider mb-3">
              Availability Status
            </h4>
            <div className="space-y-1.5">
              {[
                { label: 'All Allocations', value: '' },
                { label: 'In Stock', value: 'in_stock' },
                { label: 'Price on Request', value: 'on_request' },
                { label: 'Awaiting Allocation', value: 'out_of_stock' },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => {
                    setSelectedAvailability(item.value);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    selectedAvailability === item.value
                      ? 'bg-[#C9A45C] text-[#0B0B0A] font-bold shadow-sm'
                      : 'text-[#8D8980] hover:bg-white/[0.03] hover:text-[#F3EFE6]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {/* Header Stats */}
          <div className="flex items-center justify-between text-xs text-[#8D8980] mb-6">
            <span>
              Showing <strong className="text-[#F3EFE6]">{products.length}</strong> of{' '}
              <strong className="text-[#F3EFE6]">{totalCount}</strong> timepieces
            </span>
          </div>

          {/* Loading Skeleton State */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-b from-[#171613] to-[#0E0E0D] rounded-2xl border border-[#2A261F] aspect-[4/5] p-5 flex flex-col justify-between overflow-hidden relative shadow-lg"
                >
                  <div className="w-full h-56 bg-[#0B0B0A] rounded-xl border border-[#201D17] animate-pulse" />
                  <div className="space-y-2.5 mt-4">
                    <div className="w-1/3 h-2.5 bg-[#201D17] rounded animate-pulse" />
                    <div className="w-3/4 h-4 bg-[#2A261F] rounded animate-pulse" />
                    <div className="w-full h-3 bg-[#1A1814] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Empty State */
            <div className="py-20 text-center bg-[#171613] rounded-2xl border border-[#2A261F] p-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#0B0B0A] border border-[#C9A45C]/30 flex items-center justify-center text-[#C9A45C] mb-4">
                <Watch className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl font-normal text-[#F3EFE6]">
                No matching timepieces found
              </h3>
              <p className="text-xs sm:text-sm text-[#8D8980] max-w-md mx-auto mt-2 leading-relaxed">
                We could not find any watches matching your selected filters. Try broadening your criteria or reset the search.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2.5 rounded-xl bg-[#C9A45C] text-[#0B0B0A] font-semibold text-xs uppercase tracking-wider hover:bg-[#E8D5A7] transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          ) : (
            /* Product Grid with Layout Transition */
            <motion.div
              layout
              transition={{ duration: 0.35, ease: luxuryEase }}
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 pt-8 border-t border-[#2A261F] flex items-center justify-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-lg bg-[#171613] border border-[#2A261F] text-xs font-semibold text-[#8D8980] disabled:opacity-30 disabled:pointer-events-none hover:border-[#C9A45C] hover:text-[#F3EFE6] transition-colors"
              >
                Previous
              </button>

              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all ${
                      currentPage === pageNum
                        ? 'bg-[#C9A45C] text-[#0B0B0A] font-bold'
                        : 'bg-[#171613] border border-[#2A261F] text-[#8D8980] hover:border-[#C9A45C] hover:text-[#F3EFE6]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 rounded-lg bg-[#171613] border border-[#2A261F] text-xs font-semibold text-[#8D8980] disabled:opacity-30 disabled:pointer-events-none hover:border-[#C9A45C] hover:text-[#F3EFE6] transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 lg:hidden bg-black/80 backdrop-blur-md flex justify-end"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="w-4/5 max-w-sm bg-[#171613] h-full border-l border-[#2A261F] p-6 overflow-y-auto flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#2A261F]">
                  <h3 className="font-serif text-xl font-normal text-[#F3EFE6]">
                    Filter Timepieces
                  </h3>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1 text-[#8D8980] hover:text-[#F3EFE6]"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Categories */}
                <div className="py-4 border-b border-[#2A261F]">
                  <h4 className="text-xs font-bold text-[#F3EFE6] uppercase tracking-wider mb-2">
                    Category
                  </h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory('')}
                      className={`w-full text-left py-1.5 text-xs ${
                        !selectedCategory ? 'text-[#C9A45C] font-bold' : 'text-[#8D8980]'
                      }`}
                    >
                      All Categories
                    </button>
                    {PUBLIC_CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCategory(c.id)}
                        className={`w-full text-left py-1.5 text-xs ${
                          selectedCategory === c.id
                            ? 'text-[#C9A45C] font-bold'
                            : 'text-[#8D8980]'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brands */}
                <div className="py-4 border-b border-[#2A261F]">
                  <h4 className="text-xs font-bold text-[#F3EFE6] uppercase tracking-wider mb-2">
                    Brand
                  </h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedBrand('')}
                      className={`w-full text-left py-1.5 text-xs ${
                        !selectedBrand ? 'text-[#C9A45C] font-bold' : 'text-[#8D8980]'
                      }`}
                    >
                      All Brands
                    </button>
                    {PUBLIC_BRANDS.map((b) => (
                      <button
                        key={b.slug}
                        onClick={() => setSelectedBrand(b.name)}
                        className={`w-full text-left py-1.5 text-xs ${
                          selectedBrand === b.name
                            ? 'text-[#C9A45C] font-bold'
                            : 'text-[#8D8980]'
                        }`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div className="py-4">
                  <h4 className="text-xs font-bold text-[#F3EFE6] uppercase tracking-wider mb-2">
                    Status
                  </h4>
                  <div className="space-y-1">
                    {[
                      { label: 'All', value: '' },
                      { label: 'In Stock', value: 'in_stock' },
                      { label: 'Price on Request', value: 'on_request' },
                    ].map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setSelectedAvailability(s.value)}
                        className={`w-full text-left py-1.5 text-xs ${
                          selectedAvailability === s.value
                            ? 'text-[#C9A45C] font-bold'
                            : 'text-[#8D8980]'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2A261F] flex gap-2">
                <button
                  onClick={handleClearFilters}
                  className="flex-1 py-2.5 rounded-lg bg-[#0B0B0A] border border-[#2A261F] text-xs font-semibold text-[#8D8980] hover:text-[#F3EFE6] transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-1 py-2.5 rounded-lg bg-[#C9A45C] text-[#0B0B0A] font-bold text-xs uppercase tracking-wider hover:bg-[#E8D5A7] transition-colors"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ShopClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#C9A45C] border-t-transparent animate-spin" />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}

