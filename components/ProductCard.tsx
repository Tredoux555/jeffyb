'use client'

import React from 'react'
import Image from 'next/image'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { ShoppingCart, Eye } from 'lucide-react'
import { Product } from '@/types/database'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
  onViewDetails: (product: Product) => void
}

export function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  return (
    <Card className="group hover:shadow-jeffy-lg transition-all duration-300 p-3 sm:p-4">
      {/* Product Image */}
      <div className="relative w-full h-40 sm:h-48 mb-3 sm:mb-4 overflow-hidden rounded-lg">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
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
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg sm:text-2xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            <span className="text-xs sm:text-sm text-gray-500 ml-1 sm:ml-2">
              ({product.stock} in stock)
            </span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => onAddToCart(product)}
            disabled={product.stock === 0}
            className="flex-1 text-xs sm:text-sm"
            size="sm"
          >
            <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
          <Button
            variant="outline"
            onClick={() => onViewDetails(product)}
            size="sm"
            className="px-2 sm:px-3"
          >
            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
