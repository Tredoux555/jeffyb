'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { 
  CheckCircle, 
  Clock,
  ThumbsUp, 
  Heart,
  Package,
  Users,
  Share2,
  RefreshCw,
  PartyPopper,
  Truck,
  Copy,
  X
} from 'lucide-react'

interface JeffyRequestData {
  id: string
  request_text: string
  requester_name: string
  requester_email: string
  referral_code: string
  approvals_needed: number
  approvals_received: number
  status: string
  is_free_product_earned: boolean
  free_product_shipped: boolean
  shipping_tracking?: string
  shipping_address?: {
    name: string
    address: string
    city: string
    postal_code: string
    phone: string
  }
  matched_product_name?: string
  total_link_clicks: number
  created_at: string
  completed_at?: string
  approvals?: Array<{
    id: string
    approver_name?: string
    approver_email: string
    approval_type: string
    comment?: string
    created_at: string
  }>
}

export default function StatusPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params)
  const [request, setRequest] = useState<JeffyRequestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showShippingForm, setShowShippingForm] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState('')
  const [shippingData, setShippingData] = useState({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    phone: ''
  })
  const [savingShipping, setSavingShipping] = useState(false)

  const shareableLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/want/${resolvedParams.code}` 
    : ''

  useEffect(() => {
    fetchRequest()
  }, [resolvedParams.code])

  const fetchRequest = async () => {
    try {
      const response = await fetch(`/api/jeffy-wants/${resolvedParams.code}`)
      const data = await response.json()
      
      if (data.success) {
        setRequest(data.data)
        if (data.data.shipping_address) {
          setShippingData(data.data.shipping_address)
        }
      } else {
        setError(data.error || 'Request not found')
      }
    } catch (err) {
      console.error('Error fetching request:', err)
      setError('Failed to load request')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveShipping = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingShipping(true)

    try {
      const response = await fetch(`/api/jeffy-wants/${resolvedParams.code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipping_address: shippingData,
          requester_email: verifyEmail
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      setShowShippingForm(false)
      fetchRequest()
      alert('Shipping address saved!')

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save address')
    } finally {
      setSavingShipping(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareableLink)
    alert('Link copied!')
  }

  if (loading) {
    return <LoadingSpinner message="Loading your status..." fullScreen />
  }

  if (error && !request) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100 flex items-center justify-center px-4">
        <Card className="p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Request Not Found</h2>
          <p className="text-slate-600 mb-4">This link may have expired or is invalid.</p>
          <Link href="/free-products">
            <Button>Create a New Request</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const progressPercent = ((request?.approvals_received || 0) / (request?.approvals_needed || 10)) * 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-jeffy-yellow" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Your Request Status
          </h1>
          <p className="text-slate-600">Track your progress to a FREE product!</p>
        </div>

        {/* Main Status Card */}
        <Card className="p-6 mb-6">
          {/* Progress Circle */}
          <div className="text-center mb-6">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="12"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke={request?.is_free_product_earned ? '#22c55e' : '#fbbf24'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${progressPercent * 3.52} 352`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-3xl font-bold text-slate-900">
                    {request?.approvals_received}
                  </span>
                  <span className="text-slate-400">/{request?.approvals_needed}</span>
                </div>
              </div>
            </div>

            {request?.is_free_product_earned ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold">
                <PartyPopper className="w-5 h-5" />
                FREE Product Earned!
              </div>
            ) : (
              <p className="text-slate-600">
                <span className="font-bold text-slate-900">
                  {(request?.approvals_needed || 10) - (request?.approvals_received || 0)}
                </span>{' '}
                more approvals needed
              </p>
            )}
          </div>

          {/* Request Details */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-500 mb-1">Your request:</p>
            <p className="text-slate-900 font-medium">"{request?.request_text}"</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <Users className="w-6 h-6 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-900">{request?.approvals_received}</p>
              <p className="text-xs text-slate-600">Approvals</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <Share2 className="w-6 h-6 text-purple-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-900">{request?.total_link_clicks || 0}</p>
              <p className="text-xs text-slate-600">Link Clicks</p>
            </div>
          </div>

          {/* Share Link */}
          <div className="border-t border-slate-200 pt-6">
            <p className="text-sm font-medium text-slate-700 mb-3">Share your link:</p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                readOnly
                value={shareableLink}
                className="flex-1 px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono text-slate-600"
              />
              <Button variant="outline" onClick={copyLink}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Help me get this FREE! ${shareableLink}?source=whatsapp`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
              >
                WhatsApp
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableLink + '?source=facebook')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Facebook
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Help me get this FREE! ${shareableLink}?source=twitter`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600"
              >
                X/Twitter
              </a>
              <a
                href={`mailto:?subject=Help me get this FREE!&body=${encodeURIComponent(`Hey! I found something cool. Can you check it out? ${shareableLink}?source=email`)}`}
                className="px-3 py-1.5 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
              >
                Email
              </a>
            </div>
          </div>
        </Card>

        {/* Shipping Address Form (when eligible) */}
        {request?.is_free_product_earned && !request?.shipping_address && (
          <Card className="p-6 mb-6 border-2 border-green-300 bg-green-50">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="w-6 h-6 text-green-600" />
              <h3 className="font-bold text-green-800">Add Your Shipping Address!</h3>
            </div>
            <p className="text-green-700 text-sm mb-4">
              Congratulations! You've earned your FREE product. Enter your shipping details below.
            </p>
            
            {!showShippingForm ? (
              <Button onClick={() => setShowShippingForm(true)} className="w-full">
                Enter Shipping Address
              </Button>
            ) : (
              <form onSubmit={handleSaveShipping} className="space-y-4">
                <Input
                  label="Verify Your Email *"
                  type="email"
                  value={verifyEmail}
                  onChange={(e) => setVerifyEmail(e.target.value)}
                  placeholder="Enter the email you used"
                  required
                />
                <Input
                  label="Full Name *"
                  value={shippingData.name}
                  onChange={(e) => setShippingData({ ...shippingData, name: e.target.value })}
                  required
                />
                <Input
                  label="Street Address *"
                  value={shippingData.address}
                  onChange={(e) => setShippingData({ ...shippingData, address: e.target.value })}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="City *"
                    value={shippingData.city}
                    onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                    required
                  />
                  <Input
                    label="Postal Code *"
                    value={shippingData.postal_code}
                    onChange={(e) => setShippingData({ ...shippingData, postal_code: e.target.value })}
                    required
                  />
                </div>
                <Input
                  label="Phone Number *"
                  value={shippingData.phone}
                  onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })}
                  required
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowShippingForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={savingShipping} className="flex-1">
                    {savingShipping ? 'Saving...' : 'Save Address'}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        )}

        {/* Shipping Status */}
        {request?.shipping_address && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="w-6 h-6 text-slate-600" />
              <h3 className="font-bold text-slate-900">Shipping Details</h3>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <p><strong>Name:</strong> {request.shipping_address.name}</p>
              <p><strong>Address:</strong> {request.shipping_address.address}</p>
              <p><strong>City:</strong> {request.shipping_address.city}, {request.shipping_address.postal_code}</p>
              <p><strong>Phone:</strong> {request.shipping_address.phone}</p>
            </div>
            {request.free_product_shipped ? (
              <div className="mt-4 p-4 bg-green-50 rounded-xl">
                <p className="text-green-700 font-semibold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Product Shipped!
                </p>
                {request.shipping_tracking && (
                  <p className="text-sm text-green-600 mt-1">
                    Tracking: {request.shipping_tracking}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 p-4 bg-yellow-50 rounded-xl">
                <p className="text-yellow-700 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Processing your free product...
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Approvals List */}
        {request?.approvals && request.approvals.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Your Supporters</h3>
              <Button variant="ghost" size="sm" onClick={fetchRequest}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {request.approvals.map((approval, index) => (
                <div key={approval.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-jeffy-yellow rounded-full flex items-center justify-center text-slate-900 font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">
                      {approval.approver_name || approval.approver_email.split('@')[0]}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      {approval.approval_type === 'want_it_too' ? (
                        <>
                          <Heart className="w-3 h-3 text-red-500" />
                          Wants it too!
                        </>
                      ) : (
                        <>
                          <ThumbsUp className="w-3 h-3 text-green-500" />
                          Good idea!
                        </>
                      )}
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Refresh Button */}
        <div className="text-center mt-6">
          <Button variant="outline" onClick={fetchRequest}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Status
          </Button>
        </div>
      </div>
    </div>
  )
}

