import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Client-side Supabase client
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    console.error('Please check your .env.local file for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    // Return a mock client to prevent crashes during development
    // This will cause API calls to fail gracefully instead of crashing the app
    if (typeof window !== 'undefined') {
      // Create a minimal client with dummy credentials to prevent immediate errors
      // Actual API calls will fail but won't crash the app
      return createBrowserClient(
        supabaseUrl || 'https://placeholder.supabase.co',
        supabaseAnonKey || 'placeholder-key'
      )
    }
    throw new Error('Supabase configuration is missing. Please check your environment variables.')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Server-side client for public endpoints (uses anon key)
// For public data that respects RLS policies
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration is missing. Please check your environment variables.')
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Admin client for server-side operations (API routes)
// Uses service role key to bypass RLS policies
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Log environment variable status (without exposing values)
  console.log('[Admin Client] Checking environment variables...')
  console.log('[Admin Client] SUPABASE_URL present:', !!supabaseUrl)
  console.log('[Admin Client] SERVICE_ROLE_KEY present:', !!serviceKey)
  console.log('[Admin Client] SERVICE_ROLE_KEY length:', serviceKey?.length || 0)

  if (!supabaseUrl) {
    const error = 'Supabase URL is missing. Please check NEXT_PUBLIC_SUPABASE_URL environment variable.'
    console.error('[Admin Client]', error)
    throw new Error(error)
  }

  if (!serviceKey) {
    const error = 'Service role key is missing. Please check SUPABASE_SERVICE_ROLE_KEY environment variable.'
    console.error('[Admin Client]', error)
    throw new Error(error)
  }

  try {
    // Use createClient from @supabase/supabase-js for server-side operations
    // This is the correct way to create a client with service role key in API routes
    const client = createSupabaseClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    console.log('[Admin Client] Client created successfully')
    return client
  } catch (error: any) {
    console.error('[Admin Client] Failed to create client:', error?.message)
    console.error('[Admin Client] Error stack:', error?.stack)
    throw error
  }
}
