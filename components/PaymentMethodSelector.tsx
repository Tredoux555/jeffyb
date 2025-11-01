'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/contexts/AuthContext'
import { SavedPaymentMethod } from '@/types/database'
import { Button } from './Button'
import { CreditCard, Plus } from 'lucide-react'

interface PaymentMethodSelectorProps {
  selectedPaymentId?: string | null
  onSelect: (paymentMethod: SavedPaymentMethod | null) => void
  allowNew?: boolean
  onNew?: () => void
}

export function PaymentMethodSelector({ selectedPaymentId, onSelect, allowNew = true, onNew }: PaymentMethodSelectorProps) {
  const { user } = useAuth()
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    fetchPaymentMethods()
  }, [user])

  const fetchPaymentMethods = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('saved_payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setPaymentMethods(data || [])

      // Auto-select default payment method if none selected
      if (!selectedPaymentId && data && data.length > 0) {
        const defaultPayment = data.find((p) => p.is_default) || data[0]
        onSelect(defaultPayment)
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCardNumber = (last4: string | null) => {
    if (!last4) return '****'
    return `•••• ${last4}`
  }

  if (!user || loading) {
    return null
  }

  if (paymentMethods.length === 0) {
    return (
      <div>
        <p className="text-sm text-gray-600 mb-2">No saved payment methods</p>
        {allowNew && onNew && (
          <Button variant="outline" size="sm" onClick={onNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Method
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select a saved payment method
      </label>
      <select
        value={selectedPaymentId || ''}
        onChange={(e) => {
          const payment = paymentMethods.find((p) => p.id === e.target.value)
          onSelect(payment || null)
        }}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jeffy-yellow focus:border-transparent"
      >
        <option value="">Choose a payment method...</option>
        {paymentMethods.map((payment) => (
          <option key={payment.id} value={payment.id}>
            {payment.type === 'card' && payment.last4
              ? `${payment.brand || 'Card'} ${formatCardNumber(payment.last4)} ${payment.is_default ? '(Default)' : ''}`
              : `${payment.type} ${payment.is_default ? '(Default)' : ''}`}
          </option>
        ))}
      </select>
      {allowNew && onNew && (
        <Button variant="outline" size="sm" onClick={onNew} className="mt-2">
          <Plus className="w-4 h-4 mr-2" />
          Use a different payment method
        </Button>
      )}
    </div>
  )
}

