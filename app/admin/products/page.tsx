'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { MultiImageUpload } from '@/components/MultiImageUpload'
import { VariantManager } from '@/components/VariantManager'
import { createClient } from '@/lib/supabase'
import { Product, ProductVariant } from '@/types/database'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Upload,
  X
} from 'lucide-react'

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'gym',
    stock: '',
    image_url: '',
    images: [] as string[],
    has_variants: false
  })
  
  const [variants, setVariants] = useState<ProductVariant[]>([])
  
  const categories = [
    { value: 'gym', label: 'Gym' },
    { value: 'camping', label: 'Camping' },
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'beauty', label: 'Beauty' },
    { value: 'baby-toys', label: 'Baby Toys' }
  ]
  
  useEffect(() => {
    checkAuth()
    fetchProducts()
  }, [])
  
  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, selectedCategory])
  
  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const isAdmin = localStorage.getItem('jeffy-admin')
      if (!isAdmin) {
        router.push('/admin/login')
      }
    }
  }
  
  const fetchProducts = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
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
  
  const handleImageUpload = async (files: File[]) => {
    setUploading(true)
    try {
      const supabase = createClient()
      const uploadedUrls: string[] = []
      
      for (const file of files) {
        // Mobile-specific file validation
        if (!file) {
          throw new Error('No file selected')
        }
        
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 5MB.`)
        }
        
        // Check file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not a valid image file.`)
        }
        
        console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type)
        
        // Upload directly to product-images bucket
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        
        console.log('Uploading to Supabase:', fileName)
        
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file)
        
        if (error) {
          console.error('Upload error:', error)
          throw new Error(`Upload failed for ${file.name}: ${error.message}`)
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)
        
        console.log('Image uploaded successfully:', publicUrl)
        uploadedUrls.push(publicUrl)
      }
      
      // Update form data with new images
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
        image_url: uploadedUrls[0] || prev.image_url // Set first image as primary
      }))
      
    } catch (error) {
      console.error('Error uploading images:', error)
      alert(`Error uploading images: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }
  
  const handleImageRemove = (index: number) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== index)
      return {
        ...prev,
        images: newImages,
        image_url: newImages[0] || '' // Set first remaining image as primary
      }
    })
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock),
        image_url: formData.image_url || null,
        images: formData.images,
        has_variants: formData.has_variants
      }
      
      let response
      if (editingProduct) {
        // Update existing product
        response = await fetch('/api/admin/products', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingProduct.id,
            ...productData
          })
        })
      } else {
        // Create new product
        response = await fetch('/api/admin/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData)
        })
      }
      
      console.log('[FRONTEND] Response status:', response.status, response.statusText)
      console.log('[FRONTEND] Response ok:', response.ok)
      
      let result
      try {
        const text = await response.text()
        console.log('[FRONTEND] Raw response body:', text)
        result = JSON.parse(text)
      } catch (parseError) {
        console.error('[FRONTEND] Failed to parse response:', parseError)
        throw new Error(`Failed to parse server response: ${response.statusText}`)
      }
      
      console.log('[FRONTEND] Parsed result:', result)
      
      if (!response.ok) {
        console.error('[FRONTEND] HTTP error:', response.status, result)
        throw new Error(result.error || `Server error: ${response.statusText}`)
      }
      
      if (!result.success) {
        console.error('[FRONTEND] API returned success=false:', result)
        throw new Error(result.error || 'Failed to save product')
      }
      
      console.log('[FRONTEND] Product saved successfully!')
      console.log('[FRONTEND] Product ID:', result.product.id)
      
      const productId = result.product.id
      
      // Validate variants if has_variants is enabled
      if (formData.has_variants && variants.length === 0) {
        console.warn('[FRONTEND] WARNING: has_variants is true but no variants created!')
        console.log('[FRONTEND] Variants array:', variants)
        alert('WARNING: You enabled variants but did not create any variant combinations.\n\nThe product was saved WITHOUT variants.\n\nTo add variants:\n1. Click "Add Attribute" (e.g., Size)\n2. Add values (e.g., S, M, L)\n3. Click "Generate All Variant Combinations"\n\nThen edit this product to add variants.')
      }
      
      // Save variants if product has variants
      if (formData.has_variants && variants.length > 0) {
        console.log('[FRONTEND] Saving variants:', variants.length)
        console.log('[FRONTEND] Variants data:', variants)
        
        try {
          // First, delete existing variants if editing
          if (editingProduct) {
            console.log('[FRONTEND] Deleting old variants for product:', productId)
            const deleteResponse = await fetch(`/api/admin/variants?product_id=${productId}`, {
              method: 'DELETE'
            })
            const deleteResult = await deleteResponse.json()
            console.log('[FRONTEND] Delete variants result:', deleteResult)
          }
          
          // Then insert new variants
          console.log('[FRONTEND] Creating new variants...')
          const variantsResponse = await fetch('/api/admin/variants', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              product_id: productId,
              variants: variants
            })
          })
          
          const text = await variantsResponse.text()
          console.log('[FRONTEND] Variants raw response:', text)
          const variantsResult = JSON.parse(text)
          
          console.log('[FRONTEND] Variants result:', variantsResult)
          
          if (!variantsResponse.ok || !variantsResult.success) {
            console.error('[FRONTEND] Variants save failed:', variantsResult)
            throw new Error(variantsResult.error || 'Failed to save variants')
          }
          
          console.log('[FRONTEND] Variants saved successfully!')
        } catch (variantError) {
          console.error('[FRONTEND] Error saving variants:', variantError)
          throw new Error(`Failed to save variants: ${variantError instanceof Error ? variantError.message : 'Unknown error'}`)
        }
      } else {
        console.log('[FRONTEND] No variants to save (has_variants=false or variants empty)')
      }
      
      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'gym',
        stock: '',
        image_url: '',
        images: [],
        has_variants: false
      })
      setVariants([])
      setEditingProduct(null)
      setIsModalOpen(false)
      fetchProducts()
    } catch (error) {
      console.error('[FRONTEND] Error saving product:', error)
      console.error('[FRONTEND] Error stack:', error instanceof Error ? error.stack : 'No stack')
      alert(`Error saving product: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      image_url: product.image_url || '',
      images: product.images || [],
      has_variants: product.has_variants || false
    })
    setVariants(product.variants || [])
    setIsModalOpen(true)
  }
  
  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      const response = await fetch(`/api/admin/products?id=${productId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete product')
      }
      
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert(`Error deleting product: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  const openAddModal = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'gym',
      stock: '',
      image_url: '',
      images: [],
      has_variants: false
    })
    setVariants([])
    setIsModalOpen(true)
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your product catalog</p>
          </div>
          <Button onClick={openAddModal} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
        
        {/* Filters */}
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
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jeffy-yellow focus:border-transparent text-sm sm:text-base"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
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
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search terms or filters' 
                  : 'No products available. Add your first product!'
                }
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-jeffy-lg transition-all duration-300 p-3 sm:p-4">
                {/* Product Image */}
                <div className="relative w-full h-40 sm:h-48 mb-3 sm:mb-4 overflow-hidden rounded-lg">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover sm:group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-jeffy-yellow-light flex items-center justify-center">
                      <span className="text-gray-500 text-xs sm:text-sm">No Image</span>
                    </div>
                  )}
                  
                  {/* Stock Badge */}
                  {product.stock <= 5 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      Low Stock
                    </div>
                  )}
                </div>
                
                {/* Product Info */}
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-lg sm:text-xl font-bold text-gray-900">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500 ml-1 sm:ml-2">
                        ({product.stock} in stock)
                      </span>
                    </div>
                    <span className="text-xs bg-jeffy-yellow-light text-gray-700 px-2 py-1 rounded-full self-start sm:self-auto">
                      {product.category}
                    </span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => handleEdit(product)}
                      size="sm"
                      className="flex-1 text-xs sm:text-sm"
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(product.id)}
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 sm:px-3"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {/* Add/Edit Product Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingProduct ? 'Edit Product' : 'Add New Product'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images (up to 5)
              </label>
              <MultiImageUpload
                onUpload={handleImageUpload}
                onRemove={handleImageRemove}
                currentImages={formData.images}
                disabled={uploading}
                maxFiles={5}
              />
              {uploading && (
                <p className="text-sm text-gray-500 mt-2">Uploading images...</p>
              )}
            </div>
            
            {/* Product Name */}
            <Input
              label="Product Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter product name"
              required
            />
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter product description"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jeffy-yellow focus:border-transparent transition-all duration-200"
                rows={3}
                required
              />
            </div>
            
            {/* Price and Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Price *"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                required
              />
              <Input
                label="Stock Quantity *"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="0"
                required
              />
            </div>
            
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jeffy-yellow focus:border-transparent transition-all duration-200"
                required
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Variants Management */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="has_variants"
                  checked={formData.has_variants}
                  onChange={(e) => setFormData({ ...formData, has_variants: e.target.checked })}
                  className="w-4 h-4 text-jeffy-yellow bg-gray-100 border-gray-300 rounded focus:ring-jeffy-yellow focus:ring-2"
                />
                <label htmlFor="has_variants" className="text-sm font-medium text-gray-700">
                  This product has variants (size, color, etc.)
                </label>
              </div>
              
              {formData.has_variants && (
                <VariantManager
                  productId={editingProduct?.id || 'new'}
                  variants={variants}
                  onVariantsChange={setVariants}
                  disabled={uploading}
                />
              )}
            </div>
            
            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 order-1 sm:order-2">
                {editingProduct ? 'Update Product' : 'Add Product'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  )
}
