'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react'
import { CartItem } from '@/types/database'

interface CartProps {
  items: CartItem[]
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onCheckout: () => void
}

export function Cart({ items, onUpdateQuantity, onRemoveItem, onCheckout }: CartProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  
  return (
    <>
      {/* Cart Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 text-white hover:text-jeffy-yellow transition-colors"
      >
        <ShoppingCart className="w-6 h-6" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-jeffy-yellow text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>
      
      {/* Cart Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Shopping Cart"
        size="lg"
      >
        {items.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600">Add some products to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart Items */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {items.map((item) => (
                <div key={item.product_id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                  {/* Product Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-jeffy-yellow-light">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.product_name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-500 text-xs">No Image</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {item.product_name}
                    </h4>
                    <p className="text-jeffy-yellow font-semibold">
                      R{item.price.toFixed(2)}
                    </p>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                      className="p-1 rounded-full hover:bg-jeffy-yellow-light transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                      className="p-1 rounded-full hover:bg-jeffy-yellow-light transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => onRemoveItem(item.product_id)}
                    className="p-1 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Cart Summary */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-900">
                  Total ({itemCount} items)
                </span>
                <span className="text-2xl font-bold text-jeffy-yellow">
                  R{total.toFixed(2)}
                </span>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Continue Shopping
                </Button>
                <Button
                  onClick={() => {
                    onCheckout()
                    setIsOpen(false)
                  }}
                  className="flex-1"
                >
                  Checkout
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
