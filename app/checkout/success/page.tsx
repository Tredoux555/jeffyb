'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { CheckCircle, Package, Truck, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Order } from '@/types/database'

function CheckoutSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (orderId) {
      fetchOrder()
    } else {
      router.push('/')
    }
  }, [orderId])
  
  const fetchOrder = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()
      
      if (error) throw error
      setOrder(data)
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <Package className="w-12 h-12 text-green-500 animate-[spin_3s_linear_infinite]" />
          </div>
          <p className="text-gray-700">Loading order details...</p>
        </div>
      </div>
    )
  }
  
  if (!order) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <Card className="text-center py-12 max-w-md">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Order Not Found</h2>
          <p className="text-gray-600 mb-6">The order you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/')}>
            Go Home
          </Button>
        </Card>
      </div>
    )
  }
  
  const total = order.items && order.items.length > 0 
    ? order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0)
    : order.total || 0
  
  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600">
              Thank you for your order. We&apos;ll process it and get back to you soon.
            </p>
          </div>
          
          {/* Order Details */}
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
              <span className="text-sm text-gray-500">#{order.id ? order.id.slice(0, 8) : 'N/A'}</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{order.delivery_info?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{order.user_email || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">Delivery Address</p>
                  <p className="text-sm text-gray-600">
                    {order.delivery_info?.address || 'N/A'}
                    {order.delivery_info?.city && `, ${order.delivery_info.city}`}
                    {order.delivery_info?.postal_code && ` ${order.delivery_info.postal_code}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">Order Status</p>
                  <p className="text-sm text-gray-600 capitalize">{order.status || 'pending'}</p>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Order Items */}
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-3">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.product_name || 'Unknown Product'}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity || 0}</p>
                    </div>
                    <p className="font-medium text-jeffy-yellow">
                      R{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-sm">No items found</p>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total</span>
                <span className="text-jeffy-yellow">R{total.toFixed(2)}</span>
              </div>
            </div>
          </Card>
          
          {/* Next Steps */}
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What&apos;s Next?</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• We&apos;ll review your order and contact you for payment details</p>
              <p>• Once payment is confirmed, we&apos;ll prepare your items</p>
              <p>• You&apos;ll receive a delivery confirmation with tracking details</p>
              <p>• Your order will be delivered to the address provided</p>
            </div>
          </Card>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/products" className="flex-1">
              <Button variant="outline" className="w-full">
                Continue Shopping
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button className="w-full">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <Package className="w-12 h-12 text-green-500 animate-[spin_3s_linear_infinite]" />
          </div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
