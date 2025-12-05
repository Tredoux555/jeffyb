'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { ProductRequestForm } from '@/components/ProductRequestForm'
import { 
  Mail, 
  Clock, 
  Package, 
  Facebook, 
  Instagram, 
  MessageCircle,
  Video,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react'

export default function ComingSoonPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [daysUntilLaunch, setDaysUntilLaunch] = useState(0)
  const [hoursUntilLaunch, setHoursUntilLaunch] = useState(0)
  const [minutesUntilLaunch, setMinutesUntilLaunch] = useState(0)
  const [secondsUntilLaunch, setSecondsUntilLaunch] = useState(0)

  // Set launch date (30 days from now as default - adjust as needed)
  const launchDate = new Date()
  launchDate.setDate(launchDate.getDate() + 30)

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime()
      const distance = launchDate.getTime() - now

      if (distance > 0) {
        setDaysUntilLaunch(Math.floor(distance / (1000 * 60 * 60 * 24)))
        setHoursUntilLaunch(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))
        setMinutesUntilLaunch(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)))
        setSecondsUntilLaunch(Math.floor((distance % (1000 * 60)) / 1000))
      } else {
        setDaysUntilLaunch(0)
        setHoursUntilLaunch(0)
        setMinutesUntilLaunch(0)
        setSecondsUntilLaunch(0)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/coming-soon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name: name || null }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to sign up')
      }

      setSubmitStatus('success')
      setEmail('')
      setName('')

      setTimeout(() => {
        setSubmitStatus('idle')
      }, 5000)
    } catch (error) {
      console.error('Error signing up:', error)
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to sign up. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Social media URLs from environment variables
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL || '#'
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || '#'
  const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL || '#'
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}` : '#'

  return (
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full space-y-8">
        {/* Main Coming Soon Card */}
        <Card className="text-center p-8 sm:p-12">
          <div className="mb-8">
            <Package className="w-20 h-20 sm:w-24 sm:h-24 text-jeffy-yellow mx-auto mb-4 animate-bounce" />
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              Jeffy is Coming Soon!
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 mb-2">
              Your one-stop shop for quality products
            </p>
            <p className="text-lg text-gray-600">
              Gym Equipment • Camping Gear • Kitchen Essentials • Beauty Products
            </p>
          </div>

          {/* Countdown Timer */}
          <div className="mb-8">
            <p className="text-sm text-gray-600 mb-4">We're launching in:</p>
            <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
              <div className="bg-jeffy-yellow-light rounded-lg p-4">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900">{daysUntilLaunch}</div>
                <div className="text-sm text-gray-600">Days</div>
              </div>
              <div className="bg-jeffy-yellow-light rounded-lg p-4">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900">{hoursUntilLaunch}</div>
                <div className="text-sm text-gray-600">Hours</div>
              </div>
              <div className="bg-jeffy-yellow-light rounded-lg p-4">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900">{minutesUntilLaunch}</div>
                <div className="text-sm text-gray-600">Minutes</div>
              </div>
              <div className="bg-jeffy-yellow-light rounded-lg p-4">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900">{secondsUntilLaunch}</div>
                <div className="text-sm text-gray-600">Seconds</div>
              </div>
            </div>
          </div>

          {/* Email Signup Form */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Get Notified When We Launch
            </h2>
            <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto space-y-4">
              <Input
                label="Name (Optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
              <Input
                label="Email Address *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
              <Button
                type="submit"
                disabled={submitting || !email}
                className="w-full"
              >
                {submitting ? (
                  'Signing Up...'
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Notify Me
                  </>
                )}
              </Button>
            </form>

            {submitStatus === 'success' && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-800 font-medium">
                  Thanks! We'll notify you when we launch.
                </p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-800">{errorMessage}</p>
              </div>
            )}
          </div>

          {/* Social Media Links */}
          <div className="mb-8">
            <p className="text-gray-600 mb-4">Follow us for updates:</p>
            <div className="flex justify-center gap-4">
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                aria-label="Instagram"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
                aria-label="TikTok"
              >
                <Video className="w-6 h-6" />
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-6 h-6" />
              </a>
            </div>
          </div>
        </Card>

        {/* Product Request Form */}
        <ProductRequestForm />
      </div>
    </div>
  )
}

