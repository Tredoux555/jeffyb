import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  throw new Error('Supabase configuration is missing')
}

// Client-side Supabase client
export const createClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Admin client for server-side operations
export const createAdminClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error('Service role key is missing')
  }
  return createBrowserClient(supabaseUrl, serviceKey)
}
