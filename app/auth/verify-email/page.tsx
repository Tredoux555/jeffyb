'use client'

import React, { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const handleResend = async () => {
    if (!email) return
    setResending(true)
    
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify-email?email=${encodeURIComponent(email)}`
        }
      })
      
      if (error) {
        console.error('Error resending confirmation:', error)
        alert('Failed to resend confirmation email. Please try again later.')
      } else {
        setResent(true)
      }
    } catch (err) {
      console.error('Error resending confirmation:', err)
      alert('Failed to resend confirmation email. Please try again later.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-b from-jeffy-yellow to-amber-100 rounded-full mb-4">
            <Mail className="w-8 h-8 text-gray-900" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
          <p className="text-gray-600 mb-6">
            We've sent a confirmation link to <strong>{email || 'your email'}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Please click the link in the email to verify your account before logging in.
          </p>
          
          {!resent ? (
            <Button
              onClick={handleResend}
              disabled={resending}
              variant="outline"
              className="w-full mb-4"
            >
              {resending ? 'Sending...' : 'Resend Confirmation Email'}
            </Button>
          ) : (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-4">
              Confirmation email sent!
            </div>
          )}
          
          <Link href="/auth/login" className="text-jeffy-yellow hover:underline text-sm">
            Back to Login
          </Link>
        </div>
      </Card>
    </div>
  )
}

