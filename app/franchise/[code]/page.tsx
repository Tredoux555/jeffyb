'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProductCard } from '@/components/ProductCard'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Product } from '@/types/database'
import { createClient } from '@/lib/supabase'
import { useCart } from '@/lib/hooks/useCart'
import { Search, Filter, Grid, List, Package, MapPin } from 'lucide-react'
import { Location } from '@/types/database'

export default function FranchiseProductsPage() {
  const params = useParams()
  const router = useRouter()
  const franchiseCode = params.code as string
  const [franchise, setFranchise] = useState<Location | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const { addToCart } = useCart()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([])
  
  useEffect(() => {
    fetchFranchise()
    fetchProducts()
    fetchCategories()
  }, [franchiseCode])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, selectedCategory])

  const fetchFranchise = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('franchise_code', franchiseCode)
        .eq('is_franchise', true)
        .eq('is_active', true)
        .single()
      
      if (error || !data) {
        router.push('/products') // Redirect to main products if franchise not found
        return
      }
      
      setFranchise(data)
    } catch (error) {
      console.error('Error fetching franchise:', error)
      router.push('/products')
    }
  }

  const fetchProducts = async () => {
    if (!franchise) return

    try {
      setLoading(true)
      const supabase = createClient()
      
      // Fetch products for this franchise location
      const { data: locationStock, error: stockError } = await supabase
        .from('location_stock')
        .select('product_id, variant_id, stock_quantity')
        .eq('location_id', franchise.id)
        .gt('stock_quantity', 0)

      if (stockError) {
        console.error('Error fetching location stock:', stockError)
      }

      // Get product IDs that have stock in this location
      const productIds = [...new Set(locationStock?.map(item => item.product_id) || [])]

      if (productIds.length === 0) {
        setProducts([])
        setLoading(false)
        return
      }

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (productsError) {
        console.error('Error fetching products:', productsError)
        throw productsError
      }

      // Filter products that have stock in this location
      const productsWithStock = (productsData || []).filter(product => {
        const hasStock = locationStock?.some(
          item => item.product_id === product.id && item.stock_quantity > 0
        )
        return hasStock
      })

      // Update product stock with location-specific stock
      const productsWithLocationStock = productsWithStock.map(product => {
        const stockItem = locationStock?.find(item => item.product_id === product.id && !item.variant_id)
        return {
          ...product,
          stock: stockItem?.stock_quantity || 0
        }
      })

      setProducts(productsWithLocationStock)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      
      const categoryOptions = data?.map(cat => ({
        value: cat.slug,
        label: cat.name
      })) || []
      
      setCategories(categoryOptions)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([
        { value: 'gym', label: 'Gym' },
        { value: 'camping', label: 'Camping' },
        { value: 'kitchen', label: 'Kitchen' },
        { value: 'beauty', label: 'Beauty' }
      ])
    }
  }
  
  const filterProducts = () => {
    let filtered = products
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }
    
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredProducts(filtered)
  }

  if (!franchise) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading franchise...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Franchise Header */}
        <Card className="mb-6 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-jeffy-yellow" />
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {franchise.franchise_name || franchise.name}
                </h1>
              </div>
              {franchise.city && (
                <p className="text-sm text-gray-600">{franchise.city}, {franchise.country}</p>
              )}
            </div>
            <Link href="/products" className="text-sm text-blue-600 hover:text-blue-800">
              View All Locations →
            </Link>
          </div>
        </Card>

        {/* Search and Filters */}
        <Card className="mb-6 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jeffy-yellow"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-jeffy-yellow' : 'bg-gray-100'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-jeffy-yellow' : 'bg-gray-100'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </Card>

        {/* Products Grid */}
        {loading ? (
          <Card className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading products...</p>
          </Card>
        ) : filteredProducts.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Available</h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory !== 'all'
                ? 'No products match your filters'
                : 'No products available at this franchise location'}
            </p>
          </Card>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
            : 'space-y-4'
          }>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={(p) => {
                  // Store franchise code in localStorage for checkout
                  if (franchiseCode) {
                    localStorage.setItem('jeffy-franchise-code', franchiseCode)
                    localStorage.setItem('jeffy-franchise-id', franchise?.id || '')
                  }
                  addToCart(p)
                }}
                onViewDetails={(p) => {
                  router.push(`/franchise/${franchiseCode}/products/${p.id}`)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

