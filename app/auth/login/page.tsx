'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { useAuth } from '@/lib/contexts/AuthContext'
import { Package } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (authLoading) return
    if (user) {
      const redirectTo = searchParams.get('redirect') || '/profile'
      router.push(redirectTo)
    }
  }, [user, authLoading, searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
      // Get redirect URL from query params or default to profile
      const redirectTo = searchParams.get('redirect') || '/profile'
      router.push(redirectTo)
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Provide more helpful error messages
      if (error.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. If you just registered, please check your email to confirm your account.')
      } else if (error.message?.includes('Email not confirmed') || error.message?.includes('email_not_confirmed')) {
        setError('Please check your email and click the confirmation link before logging in.')
      } else {
        setError(error.message || 'Invalid email or password')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100 flex items-center justify-center px-3 sm:px-4 py-8">
      <Card className="w-full max-w-md p-4 sm:p-6" padding="lg">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-jeffy-yellow to-amber-500 rounded-2xl mb-4 shadow-lg">
            <Package className="w-8 h-8 text-slate-900" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
          <p className="text-sm sm:text-base text-slate-600">Sign in to your Jeffy account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-jeffy-yellow focus:ring-jeffy-yellow" />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            <Link href="/auth/forgot-password" className="text-sm text-jeffy-yellow hover:underline">
              Forgot password?
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            Sign In
          </Button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-jeffy-yellow font-medium hover:underline">
              Register here
            </Link>
          </p>
        </form>
      </Card>
    </div>
  )
}

