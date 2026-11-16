'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import Breadcrumbs from '@/components/public/Breadcrumbs';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Shop / Catalogue' }]} />

      {/* Catalogue Header */}
      <div className="py-6 border-b border-[#221F1A]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs text-[#C9A04F] font-semibold uppercase tracking-[0.2em] block mb-1.5">
              The Curated Collection
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F0E6]">
              Timepiece Catalogue
            </h1>
            <p className="text-xs sm:text-sm text-[#8E877A] mt-2 max-w-xl">
              Explore authentic luxury wristwatches, automatic movements, and wall clocks purveyed by Meghani Watch Co.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-[#151515] border border-[#2A261F] rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${
                  viewMode === 'grid'
                    ? 'bg-[#221F1A] text-[#C9A04F]'
                    : 'text-[#8E877A] hover:text-white'
                }`}
                aria-label="Grid View"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${
                  viewMode === 'list'
                    ? 'bg-[#221F1A] text-[#C9A04F]'
                    : 'text-[#8E877A] hover:text-white'
                }`}
                aria-label="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Filter Trigger Button */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden px-4 py-2 rounded-lg bg-[#181818] border border-[#332E24] text-xs font-semibold uppercase tracking-wider text-[#F5F0E6] flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#C9A04F]" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Sort Row */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Quick Search Input */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-[#8E877A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by watch name, ref, or model..."
              className="w-full bg-[#151515] border border-[#2A261F] focus:border-[#C9A04F] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#F5F0E6] placeholder-[#6E685E] focus:outline-none transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E877A] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
            <span className="text-[#8E877A] hidden sm:inline">Sort:</span>
            <div className="relative w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto appearance-none bg-[#151515] border border-[#2A261F] text-[#F5F0E6] py-2.5 pl-4 pr-10 rounded-xl focus:border-[#C9A04F] focus:outline-none text-xs font-medium cursor-pointer"
              >
                <option value="featured">Featured Curations</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#8E877A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-3">
            <span className="text-[11px] text-[#8E877A] uppercase tracking-wider font-semibold mr-1">
              Active Filters:
            </span>

            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#1F1B14] border border-[#C9A04F]/40 text-[#DFC17B]">
                <span>Category: {selectedCategory}</span>
                <button
                  onClick={() => setSelectedCategory('')}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedBrand && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#1F1B14] border border-[#C9A04F]/40 text-[#DFC17B]">
                <span>Brand: {selectedBrand}</span>
                <button
                  onClick={() => setSelectedBrand('')}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedAvailability && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#1F1B14] border border-[#C9A04F]/40 text-[#DFC17B]">
                <span>Status: {selectedAvailability.replace('_', ' ')}</span>
                <button
                  onClick={() => setSelectedAvailability('')}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {search && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#1F1B14] border border-[#C9A04F]/40 text-[#DFC17B]">
                <span>Search: &ldquo;{search}&rdquo;</span>
                <button onClick={() => setSearch('')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-xs text-[#8E877A] hover:text-[#C9A04F] transition-colors ml-2 font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
          </div>
        )}
      </div>

      {/* Catalogue Layout: Sidebar + Product Grid */}
      <div className="py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block space-y-6 bg-[#131313] p-6 rounded-2xl border border-[#221F18] h-fit">
          <div className="flex items-center justify-between pb-4 border-b border-[#221F18]">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#F5F0E6] flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#C9A04F]" />
              Refine Curations
            </span>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-[11px] text-[#C9A04F] hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <h4 className="text-xs font-bold text-[#F5F0E6] uppercase tracking-wider mb-3">
              Timepiece Category
            </h4>
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setCurrentPage(1);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                  !selectedCategory
                    ? 'bg-[#C9A04F] text-[#101010] font-bold'
                    : 'text-[#9E9789] hover:bg-white/[0.03] hover:text-white'
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
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    selectedCategory === cat.id
                      ? 'bg-[#C9A04F] text-[#101010] font-bold'
                      : 'text-[#9E9789] hover:bg-white/[0.03] hover:text-white'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-75">{cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div className="pt-4 border-t border-[#221F18]">
            <h4 className="text-xs font-bold text-[#F5F0E6] uppercase tracking-wider mb-3">
              Authorized Brands
            </h4>
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setSelectedBrand('');
                  setCurrentPage(1);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  !selectedBrand
                    ? 'bg-[#C9A04F] text-[#101010] font-bold'
                    : 'text-[#9E9789] hover:bg-white/[0.03] hover:text-white'
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
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    selectedBrand === brand.name
                      ? 'bg-[#C9A04F] text-[#101010] font-bold'
                      : 'text-[#9E9789] hover:bg-white/[0.03] hover:text-white'
                  }`}
                >
                  <span>{brand.name}</span>
                  <span className="text-[10px] opacity-75">{brand.country}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Availability Filter */}
          <div className="pt-4 border-t border-[#221F18]">
            <h4 className="text-xs font-bold text-[#F5F0E6] uppercase tracking-wider mb-3">
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
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedAvailability === item.value
                      ? 'bg-[#C9A04F] text-[#101010] font-bold'
                      : 'text-[#9E9789] hover:bg-white/[0.03] hover:text-white'
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
          <div className="flex items-center justify-between text-xs text-[#8E877A] mb-6">
            <span>
              Showing <strong className="text-[#F5F0E6]">{products.length}</strong> of{' '}
              <strong className="text-[#F5F0E6]">{totalCount}</strong> timepieces
            </span>
          </div>

          {/* Loading Skeleton State */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-[#141414] rounded-xl border border-[#221F18] aspect-[3/4] animate-pulse p-4 flex flex-col justify-between"
                >
                  <div className="w-full h-44 bg-[#1C1C1C] rounded-lg" />
                  <div className="space-y-2 mt-4">
                    <div className="w-1/3 h-3 bg-[#222] rounded" />
                    <div className="w-3/4 h-5 bg-[#252525] rounded" />
                    <div className="w-full h-3 bg-[#1C1C1C] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Empty State */
            <div className="py-20 text-center bg-[#131313] rounded-2xl border border-[#221F18] p-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#1C1A16] border border-[#C9A04F]/30 flex items-center justify-center text-[#C9A04F] mb-4">
                <Watch className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#F5F0E6]">
                No matching timepieces found
              </h3>
              <p className="text-xs sm:text-sm text-[#8E877A] max-w-md mx-auto mt-2 leading-relaxed">
                We could not find any watches matching your selected filters. Try broadening your criteria or reset the search.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2.5 rounded-xl bg-[#C9A04F] text-[#101010] font-bold text-xs uppercase tracking-wider hover:bg-[#DFC17B] transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          ) : (
            /* Product Grid */
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 pt-8 border-t border-[#221F18] flex items-center justify-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-lg bg-[#151515] border border-[#2A261F] text-xs font-semibold text-[#D0C8B8] disabled:opacity-30 disabled:pointer-events-none hover:border-[#C9A04F]"
              >
                Previous
              </button>

              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                      currentPage === pageNum
                        ? 'bg-[#C9A04F] text-[#101010]'
                        : 'bg-[#151515] border border-[#2A261F] text-[#D0C8B8] hover:border-[#C9A04F]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 rounded-lg bg-[#151515] border border-[#2A261F] text-xs font-semibold text-[#D0C8B8] disabled:opacity-30 disabled:pointer-events-none hover:border-[#C9A04F]"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/80 backdrop-blur-md flex justify-end">
          <div className="w-4/5 max-w-sm bg-[#131313] h-full border-l border-[#26221A] p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#221F18]">
                <h3 className="font-serif text-lg font-bold text-[#F5F0E6]">
                  Filter Timepieces
                </h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 text-[#8E877A] hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Categories */}
              <div className="py-4 border-b border-[#221F18]">
                <h4 className="text-xs font-bold text-[#F5F0E6] uppercase tracking-wider mb-2">
                  Category
                </h4>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`w-full text-left py-1.5 text-xs ${
                      !selectedCategory ? 'text-[#C9A04F] font-bold' : 'text-[#8E877A]'
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
                          ? 'text-[#C9A04F] font-bold'
                          : 'text-[#8E877A]'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brands */}
              <div className="py-4 border-b border-[#221F18]">
                <h4 className="text-xs font-bold text-[#F5F0E6] uppercase tracking-wider mb-2">
                  Brand
                </h4>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedBrand('')}
                    className={`w-full text-left py-1.5 text-xs ${
                      !selectedBrand ? 'text-[#C9A04F] font-bold' : 'text-[#8E877A]'
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
                          ? 'text-[#C9A04F] font-bold'
                          : 'text-[#8E877A]'
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="py-4">
                <h4 className="text-xs font-bold text-[#F5F0E6] uppercase tracking-wider mb-2">
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
                          ? 'text-[#C9A04F] font-bold'
                          : 'text-[#8E877A]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#221F18] flex gap-2">
              <button
                onClick={handleClearFilters}
                className="flex-1 py-2.5 rounded-lg bg-[#221F18] text-xs font-semibold text-[#8E877A]"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-2.5 rounded-lg bg-[#C9A04F] text-[#101010] font-bold text-xs uppercase tracking-wider"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#C9A04F] border-t-transparent animate-spin" />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}

