import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const createClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Admin client for server-side operations (without cookies)
export const createAdminClient = () => {
  return createBrowserClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
