'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { Product, ProductVariant, CartItem } from '@/types/database'
import { createClient } from '@/lib/supabase'
import { useCart } from '@/lib/hooks/useCart'
import { 
  ArrowLeft, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Package,
  ZoomIn,
  MapPin
} from 'lucide-react'
import { FavoriteButton } from '@/components/FavoriteButton'
import { ImageZoom } from '@/components/ImageZoom'
import { SocialShare } from '@/components/SocialShare'
import { ProductMetadata } from '@/components/ProductMetadata'
import { Location } from '@/types/database'

export default function FranchiseProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const franchiseCode = params.code as string
  const productId = params.id as string
  const [franchise, setFranchise] = useState<Location | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({})
  const { addToCart } = useCart()
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [isZoomOpen, setIsZoomOpen] = useState(false)

  useEffect(() => {
    fetchFranchise()
    fetchProduct()
  }, [franchiseCode, productId])

  useEffect(() => {
    if (franchise && product) {
      fetchVariants()
    }
  }, [franchise, product])

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
        router.push(`/products/${productId}`)
        return
      }
      
      setFranchise(data)
    } catch (error) {
      console.error('Error fetching franchise:', error)
      router.push(`/products/${productId}`)
    }
  }

  const fetchProduct = async () => {
    if (!franchise) return

    try {
      setLoading(true)
      const supabase = createClient()

      // Get location-specific stock
      const { data: locationStock } = await supabase
        .from('location_stock')
        .select('product_id, variant_id, stock_quantity')
        .eq('location_id', franchise.id)
        .eq('product_id', productId)

      // Fetch product
      const { data: productData, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single()

      if (error || !productData) {
        router.push(`/franchise/${franchiseCode}`)
        return
      }

      // Update stock with location-specific stock
      const stockItem = locationStock?.find(item => !item.variant_id)
      const productWithStock = {
        ...productData,
        stock: stockItem?.stock_quantity || 0
      }

      setProduct(productWithStock)
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVariants = async () => {
    if (!product?.has_variants || !franchise) return

    try {
      const supabase = createClient()
      
      // Get location-specific variant stock
      const { data: locationStock } = await supabase
        .from('location_stock')
        .select('variant_id, stock_quantity')
        .eq('location_id', franchise.id)
        .eq('product_id', product.id)
        .not('variant_id', 'is', null)

      const { data: variantsData, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at')

      if (error) throw error

      // Update variant stock with location-specific stock
      const variantsWithStock = (variantsData || []).map(variant => {
        const stockItem = locationStock?.find(item => item.variant_id === variant.id)
        return {
          ...variant,
          stock: stockItem?.stock_quantity || 0
        }
      })

      setVariants(variantsWithStock)
    } catch (error) {
      console.error('Error fetching variants:', error)
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    // Store franchise info for checkout
    if (franchiseCode && franchise) {
      localStorage.setItem('jeffy-franchise-code', franchiseCode)
      localStorage.setItem('jeffy-franchise-id', franchise.id)
    }

    if (product.has_variants && variants.length > 0) {
      // Handle variant selection
      const selectedVariantIds = Object.keys(selectedVariants).filter(
        variantId => selectedVariants[variantId] > 0
      )

      if (selectedVariantIds.length === 0) {
        setNotificationMessage('Please select at least one variant')
        setShowNotification(true)
        setTimeout(() => setShowNotification(false), 3000)
        return
      }

      selectedVariantIds.forEach(variantId => {
        const variant = variants.find(v => v.id === variantId)
        if (variant) {
          const cartItem: CartItem = {
            product_id: product.id,
            variant_id: variantId,
            product_name: product.name,
            variant_display: Object.entries(variant.variant_attributes || {})
              .map(([key, value]) => `${key}: ${value}`)
              .join(', '),
            price: variant.price || product.price,
            quantity: selectedVariants[variantId],
            image_url: variant.image_url || product.image_url || undefined
          }
          addToCart(cartItem)
        }
      })
    } else {
      // Simple product without variants
      const cartItem: CartItem = {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: 1,
        image_url: product.images?.[0] || product.image_url || undefined
      }
      addToCart(cartItem)
    }

    setNotificationMessage('Added to cart!')
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
  }

  if (loading || !product || !franchise) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  const images = product.images && product.images.length > 0 ? product.images : 
                 product.image_url ? [product.image_url] : []

  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-4 py-6">
        {/* Franchise Header */}
        <div className="mb-4 flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-gray-500" />
          <Link href={`/franchise/${franchiseCode}`} className="text-blue-600 hover:text-blue-800">
            {franchise.franchise_name || franchise.name}
          </Link>
          <span className="text-gray-500">/</span>
          <span className="text-gray-700">{product.name}</span>
        </div>

        {/* Back Button */}
        <Link href={`/franchise/${franchiseCode}`}>
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </Link>

        {/* Product Details - Reuse existing product detail page structure */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Images */}
          <div className="space-y-4">
            {images.length > 0 && (
              <>
                <div className="relative aspect-square bg-white rounded-lg overflow-hidden">
                  <Image
                    src={images[selectedImageIndex]}
                    alt={product.name}
                    fill
                    className="object-cover cursor-zoom-in"
                    onClick={() => setIsZoomOpen(true)}
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 ${
                          selectedImageIndex === idx ? 'border-jeffy-yellow' : 'border-transparent'
                        }`}
                      >
                        <Image src={img} alt={`${product.name} ${idx + 1}`} width={100} height={100} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-2xl font-semibold text-jeffy-yellow mb-4">
                R{product.price.toFixed(2)}
              </p>
            </div>

            <div className="prose max-w-none">
              <p className="text-gray-700">{product.description}</p>
            </div>

            {/* Variants */}
            {product.has_variants && variants.length > 0 && (
              <div className="space-y-4">
                {variants.map((variant) => {
                  const attributes = Object.entries(variant.variant_attributes || {})
                  return (
                    <div key={variant.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">
                            {attributes.map(([key, value]) => `${key}: ${value}`).join(', ')}
                          </p>
                          <p className="text-sm text-gray-600">
                            Stock: {variant.stock} | Price: R{(variant.price || product.price).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedVariants(prev => ({
                              ...prev,
                              [variant.id]: Math.max(0, (prev[variant.id] || 0) - 1)
                            }))}
                            className="p-1 rounded border"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center">{selectedVariants[variant.id] || 0}</span>
                          <button
                            onClick={() => setSelectedVariants(prev => ({
                              ...prev,
                              [variant.id]: Math.min(variant.stock, (prev[variant.id] || 0) + 1)
                            }))}
                            className="p-1 rounded border"
                            disabled={variant.stock === 0}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Stock */}
            {!product.has_variants && (
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>
            )}

            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0 && (!product.has_variants || variants.every(v => v.stock === 0))}
              className="w-full"
              size="lg"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </Button>

            {/* Actions */}
            <div className="flex gap-2">
              <FavoriteButton productId={product.id} />
              <SocialShare product={product} />
            </div>
          </div>
        </div>

        {/* Notification */}
        {showNotification && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            {notificationMessage}
          </div>
        )}

        {/* Image Zoom Modal */}
        {isZoomOpen && images.length > 0 && (
          <ImageZoom
            images={images}
            initialIndex={selectedImageIndex}
            onClose={() => setIsZoomOpen(false)}
          />
        )}
      </div>
    </div>
  )
}

