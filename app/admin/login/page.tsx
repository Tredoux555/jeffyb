'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Package } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [credentials, setCredentials] = useState({
    email: 'admin@jeffy.com',
    password: 'jeffy123'
  })
  const [error, setError] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      // For now, we'll use simple credential checking
      // In production, this should use Supabase Auth
      if (credentials.email === 'admin@jeffy.com' && credentials.password === 'jeffy123') {
        // Set admin session
        localStorage.setItem('jeffy-admin', 'true')
        router.push('/admin')
      } else {
        setError('Invalid credentials')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An error occurred during login')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-jeffy-grey rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-jeffy-yellow" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Jeffy Admin</h1>
          <p className="text-gray-600">Sign in to manage your store</p>
        </div>
        
        {/* Login Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                placeholder="admin@jeffy.com"
                required
              />
              
              <Input
                label="Password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                placeholder="Enter your password"
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            <Button type="submit" loading={loading} className="w-full">
              Sign In
            </Button>
            
            {/* Quick Login Button */}
            <Button 
              type="button" 
              variant="outline" 
              onClick={async () => {
                setCredentials({ email: 'admin@jeffy.com', password: 'jeffy123' })
                setLoading(true)
                setError('')
                
                try {
                  // Set admin session
                  localStorage.setItem('jeffy-admin', 'true')
                  router.push('/admin')
                } catch (error) {
                  console.error('Login error:', error)
                  setError('An error occurred during login')
                } finally {
                  setLoading(false)
                }
              }}
              className="w-full"
            >
              Quick Login (Auto-fill)
            </Button>
          </form>
          
          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gradient-to-b from-jeffy-yellow to-amber-100-light rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Demo Credentials (Pre-filled):</h3>
            <p className="text-sm text-gray-700">
              <strong>Email:</strong> admin@jeffy.com<br />
              <strong>Password:</strong> jeffy123
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Credentials are pre-filled for easy access. Click &quot;Quick Login&quot; for instant access.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
