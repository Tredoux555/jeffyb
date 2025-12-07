'use client'

import { useEffect, useState, useCallback } from 'react'
import { CartItem } from '@/types/database'
import { createClient } from '@/lib/supabase'

const OFFLINE_CART_KEY = 'jeffy-offline-cart'
const PENDING_SYNC_KEY = 'jeffy-pending-sync'

interface OfflineCartState {
  isOnline: boolean
  hasPendingSync: boolean
  lastSyncTime: Date | null
}

export function useOfflineCart() {
  const [state, setState] = useState<OfflineCartState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    hasPendingSync: false,
    lastSyncTime: null
  })

  // Check for pending sync items on mount
  useEffect(() => {
    const pendingSync = localStorage.getItem(PENDING_SYNC_KEY)
    if (pendingSync) {
      setState(prev => ({ ...prev, hasPendingSync: true }))
    }
  }, [])

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('[OfflineCart] Back online - syncing cart...')
      setState(prev => ({ ...prev, isOnline: true }))
      syncOfflineCart()
    }

    const handleOffline = () => {
      console.log('[OfflineCart] Gone offline')
      setState(prev => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for service worker sync messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_CART') {
          syncOfflineCart()
        }
      })
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Save cart to local storage (for offline access)
  const saveCartOffline = useCallback((items: CartItem[]) => {
    try {
      localStorage.setItem(OFFLINE_CART_KEY, JSON.stringify({
        items,
        timestamp: new Date().toISOString()
      }))
      console.log('[OfflineCart] Cart saved offline:', items.length, 'items')
    } catch (error) {
      console.error('[OfflineCart] Failed to save cart offline:', error)
    }
  }, [])

  // Get cart from local storage
  const getOfflineCart = useCallback((): CartItem[] => {
    try {
      const stored = localStorage.getItem(OFFLINE_CART_KEY)
      if (stored) {
        const { items } = JSON.parse(stored)
        return items || []
      }
    } catch (error) {
      console.error('[OfflineCart] Failed to get offline cart:', error)
    }
    return []
  }, [])

  // Add item to pending sync queue
  const addToPendingSync = useCallback((action: 'add' | 'remove' | 'update', item: CartItem) => {
    try {
      const pending = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]')
      pending.push({
        action,
        item,
        timestamp: new Date().toISOString()
      })
      localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending))
      setState(prev => ({ ...prev, hasPendingSync: true }))
      console.log('[OfflineCart] Added to pending sync:', action, item.product_name)

      // Request background sync if available
      if ('serviceWorker' in navigator && 'sync' in (navigator.serviceWorker as any)) {
        navigator.serviceWorker.ready.then((registration: any) => {
          registration.sync.register('sync-cart')
        }).catch(console.error)
      }
    } catch (error) {
      console.error('[OfflineCart] Failed to add to pending sync:', error)
    }
  }, [])

  // Sync offline cart with server
  const syncOfflineCart = useCallback(async () => {
    if (!navigator.onLine) {
      console.log('[OfflineCart] Cannot sync - offline')
      return
    }

    const pending = localStorage.getItem(PENDING_SYNC_KEY)
    if (!pending) {
      console.log('[OfflineCart] No pending sync items')
      return
    }

    try {
      const pendingActions = JSON.parse(pending)
      console.log('[OfflineCart] Syncing', pendingActions.length, 'pending actions...')

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.log('[OfflineCart] No user - keeping items in local storage')
        return
      }

      // Process each pending action
      for (const { action, item } of pendingActions) {
        try {
          if (action === 'add') {
            // Check if item already exists
            const { data: existing } = await supabase
              .from('cart_items')
              .select('id, quantity')
              .eq('user_id', user.id)
              .eq('product_id', item.product_id)
              .eq('variant_id', item.variant_id || '')
              .single()

            if (existing) {
              // Update quantity
              await supabase
                .from('cart_items')
                .update({ quantity: existing.quantity + item.quantity })
                .eq('id', existing.id)
            } else {
              // Insert new item
              await supabase
                .from('cart_items')
                .insert({
                  user_id: user.id,
                  product_id: item.product_id,
                  variant_id: item.variant_id,
                  quantity: item.quantity
                })
            }
          } else if (action === 'remove') {
            await supabase
              .from('cart_items')
              .delete()
              .eq('user_id', user.id)
              .eq('product_id', item.product_id)
              .eq('variant_id', item.variant_id || '')
          } else if (action === 'update') {
            await supabase
              .from('cart_items')
              .update({ quantity: item.quantity })
              .eq('user_id', user.id)
              .eq('product_id', item.product_id)
              .eq('variant_id', item.variant_id || '')
          }
        } catch (error) {
          console.error('[OfflineCart] Failed to sync action:', action, error)
        }
      }

      // Clear pending sync
      localStorage.removeItem(PENDING_SYNC_KEY)
      setState(prev => ({
        ...prev,
        hasPendingSync: false,
        lastSyncTime: new Date()
      }))
      console.log('[OfflineCart] Sync complete!')

      // Notify the page to refresh cart
      window.dispatchEvent(new CustomEvent('cart-synced'))
    } catch (error) {
      console.error('[OfflineCart] Sync failed:', error)
    }
  }, [])

  // Clear offline data
  const clearOfflineData = useCallback(() => {
    localStorage.removeItem(OFFLINE_CART_KEY)
    localStorage.removeItem(PENDING_SYNC_KEY)
    setState(prev => ({ ...prev, hasPendingSync: false }))
  }, [])

  return {
    ...state,
    saveCartOffline,
    getOfflineCart,
    addToPendingSync,
    syncOfflineCart,
    clearOfflineData
  }
}

// Hook to show offline status indicator
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

