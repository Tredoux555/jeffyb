'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { Product, ProductVariant, CartItem } from '@/types/database'
import { createClient } from '@/lib/supabase'
import { 
  ArrowLeft, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({}) // variant_id: quantity
  const [cart, setCart] = useState<CartItem[]>([])
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')

  const productId = params.id as string

  useEffect(() => {
    fetchProduct()
    loadCart()
  }, [productId])

  // Monitor state changes for debugging
  useEffect(() => {
    console.log('[Product] selectedVariants state updated:', selectedVariants)
  }, [selectedVariants])

  useEffect(() => {
    console.log('[Product] variants loaded:', variants)
  }, [variants])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Fetch product with variants
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (productError) throw productError
      
      // Fetch variants if product has them
      if (productData.has_variants) {
        console.log('[Product] Fetching variants for product:', productId)
        const { data: variantsData, error: variantsError } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', productId)
          .order('created_at')

        if (variantsError) {
          console.error('[Product] Error fetching variants:', variantsError)
        } else {
          console.log('[Product] Loaded variants:', variantsData)
          setVariants(variantsData || [])
          // Initialize quantities for all variants
          const initialQuantities: Record<string, number> = {}
          variantsData?.forEach(variant => {
            initialQuantities[variant.id] = 0
          })
          console.log('[Product] Initialized quantities:', initialQuantities)
          setSelectedVariants(initialQuantities)
        }
      } else {
        console.log('[Product] Product has no variants')
      }
      
      setProduct(productData)
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCart = () => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('jeffy-cart')
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart)
          if (Array.isArray(parsedCart)) {
            setCart(parsedCart)
          } else {
            setCart([])
          }
        } catch (error) {
          console.error('Error parsing cart data:', error)
          setCart([])
        }
      }
    }
  }

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart)
    if (typeof window !== 'undefined') {
      localStorage.setItem('jeffy-cart', JSON.stringify(newCart))
    }
  }


  const handleAddToCart = () => {
    if (!product) return

    const currentCart = Array.isArray(cart) ? cart : []
    
    // If product has variants, add selected variant
    if (product.has_variants && variants.length > 0) {
      const selectedVariantId = Object.keys(selectedVariants).find(id => selectedVariants[id] > 0)
      
      if (!selectedVariantId) {
        alert('Please select a variant')
        return
      }

      const variant = variants.find(v => v.id === selectedVariantId)
      if (!variant) return

      const quantity = selectedVariants[selectedVariantId]
      const variantPrice = variant.price || product.price
      const variantDisplay = Object.entries(variant.variant_attributes)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')

      const cartItem: CartItem = {
        product_id: product.id,
        variant_id: variant.id,
        product_name: product.name,
        variant_display: variantDisplay,
        price: variantPrice,
        quantity: quantity,
        image_url: variant.image_url || product.images?.[0] || product.image_url || undefined
      }

      // Check if this exact variant already exists
      const existingIndex = currentCart.findIndex(
        item => item.product_id === product.id && item.variant_id === variant.id
      )

      if (existingIndex >= 0) {
        // Update existing variant quantity
        currentCart[existingIndex].quantity += quantity
      } else {
        // Add new variant
        currentCart.push(cartItem)
      }

      saveCart(currentCart)
      
      // Show notification
      setNotificationMessage(`Added ${quantity} ${variantDisplay} to cart!`)
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
      
      // Reset selection after adding
      setSelectedVariants({})
    } else {
      // Product without variants - use old logic
      const quantity = 1 // Default quantity for non-variant products
      const existingItem = currentCart.find(item => 
        item.product_id === product.id && !item.variant_id
      )
      
      if (existingItem) {
        const updatedCart = currentCart.map(item =>
          item.product_id === product.id && !item.variant_id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
        saveCart(updatedCart)
      } else {
        const newItem: CartItem = {
          product_id: product.id,
          product_name: product.name,
          price: product.price,
          quantity: quantity,
          image_url: product.images?.[0] || product.image_url || undefined
        }
        saveCart([...currentCart, newItem])
      }
      
      // Show notification
      setNotificationMessage(`Added ${quantity} ${product.name}(s) to cart!`)
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
    }
  }

  const nextImage = () => {
    if (!product?.images) return
    setSelectedImageIndex((prev) => 
      prev === product.images.length - 1 ? 0 : prev + 1
    )
  }

  const prevImage = () => {
    if (!product?.images) return
    setSelectedImageIndex((prev) => 
      prev === 0 ? product.images.length - 1 : prev - 1
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <div className="animate-[spin_3s_linear_infinite] rounded-full h-12 w-12 border-b-2 border-jeffy-grey mx-auto mb-4"></div>
          <p className="text-gray-700">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <Link href="/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    )
  }

  const images = product.images && product.images.length > 0 ? product.images : 
                 product.image_url ? [product.image_url] : []

  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square max-h-[500px] bg-white rounded-xl overflow-hidden shadow-jeffy">
              {images.length > 0 ? (
                <>
                  <Image
                    src={images[selectedImageIndex]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                  
                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  
                  {/* Image Counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {selectedImageIndex + 1} / {images.length}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>No image available</p>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-jeffy-yellow shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl font-bold text-jeffy-grey">
                  R{product.price.toFixed(2)}
                </span>
                <span className="bg-jeffy-yellow-light text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                  {product.category}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">(4.8) 124 reviews</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Stock:</span>
              <span className={`font-medium ${
                product.stock > 10 ? 'text-green-600' : 
                product.stock > 0 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
              </span>
            </div>

            {/* Variant Selection - Simplified Approach */}
            {product.has_variants && variants.length > 0 && (
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Select Your Options</h3>
                
                {/* Variant Selection - One Selected at a Time */}
                <div className="space-y-3">
                  {variants.map((variant) => {
                    const variantDisplay = Object.entries(variant.variant_attributes)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(', ')
                    const variantPrice = variant.price || product.price
                    const isSelected = selectedVariants[variant.id] && selectedVariants[variant.id] > 0
                    
                    return (
                      <button
                        key={variant.id}
                        onClick={() => {
                          // Clear all others and select this one with quantity 1
                          const newSelected: Record<string, number> = {}
                          newSelected[variant.id] = 1
                          console.log('[Product] Variant selected:', variant.id, 'with quantity 1')
                          setSelectedVariants(newSelected)
                        }}
                        className={`w-full text-left border-2 rounded-lg p-4 transition-all ${
                          isSelected
                            ? 'border-jeffy-yellow bg-yellow-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        type="button"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">{variantDisplay}</p>
                            <p className="text-sm text-gray-600">
                              R{variantPrice.toFixed(2)} • Stock: {variant.stock}
                            </p>
                          </div>
                          {isSelected && (
                            <span className="text-jeffy-yellow font-bold">✓</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Quantity Input for Selected Variant */}
                {Object.keys(selectedVariants).length > 0 && Object.values(selectedVariants).some(qty => qty > 0) && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const selectedId = Object.keys(selectedVariants).find(id => selectedVariants[id] > 0)
                          if (selectedId) {
                            setSelectedVariants(prev => {
                              const currentQty = prev[selectedId] || 1
                              const newQty = Math.max(1, currentQty - 1)
                              console.log('[Product] Minus button - current:', currentQty, 'new:', newQty)
                              return {
                                ...prev,
                                [selectedId]: newQty
                              }
                            })
                          }
                        }}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                        type="button"
                      >
                        <Minus className="w-5 h-5 text-gray-700" />
                      </button>
                      <span className="px-4 py-2 text-lg font-semibold min-w-[3rem] text-center">
                        {(() => {
                          const selectedId = Object.keys(selectedVariants).find(id => selectedVariants[id] > 0)
                          return selectedVariants[selectedId || ''] || 1
                        })()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const selectedId = Object.keys(selectedVariants).find(id => selectedVariants[id] > 0)
                          if (selectedId) {
                            setSelectedVariants(prev => {
                              const currentQty = prev[selectedId] || 1
                              const variant = variants.find(v => v.id === selectedId)
                              const maxQty = variant?.stock || 999
                              const newQty = Math.min(maxQty, currentQty + 1)
                              console.log('[Product] Plus button - current:', currentQty, 'new:', newQty)
                              return {
                                ...prev,
                                [selectedId]: newQty
                              }
                            })
                          }
                        }}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                        type="button"
                      >
                        <Plus className="w-5 h-5 text-gray-700" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5 text-yellow-600" />
                Add to Cart
              </Button>
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                <Heart className="w-5 h-5 text-yellow-600" />
                Wishlist
              </Button>
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5 text-yellow-600" />
                Share
              </Button>
            </div>

            {/* Additional Info */}
            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Category:</span>
                  <span className="ml-2 font-medium capitalize">{product.category}</span>
                </div>
                <div>
                  <span className="text-gray-600">SKU:</span>
                  <span className="ml-2 font-medium">{product.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed bottom-6 right-6 bg-jeffy-yellow text-gray-900 px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-slide-up">
          <span className="text-2xl">✓</span>
          <span className="font-medium">{notificationMessage}</span>
        </div>
      )}
    </div>
  )
}
