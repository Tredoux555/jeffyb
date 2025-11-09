'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '../supabase'
import { UserProfile } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName?: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Create supabase client with error handling - use useMemo to ensure stability
  const supabase = useMemo(() => {
    try {
      return createClient()
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error)
      return undefined
    }
  }, [])

  // Fetch user profile from user_profiles table - memoized with useCallback
  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabase) return null
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // PGRST116 = no rows returned, profile might not exist yet - this is OK
        if (error.code === 'PGRST116') {
          // Profile doesn't exist yet, return null (will be created by trigger on signup)
          return null
        }
        // Log other errors with more detail
        try {
          console.error('Error fetching profile:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            errorString: JSON.stringify(error, Object.getOwnPropertyNames(error))
          })
        } catch (stringifyError) {
          // Fallback if JSON.stringify fails
          console.error('Error fetching profile:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            errorType: typeof error,
            errorConstructor: error?.constructor?.name,
            errorKeys: error ? Object.keys(error) : []
          })
        }
        return null
      }

      return data as UserProfile | null
    } catch (error) {
      // Handle unexpected errors
      console.error('Unexpected error fetching profile:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorObject: error
      })
      return null
    }
  }, [supabase])

  // Initialize auth state
  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let mounted = true

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).then((profile) => {
          if (mounted) setProfile(profile)
        })
      }
      setLoading(false)
    }).catch((error) => {
      console.error('Error getting session:', error)
      if (mounted) setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      setUser(session?.user ?? null)
      if (session?.user) {
        const userProfile = await fetchProfile(session.user.id)
        if (mounted) setProfile(userProfile)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase client not initialized')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    if (data.user) {
      const userProfile = await fetchProfile(data.user.id)
      setProfile(userProfile)
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    if (!supabase) throw new Error('Supabase client not initialized')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
        },
      },
    })
    if (error) throw error
    // Profile is auto-created by database trigger
    if (data.user) {
      // Wait a moment for trigger to create profile
      setTimeout(async () => {
        const userProfile = await fetchProfile(data.user!.id)
        setProfile(userProfile)
      }, 500)
    }
  }

  const signOut = async () => {
    if (!supabase) throw new Error('Supabase client not initialized')
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await fetchProfile(user.id)
      setProfile(userProfile)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

