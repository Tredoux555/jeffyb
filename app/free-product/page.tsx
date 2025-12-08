'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { useAuth } from '@/lib/contexts/AuthContext'
import { generateShareUrls, formatTimeRemaining } from '@/lib/referrals'
import {
  Gift,
  Share2,
  Mail,
  Check,
  Copy,
  Users,
  ArrowRight,
  Sparkles,
  MessageCircle,
  Instagram,
  Facebook,
  Loader2,
  PartyPopper,
  CheckCircle2
} from 'lucide-react'

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
)

export default function HalfPriceRewardPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const referralCode = searchParams.get('ref')
  
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [campaign, setCampaign] = useState<any>(null)
  const [referrals, setReferrals] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [hasClaimedFreeProduct, setHasClaimedFreeProduct] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isValidRef, setIsValidRef] = useState(true)

  useEffect(() => {
    fetchData()
  }, [user, referralCode])

  const fetchData = async () => {
    try {
      const params = new URLSearchParams()
      if (user?.id) params.set('userId', user.id)
      if (referralCode) params.set('code', referralCode)
      
      const response = await fetch(`/api/referrals?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setSettings(data.settings)
        setCampaign(data.campaign)
        setReferrals(data.referrals || [])
        setHasClaimedFreeProduct(data.hasClaimedFreeProduct || false)
        if (referralCode && data.isValidCode === false) {
          setIsValidRef(false)
        }
      }
    } catch (err) {
      console.error('Error fetching referral data:', err)
    }
  }

  const handleStartCampaign = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      const data = await response.json()
      
      if (data.success) {
        setCampaign(data.campaign)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to start campaign')
    } finally {
      setLoading(false)
    }
  }

  const handleReferralSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !referralCode) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/referrals/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, referralCode })
      })
      const data = await response.json()

      if (data.success) {
        setSubmitted(true)
        // In development, auto-verify for testing
        if (data.verificationUrl) {
          // Extract token and verify
          const token = new URL(data.verificationUrl).searchParams.get('token')
          if (token) {
            const verifyResponse = await fetch('/api/referrals/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token })
            })
            const verifyData = await verifyResponse.json()
            if (verifyData.discountCode) {
              setDiscountCode(verifyData.discountCode)
            }
          }
        }
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareUrls = campaign 
    ? generateShareUrls(campaign.referral_code, typeof window !== 'undefined' ? window.location.origin : '')
    : null

  // Referral signup view (when coming from a referral link)
  if (referralCode && !user) {
    if (!isValidRef) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 py-12 px-4">
          <div className="max-w-md mx-auto text-center">
            <Card className="p-8">
              <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h1>
              <p className="text-gray-600 mb-6">This referral link is no longer valid or has expired.</p>
              <Link href="/free-product">
                <Button>Learn About Free Products</Button>
              </Link>
            </Card>
          </div>
        </div>
      )
    }

    if (submitted) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12 px-4">
          <div className="max-w-md mx-auto">
            <Card className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <PartyPopper className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">You're In! 🎉</h1>
              
              {discountCode ? (
                <>
                  <p className="text-gray-600 mb-6">
                    Your {settings?.referral_discount_percent || 30}% discount code is ready!
                  </p>
                  <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border-2 border-amber-300 rounded-xl p-4 mb-6">
                    <p className="text-sm text-amber-700 mb-2">Your Discount Code:</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-bold text-amber-900 font-mono">{discountCode}</span>
                      <button
                        onClick={() => copyToClipboard(discountCode)}
                        className="p-2 hover:bg-amber-200 rounded-lg transition-colors"
                      >
                        {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-amber-700" />}
                      </button>
                    </div>
                  </div>
                  <Link href="/products">
                    <Button className="w-full">
                      Start Shopping <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-gray-600 mb-6">
                    Check your email to verify and get your {settings?.referral_discount_percent || 30}% discount code!
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <Mail className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-blue-700">
                      We sent a verification link to <strong>{email}</strong>
                    </p>
                  </div>
                </>
              )}

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">Want your own FREE product?</p>
                <Link href="/auth/register">
                  <Button variant="outline" className="w-full">
                    Create Account & Start Sharing
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Gift className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                You've Been Invited! 🎉
              </h1>
              <p className="text-gray-600">
                Get <span className="font-bold text-amber-600">{settings?.referral_discount_percent || 30}% OFF</span> your first order!
              </p>
            </div>

            <form onSubmit={handleReferralSignup} className="space-y-4">
              <Input
                type="email"
                label="Enter your email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Claim My Discount
                  </>
                )}
              </Button>
            </form>

            <p className="text-xs text-gray-500 text-center mt-4">
              By signing up, you'll receive your discount code via email.
              No spam, just deals!
            </p>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Want to earn <strong>50% OFF</strong> any product?
              </p>
              <Link href="/auth/register" className="text-amber-600 hover:text-amber-700 font-medium text-sm">
                Create an account and start sharing →
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Logged in user view with campaign
  if (user && campaign) {
    const progress = (campaign.referral_count / (settings?.referrals_required || 10)) * 100
    const isComplete = campaign.is_completed
    const verifiedReferrals = referrals.filter(r => r.email_verified).length

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress Card */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Your Progress</h2>
              <span className="text-sm text-gray-500">
                {formatTimeRemaining(campaign.expires_at)}
              </span>
            </div>

            {isComplete ? (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-green-800 mb-2">
                  🎉 Congratulations! You did it!
                </h3>
                {campaign.reward_claimed ? (
                  <p className="text-green-700">You've already used your 50% discount!</p>
                ) : (
                  <>
                    <p className="text-green-700 mb-4">
                      Your 50% OFF code is ready:
                    </p>
                    <div className="bg-white border-2 border-green-300 rounded-lg p-3 inline-block">
                      <span className="text-xl font-bold font-mono text-green-800">
                        {campaign.reward_promo_code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(campaign.reward_promo_code)}
                        className="ml-2 p-1 hover:bg-green-100 rounded"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-green-600" />}
                      </button>
                    </div>
                    <p className="text-sm text-green-600 mt-3">
                      Use at checkout for 50% off ANY product!
                    </p>
                    <Link href="/products" className="mt-4 inline-block">
                      <Button>
                        Shop Now - 50% Off! <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-900">{verifiedReferrals}</span>
                    <span className="text-gray-500">/{settings?.referrals_required || 10}</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  {settings?.referrals_required - verifiedReferrals} more friends needed for your 50% OFF reward!
                </p>
              </>
            )}
          </Card>

          {/* Share Card */}
          {!isComplete && shareUrls && (
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Share Your Link</h2>
              
              {/* Referral Link */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">Your unique referral link:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareUrls.referralUrl}
                    readOnly
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(shareUrls.referralUrl)}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Social Share Buttons */}
              <p className="text-sm text-gray-600 mb-3">Share directly:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <a
                  href={shareUrls.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 px-4 rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={shareUrls.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#1877F2] text-white py-3 px-4 rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  <Facebook className="w-5 h-5" />
                  <span>Facebook</span>
                </a>
                <button
                  onClick={() => {
                    copyToClipboard(shareUrls.instagram)
                    alert('Link copied! Paste it in your Instagram bio or story.')
                  }}
                  className="flex items-center justify-center gap-2 bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white py-3 px-4 rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  <Instagram className="w-5 h-5" />
                  <span>Instagram</span>
                </button>
                <button
                  onClick={() => {
                    copyToClipboard(shareUrls.tiktok)
                    alert('Link copied! Paste it in your TikTok bio or video description.')
                  }}
                  className="flex items-center justify-center gap-2 bg-black text-white py-3 px-4 rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  <TikTokIcon className="w-5 h-5" />
                  <span>TikTok</span>
                </button>
              </div>
            </Card>
          )}

          {/* Referrals List */}
          {referrals.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Referrals</h2>
              <div className="space-y-3">
                {referrals.map((ref) => (
                  <div
                    key={ref.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      ref.email_verified ? 'bg-green-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        ref.email_verified ? 'bg-green-200' : 'bg-gray-200'
                      }`}>
                        {ref.email_verified ? (
                          <Check className="w-4 h-4 text-green-700" />
                        ) : (
                          <Mail className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <span className="text-gray-700">{ref.email}</span>
                    </div>
                    <span className={`text-sm ${
                      ref.email_verified ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {ref.email_verified ? 'Verified ✓' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    )
  }

  // Default view - explain the program
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Gift className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Get 50% OFF Any Product! 🎉
          </h1>
          <p className="text-xl text-gray-600 max-w-xl mx-auto">
            Share Jeffy with {settings?.referrals_required || 10} friends and get 
            50% OFF any product you want!
          </p>
        </div>

        {/* How it works */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">1. Share Your Link</h3>
              <p className="text-gray-600 text-sm">
                Get your unique referral link and share it with friends on WhatsApp, Instagram, Facebook & TikTok
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">2. Friends Sign Up</h3>
              <p className="text-gray-600 text-sm">
                When {settings?.referrals_required || 10} friends verify their email, you unlock your reward! 
                They also get {settings?.referral_discount_percent || 30}% off!
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">3. Get 50% Off!</h3>
              <p className="text-gray-600 text-sm">
                Choose ANY product and get 50% off! Can't find what you want? Request it and still get 50% off!
              </p>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <Card className="p-8 text-center bg-gradient-to-r from-amber-500 to-yellow-500 text-white">
          {hasClaimedFreeProduct ? (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-90" />
              <h2 className="text-2xl font-bold mb-2">You've Already Claimed!</h2>
              <p className="opacity-90 mb-4">
                You've already used your 50% discount. Thanks for being part of the Jeffy family!
              </p>
              <Link href="/products">
                <Button variant="outline" className="bg-white text-amber-600 border-white hover:bg-amber-50">
                  Continue Shopping
                </Button>
              </Link>
            </>
          ) : user ? (
            <>
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-90" />
              <h2 className="text-2xl font-bold mb-2">Ready to Start?</h2>
              <p className="opacity-90 mb-4">
                Create your referral campaign and start sharing!
              </p>
              <Button
                onClick={handleStartCampaign}
                disabled={loading}
                className="bg-white text-amber-600 hover:bg-amber-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Share2 className="w-4 h-4 mr-2" />
                )}
                Start My Campaign
              </Button>
            </>
          ) : (
            <>
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-90" />
              <h2 className="text-2xl font-bold mb-2">Ready to Get Started?</h2>
              <p className="opacity-90 mb-4">
                Create a free account to start your referral campaign!
              </p>
              <Link href="/auth/register">
                <Button className="bg-white text-amber-600 hover:bg-amber-50">
                  Create Free Account <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </>
          )}
        </Card>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Questions?</h2>
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-bold text-gray-900 mb-1">How long do I have?</h3>
              <p className="text-gray-600 text-sm">
                You have {settings?.referral_expiry_days || 30} days from when you start your campaign to get all {settings?.referrals_required || 10} referrals.
              </p>
            </Card>
            <Card className="p-4">
              <h3 className="font-bold text-gray-900 mb-1">What do my friends get?</h3>
              <p className="text-gray-600 text-sm">
                Everyone who signs up through your link gets {settings?.referral_discount_percent || 30}% off their first order - plus they can start their own campaign!
              </p>
            </Card>
            <Card className="p-4">
              <h3 className="font-bold text-gray-900 mb-1">Can I do this more than once?</h3>
              <p className="text-gray-600 text-sm">
                The 50% discount reward is a one-time special offer. Make it count!
              </p>
            </Card>
            <Card className="p-4">
              <h3 className="font-bold text-gray-900 mb-1">What if I can't find what I want?</h3>
              <p className="text-gray-600 text-sm">
                No problem! Request any product through "Jeffy Wants" and you'll still get 50% off when we stock it!
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

