'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { createClient } from '@/lib/supabase'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { DeliveryMap } from '@/components/DeliveryMap'
import { Order, DeliveryAssignment, Driver } from '@/types/database'
import { Package, ArrowLeft, MapPin, Truck, Clock, CheckCircle, Phone } from 'lucide-react'
import Link from 'next/link'

export default function TrackingPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const orderId = params.orderId as string

  const [order, setOrder] = useState<Order | null>(null)
  const [assignment, setAssignment] = useState<DeliveryAssignment | null>(null)
  const [driver, setDriver] = useState<Driver | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrderData()
  }, [orderId])

  // Real-time subscription for order and delivery updates
  useEffect(() => {
    if (!orderId) return

    const supabase = createClient()

    // Subscribe to order status updates
    const orderChannel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log('Order update:', payload)
          setOrder(payload.new as Order)
        }
      )
      .subscribe()

    // Subscribe to delivery assignment creation
    const assignmentChannel = supabase
      .channel(`assignment-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_assignments',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          console.log('Assignment update:', payload)
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const assignmentData = payload.new as DeliveryAssignment
            setAssignment(assignmentData)
            // Fetch driver if assigned
            if (assignmentData.driver_id) {
              fetchDriver(assignmentData.driver_id)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(orderChannel)
      supabase.removeChannel(assignmentChannel)
    }
  }, [orderId])

  // Real-time subscription for driver location updates
  useEffect(() => {
    if (!driver) return

    const supabase = createClient()

        const driverChannel = supabase
          .channel(`driver-location-${driver.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'drivers',
              filter: `id=eq.${driver.id}`,
            },
        (payload) => {
          console.log('Driver location update:', payload)
          setDriver(payload.new as Driver)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(driverChannel)
    }
  }, [driver])

  const fetchOrderData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Fetch order (allow both authenticated and guest lookup)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError
      if (!orderData) {
        alert('Order not found')
        router.push('/')
        return
      }

      // If user is logged in, verify ownership
      if (user && orderData.user_id !== user.id) {
        alert('This order does not belong to you')
        router.push('/profile/orders')
        return
      }

      setOrder(orderData as Order)

      // Fetch delivery assignment if exists
      const { data: assignmentData } = await supabase
        .from('delivery_assignments')
        .select('*')
        .eq('order_id', orderId)
        .single()

      if (assignmentData) {
        setAssignment(assignmentData as DeliveryAssignment)
        // Fetch driver
        if (assignmentData.driver_id) {
          await fetchDriver(assignmentData.driver_id)
        }
      }
    } catch (error) {
      console.error('Error fetching order data:', error)
      alert('Error loading order tracking')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const fetchDriver = async (driverId: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('drivers').select('*').eq('id', driverId).single()

      if (!error && data) {
        setDriver(data as Driver)
      }
    } catch (error) {
      console.error('Error fetching driver:', error)
    }
  }

  const getStatusSteps = () => {
    if (!order) return []

    const steps = [
      { status: 'pending', label: 'Order Placed', icon: Package },
      { status: 'confirmed', label: 'Order Confirmed', icon: CheckCircle },
      { status: 'processing', label: 'Processing', icon: Package },
    ]

    if (assignment) {
      steps.push(
        { status: 'assigned', label: 'Driver Assigned', icon: Truck },
        { status: 'picked_up', label: 'Picked Up', icon: Truck },
        { status: 'in_transit', label: 'In Transit', icon: Truck }
      )
    }

    steps.push({ status: 'delivered', label: 'Delivered', icon: CheckCircle })

    return steps
  }

  const getCurrentStepIndex = () => {
    if (!order) return 0

    const steps = getStatusSteps()
    const currentStatus = assignment?.status || order.status

    const statusMap: Record<string, number> = {
      pending: 0,
      confirmed: 1,
      processing: 2,
      assigned: 3,
      picked_up: 4,
      in_transit: 5,
      delivered: 6,
    }

    return statusMap[currentStatus] || 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <Package className="w-12 h-12 text-green-500 animate-[spin_3s_linear_infinite]" />
          </div>
          <p className="text-gray-700">Loading tracking information...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return null
  }

  const steps = getStatusSteps()
  const currentStep = getCurrentStepIndex()

  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Back Button */}
        {user ? (
          <Link href="/profile/orders">
            <Button variant="outline" className="mb-4 sm:mb-6 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </Button>
          </Link>
        ) : (
          <Link href="/">
            <Button variant="outline" className="mb-4 sm:mb-6 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        )}

        {/* Order Header */}
        <Card className="mb-6 sm:mb-8 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Track Order #{order.id.slice(0, 8)}
              </h1>
              <p className="text-sm text-gray-600">Real-time delivery tracking</p>
            </div>
            <div className="text-sm sm:text-base text-gray-600">
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Placed {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Status Timeline */}
        <Card className="mb-6 sm:mb-8 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Delivery Status</h2>
          <div className="relative">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = index <= currentStep
              const isCurrent = index === currentStep

              return (
                <div key={index} className="flex items-start gap-4 pb-6 last:pb-0 relative">
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`absolute left-4 top-8 w-0.5 h-full ${
                        isCompleted ? 'bg-jeffy-yellow' : 'bg-gray-200'
                      }`}
                    />
                  )}

                  {/* Icon */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 ${
                      isCompleted
                        ? 'bg-jeffy-yellow'
                        : isCurrent
                        ? 'bg-jeffy-yellow-light border-2 border-jeffy-yellow'
                        : 'bg-gray-200'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isCompleted ? 'text-gray-900' : isCurrent ? 'text-jeffy-yellow' : 'text-gray-400'
                      }`}
                    />
                  </div>

                  {/* Label */}
                  <div className="flex-1 pt-1">
                    <p
                      className={`font-medium ${
                        isCompleted ? 'text-gray-900' : isCurrent ? 'text-jeffy-yellow' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </p>
                    {isCurrent && assignment && (
                      <p className="text-xs text-gray-600 mt-1">
                        {assignment.status === 'assigned' && driver && (
                          <>Assigned to {driver.name}</>
                        )}
                        {assignment.status === 'picked_up' && (
                          <>Picked up at {assignment.picked_up_at && new Date(assignment.picked_up_at).toLocaleTimeString()}</>
                        )}
                        {assignment.status === 'in_transit' && (
                          <>On the way to delivery address</>
                        )}
                        {order.status === 'delivered' && assignment.delivered_at && (
                          <>Delivered at {new Date(assignment.delivered_at).toLocaleTimeString()}</>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Driver Information */}
        {driver && assignment && assignment.status !== 'delivered' && (
          <Card className="mb-6 sm:mb-8 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Driver Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Driver Name</p>
                <p className="font-medium text-gray-900">{driver.name}</p>
              </div>
              {driver.phone && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Contact</p>
                  <a
                    href={`tel:${driver.phone}`}
                    className="font-medium text-jeffy-yellow hover:underline flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    {driver.phone}
                  </a>
                </div>
              )}
              {driver.vehicle_type && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Vehicle</p>
                  <p className="font-medium text-gray-900 capitalize">{driver.vehicle_type}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Map */}
        {order.delivery_info && (
          <Card className="mb-6 sm:mb-8 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
              Delivery Route
            </h2>
            <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: '400px' }}>
              <DeliveryMap
                pickupAddress="123 Main Street, Johannesburg, 2000"
                deliveryAddress={order.delivery_info.address}
                deliveryCoords={
                  order.delivery_info.latitude && order.delivery_info.longitude
                    ? {
                        lat: order.delivery_info.latitude,
                        lng: order.delivery_info.longitude,
                      }
                    : undefined
                }
                driverLocation={
                  driver?.current_location
                    ? {
                        lat: driver.current_location.lat,
                        lng: driver.current_location.lng,
                      }
                    : undefined
                }
              />
            </div>
            {driver?.current_location && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Driver location updated {driver.last_location_update && (
                  <>• {new Date(driver.last_location_update).toLocaleTimeString()}</>
                )}
              </p>
            )}
          </Card>
        )}

        {/* Order Summary */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <p className="text-gray-600">Items</p>
              <p className="font-medium text-gray-900">{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <p className="text-lg font-semibold text-gray-900">Total</p>
              <p className="text-xl font-bold text-jeffy-yellow">R{order.total?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

