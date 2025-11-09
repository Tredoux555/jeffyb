'use client'

import React, { useState, useEffect } from 'react'
import { Toast } from "@/components/Toast"
import { useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { MultiImageUpload } from '@/components/MultiImageUpload'
import { SimpleVariantManager } from '@/components/SimpleVariantManager'
import { Toggle } from '@/components/Toggle'
import { createClient } from '@/lib/supabase'
import { Product, ProductVariant } from '@/types/database'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Package
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
  const [toast, setToast] = useState({ isVisible: false, message: '' })
  const [updatingProduct, setUpdatingProduct] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'gym',
    stock: '',
    image_url: '',
    images: [] as string[],
    video_url: '',
    video_file_url: '',
    has_variants: false,
    is_active: true
  })
  
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([])
  
  useEffect(() => {
    checkAuth()
    fetchProducts()
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  useEffect(() => {
    filterProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const fetchCategories = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      
      // Transform to dropdown format
      const categoryOptions = data?.map(cat => ({
        value: cat.slug,
        label: cat.name
      })) || []
      
      setCategories(categoryOptions)
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Fallback to hardcoded if database fails
      setCategories([
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
      const failedFiles: string[] = []
      for (const file of files) {
        if (!file) {
          failedFiles.push('Invalid file')
          continue
        }
        if (file.size > 5 * 1024 * 1024) {
          failedFiles.push(`${file.name} (too large)`)
          continue
        }
        if (!file.type.startsWith('image/')) {
          failedFiles.push(`${file.name} (invalid type)`)
          continue
        }
        console.log('Uploading file:', file.name)
        // Retry logic for SSL/network errors
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
            const { error } = await supabase.storage
              .from('product-images')
              .upload(fileName, file)
            if (error) throw error
            const { data: { publicUrl } } = supabase.storage
              .from('product-images')
              .getPublicUrl(fileName)
            uploadedUrls.push(publicUrl)
            break
          } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error)
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            } else {
              failedFiles.push(`${file.name}`)
            }
          }
        }
      }
      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls],
          image_url: uploadedUrls[0] || prev.image_url
        }))
      }
      if (failedFiles.length > 0) {
        alert(`Uploaded ${uploadedUrls.length} images. Failed: ${failedFiles.join(', ')}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert(`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

  const handleVideoUpload = async (file: File) => {
    setUploading(true)
    try {
      const supabase = createClient()
      
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        alert('Video file must be less than 100MB')
        return
      }
      
      // Validate file type
      const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid video file (MP4, WebM, MOV, AVI)')
        return
      }
      
      const fileExt = file.name.split('.').pop()
      const fileName = `videos/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      
      const { error } = await supabase.storage
        .from('product-videos')
        .upload(fileName, file)
      
      if (error) throw error
      
      const { data: { publicUrl } } = supabase.storage
        .from('product-videos')
        .getPublicUrl(fileName)
      
      setFormData(prev => ({
        ...prev,
        video_file_url: publicUrl
      }))
      
      setToast({ 
        isVisible: true, 
        message: 'Video uploaded successfully' 
      })
    } catch (error) {
      console.error('Error uploading video:', error)
      setToast({ 
        isVisible: true, 
        message: `Video upload error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    } finally {
      setUploading(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // ALWAYS prevent submission if variants enabled but no variants generated
    if (formData.has_variants && variants.length === 0) {
      const proceed = confirm(
        '⚠️ You enabled variants but haven\'t created any variant combinations yet!\n\n' +
        'Click OK to save WITHOUT variants (will disable "has variants" checkbox)\n' +
        'Click Cancel to go back and:\n' +
        '  1. Add values to your attributes (e.g., Red, Blue for Color)\n' +
        '  2. Click "Generate All Variant Combinations"\n' +
        '  3. Then save again'
      )
      if (!proceed) return
      
      // User confirmed - remove variants from product
      const updatedFormData = { ...formData, has_variants: false }
      setFormData(updatedFormData)
      
      // Continue with submission using updated data
      const productData = {
        name: updatedFormData.name,
        description: updatedFormData.description,
        price: parseFloat(updatedFormData.price),
        category: updatedFormData.category,
        stock: parseInt(updatedFormData.stock),
        image_url: updatedFormData.image_url || null,
        images: updatedFormData.images,
        video_url: updatedFormData.video_url || null,
        video_file_url: updatedFormData.video_file_url || null,
        has_variants: false,
        is_active: updatedFormData.is_active
      }
      
      // Submit without variants
      let response
      if (editingProduct) {
        response = await fetch('/api/admin/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingProduct.id, ...productData })
        })
      } else {
        response = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        })
      }
      
      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Failed to save product')
      
      // Reset form and close
      setFormData({ name: '', description: '', price: '', category: 'gym', stock: '', image_url: '', images: [], video_url: '', video_file_url: '', has_variants: false, is_active: true })
      setVariants([])
      setEditingProduct(null)
      setIsModalOpen(false)
      fetchProducts()
      return
    }
    
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock),
        image_url: formData.image_url || null,
        images: formData.images,
        video_url: formData.video_url || null,
        video_file_url: formData.video_file_url || null,
        has_variants: formData.has_variants,
        is_active: formData.is_active
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
          
          // Show success toast and close modal
          setToast({ 
            isVisible: true, 
            message: editingProduct ? 'Product Successfully Updated' : 'Product Successfully Added' 
          })
          
          fetchProducts() // Refresh product list in background
          
          // Close modal after showing toast
          setFormData({ name: '', description: '', price: '', category: 'gym', stock: '', image_url: '', images: [], video_url: '', video_file_url: '', has_variants: false, is_active: true })
          setVariants([])
          setEditingProduct(null)
          setIsModalOpen(false)
          return // Exit the function
        } catch (variantError) {
          console.error('[FRONTEND] Error saving variants:', variantError)
          throw new Error(`Failed to save variants: ${variantError instanceof Error ? variantError.message : 'Unknown error'}`)
        }
      } else {
        console.log('[FRONTEND] No variants to save (has_variants=false or variants empty)')
      }
      
      // If no variants or product without variants, close modal normally
      // Show success toast and close modal
      setToast({ 
        isVisible: true, 
        message: editingProduct ? 'Product Successfully Updated' : 'Product Successfully Added' 
      })
      
      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'gym',
        stock: '',
        image_url: '',
        images: [],
        video_url: '',
        video_file_url: '',
        has_variants: false,
        is_active: true
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
  
  const handleToggleProduct = async (productId: string, isActive: boolean) => {
    setUpdatingProduct(productId)
    try {
      const response = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, is_active: isActive })
      })
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to update product')
      }
      
      // Refresh products list
      fetchProducts()
      
      // Show success toast
      setToast({ 
        isVisible: true, 
        message: isActive ? 'Product is now visible' : 'Product is now hidden' 
      })
    } catch (error) {
      console.error('Error toggling product:', error)
      setToast({ 
        isVisible: true, 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    } finally {
      setUpdatingProduct(null)
    }
  }

  const handleEdit = async (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      image_url: product.image_url || '',
      images: product.images || [],
      video_url: product.video_url || '',
      video_file_url: product.video_file_url || '',
      has_variants: product.has_variants || false,
      is_active: product.is_active !== undefined ? product.is_active : true
    })
    
    // Load variants from database
    try {
      const supabase = createClient()
      const { data: variantsData } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at')
      
      console.log('[Admin] Loaded variants:', variantsData)
      setVariants(variantsData || [])
    } catch (error) {
      console.error('Error loading variants:', error)
      setVariants([])
    }
    
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
      video_url: '',
      video_file_url: '',
      has_variants: false,
      is_active: true
    })
    setVariants([])
    setIsModalOpen(true)
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
                    // eslint-disable-next-line @next/next/no-img-element
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
                  {/* Hidden Product Badge */}
                  {product.is_active === false && (
                    <div className="absolute top-2 left-2 bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
                      Hidden
                    </div>
                  )}
                </div>
                
                {/* Product Info */}
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <h3 className={`font-semibold text-base sm:text-lg mb-1 ${product.is_active === false ? 'text-gray-400' : 'text-gray-900'}`}>
                      {product.name}
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-lg sm:text-xl font-bold text-gray-900">
                        R{product.price.toFixed(2)}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500 ml-1 sm:ml-2">
                        ({product.stock} in stock)
                      </span>
                    </div>
                    <span className="text-xs bg-jeffy-yellow-light text-gray-700 px-2 py-1 rounded-full self-start sm:self-auto">
                      {product.category}
                    </span>
                  </div>
                  
                  {/* Visibility Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-600">Visible to customers</span>
                    <Toggle
                      checked={product.is_active !== undefined ? product.is_active : true}
                      onChange={(checked) => handleToggleProduct(product.id, checked)}
                      disabled={updatingProduct === product.id}
                      size="sm"
                    />
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
                Product Images (up to 10)
              </label>
              <MultiImageUpload
                onUpload={handleImageUpload}
                onRemove={handleImageRemove}
                currentImages={formData.images}
                disabled={uploading}
                maxFiles={10}
              />
              {uploading && (
                <p className="text-sm text-gray-500 mt-2">Uploading images...</p>
              )}
            </div>

            {/* Video URL Input */}
            <Input
              label="Video URL (Optional)"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
              helperText="YouTube, Vimeo, or other video platform URL"
            />

            {/* Video Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Upload Video (Optional)
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleVideoUpload(file)
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jeffy-yellow"
                disabled={uploading}
              />
              {formData.video_file_url && (
                <div className="flex items-center gap-2 mt-2 p-3 bg-gray-50 rounded-lg">
                  <video src={formData.video_file_url} controls className="max-w-xs h-24 rounded" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, video_file_url: '' })}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500">
                Maximum file size: 100MB. Supported formats: MP4, WebM, MOV, AVI
              </p>
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
            
            {/* Visibility Toggle */}
            <div className="flex items-center justify-between py-3 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-700">
                Product Visibility
              </label>
              <Toggle
                checked={formData.is_active}
                onChange={(checked) => setFormData({ ...formData, is_active: checked })}
                size="md"
              />
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
                <SimpleVariantManager
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
        <Toast
          message={toast.message}
          isVisible={toast.isVisible}
          onClose={() => setToast({ isVisible: false, message: '' })}
        />
      </div>
    </div>
  )
}
