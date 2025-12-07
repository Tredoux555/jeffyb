'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { createClient } from '@/lib/supabase'
import { ProductSEOOptimizer } from '@/lib/seo-product-optimizer'
import { 
  Search, 
  Sparkles, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  ChevronDown,
  ChevronUp,
  Eye,
  Edit2,
  Save,
  X
} from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  seo_title?: string
  meta_description?: string
  features?: string[]
  benefits?: string[]
  brand?: string
}

export default function SEOManagementPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [editedDescription, setEditedDescription] = useState('')
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, category, price, seo_title, meta_description, features, benefits, brand')
        .eq('is_active', true)
        .order('category')
        .order('name')

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      setMessage({ type: 'error', text: 'Failed to load products' })
    } finally {
      setLoading(false)
    }
  }

  const generateSEOForProduct = async (product: Product) => {
    setUpdating(product.id)
    try {
      // Safely prepare product data with null checks
      const seoData = ProductSEOOptimizer.generateComplete({
        name: product.name || 'Unnamed Product',
        category: product.category || 'general',
        price: product.price || 0,
        features: Array.isArray(product.features) ? product.features : [],
        benefits: Array.isArray(product.benefits) ? product.benefits : [],
        brand: product.brand || undefined
      })

      // Use API route for server-side update (bypasses RLS)
      const response = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          description: seoData.description,
          seo_title: seoData.seoTitle,
          meta_description: seoData.metaDescription
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update')
      }

      // Update local state
      setProducts(prev => prev.map(p => 
        p.id === product.id 
          ? { ...p, description: seoData.description, seo_title: seoData.seoTitle, meta_description: seoData.metaDescription }
          : p
      ))

      setMessage({ type: 'success', text: `Updated SEO for ${product.name}` })
    } catch (error: any) {
      console.error('Error updating SEO:', error?.message || error)
      setMessage({ type: 'error', text: `Failed to update ${product.name}: ${error?.message || 'Unknown error'}` })
    } finally {
      setUpdating(null)
    }
  }

  const bulkGenerateSEO = async () => {
    setBulkUpdating(true)
    setMessage(null)
    
    const filteredProducts = getFilteredProducts()
    let successCount = 0
    let errorCount = 0

    for (const product of filteredProducts) {
      try {
        await generateSEOForProduct(product)
        successCount++
      } catch {
        errorCount++
      }
    }

    setBulkUpdating(false)
    setMessage({ 
      type: successCount > 0 ? 'success' : 'error', 
      text: `Updated ${successCount} products. ${errorCount > 0 ? `${errorCount} failed.` : ''}` 
    })
  }

  const saveCustomDescription = async (productId: string) => {
    setUpdating(productId)
    try {
      // Use API route for server-side update (bypasses RLS)
      const response = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          description: editedDescription
        })
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error)

      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, description: editedDescription } : p
      ))
      setEditingProduct(null)
      setMessage({ type: 'success', text: 'Description saved!' })
    } catch (error: any) {
      console.error('Error saving description:', error)
      setMessage({ type: 'error', text: `Failed to save: ${error?.message || 'Unknown error'}` })
    } finally {
      setUpdating(null)
    }
  }

  const getFilteredProducts = () => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }

  const categories = ['all', ...new Set(products.map(p => p.category))]
  const filteredProducts = getFilteredProducts()

  const getSEOScore = (product: Product): number => {
    let score = 0
    const descLength = product.description?.length || 0
    if (descLength > 100) score += 25
    if (descLength > 200) score += 15
    if (product.seo_title) score += 20
    if (product.meta_description) score += 20
    const featuresLength = Array.isArray(product.features) ? product.features.length : 0
    const benefitsLength = Array.isArray(product.benefits) ? product.benefits.length : 0
    if (featuresLength > 0) score += 10
    if (benefitsLength > 0) score += 10
    return Math.min(score, 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-500" />
            SEO Management
          </h1>
          <p className="text-slate-600 mt-2">
            Optimize your product descriptions for better search engine visibility
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
            <button onClick={() => setMessage(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filters & Actions */}
        <Card className="mb-6 p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
            <Button
              onClick={bulkGenerateSEO}
              disabled={bulkUpdating || filteredProducts.length === 0}
              className="flex items-center gap-2"
            >
              {bulkUpdating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Generate SEO for {filteredProducts.length} Products
            </Button>
          </div>
        </Card>

        {/* Products List */}
        {loading ? (
          <Card className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-4" />
            <p className="text-slate-600">Loading products...</p>
          </Card>
        ) : filteredProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-slate-600">No products found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map(product => {
              const seoScore = getSEOScore(product)
              const isExpanded = expandedProduct === product.id
              const isEditing = editingProduct === product.id

              return (
                <Card key={product.id} className="overflow-hidden">
                  {/* Product Header */}
                  <div 
                    className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50"
                    onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-slate-900">{product.name}</h3>
                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                          {product.category}
                        </span>
                        <span className="text-sm text-slate-500">R{product.price.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                        {product.description?.slice(0, 100)}...
                      </p>
                    </div>

                    {/* SEO Score */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-slate-700">SEO Score</div>
                        <div className={`text-lg font-bold ${
                          seoScore >= 80 ? 'text-green-600' : seoScore >= 50 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {seoScore}%
                        </div>
                      </div>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            seoScore >= 80 ? 'bg-green-500' : seoScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${seoScore}%` }}
                        />
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-4 bg-slate-50">
                      <div className="grid gap-4">
                        {/* Current Description */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Current Description
                          </label>
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                value={editedDescription}
                                onChange={(e) => setEditedDescription(e.target.value)}
                                className="w-full h-32 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveCustomDescription(product.id)}
                                  disabled={updating === product.id}
                                >
                                  <Save className="w-4 h-4 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingProduct(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-white rounded-lg border border-slate-200">
                              <p className="text-slate-700 text-sm">{product.description}</p>
                            </div>
                          )}
                        </div>

                        {/* SEO Fields */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              SEO Title
                            </label>
                            <div className="p-3 bg-white rounded-lg border border-slate-200 text-sm">
                              {product.seo_title || <span className="text-slate-400">Not set</span>}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Meta Description
                            </label>
                            <div className="p-3 bg-white rounded-lg border border-slate-200 text-sm">
                              {product.meta_description || <span className="text-slate-400">Not set</span>}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => generateSEOForProduct(product)}
                            disabled={updating === product.id}
                          >
                            {updating === product.id ? (
                              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4 mr-1" />
                            )}
                            Generate SEO Content
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingProduct(product.id)
                              setEditedDescription(product.description || '')
                            }}
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit Manually
                          </Button>
                          <a
                            href={`/products/${product.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-white transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

