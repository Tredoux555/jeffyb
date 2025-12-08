'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Check,
  Gift,
  ShoppingBag
} from 'lucide-react'

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_verified'>('loading')
  const [discountCode, setDiscountCode] = useState('')
  const [discountPercent, setDiscountPercent] = useState(30)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (token) {
      verifyEmail()
    } else {
      setStatus('error')
      setError('No verification token provided')
    }
  }, [token])

  const verifyEmail = async () => {
    try {
      const response = await fetch('/api/referrals/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      const data = await response.json()

      if (data.success) {
        if (data.alreadyVerified) {
          setStatus('already_verified')
        } else {
          setStatus('success')
        }
        setDiscountCode(data.discountCode)
        setDiscountPercent(data.discountPercent || 30)
      } else {
        setStatus('error')
        setError(data.error || 'Verification failed')
      }
    } catch (err) {
      setStatus('error')
      setError('Something went wrong. Please try again.')
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(discountCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center px-4">
        <Card className="p-8 text-center max-w-md w-full">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Verifying your email...</h1>
          <p className="text-gray-600">Just a moment!</p>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center px-4">
        <Card className="p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/free-product">
            <Button variant="outline">Try Again</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card className="p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'already_verified' ? 'Already Verified!' : 'Email Verified! 🎉'}
          </h1>
          
          <p className="text-gray-600 mb-6">
            {status === 'already_verified' 
              ? 'Your email was already verified. Here\'s your discount code again:'
              : `Awesome! You've got ${discountPercent}% off your first order!`
            }
          </p>

          <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border-2 border-amber-300 rounded-xl p-6 mb-6">
            <p className="text-sm text-amber-700 mb-2">Your Discount Code:</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-bold text-amber-900 font-mono tracking-wider">
                {discountCode}
              </span>
              <button
                onClick={copyToClipboard}
                className="p-2 bg-amber-200 hover:bg-amber-300 rounded-lg transition-colors"
                title="Copy code"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-amber-700" />
                )}
              </button>
            </div>
            {copied && (
              <p className="text-sm text-green-600 mt-2">Copied to clipboard!</p>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-bold text-gray-900 mb-2">How to use:</h3>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Browse our products</li>
              <li>2. Add items to your cart</li>
              <li>3. Enter your code at checkout</li>
              <li>4. Enjoy {discountPercent}% off!</li>
            </ol>
          </div>

          <div className="space-y-3">
            <Link href="/products" className="block">
              <Button className="w-full">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Start Shopping
              </Button>
            </Link>
            
            <Link href="/free-product" className="block">
              <Button variant="outline" className="w-full">
                <Gift className="w-4 h-4 mr-2" />
                Get Your Own FREE Product
              </Button>
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            Code valid for 30 days. One-time use only.
          </p>
        </Card>
      </div>
    </div>
  )
}

