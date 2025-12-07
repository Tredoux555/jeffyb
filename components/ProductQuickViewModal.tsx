'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { Product, ProductVariant, CartItem } from '@/types/database'
import { createClient } from '@/lib/supabase'
import { useCart } from '@/lib/hooks/useCart'
import { FavoriteButton } from '@/components/FavoriteButton'
import { 
  X, 
  ShoppingCart, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Minus,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface ProductQuickViewModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
}

export function ProductQuickViewModal({ product, isOpen, onClose }: ProductQuickViewModalProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loadingVariants, setLoadingVariants] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({})
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const { addToCart } = useCart()

  // Fetch variants when modal opens
  useEffect(() => {
    if (isOpen && product.has_variants) {
      fetchVariants()
    }
    // Reset state when modal closes
    if (!isOpen) {
      setSelectedVariants({})
      setSelectedImageIndex(0)
      setNotification(null)
    }
  }, [isOpen, product.id, product.has_variants])

  const fetchVariants = async () => {
    setLoadingVariants(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at')

      if (error) throw error
      setVariants(data || [])
    } catch (error) {
      console.error('Error fetching variants:', error)
    } finally {
      setLoadingVariants(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product) return

    // If product has variants and they exist, require selection
    if (product.has_variants && variants.length > 0) {
      const selectedVariantId = Object.keys(selectedVariants).find(id => selectedVariants[id] > 0)
      
      if (!selectedVariantId) {
        setNotification({ type: 'error', message: 'Please select a variant first' })
        setTimeout(() => setNotification(null), 3000)
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

      await addToCart(cartItem)
      
      setNotification({ type: 'success', message: `Added ${quantity}x ${variantDisplay} to cart!` })
      setTimeout(() => {
        setNotification(null)
        onClose()
      }, 1500)
      
      // Reset selection
      setSelectedVariants({})
    } else {
      // Product without variants
      const newItem: CartItem = {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: 1,
        image_url: product.images?.[0] || product.image_url || undefined
      }
      
      await addToCart(newItem)
      
      setNotification({ type: 'success', message: `Added ${product.name} to cart!` })
      setTimeout(() => {
        setNotification(null)
        onClose()
      }, 1500)
    }
  }

  const nextImage = () => {
    const images = product.images && product.images.length > 0 ? product.images : 
                   product.image_url ? [product.image_url] : []
    if (images.length <= 1) return
    setSelectedImageIndex((prev) => prev === images.length - 1 ? 0 : prev + 1)
  }

  const prevImage = () => {
    const images = product.images && product.images.length > 0 ? product.images : 
                   product.image_url ? [product.image_url] : []
    if (images.length <= 1) return
    setSelectedImageIndex((prev) => prev === 0 ? images.length - 1 : prev - 1)
  }

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const images = product.images && product.images.length > 0 ? product.images : 
                 product.image_url ? [product.image_url] : []

  const hasVariantSelected = Object.values(selectedVariants).some(qty => qty > 0)
  const needsVariantSelection = product.has_variants && variants.length > 0 && !hasVariantSelected

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[90vh] overflow-y-auto">
          {/* Image Section */}
          <div className="relative bg-gradient-to-br from-amber-50 to-yellow-100 p-6">
            {/* Main Image */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-white shadow-lg">
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
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all hover:scale-110"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all hover:scale-110"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  
                  {/* Image Counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
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
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-amber-500 ring-2 ring-amber-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Stock Badge */}
            <div className="absolute top-8 left-8">
              {product.stock <= 5 && product.stock > 0 && (
                <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                  Only {product.stock} left!
                </span>
              )}
              {product.stock === 0 && (
                <span className="bg-gray-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                  Out of Stock
                </span>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6 flex flex-col">
            {/* Header */}
            <div className="mb-4">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                  {product.name}
                </h2>
                <FavoriteButton productId={product.id} size="md" />
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-3xl font-bold text-gray-900">
                  R{product.price.toFixed(2)}
                </span>
                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium capitalize">
                  {product.category}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-6 leading-relaxed line-clamp-3">
              {product.description}
            </p>

            {/* Variant Selection */}
            {product.has_variants && (
              <div className="flex-1 overflow-y-auto mb-4">
                {loadingVariants ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                  </div>
                ) : variants.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      Select Option
                      {needsVariantSelection && (
                        <span className="text-xs text-red-500 font-normal">(Required)</span>
                      )}
                    </h3>
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
                            const newSelected: Record<string, number> = {}
                            newSelected[variant.id] = 1
                            setSelectedVariants(newSelected)
                          }}
                          className={`w-full text-left border-2 rounded-xl p-4 transition-all ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                              : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                          }`}
                          type="button"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">{variantDisplay}</p>
                              <p className="text-sm text-gray-500">
                                R{variantPrice.toFixed(2)} • {variant.stock} in stock
                              </p>
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-6 h-6 text-amber-500" />
                            )}
                          </div>
                        </button>
                      )
                    })}

                    {/* Quantity for Selected Variant */}
                    {hasVariantSelected && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity
                        </label>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => {
                              const selectedId = Object.keys(selectedVariants).find(id => selectedVariants[id] > 0)
                              if (selectedId) {
                                setSelectedVariants(prev => ({
                                  ...prev,
                                  [selectedId]: Math.max(1, (prev[selectedId] || 1) - 1)
                                }))
                              }
                            }}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                            type="button"
                          >
                            <Minus className="w-5 h-5 text-gray-700" />
                          </button>
                          <span className="px-4 py-2 text-lg font-bold min-w-[3rem] text-center">
                            {(() => {
                              const selectedId = Object.keys(selectedVariants).find(id => selectedVariants[id] > 0)
                              return selectedVariants[selectedId || ''] || 1
                            })()}
                          </span>
                          <button
                            onClick={() => {
                              const selectedId = Object.keys(selectedVariants).find(id => selectedVariants[id] > 0)
                              if (selectedId) {
                                const variant = variants.find(v => v.id === selectedId)
                                const maxQty = variant?.stock || 999
                                setSelectedVariants(prev => ({
                                  ...prev,
                                  [selectedId]: Math.min(maxQty, (prev[selectedId] || 1) + 1)
                                }))
                              }
                            }}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                            type="button"
                          >
                            <Plus className="w-5 h-5 text-gray-700" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">No variants available</p>
                )}
              </div>
            )}

            {/* Notification */}
            {notification && (
              <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 animate-slide-up ${
                notification.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {notification.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="font-medium">{notification.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 mt-auto pt-4 border-t border-gray-100">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`w-full flex items-center justify-center gap-2 py-3 text-lg font-semibold transition-all ${
                  needsVariantSelection ? 'opacity-50' : ''
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {product.stock === 0 
                  ? 'Out of Stock' 
                  : needsVariantSelection 
                    ? 'Select an Option First'
                    : 'Add to Cart'
                }
              </Button>
              
              <Link href={`/products/${product.id}`} className="block">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={onClose}
                >
                  <ExternalLink className="w-4 h-4" />
                  View Full Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

