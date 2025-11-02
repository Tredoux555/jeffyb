'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { createClient } from '@/lib/supabase'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Order, DeliveryAssignment } from '@/types/database'
import { Package, ArrowLeft, MapPin, Phone, Calendar, DollarSign, Truck, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [assignment, setAssignment] = useState<DeliveryAssignment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/auth/login')
      return
    }

    fetchOrderDetails()
  }, [user, authLoading, orderId])

  const fetchOrderDetails = async () => {
    if (!user || !orderId) return

    try {
      setLoading(true)
      const supabase = createClient()

      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single()

      if (orderError) throw orderError
      setOrder(orderData as Order)

      // Fetch delivery assignment if exists
      const { data: assignmentData } = await supabase
        .from('delivery_assignments')
        .select('*, driver:drivers(*)')
        .eq('order_id', orderId)
        .single()

      if (assignmentData) {
        setAssignment(assignmentData as DeliveryAssignment)
      }
    } catch (error: any) {
      console.error('Error fetching order details:', error)
      if (error.code === 'PGRST116') {
        // Order not found or not owned by user
        alert('Order not found')
        router.push('/profile/orders')
      } else {
        alert('Error loading order details')
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700'
      case 'confirmed':
      case 'processing':
        return 'bg-blue-100 text-blue-700'
      case 'shipped':
        return 'bg-purple-100 text-purple-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <Package className="w-12 h-12 text-green-500 animate-pulse" />
          </div>
          <p className="text-gray-700">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!user || !order) {
    return null
  }

  const total = order.items?.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0) || order.total || 0

  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href="/profile/orders" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders</span>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order #{order.id.slice(0, 8)}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(order.status)}`}
                >
                  {order.status}
                </span>
                {order.payment_status === 'paid' && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Paid
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Order Details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Order Items */}
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Order Items</h2>
              {order.items && order.items.length > 0 ? (
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 sm:p-4 bg-jeffy-yellow-light rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.product_name || 'Unknown Product'}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity || 0}</p>
                        <p className="text-sm text-gray-600">Price: R{(item.price || 0).toFixed(2)} each</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-jeffy-yellow">
                          R{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex items-center justify-between text-lg sm:text-xl font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-jeffy-yellow">R{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No items found</p>
              )}
            </Card>

            {/* Delivery Information */}
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Delivery Information</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">{order.delivery_info?.name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">{order.delivery_info?.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-semibold text-gray-900">{order.delivery_info?.address || 'N/A'}</p>
                    {order.delivery_info?.city && (
                      <p className="text-sm text-gray-600">
                        {order.delivery_info.city}
                        {order.delivery_info.postal_code && ` ${order.delivery_info.postal_code}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Order Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(order.created_at).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Delivery Assignment (if exists) */}
            {assignment && (
              <Card className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Delivery Status
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize mt-1 ${
                        assignment.status === 'delivered'
                          ? 'bg-green-100 text-green-700'
                          : assignment.status === 'in_transit'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {assignment.status.replace('_', ' ')}
                    </span>
                  </div>
                  {assignment.driver && (
                    <div>
                      <p className="text-sm text-gray-600">Driver</p>
                      <p className="font-semibold text-gray-900">
                        {(assignment.driver as any).name || 'N/A'}
                      </p>
                    </div>
                  )}
                  {assignment.assigned_at && (
                    <div>
                      <p className="text-sm text-gray-600">Assigned At</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(assignment.assigned_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {assignment.delivered_at && (
                    <div>
                      <p className="text-sm text-gray-600">Delivered At</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(assignment.delivered_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                  <Link href={`/tracking/${order.id}`}>
                    <Button className="w-full mt-4">
                      <Truck className="w-4 h-4 mr-2" />
                      Track Package
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="p-4 sm:p-6 sticky top-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">R{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-semibold text-gray-900">R20.00</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-jeffy-yellow">R{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Order ID</span>
                  <span className="font-mono text-gray-900">{order.id.slice(0, 8)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Email</span>
                  <span className="text-gray-900">{order.user_email}</span>
                </div>
                {order.payment_status && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Payment</span>
                    <span className={`font-medium ${
                      order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
