/**
 * Cart Persistence System
 * Syncs cart between localStorage (guest) and database (authenticated users)
 */

import { CartItem } from '@/types/database'
import { createClient } from './supabase'

/**
 * Get cart items from localStorage
 */
export function getLocalCart(): CartItem[] {
  if (typeof window === 'undefined') return []

  try {
    const savedCart = localStorage.getItem('jeffy-cart')
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart)
      return Array.isArray(parsedCart) ? parsedCart : []
    }
  } catch (error) {
    console.error('Error reading cart from localStorage:', error)
  }

  return []
}

/**
 * Save cart items to localStorage
 */
export function saveLocalCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem('jeffy-cart', JSON.stringify(items))
  } catch (error) {
    console.error('Error saving cart to localStorage:', error)
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      alert('Cart storage is full. Please checkout or clear your cart.')
    }
  }
}

/**
 * Get cart items from database for authenticated user
 */
export async function getDatabaseCart(userId: string): Promise<CartItem[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('user_carts')
      .select('items')
      .eq('user_id', userId)
      .single()

    if (error) {
      // PGRST116 = no rows returned, cart doesn't exist yet - this is OK
      if (error.code === 'PGRST116') {
        return []
      }
      try {
        console.error('Error fetching cart from database:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          errorString: JSON.stringify(error, Object.getOwnPropertyNames(error))
        })
      } catch (stringifyError) {
        // Fallback if JSON.stringify fails
        console.error('Error fetching cart from database:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
          errorKeys: error ? Object.keys(error) : []
        })
      }
      return []
    }

    return (data?.items as CartItem[]) || []
  } catch (error) {
    console.error('Unexpected error fetching cart from database:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorObject: error
    })
    return []
  }
}

/**
 * Save cart items to database for authenticated user
 */
export async function saveDatabaseCart(userId: string, items: CartItem[]): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('user_carts')
      .upsert({
        user_id: userId,
        items: items,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      try {
        console.error('Error saving cart to database:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          errorString: JSON.stringify(error, Object.getOwnPropertyNames(error))
        })
      } catch (stringifyError) {
        // Fallback if JSON.stringify fails
        console.error('Error saving cart to database:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
          errorKeys: error ? Object.keys(error) : []
        })
      }
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error saving cart to database:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorObject: error
    })
    return false
  }
}

/**
 * Merge local cart with database cart
 * Combines items, preferring database items for conflicts
 */
export function mergeCarts(localCart: CartItem[], dbCart: CartItem[]): CartItem[] {
  const merged: CartItem[] = []
  const seenProducts = new Map<string, CartItem>()

  // Add database items first (prefer database)
  dbCart.forEach((item) => {
    const key = `${item.product_id}-${item.variant_id || ''}`
    seenProducts.set(key, { ...item })
  })

  // Add local items (merge if same product/variant)
  localCart.forEach((item) => {
    const key = `${item.product_id}-${item.variant_id || ''}`
    const existing = seenProducts.get(key)

    if (existing) {
      // Merge: use higher quantity
      existing.quantity = Math.max(existing.quantity, item.quantity)
    } else {
      // New item
      seenProducts.set(key, { ...item })
    }
  })

  // Convert map to array
  seenProducts.forEach((item) => {
    merged.push(item)
  })

  return merged
}

/**
 * Load cart for user (syncs database with localStorage if logged in)
 */
export async function loadCart(userId: string | null): Promise<CartItem[]> {
  const localCart = getLocalCart()

  if (!userId) {
    // Guest user - return local cart only
    return localCart
  }

  // Authenticated user - sync with database
  try {
    const dbCart = await getDatabaseCart(userId)

    // Merge carts
    const mergedCart = mergeCarts(localCart, dbCart)

    // Save merged cart to both locations
    saveLocalCart(mergedCart)
    await saveDatabaseCart(userId, mergedCart)

    return mergedCart
  } catch (error) {
    console.error('Error loading cart:', error)
    // Fallback to local cart
    return localCart
  }
}

/**
 * Save cart for user (saves to both localStorage and database if logged in)
 */
export async function saveCart(userId: string | null, items: CartItem[]): Promise<boolean> {
  // Always save to localStorage
  saveLocalCart(items)

  // Save to database if authenticated
  if (userId) {
    return await saveDatabaseCart(userId, items)
  }

  return true
}

/**
 * Clear cart for user (clears both localStorage and database if logged in)
 */
export async function clearCart(userId: string | null): Promise<boolean> {
  saveLocalCart([])

  if (userId) {
    return await saveDatabaseCart(userId, [])
  }

  return true
}

