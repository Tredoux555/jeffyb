import { createClient } from './supabase'
import { Favorite } from '@/types/database'

/**
 * Favorites utilities
 * Handle adding, removing, and fetching favorites
 */

/**
 * Check if a product is favorited by the current user
 */
export async function isFavorited(userId: string, productId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single()

    // PGRST116 = no rows returned (not favorited) - this is OK
    if (error && error.code === 'PGRST116') {
      return false
    }

    // Handle RLS/authentication errors (406, 401, etc.) - return false silently
    // These occur when user authentication state is uncertain or RLS blocks access
    if (error) {
      const status = (error as any).status || (error as any).code
      if (status === 406 || status === 401 || error.code === 'PGRST301') {
        // RLS or authentication error - silently return false
        console.warn('Cannot check favorite status (auth/RLS issue):', error.message)
        return false
      }
      // Other errors - log but still return false
      console.error('Error checking favorite:', error)
      return false
    }

    return !!data
  } catch (error) {
    // Handle unexpected errors gracefully
    console.error('Error checking favorite:', error)
    return false
  }
}

/**
 * Add product to favorites
 */
export async function addFavorite(userId: string, productId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('favorites')
    .insert({
      user_id: userId,
      product_id: productId,
    })

  if (error) {
    // If already favorited, ignore the error
    if (error.code !== '23505') {
      // 23505 = unique constraint violation (already favorited)
      throw error
    }
  }
}

/**
 * Remove product from favorites
 */
export async function removeFavorite(userId: string, productId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)

  if (error) throw error
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(userId: string, productId: string): Promise<boolean> {
  const isFav = await isFavorited(userId, productId)
  
  if (isFav) {
    await removeFavorite(userId, productId)
    return false
  } else {
    await addFavorite(userId, productId)
    return true
  }
}

/**
 * Fetch all favorites for a user
 */
export async function fetchFavorites(userId: string): Promise<Favorite[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('favorites')
    .select('*, product:products(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as Favorite[]
}
