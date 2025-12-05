'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { CartItem } from '@/types/database'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { useAuth } from '@/lib/contexts/AuthContext'
import { loadCart, saveCart as saveCartToDB, clearCart as clearCartFromDB } from '@/lib/cart'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2,
  ArrowLeft
} from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import Image from 'next/image'

export default function CartPage() {
  const { user, loading: authLoading } = useAuth()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  // Load cart on mount and when user changes
  useEffect(() => {
    if (authLoading) return

    const fetchCart = async () => {
      setLoading(true)
      try {
        const cartData = await loadCart(user?.id || null)
        setCart(cartData)
      } catch (error) {
        console.error('Error loading cart:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCart()
  }, [user, authLoading])

  const saveCart = async (newCart: CartItem[]) => {
    setCart(newCart)
    await saveCartToDB(user?.id || null, newCart)
  }

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await handleRemoveItem(productId)
      return
    }

    const updatedCart = cart.map(item =>
      item.product_id === productId
        ? { ...item, quantity }
        : item
    )
    await saveCart(updatedCart)
  }

  const handleRemoveItem = async (productId: string) => {
    const updatedCart = cart.filter(item => item.product_id !== productId)
    await saveCart(updatedCart)
  }

  const clearCart = async () => {
    if (confirm('Clear entire cart?')) {
      await saveCart([])
      await clearCartFromDB(user?.id || null)
    }
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  if (loading) {
    return <LoadingSpinner message="Loading your cart..." fullScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/products" className="text-jeffy-yellow hover:text-yellow-600">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ShoppingCart className="w-8 h-8" />
              Shopping Cart
            </h1>
          </div>
          {cart.length > 0 && (
            <Button onClick={clearCart} variant="outline" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cart
            </Button>
          )}
        </div>

        {cart.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingCart className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products to get started!</p>
            <Link href="/products">
              <Button>
                Browse Products
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item, index) => (
                <Card key={`${item.product_id}-${item.variant_id || 'default'}-${index}`} className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Image */}
                    {item.image_url && (
                      <div className="relative w-full sm:w-24 h-48 sm:h-24 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={item.image_url}
                          alt={item.product_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {item.product_name}
                      </h3>
                      {item.variant_display && (
                        <p className="text-sm text-gray-600 mb-2">
                          {item.variant_display}
                        </p>
                      )}
                      <p className="text-jeffy-yellow font-bold text-xl mb-3">
                        R{(item.price * item.quantity).toFixed(2)}
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">Quantity:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                            className="p-1 rounded-full hover:bg-jeffy-yellow-light transition-colors"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <span className="w-12 text-center font-medium text-lg">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                            className="p-1 rounded-full hover:bg-jeffy-yellow-light transition-colors"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => handleRemoveItem(item.product_id)}
                          className="ml-auto text-red-600 hover:text-red-700 p-2 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Order Summary
                </h2>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Items ({itemCount})</span>
                    <span>R{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>R{total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link href="/checkout" className="block">
                    <Button className="w-full">
                      Proceed to Checkout
                    </Button>
                  </Link>
                  <Link href="/products" className="block">
                    <Button variant="outline" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


