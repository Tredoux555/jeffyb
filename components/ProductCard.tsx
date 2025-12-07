'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { FavoriteButton } from '@/components/FavoriteButton'
import { OptimizedImage } from '@/components/OptimizedImage'
import { ShoppingCart, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { Product } from '@/types/database'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
  onViewDetails: (product: Product) => void
}

export function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAdding, setIsAdding] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchEndX, setTouchEndX] = useState<number | null>(null)
  
  // Get all available images
  const images = product.images && product.images.length > 0 ? product.images : 
                 product.image_url ? [product.image_url] : []
  
  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    )
  }
  
  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    )
  }
  
  // Swipe handlers for mobile
  const minSwipeDistance = 50
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null)
    setTouchStartX(e.targetTouches[0].clientX)
  }
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX)
  }
  
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX || !touchEndX || !images || images.length <= 1) return
    
    const distance = touchStartX - touchEndX
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe || isRightSwipe) {
      e.preventDefault()
      e.stopPropagation()
      if (isLeftSwipe) {
        setCurrentImageIndex((prev) => 
          prev === images.length - 1 ? 0 : prev + 1
        )
      }
      if (isRightSwipe) {
        setCurrentImageIndex((prev) => 
          prev === 0 ? images.length - 1 : prev - 1
        )
      }
    }
  }
  
  const handleAddClick = () => {
    if (isAdding) return // Prevent double-tap
    
    setIsAdding(true)
    onAddToCart(product)
    
    // Re-enable after 500ms
    setTimeout(() => setIsAdding(false), 500)
  }

  return (
    <Card className="group hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden" padding="none">
      {/* Product Image */}
      <div className="relative w-full h-44 sm:h-52 overflow-hidden">
        {images.length > 0 ? (
          <Link href={`/products/${product.id}`}>
            <div 
              className="relative w-full h-full cursor-pointer"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <OptimizedImage
                src={images[currentImageIndex]}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover lg:group-hover:scale-105 transition-transform duration-300"
                priority={false}
                quality={75}
                showLoader={false}
              />
              
              {/* Image Navigation for Multiple Images */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 active:bg-white rounded-full p-2 shadow-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 active:bg-white rounded-full p-2 shadow-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {currentImageIndex + 1}/{images.length}
                  </div>
                </>
              )}
            </div>
          </Link>
        ) : (
          <div className="w-full h-full bg-jeffy-yellow-light flex items-center justify-center">
            <span className="text-gray-500 text-xs sm:text-sm">No Image</span>
          </div>
        )}
        
        {/* Stock Badge */}
        {product.stock <= 5 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            Low Stock
          </div>
        )}
        
        {/* Multiple Images Indicator */}
        {images.length > 1 && (
          <div className="absolute top-2 right-2 bg-jeffy-yellow text-gray-900 text-xs px-2 py-1 rounded-full font-medium">
            {images.length} photos
          </div>
        )}

        {/* Favorite Button */}
        <div className="absolute top-2 right-2 sm:top-2 sm:right-12 z-10">
          <FavoriteButton productId={product.id} size="md" />
        </div>
      </div>
      
      {/* Product Info */}
      <div className="p-4 space-y-2 sm:space-y-3">
        <div>
          <Link href={`/products/${product.id}`}>
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 hover:text-jeffy-grey transition-colors cursor-pointer">
              {product.name}
            </h3>
          </Link>
          <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">
            {product.description}
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg sm:text-2xl font-bold text-gray-900">
              R{product.price.toFixed(2)}
            </span>
            <span className="text-xs sm:text-sm text-gray-500 ml-1 sm:ml-2">
              ({product.stock} in stock)
            </span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleAddClick}
            disabled={product.stock === 0 || isAdding}
            className="flex-1 text-xs sm:text-sm active:scale-95"
            size="sm"
          >
            <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            {product.stock === 0 ? 'Out of Stock' : isAdding ? 'Adding...' : 'Add to Cart'}
          </Button>
          <Button
            variant="outline"
            onClick={() => onViewDetails(product)}
            size="sm"
            className="px-2 sm:px-3 active:scale-95"
          >
            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
