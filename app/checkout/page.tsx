'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { AddressInput } from '@/components/AddressInput'
import { AddressSelector } from '@/components/AddressSelector'
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector'
import { useAuth } from '@/lib/contexts/AuthContext'
import { CartItem, SavedAddress, SavedPaymentMethod } from '@/types/database'
import { createClient } from '@/lib/supabase'
import { generateOrderQRCode } from '@/lib/qrcode'
import { loadCart, clearCart as clearCartFromDB } from '@/lib/cart'
import { CreditCard } from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function CheckoutPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [cartLoading, setCartLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
  const [useSavedAddress, setUseSavedAddress] = useState(false)
  const [useSavedPayment, setUseSavedPayment] = useState(false)
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(false)
  const [savePaymentForFuture, setSavePaymentForFuture] = useState(false)
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  })
  
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: '',
    city: '',
    postal_code: '',
    country: 'South Africa',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined
  })
  
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'mock'>('mock')
  
  // Load cart when auth state is ready
  useEffect(() => {
    if (authLoading) return // Wait for auth to finish loading
    
    const fetchCart = async () => {
      setCartLoading(true)
      try {
        const cartData = await loadCart(user?.id || null)
        setCart(cartData)
      } catch (error) {
        console.error('Error loading cart:', error)
      } finally {
        setCartLoading(false)
      }
    }
    
    fetchCart()
  }, [user?.id, authLoading]) // Only depend on user.id and authLoading
  
  // Pre-populate customer info when user/profile changes
  useEffect(() => {
    if (authLoading) return
    
    if (user && profile) {
      setCustomerInfo({
        name: profile.full_name || user.email?.split('@')[0] || '',
        email: user.email || '',
        phone: profile.phone || ''
      })
    }
  }, [user, profile, authLoading])
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  
  const handleSubmitOrder = async () => {
    if (!customerInfo.name || !customerInfo.email || !deliveryInfo.address) {
      alert('Please fill in all required fields')
      return
    }
    
    setLoading(true)
    
    try {
      // Fetch product/variant costs for profit calculation
      const supabase = createClient()
      const itemsWithCosts = await Promise.all(
        cart.map(async (item) => {
          let cost = 0
          
          if (item.variant_id) {
            // Fetch variant cost
            const { data: variantData } = await supabase
              .from('product_variants')
              .select('cost, product:products(cost)')
              .eq('id', item.variant_id)
              .single()
            
            const variant = variantData as any
            cost = variant?.cost ?? variant?.product?.cost ?? 0
          } else {
            // Fetch product cost
            const { data: product } = await supabase
              .from('products')
              .select('cost')
              .eq('id', item.product_id)
              .single()
            
            cost = product?.cost ?? 0
          }
          
          return {
            product_id: item.product_id,
            product_name: item.product_name,
            variant_id: item.variant_id,
            quantity: item.quantity,
            price: item.price,
            cost: cost
          }
        })
      )
      
      // Get franchise location ID from localStorage if available
      const franchiseLocationId = typeof window !== 'undefined' 
        ? localStorage.getItem('jeffy-franchise-id') 
        : null

      // Debug: Log cart items before submission
      console.log('[Checkout] Cart items being sent:', itemsWithCosts)
      const itemsWithoutVariantId = itemsWithCosts.filter(item => !item.variant_id)
      if (itemsWithoutVariantId.length > 0) {
        console.warn('[Checkout] Items without variant_id:', itemsWithoutVariantId)
      }

      // Create order via API route (handles stock decrement and financial transactions)
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.id || null,
          user_email: customerInfo.email,
          items: itemsWithCosts,
          total: total,
          franchise_location_id: franchiseLocationId || null,
          delivery_info: {
            name: customerInfo.name,
            phone: customerInfo.phone,
            address: deliveryInfo.address,
            city: deliveryInfo.city,
            postal_code: deliveryInfo.postal_code,
            ...(deliveryInfo.latitude && deliveryInfo.longitude && {
              latitude: deliveryInfo.latitude,
              longitude: deliveryInfo.longitude
            })
          }
        })
      })
      
      if (!orderResponse.ok) {
        const errorData = await orderResponse.json()
        throw new Error(errorData.error || 'Failed to create order')
      }
      
      const orderResult = await orderResponse.json()
      
      if (!orderResult.success || !orderResult.data) {
        throw new Error(orderResult.error || 'Failed to create order')
      }
      
      const order = orderResult.data
      
      // Process payment - ALL payment methods use mock payment for testing
      // This bypasses real payment processing and marks order as ready_for_delivery
      // When ready for production, add conditional logic for real Stripe/PayPal
      try {
        const paymentResponse = await fetch('/api/payments/mock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            amount: total
          })
        })

        const paymentResult = await paymentResponse.json()

        if (!paymentResult.success) {
          console.error('Payment processing failed:', paymentResult.error)
          // Order created but payment failed - admin can handle manually
          // Continue to success page but order will be pending
        } else {
          console.log(`Payment processed (${paymentMethod}):`, paymentResult)
          // Payment successful - order is now marked ready_for_delivery
        }
      } catch (paymentError) {
        console.error('Payment processing error:', paymentError)
        // Order created but payment failed - admin can handle manually
        // Continue to success page
      }
      
      // Generate QR code for order tracking
      let qrCode = null
      try {
        qrCode = await generateOrderQRCode(order.id)
      } catch (qrError) {
        console.error('Error generating QR code:', qrError)
        // Continue even if QR generation fails
      }
      
      // Update order with QR code if generated
      if (qrCode) {
        await supabase
          .from('orders')
          .update({ qr_code: qrCode })
          .eq('id', order.id)
      }
      
      // Save address if user is logged in and checkbox is checked
      if (user && saveAddressForFuture && !selectedAddressId) {
        try {
          const { error: addressError } = await supabase
            .from('saved_addresses')
            .insert({
              user_id: user.id,
              label: 'Home',
              address: deliveryInfo.address,
              city: deliveryInfo.city || null,
              postal_code: deliveryInfo.postal_code || null,
              country: deliveryInfo.country || 'South Africa',
              latitude: deliveryInfo.latitude || null,
              longitude: deliveryInfo.longitude || null,
              is_default: false,
            })
          
          if (addressError) {
            console.error('Error saving address:', addressError)
          }
        } catch (error) {
          console.error('Error saving address:', error)
        }
      }
      
      // Save payment method if user is logged in and checkbox is checked
      if (user && savePaymentForFuture && paymentMethod !== 'mock') {
        try {
          const { error: paymentError } = await supabase
            .from('saved_payment_methods')
            .insert({
              user_id: user.id,
              type: paymentMethod === 'stripe' ? 'card' : paymentMethod === 'paypal' ? 'paypal' : 'other',
              last4: null,
              brand: paymentMethod === 'stripe' ? 'card' : 'paypal',
              expiry_month: null,
              expiry_year: null,
              is_default: false,
              stripe_payment_method_id: null,
            })
          
          if (paymentError) {
            console.error('Error saving payment method:', paymentError)
          }
        } catch (error) {
          console.error('Error saving payment method:', error)
        }
      }
      
      // Clear cart
      await clearCartFromDB(user?.id || null)
      
      // Redirect to success page
      router.push(`/checkout/success?orderId=${order.id}`)
      
    } catch (error) {
      console.error('Error creating order:', error)
      alert('There was an error processing your order. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  // Show loading state while cart is being loaded
  if (authLoading || cartLoading) {
    return <LoadingSpinner message="Loading checkout..." fullScreen />
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100 flex items-center justify-center px-4">
        <Card className="text-center py-12 max-w-md" padding="lg">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Your cart is empty</h2>
          <p className="text-slate-600 mb-6">Add some products to your cart before checking out.</p>
          <Button onClick={() => router.push('/products')}>
            Browse Products
          </Button>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-jeffy-yellow to-amber-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
            <p className="text-gray-600">Complete your order</p>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 1 ? 'bg-jeffy-yellow text-gray-900' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-jeffy-yellow' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 2 ? 'bg-jeffy-yellow text-gray-900' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <div className={`w-16 h-1 ${step >= 3 ? 'bg-jeffy-yellow' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 3 ? 'bg-jeffy-yellow text-gray-900' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Customer Information */}
              {step === 1 && (
                <Card>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Customer Information</h2>
                  <div className="space-y-4">
                    <Input
                      label="Full Name *"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      placeholder="Enter your full name"
                    />
                    <Input
                      label="Email Address *"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      placeholder="Enter your email"
                    />
                    <Input
                      label="Phone Number"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </Card>
              )}
              
              {/* Step 2: Delivery Information */}
              {step === 2 && (
                <Card>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Delivery Information</h2>
                  <div className="space-y-4">
                    {user && (
                      <div className="mb-4">
                        <label className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            checked={useSavedAddress}
                            onChange={(e) => setUseSavedAddress(e.target.checked)}
                            className="rounded border-gray-300 text-jeffy-yellow focus:ring-jeffy-yellow"
                          />
                          <span className="ml-2 text-sm text-gray-700">Use a saved address</span>
                        </label>
                        {useSavedAddress && (
                          <AddressSelector
                            selectedAddressId={selectedAddressId}
                            onSelect={(address) => {
                              if (address) {
                                setSelectedAddressId(address.id)
                                setDeliveryInfo({
                                  address: address.address,
                                  city: address.city || '',
                                  postal_code: address.postal_code || '',
                                  country: address.country || 'South Africa',
                                  latitude: address.latitude || undefined,
                                  longitude: address.longitude || undefined,
                                })
                              }
                            }}
                            onNew={() => setUseSavedAddress(false)}
                          />
                        )}
                      </div>
                    )}
                    {(!user || !useSavedAddress) && (
                      <>
                        <AddressInput
                          label="Delivery Address *"
                          value={deliveryInfo.address}
                          onChange={(address) => setDeliveryInfo({...deliveryInfo, address})}
                          onAddressSelect={(data) => {
                            setDeliveryInfo({
                              ...deliveryInfo,
                              address: data.address,
                              city: data.city || deliveryInfo.city,
                              postal_code: data.postal_code || deliveryInfo.postal_code,
                              latitude: data.latitude,
                              longitude: data.longitude
                            })
                          }}
                          placeholder="Type and select an address (e.g., 123 Main St, Johannesburg)"
                          required
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="City"
                            value={deliveryInfo.city}
                            onChange={(e) => setDeliveryInfo({...deliveryInfo, city: e.target.value})}
                            placeholder="Enter your city"
                          />
                          <Input
                            label="Postal Code"
                            value={deliveryInfo.postal_code}
                            onChange={(e) => setDeliveryInfo({...deliveryInfo, postal_code: e.target.value})}
                            placeholder="Enter postal code"
                          />
                        </div>
                        <Input
                          label="Country"
                          value={deliveryInfo.country}
                          onChange={(e) => setDeliveryInfo({...deliveryInfo, country: e.target.value})}
                          placeholder="Enter your country"
                        />
                        {user && (
                          <label className="flex items-center mt-4">
                            <input
                              type="checkbox"
                              checked={saveAddressForFuture}
                              onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                              className="rounded border-gray-300 text-jeffy-yellow focus:ring-jeffy-yellow"
                            />
                            <span className="ml-2 text-sm text-gray-700">Save this address for future orders</span>
                          </label>
                        )}
                      </>
                    )}
                  </div>
                </Card>
              )}
              
              {/* Step 3: Payment */}
              {step === 3 && (
                <Card>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => setPaymentMethod('mock')}
                        className={`p-4 border-2 rounded-xl text-left transition-colors ${
                          paymentMethod === 'mock' 
                            ? 'border-jeffy-yellow bg-jeffy-yellow-light' 
                            : 'border-gray-300 hover:border-jeffy-yellow'
                        }`}
                      >
                        <CreditCard className="w-6 h-6 mb-2" />
                        <div className="font-medium">Test Payment (Mock)</div>
                        <div className="text-sm text-gray-600">Instant processing for testing</div>
                      </button>
                      <button
                        onClick={() => setPaymentMethod('stripe')}
                        className={`p-4 border-2 rounded-xl text-left transition-colors ${
                          paymentMethod === 'stripe' 
                            ? 'border-jeffy-yellow bg-jeffy-yellow-light' 
                            : 'border-gray-300 hover:border-jeffy-yellow'
                        }`}
                      >
                        <CreditCard className="w-6 h-6 mb-2" />
                        <div className="font-medium">Credit/Debit Card</div>
                        <div className="text-sm text-gray-600">Pay with Stripe</div>
                      </button>
                      <button
                        onClick={() => setPaymentMethod('paypal')}
                        className={`p-4 border-2 rounded-xl text-left transition-colors ${
                          paymentMethod === 'paypal' 
                            ? 'border-jeffy-yellow bg-jeffy-yellow-light' 
                            : 'border-gray-300 hover:border-jeffy-yellow'
                        }`}
                      >
                        <CreditCard className="w-6 h-6 mb-2" />
                        <div className="font-medium">PayPal</div>
                        <div className="text-sm text-gray-600">Pay with PayPal</div>
                      </button>
                    </div>
                    
                    {paymentMethod === 'mock' && (
                      <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                        <p className="text-sm text-green-700">
                          <strong>Test Mode:</strong> This payment will be processed instantly. 
                          Your order will be automatically marked as ready for delivery.
                        </p>
                      </div>
                    )}
                    
                    {(paymentMethod === 'stripe' || paymentMethod === 'paypal') && (
                      <div className="bg-jeffy-yellow-light p-4 rounded-xl">
                        <p className="text-sm text-gray-700">
                          <strong>Note:</strong> Payment integration is ready but requires API keys to be configured. 
                          For now, orders will be processed and you&apos;ll be contacted for payment.
                        </p>
                      </div>
                    )}
                    
                    {user && (paymentMethod === 'stripe' || paymentMethod === 'paypal') && (
                      <label className="flex items-center mt-4">
                        <input
                          type="checkbox"
                          checked={savePaymentForFuture}
                          onChange={(e) => setSavePaymentForFuture(e.target.checked)}
                          className="rounded border-gray-300 text-jeffy-yellow focus:ring-jeffy-yellow"
                        />
                        <span className="ml-2 text-sm text-gray-700">Save this payment method for future orders</span>
                      </label>
                    )}
                  </div>
                </Card>
              )}
            </div>
            
            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                
                {/* Items */}
                <div className="space-y-3 mb-6">
                  {cart.map((item, index) => (
                    <div key={`${item.product_id}-${item.variant_id || 'default'}-${index}`} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.product_name}{item.variant_display ? ` (${item.variant_display})` : ''} x {item.quantity}
                      </span>
                      <span className="font-medium">
                        R{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Total */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total ({itemCount} items)</span>
                    <span className="text-jeffy-yellow">R{total.toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Navigation Buttons */}
                <div className="mt-6 space-y-3">
                  {step > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setStep(step - 1)}
                      className="w-full"
                    >
                      Previous
                    </Button>
                  )}
                  
                  {step < 3 ? (
                    <Button
                      onClick={() => setStep(step + 1)}
                      className="w-full"
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmitOrder}
                      loading={loading}
                      className="w-full"
                    >
                      Complete Order
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
