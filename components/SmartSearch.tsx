'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Search, 
  X, 
  Filter, 
  Loader2, 
  TrendingUp, 
  Clock,
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react'
import { Product } from '@/types/database'
import { useDebounce } from '@/lib/hooks/useDebounce'

interface SearchFilters {
  category: string
  priceMin: number
  priceMax: number
  inStock: boolean
}

interface SearchResult extends Product {
  highlight?: {
    name?: string
    description?: string
  }
}

const DEFAULT_FILTERS: SearchFilters = {
  category: '',
  priceMin: 0,
  priceMax: 10000,
  inStock: false
}

// Recent searches stored in localStorage
const RECENT_SEARCHES_KEY = 'jeffy-recent-searches'
const MAX_RECENT_SEARCHES = 5

export function SmartSearch() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([])

  const debouncedQuery = useDebounce(query, 300)

  // Load recent searches and categories on mount
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse recent searches')
      }
    }

    // Fetch categories
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchProducts(debouncedQuery, filters)
    } else {
      setResults([])
    }
  }, [debouncedQuery, filters])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowFilters(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const searchProducts = async (searchQuery: string, searchFilters: SearchFilters) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        ...(searchFilters.category && { category: searchFilters.category }),
        ...(searchFilters.priceMin > 0 && { minPrice: searchFilters.priceMin.toString() }),
        ...(searchFilters.priceMax < 10000 && { maxPrice: searchFilters.priceMax.toString() }),
        ...(searchFilters.inStock && { inStock: 'true' })
      })

      const response = await fetch(`/api/search?${params}`)
      const data = await response.json()

      if (data.success) {
        setResults(data.data || [])
      }
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const saveRecentSearch = (searchTerm: string) => {
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)]
      .slice(0, MAX_RECENT_SEARCHES)
    setRecentSearches(updated)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      saveRecentSearch(query.trim())
      router.push(`/products?search=${encodeURIComponent(query.trim())}`)
      setIsOpen(false)
    }
  }

  const handleResultClick = (product: SearchResult) => {
    saveRecentSearch(query.trim())
    setIsOpen(false)
    router.push(`/products/${product.id}`)
  }

  const handleRecentSearchClick = (term: string) => {
    setQuery(term)
    searchProducts(term, filters)
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text
    const regex = new RegExp(`(${query.trim()})`, 'gi')
    return text.replace(regex, '<mark class="bg-amber-200 rounded px-0.5">$1</mark>')
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="Search products... (Ctrl+K)"
            className="w-full pl-12 pr-24 py-3 bg-white border-2 border-gray-200 rounded-xl
                       focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100
                       text-gray-900 placeholder-gray-400 transition-all"
          />
          <div className="absolute right-3 flex items-center gap-2">
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setResults([])
                  inputRef.current?.focus()
                }}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-xl shadow-xl border border-gray-200 z-50 animate-scale-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-amber-400 focus:outline-none"
                >
                  <option value="">All</option>
                  {categories.map(cat => (
                    <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Min Price */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Min Price</label>
                <input
                  type="number"
                  value={filters.priceMin || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceMin: Number(e.target.value) || 0 }))}
                  placeholder="R0"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Max Price</label>
                <input
                  type="number"
                  value={filters.priceMax < 10000 ? filters.priceMax : ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceMax: Number(e.target.value) || 10000 }))}
                  placeholder="Any"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* In Stock Only */}
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={(e) => setFilters(prev => ({ ...prev, inStock: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-sm text-gray-700">In Stock Only</span>
                </label>
              </div>
            </div>

            {/* Reset Filters */}
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="mt-3 text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              Reset Filters
            </button>
          </div>
        )}
      </form>

      {/* Search Dropdown */}
      {isOpen && !showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 max-h-[70vh] overflow-y-auto animate-scale-in">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
            </div>
          )}

          {/* Results */}
          {!isLoading && results.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-500">
                  {results.length} result{results.length !== 1 ? 's' : ''} found
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {results.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleResultClick(product)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-amber-50 transition-colors text-left"
                  >
                    {/* Product Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {product.images?.[0] || product.image_url ? (
                        <Image
                          src={product.images?.[0] || product.image_url || ''}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          📦
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 
                        className="font-medium text-gray-900 truncate"
                        dangerouslySetInnerHTML={{ 
                          __html: highlightMatch(product.name, query) 
                        }}
                      />
                      <p 
                        className="text-sm text-gray-500 truncate"
                        dangerouslySetInnerHTML={{ 
                          __html: highlightMatch(product.description?.slice(0, 60) + '...' || '', query) 
                        }}
                      />
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold text-amber-600">R{product.price.toFixed(2)}</span>
                        {product.stock > 0 ? (
                          <span className="text-xs text-green-600">In Stock</span>
                        ) : (
                          <span className="text-xs text-red-500">Out of Stock</span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>

              {/* View All Results */}
              <div className="p-3 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={handleSubmit}
                  className="w-full py-2 text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center justify-center gap-1"
                >
                  View all results for "{query}"
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* No Results */}
          {!isLoading && query.length >= 2 && results.length === 0 && (
            <div className="py-8 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No products found for "{query}"</p>
              <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
            </div>
          )}

          {/* Recent Searches & Suggestions (when no query) */}
          {!isLoading && query.length < 2 && (
            <div>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Recent Searches
                    </span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="p-2">
                    {recentSearches.map((term, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(term)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left"
                      >
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending/Popular Categories */}
              <div>
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Popular Categories
                  </span>
                </div>
                <div className="p-3 flex flex-wrap gap-2">
                  {categories.slice(0, 6).map((category) => (
                    <Link
                      key={category.slug}
                      href={`/products/category/${category.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium
                                 hover:bg-amber-100 transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Compact search for mobile/header
export function CompactSearch({ onExpand }: { onExpand?: () => void }) {
  return (
    <button
      onClick={onExpand}
      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      aria-label="Search"
    >
      <Search className="w-5 h-5" />
    </button>
  )
}

