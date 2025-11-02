/**
 * Cart Hook
 * Provides easy access to cart operations with persistence
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CartItem } from '@/types/database'
import { loadCart, saveCart as saveCartToDB, clearCart } from '../cart'

export function useCart() {
  const { user, loading: authLoading } = useAuth()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  // Load cart when auth state is ready
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
  }, [user?.id, authLoading])

  // Save cart function
  const saveCart = useCallback(async (newCart: CartItem[]) => {
    setCart(newCart)
    await saveCartToDB(user?.id || null, newCart)
  }, [user?.id])

  // Add item to cart
  const addToCart = useCallback(async (item: CartItem) => {
    const currentCart = Array.isArray(cart) ? cart : []
    
    // Check if item already exists (same product_id and variant_id)
    const existingIndex = currentCart.findIndex(
      (cartItem) =>
        cartItem.product_id === item.product_id &&
        cartItem.variant_id === item.variant_id
    )

    let updatedCart: CartItem[]
    if (existingIndex >= 0) {
      // Update existing item quantity
      updatedCart = currentCart.map((cartItem, index) =>
        index === existingIndex
          ? { ...cartItem, quantity: cartItem.quantity + (item.quantity || 1) }
          : cartItem
      )
    } else {
      // Add new item
      updatedCart = [...currentCart, { ...item, quantity: item.quantity || 1 }]
    }

    await saveCart(updatedCart)
  }, [cart, saveCart])

  // Update item quantity
  const updateQuantity = useCallback(async (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      await removeFromCart(productId, variantId)
      return
    }

    const updatedCart = cart.map((item) =>
      item.product_id === productId &&
      (variantId ? item.variant_id === variantId : !item.variant_id)
        ? { ...item, quantity }
        : item
    )

    await saveCart(updatedCart)
  }, [cart, saveCart])

  // Remove item from cart
  const removeFromCart = useCallback(async (productId: string, variantId?: string) => {
    const updatedCart = cart.filter(
      (item) =>
        !(
          item.product_id === productId &&
          (variantId ? item.variant_id === variantId : !item.variant_id)
        )
    )

    await saveCart(updatedCart)
  }, [cart, saveCart])

  // Clear cart
  const clear = useCallback(async () => {
    await saveCart([])
    await clearCart(user?.id || null)
  }, [user?.id, saveCart])

  // Get cart totals
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return {
    cart,
    loading,
    total,
    itemCount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clear,
    saveCart,
  }
}

