'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/Card'
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

  const productId = params.id as string

  useEffect(() => {
    fetchProduct()
    loadCart()
  }, [productId])

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
        const { data: variantsData, error: variantsError } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', productId)
          .order('created_at')

        if (variantsError) {
          console.error('Error fetching variants:', variantsError)
        } else {
          setVariants(variantsData || [])
          // Initialize quantities for all variants
          const initialQuantities: Record<string, number> = {}
          variantsData?.forEach(variant => {
            initialQuantities[variant.id] = 0
          })
          setSelectedVariants(initialQuantities)
        }
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

  const saveCart = (newCart: any[]) => {
    setCart(newCart)
    if (typeof window !== 'undefined') {
      localStorage.setItem('jeffy-cart', JSON.stringify(newCart))
    }
  }

  const updateVariantQuantity = (variantId: string, quantity: number) => {
    console.log('[Product] Updating variant quantity:', variantId, quantity)
    setSelectedVariants(prev => {
      const updated = {
        ...prev,
        [variantId]: Math.max(0, quantity)
      }
      console.log('[Product] Updated quantities:', updated)
      return updated
    })
  }

  const handleAddToCart = () => {
    if (!product) return

    const currentCart = Array.isArray(cart) ? cart : []
    
    // If product has variants, add selected variants
    if (product.has_variants && variants.length > 0) {
      const variantsToAdd = variants.filter(v => selectedVariants[v.id] > 0)
      
      if (variantsToAdd.length === 0) {
        alert('Please select at least one variant and set quantity')
        return
      }

      variantsToAdd.forEach(variant => {
        const quantity = selectedVariants[variant.id]
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
          image_url: variant.image_url || product.images?.[0] || product.image_url
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
      })

      saveCart(currentCart)
      
      const totalItems = variantsToAdd.reduce((sum, v) => sum + selectedVariants[v.id], 0)
      alert(`Added ${totalItems} item(s) to cart!`)
      
      // Reset quantities after adding
      const resetQuantities: Record<string, number> = {}
      variants.forEach(v => resetQuantities[v.id] = 0)
      setSelectedVariants(resetQuantities)
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
          image_url: product.images?.[0] || product.image_url
        }
        saveCart([...currentCart, newItem])
      }
      
      alert(`Added ${quantity} ${product.name}(s) to cart!`)
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jeffy-grey mx-auto mb-4"></div>
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
                  ${product.price.toFixed(2)}
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

            {/* Variant Selection */}
            {product.has_variants && variants.length > 0 && (
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Select Variants</h3>
                
                {variants.map((variant) => {
                  const variantDisplay = Object.entries(variant.variant_attributes)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ')
                  const quantity = selectedVariants[variant.id] ?? 0
                  const variantPrice = variant.price || product.price
                  console.log('[Product] Rendering variant:', variant.id, 'quantity:', quantity)
                  
                  return (
                    <div key={variant.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{variantDisplay}</p>
                          <p className="text-sm text-gray-600">
                            ${variantPrice.toFixed(2)} • Stock: {variant.stock}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700">Quantity:</span>
                        <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                          <button
                            onClick={() => updateVariantQuantity(variant.id, quantity - 1)}
                            className="p-2 hover:bg-gray-100 transition-colors"
                            disabled={quantity <= 0}
                          >
                            <Minus className="w-4 h-4 text-yellow-600" />
                          </button>
                          <span className="px-4 py-2 font-medium w-12 text-center">{quantity}</span>
                          <button
                            onClick={() => updateVariantQuantity(variant.id, quantity + 1)}
                            className="p-2 hover:bg-gray-100 transition-colors"
                            disabled={quantity >= variant.stock}
                          >
                            <Plus className="w-4 h-4 text-yellow-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
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
    </div>
  )
}
