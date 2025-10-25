'use client'

import React, { useState, useEffect, use } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Product, CartItem } from '@/types/database'
import { createClient } from '@/lib/supabase'
import { Search, Filter } from 'lucide-react'

interface CategoryPageProps {
  params: Promise<{
    category: string
  }>
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = use(params)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  
  const categoryName = resolvedParams.category.charAt(0).toUpperCase() + resolvedParams.category.slice(1)
  
  useEffect(() => {
    fetchProducts()
    loadCart()
  }, [resolvedParams.category])
  
  useEffect(() => {
    filterProducts()
  }, [products, searchTerm])
  
  const fetchProducts = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', resolvedParams.category)
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
    if (!searchTerm) {
      setFilteredProducts(products)
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProducts(filtered)
    }
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
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {categoryName} Products
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Discover our amazing {categoryName.toLowerCase()} collection
          </p>
        </div>
        
        {/* Search and Filter */}
        <Card className="mb-6 sm:mb-8 p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm sm:text-base"
              />
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{filteredProducts.length} products found</span>
            </div>
          </div>
        </Card>
        
        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-gray-500">
              <p className="text-lg mb-2">No products found</p>
              <p className="text-sm">
                {searchTerm ? 'Try adjusting your search terms' : 'No products available in this category'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
