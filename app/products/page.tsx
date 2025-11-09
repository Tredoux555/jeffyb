'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ProductCard } from '@/components/ProductCard'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Product, CartItem } from '@/types/database'
import { createClient } from '@/lib/supabase'
import { useCart } from '@/lib/hooks/useCart'
import { Search, Filter, Grid, List, Package } from 'lucide-react'

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const { addToCart } = useCart()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([])
  
  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])
  
  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, selectedCategory])
  
  const fetchProducts = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching products:', error)
        throw error
      }
      
      console.log('[Products Page] Fetched products:', data?.length || 0)
      console.log('[Products Page] Sample product:', data?.[0])
      setProducts(data || [])
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
      
      const categoryOptions = [
        { value: 'all', label: 'All Categories' },
        ...(data?.map(cat => ({
          value: cat.slug,
          label: cat.name
        })) || [])
      ]
      
      setCategories(categoryOptions)
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Fallback to hardcoded if database fails
      setCategories([
        { value: 'all', label: 'All Categories' },
        { value: 'gym', label: 'Gym' },
        { value: 'camping', label: 'Camping' },
        { value: 'kitchen', label: 'Kitchen' },
        { value: 'beauty', label: 'Beauty' },
        { value: 'baby-toys', label: 'Baby Toys' },
        { value: 'archery', label: 'Archery' }
      ])
    }
  }
  
  const filterProducts = () => {
    let filtered = products
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredProducts(filtered)
  }
  
  const handleAddToCart = async (product: Product) => {
    // If product has variants, redirect to detail page
    if (product.has_variants) {
      router.push(`/products/${product.id}`)
      return
    }
    
    try {
      const newItem: CartItem = {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: 1,
        image_url: product.images?.[0] || product.image_url || undefined
      }
      
      await addToCart(newItem)
      console.log('[Cart] Item added successfully:', product.name)
    } catch (error) {
      console.error('[Cart] Failed to add item:', error)
      alert('Failed to add item to cart. Please try again.')
    }
  }
  
  const handleViewDetails = (product: Product) => {
    // Navigate to product detail page
    router.push(`/products/${product.id}`)
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <Package className="w-12 h-12 text-green-500 animate-bounce" />
          </div>
          <p className="text-gray-700">Loading products...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            All Products
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Browse our complete collection of products
          </p>
        </div>
        
        {/* Filters */}
        <Card className="mb-6 sm:mb-8 p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm sm:text-base"
              />
            </div>
            
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jeffy-yellow focus:border-transparent text-sm sm:text-base"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              
              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 sm:p-3 ${viewMode === 'grid' ? 'bg-jeffy-yellow text-gray-900' : 'bg-white text-gray-600'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 sm:p-3 ${viewMode === 'list' ? 'bg-jeffy-yellow text-gray-900' : 'bg-white text-gray-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Results Count */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 pt-4 border-t border-gray-200 gap-3 sm:gap-0">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{filteredProducts.length} products found</span>
            </div>
            
            {/* Category Links */}
            <div className="flex flex-wrap gap-2">
              {categories.slice(1).map((category) => (
                <Link
                  key={category.value}
                  href={`/products/category/${category.value}`}
                  className="px-2 sm:px-3 py-1 text-xs bg-jeffy-yellow-light text-gray-700 rounded-full hover:bg-jeffy-yellow transition-colors"
                >
                  {category.label}
                </Link>
              ))}
            </div>
          </div>
        </Card>
        
        {/* Products Grid/List */}
        {filteredProducts.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-gray-500">
              <p className="text-lg mb-2">No products found</p>
              <p className="text-sm">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search terms or filters' 
                  : 'No products available'
                }
              </p>
            </div>
          </Card>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
              : 'space-y-3 sm:space-y-4'
          }>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
