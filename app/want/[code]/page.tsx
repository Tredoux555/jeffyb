'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { 
  CheckCircle, 
  ThumbsUp, 
  Heart,
  Package,
  Users,
  Sparkles,
  ArrowRight,
  MessageCircle,
  Bell,
  X
} from 'lucide-react'

interface JeffyRequestData {
  id: string
  request_text: string
  requester_name: string
  referral_code: string
  approvals_needed: number
  approvals_received: number
  status: string
  is_free_product_earned: boolean
  matched_product_name?: string
  created_at: string
  approvals?: Array<{
    id: string
    approver_name?: string
    approval_type: string
    comment?: string
    created_at: string
  }>
}

export default function ApprovalPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params)
  const [request, setRequest] = useState<JeffyRequestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    approver_name: '',
    approver_email: '',
    approval_type: 'good_idea' as 'good_idea' | 'want_it_too',
    comment: '',
    wants_updates: false,
    wants_own_link: false
  })

  useEffect(() => {
    fetchRequest()
  }, [resolvedParams.code])

  const fetchRequest = async () => {
    try {
      // Get source from URL params
      const urlParams = new URLSearchParams(window.location.search)
      const source = urlParams.get('source') || 'direct'
      
      const response = await fetch(`/api/jeffy-wants/${resolvedParams.code}?track=true&source=${source}`)
      const data = await response.json()
      
      if (data.success) {
        setRequest(data.data)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/jeffy-wants/${resolvedParams.code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          referral_source: new URLSearchParams(window.location.search).get('source') || 'direct'
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit approval')
      }

      setSubmitted(true)
      
      // Refresh to show updated approval count
      fetchRequest()

    } catch (err) {
      console.error('Error submitting approval:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading..." fullScreen />
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
            <Button>Create Your Own Request</Button>
          </Link>
        </Card>
      </div>
    )
  }

  // Success state after approval
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100 py-8 px-4">
        <div className="container mx-auto max-w-lg">
          <Card className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Thanks for Your Support! 🎉
            </h2>
            <p className="text-slate-600 mb-6">
              You've helped {request?.requester_name} get closer to their FREE product!
            </p>

            <div className="bg-slate-100 rounded-xl p-4 mb-6">
              <div className="text-4xl font-bold text-jeffy-yellow mb-2">
                {request?.approvals_received}/{request?.approvals_needed}
              </div>
              <p className="text-slate-600 text-sm">Approvals received</p>
              <div className="w-full bg-slate-200 rounded-full h-3 mt-3">
                <div 
                  className="bg-jeffy-yellow h-3 rounded-full transition-all duration-500"
                  style={{ width: `${((request?.approvals_received || 0) / (request?.approvals_needed || 10)) * 100}%` }}
                />
              </div>
            </div>

            {request?.is_free_product_earned && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <p className="text-green-700 font-semibold">
                  🎊 This request has earned a FREE product!
                </p>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-slate-700 font-medium">
                Want your own FREE product?
              </p>
              <Link href="/free-products">
                <Button className="w-full" size="lg">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Tell Jeffy What YOU Want
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-jeffy-yellow" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Help Your Friend Get This FREE! 🎁
          </h1>
          <p className="text-slate-600">
            {request?.requester_name} wants your opinion on this product idea
          </p>
        </div>

        {/* Request Details */}
        <Card className="p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-jeffy-yellow/20 rounded-xl flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6 text-jeffy-yellow" />
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">
                {request?.requester_name} is looking for:
              </p>
              <p className="text-lg text-slate-900 font-medium">
                "{request?.request_text}"
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-500" />
                <span className="text-sm text-slate-600">Approval Progress</span>
              </div>
              <span className="font-bold text-slate-900">
                {request?.approvals_received}/{request?.approvals_needed}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div 
                className="bg-jeffy-yellow h-3 rounded-full transition-all duration-500"
                style={{ width: `${((request?.approvals_received || 0) / (request?.approvals_needed || 10)) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {(request?.approvals_needed || 10) - (request?.approvals_received || 0)} more approvals needed for FREE product!
            </p>
          </div>
        </Card>

        {/* Approval Form */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            What do you think? 🤔
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Approval Type Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, approval_type: 'good_idea' })}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  formData.approval_type === 'good_idea'
                    ? 'border-jeffy-yellow bg-yellow-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <ThumbsUp className={`w-8 h-8 mx-auto mb-2 ${
                  formData.approval_type === 'good_idea' ? 'text-jeffy-yellow' : 'text-slate-400'
                }`} />
                <p className="font-semibold text-slate-900">Good Idea!</p>
                <p className="text-xs text-slate-500">I agree this is useful</p>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData({ ...formData, approval_type: 'want_it_too' })}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  formData.approval_type === 'want_it_too'
                    ? 'border-red-400 bg-red-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Heart className={`w-8 h-8 mx-auto mb-2 ${
                  formData.approval_type === 'want_it_too' ? 'text-red-500' : 'text-slate-400'
                }`} />
                <p className="font-semibold text-slate-900">I Want It Too!</p>
                <p className="text-xs text-slate-500">Add me to the list</p>
              </button>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Your Name"
                value={formData.approver_name}
                onChange={(e) => setFormData({ ...formData, approver_name: e.target.value })}
                placeholder="John"
              />
              <Input
                label="Your Email *"
                type="email"
                value={formData.approver_email}
                onChange={(e) => setFormData({ ...formData, approver_email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>

            {/* Optional Comment */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Add a comment (optional)
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Great idea! I've been looking for something like this too..."
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-jeffy-yellow focus:bg-white transition-all resize-none"
                rows={2}
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.wants_updates}
                  onChange={(e) => setFormData({ ...formData, wants_updates: e.target.checked })}
                  className="w-5 h-5 text-jeffy-yellow border-slate-300 rounded focus:ring-jeffy-yellow"
                />
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700">
                    Notify me when this product is available
                  </span>
                </div>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.wants_own_link}
                  onChange={(e) => setFormData({ ...formData, wants_own_link: e.target.checked })}
                  className="w-5 h-5 text-jeffy-yellow border-slate-300 rounded focus:ring-jeffy-yellow"
                />
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700">
                    I want my own link to get this FREE too!
                  </span>
                </div>
              </label>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting || !formData.approver_email}
              className="w-full"
              size="lg"
            >
              {submitting ? (
                'Submitting...'
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Submit My Approval
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Recent Approvals */}
        {request?.approvals && request.approvals.length > 0 && (
          <Card className="p-6 mt-6">
            <h3 className="font-semibold text-slate-900 mb-4">Recent Approvals</h3>
            <div className="space-y-3">
              {request.approvals.slice(0, 5).map((approval) => (
                <div key={approval.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    approval.approval_type === 'want_it_too' ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    {approval.approval_type === 'want_it_too' ? (
                      <Heart className="w-5 h-5 text-red-500" />
                    ) : (
                      <ThumbsUp className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">
                      {approval.approver_name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {approval.approval_type === 'want_it_too' ? 'Wants it too!' : 'Agrees it\'s a good idea'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* CTA to create own request */}
        <div className="text-center mt-8">
          <p className="text-slate-600 mb-3">Want your own FREE product?</p>
          <Link href="/free-products">
            <Button variant="outline">
              Tell Jeffy What You Want
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

