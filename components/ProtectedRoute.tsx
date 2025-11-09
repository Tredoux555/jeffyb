'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { Package } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

/**
 * Client-side route protection wrapper
 * Use this as a backup for routes that need extra protection
 * Note: Middleware handles server-side protection, this is for client-side UX
 */
export function ProtectedRoute({ children, redirectTo = '/auth/login' }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      const currentPath = window.location.pathname
      router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`)
    }
  }, [user, loading, router, redirectTo])

  if (loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <Package className="w-12 h-12 text-green-500 animate-[spin_3s_linear_infinite]" />
          </div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return <>{children}</>
}

