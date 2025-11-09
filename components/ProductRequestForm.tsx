'use client'

import React, { useState } from 'react'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Card } from '@/components/Card'
import { Package, Send, CheckCircle, AlertCircle } from 'lucide-react'

interface ProductRequestFormProps {
  onSuccess?: () => void
  className?: string
}

export function ProductRequestForm({ onSuccess, className }: ProductRequestFormProps) {
  const [formData, setFormData] = useState({
    product_name: '',
    description: '',
    category: '',
    estimated_price_range: '',
    quantity_needed: '',
    urgency: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    requester_name: '',
    requester_email: '',
    requester_phone: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/product-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          quantity_needed: formData.quantity_needed ? parseInt(formData.quantity_needed) : null,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit request')
      }

      setSubmitStatus('success')
      setFormData({
        product_name: '',
        description: '',
        category: '',
        estimated_price_range: '',
        quantity_needed: '',
        urgency: 'normal',
        requester_name: '',
        requester_email: '',
        requester_phone: ''
      })

      if (onSuccess) {
        onSuccess()
      }

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle')
      }, 5000)
    } catch (error) {
      console.error('Error submitting product request:', error)
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-6 h-6 text-jeffy-yellow" />
        <h3 className="text-xl font-bold text-gray-900">Looking for Something Specific?</h3>
      </div>
      <p className="text-gray-600 mb-6">
        Can't find what you're looking for? Tell us what product you need, and we'll source it for you at a great price!
      </p>

      {submitStatus === 'success' && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800 font-medium">
            Request submitted! We'll get back to you soon with options.
          </p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Product Name *"
            value={formData.product_name}
            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
            placeholder="e.g., Adjustable Dumbbells"
            required
          />
          <Input
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., Gym Equipment, Camping Gear"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Tell us more about what you're looking for..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jeffy-yellow focus:border-jeffy-yellow outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Estimated Price Range"
            value={formData.estimated_price_range}
            onChange={(e) => setFormData({ ...formData, estimated_price_range: e.target.value })}
            placeholder="e.g., R500-R1000"
          />
          <Input
            label="Quantity Needed"
            type="number"
            value={formData.quantity_needed}
            onChange={(e) => setFormData({ ...formData, quantity_needed: e.target.value })}
            placeholder="1"
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Urgency
          </label>
          <select
            value={formData.urgency}
            onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jeffy-yellow focus:border-jeffy-yellow outline-none"
          >
            <option value="low">Low - Just browsing</option>
            <option value="normal">Normal - Within a few weeks</option>
            <option value="high">High - Need it soon</option>
            <option value="urgent">Urgent - Need it ASAP</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Your Name"
            value={formData.requester_name}
            onChange={(e) => setFormData({ ...formData, requester_name: e.target.value })}
            placeholder="John Doe"
          />
          <Input
            label="Email *"
            type="email"
            value={formData.requester_email}
            onChange={(e) => setFormData({ ...formData, requester_email: e.target.value })}
            placeholder="john@example.com"
            required
          />
        </div>

        <Input
          label="Phone Number"
          type="tel"
          value={formData.requester_phone}
          onChange={(e) => setFormData({ ...formData, requester_phone: e.target.value })}
          placeholder="+27 12 345 6789"
        />

        <Button
          type="submit"
          disabled={submitting || !formData.product_name || !formData.requester_email}
          className="w-full"
        >
          {submitting ? (
            'Submitting...'
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Request
            </>
          )}
        </Button>
      </form>
    </Card>
  )
}

