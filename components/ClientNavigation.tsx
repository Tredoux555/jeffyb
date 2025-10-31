'use client'

import React, { useState, useEffect } from 'react'
import { Navigation } from '@/components/Navigation'

export function ClientNavigation() {
  const [cartItemCount, setCartItemCount] = useState(0)

  useEffect(() => {
    // Load cart count from localStorage
    const loadCartCount = () => {
      if (typeof window !== 'undefined') {
        try {
          const savedCart = localStorage.getItem('jeffy-cart')
          if (savedCart) {
            const parsedCart = JSON.parse(savedCart)
            if (Array.isArray(parsedCart)) {
              const totalItems = parsedCart.reduce((sum, item) => sum + item.quantity, 0)
              setCartItemCount(totalItems)
            }
          }
        } catch (error) {
          console.error('[Navigation] Error loading cart count:', error)
        }
      }
    }

    loadCartCount()

    // Listen for storage events (cart updates from other tabs/windows)
    window.addEventListener('storage', loadCartCount)

    // Poll for cart changes (for same-tab updates)
    const interval = setInterval(loadCartCount, 500)

    return () => {
      window.removeEventListener('storage', loadCartCount)
      clearInterval(interval)
    }
  }, [])

  return <Navigation cartItemCount={cartItemCount} />
}


