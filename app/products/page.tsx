'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProductCard } from '@/components/ProductCard'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Product, CartItem } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { Search, Filter, Grid, List } from 'lucide-react'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'gym', label: 'Gym' },
    { value: 'camping', label: 'Camping' },
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'beauty', label: 'Beauty' }
  ]
  
  useEffect(() => {
    fetchProducts()
    loadCart()
  }, [])
  
  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, selectedCategory])
  
  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const loadCart = () => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('jeffy-cart')
      if (savedCart) {
        setCart(JSON.parse(savedCart))
      }
    }
  }
  
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart)
    if (typeof window !== 'undefined') {
      localStorage.setItem('jeffy-cart', JSON.stringify(newCart))
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
  
  const handleAddToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product_id === product.id)
    
    if (existingItem) {
      const updatedCart = cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
      saveCart(updatedCart)
    } else {
      const newItem: CartItem = {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: 1,
        image_url: product.image_url || undefined
      }
      saveCart([...cart, newItem])
    }
  }
  
  const handleViewDetails = (product: Product) => {
    // TODO: Implement product detail modal/page
    console.log('View details for:', product.name)
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jeffy-grey mx-auto mb-4"></div>
          <p className="text-gray-700">Loading products...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            All Products
          </h1>
          <p className="text-gray-600">
            Browse our complete collection of products
          </p>
        </div>
        
        {/* Filters */}
        <Card className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jeffy-yellow focus:border-transparent"
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
                className={`p-3 ${viewMode === 'grid' ? 'bg-jeffy-yellow text-gray-900' : 'bg-white text-gray-600'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 ${viewMode === 'list' ? 'bg-jeffy-yellow text-gray-900' : 'bg-white text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Results Count */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              <span>{filteredProducts.length} products found</span>
            </div>
            
            {/* Category Links */}
            <div className="flex gap-2">
              {categories.slice(1).map((category) => (
                <Link
                  key={category.value}
                  href={`/products/${category.value}`}
                  className="px-3 py-1 text-xs bg-jeffy-yellow-light text-gray-700 rounded-full hover:bg-jeffy-yellow transition-colors"
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
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
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
