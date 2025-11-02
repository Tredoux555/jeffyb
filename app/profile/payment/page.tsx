'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { createClient } from '@/lib/supabase'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { PaymentMethodCard } from '@/components/PaymentMethodCard'
import { SavedPaymentMethod } from '@/types/database'
import { Package, Plus, CreditCard, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function PaymentPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPayment, setEditingPayment] = useState<SavedPaymentMethod | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'card' as 'card' | 'paypal' | 'other',
    last4: '',
    brand: '',
    expiry_month: '',
    expiry_year: '',
    is_default: false,
  })

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/auth/login')
      return
    }

    fetchPaymentMethods()
  }, [user, authLoading])

  const fetchPaymentMethods = async () => {
    if (!user) return

    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('saved_payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setPaymentMethods(data || [])
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      alert('Error loading payment methods')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // For now, this is a simple form that saves payment info
    // In production, this should integrate with Stripe/PayPal for secure tokenization
    // For demo purposes, we'll just save the basic info

    try {
      setFormLoading(true)
      const supabase = createClient()

      // If setting as default, unset other defaults first
      if (formData.is_default) {
        await supabase
          .from('saved_payment_methods')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true)
      }

      const paymentData: Omit<SavedPaymentMethod, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'stripe_payment_method_id'> = {
        type: formData.type,
        last4: formData.last4 || null,
        brand: formData.brand || null,
        expiry_month: formData.expiry_month ? parseInt(formData.expiry_month) : null,
        expiry_year: formData.expiry_year ? parseInt(formData.expiry_year) : null,
        is_default: formData.is_default,
      }

      if (editingPayment) {
        // Update existing payment method
        const { error } = await supabase
          .from('saved_payment_methods')
          .update({
            ...paymentData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPayment.id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // Create new payment method
        const { error } = await supabase
          .from('saved_payment_methods')
          .insert({
            ...paymentData,
            user_id: user.id,
          })

        if (error) throw error
      }

      await fetchPaymentMethods()
      setShowForm(false)
      setEditingPayment(null)
      setFormData({
        type: 'card',
        last4: '',
        brand: '',
        expiry_month: '',
        expiry_year: '',
        is_default: false,
      })
    } catch (error: any) {
      console.error('Error saving payment method:', error)
      alert(error.message || 'Error saving payment method')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (paymentMethod: SavedPaymentMethod) => {
    setEditingPayment(paymentMethod)
    setFormData({
      type: paymentMethod.type,
      last4: paymentMethod.last4 || '',
      brand: paymentMethod.brand || '',
      expiry_month: paymentMethod.expiry_month?.toString() || '',
      expiry_year: paymentMethod.expiry_year?.toString() || '',
      is_default: paymentMethod.is_default,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return
    if (!user) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('saved_payment_methods')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchPaymentMethods()
    } catch (error: any) {
      console.error('Error deleting payment method:', error)
      alert(error.message || 'Error deleting payment method')
    }
  }

  const handleSetDefault = async (id: string) => {
    if (!user) return

    try {
      const supabase = createClient()

      // Unset all other defaults
      await supabase
        .from('saved_payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true)

      // Set this one as default
      const { error } = await supabase
        .from('saved_payment_methods')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchPaymentMethods()
    } catch (error: any) {
      console.error('Error setting default payment method:', error)
      alert(error.message || 'Error setting default payment method')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <Package className="w-12 h-12 text-green-500 animate-spin" />
          </div>
          <p className="text-gray-700">Loading payment methods...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href="/profile" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Profile</span>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payment Methods</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage your saved payment methods</p>
            </div>
            {!showForm && (
              <Button onClick={() => {
                setEditingPayment(null)
                setFormData({
                  type: 'card',
                  last4: '',
                  brand: '',
                  expiry_month: '',
                  expiry_year: '',
                  is_default: false,
                })
                setShowForm(true)
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <Card className="mb-6 sm:mb-8 p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Secure Payment Storage</h3>
              <p className="text-sm text-blue-700">
                We never store your full card number. Only the last 4 digits and payment token are saved securely.
                In production, this will integrate with Stripe/PayPal for secure tokenization.
              </p>
            </div>
          </div>
        </Card>

        {/* Add/Edit Form */}
        {showForm && (
          <Card className="mb-6 sm:mb-8 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              {editingPayment ? 'Edit Payment Method' : 'Add New Payment Method'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-jeffy-yellow focus:border-transparent"
                >
                  <option value="card">Credit/Debit Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {formData.type === 'card' && (
                <>
                  <Input
                    label="Card Brand"
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Visa, Mastercard, etc."
                  />

                  <Input
                    label="Last 4 Digits"
                    type="text"
                    value={formData.last4}
                    onChange={(e) => setFormData({ ...formData, last4: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    placeholder="1234"
                    maxLength={4}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Expiry Month"
                      type="number"
                      value={formData.expiry_month}
                      onChange={(e) => setFormData({ ...formData, expiry_month: e.target.value })}
                      placeholder="MM"
                      min="1"
                      max="12"
                    />

                    <Input
                      label="Expiry Year"
                      type="number"
                      value={formData.expiry_year}
                      onChange={(e) => setFormData({ ...formData, expiry_year: e.target.value })}
                      placeholder="YYYY"
                      min={new Date().getFullYear()}
                    />
                  </div>
                </>
              )}

              {formData.type === 'paypal' && (
                <div className="p-4 bg-jeffy-yellow-light rounded-lg">
                  <p className="text-sm text-gray-600">
                    PayPal account will be linked when you select PayPal as payment method during checkout.
                  </p>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="rounded border-gray-300 text-jeffy-yellow focus:ring-jeffy-yellow"
                />
                <label className="ml-2 text-sm text-gray-600">Set as default payment method</label>
              </div>

              <div className="flex gap-3">
                <Button type="submit" loading={formLoading} className="flex-1">
                  {editingPayment ? 'Update Payment Method' : 'Add Payment Method'}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false)
                  setEditingPayment(null)
                }} disabled={formLoading}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Payment Methods List */}
        {paymentMethods.length === 0 && !showForm ? (
          <Card className="p-8 sm:p-12 text-center">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved payment methods</h3>
            <p className="text-gray-600 mb-6">Add a payment method to make checkout faster</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {paymentMethods.map((paymentMethod) => (
              <PaymentMethodCard
                key={paymentMethod.id}
                paymentMethod={paymentMethod}
                isDefault={paymentMethod.is_default}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
