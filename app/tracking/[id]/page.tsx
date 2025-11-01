'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { createClient } from '@/lib/supabase'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { DeliveryMap } from '@/components/DeliveryMap'
import { Order, DeliveryAssignment, Driver } from '@/types/database'
import { Package, ArrowLeft, Truck, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface StatusUpdate {
  status: string
  timestamp: string
  location?: { lat: number; lng: number }
  notes?: string
}

export default function TrackingPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [assignment, setAssignment] = useState<DeliveryAssignment | null>(null)
  const [driver, setDriver] = useState<Driver | null>(null)
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([])
  const [eta, setEta] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrackingData()

    // Set up real-time subscription for order updates
    const supabase = createClient()
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
          setOrder(payload.new as Order)
        }
      )
      .subscribe()

    // Set up real-time subscription for delivery assignment updates
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
        async (payload) => {
          const newAssignment = payload.new as DeliveryAssignment
          setAssignment(newAssignment)

          // Fetch driver info if assigned
          if (newAssignment.driver_id) {
            const { data: driverData } = await supabase
              .from('drivers')
              .select('*')
              .eq('id', newAssignment.driver_id)
              .single()

            if (driverData) {
              setDriver(driverData as Driver)
            }
          }

          // Fetch status updates
          fetchStatusUpdates(newAssignment.id)
        }
      )
      .subscribe()

    // Set up real-time subscription for driver location updates
    if (assignment?.driver_id) {
      const driverChannel = supabase
        .channel(`driver-location-${assignment.driver_id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'drivers',
            filter: `id=eq.${assignment.driver_id}`,
          },
          (payload) => {
            setDriver(payload.new as Driver)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(orderChannel)
        supabase.removeChannel(assignmentChannel)
        supabase.removeChannel(driverChannel)
      }
    }

    return () => {
      supabase.removeChannel(orderChannel)
      supabase.removeChannel(assignmentChannel)
    }
  }, [orderId, assignment?.driver_id])

  const fetchTrackingData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError
      setOrder(orderData as Order)

      // Fetch delivery assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('delivery_assignments')
        .select('*, driver:drivers(*)')
        .eq('order_id', orderId)
        .single()

      if (assignmentData && !assignmentError) {
        const assignment = assignmentData as any
        setAssignment(assignment as DeliveryAssignment)
        if (assignment.driver) {
          setDriver(assignment.driver as Driver)
        }

        // Fetch status updates
        await fetchStatusUpdates(assignment.id)
      }

      // Calculate ETA if driver and order have location data
      // Wait for Google Maps to load before calculating
      if (assignmentData && orderData && typeof window !== 'undefined' && window.google?.maps) {
        calculateETA(assignmentData, orderData)
      } else if (assignmentData && orderData) {
        // Try again after a delay if Google Maps isn't loaded yet
        const checkGoogleMaps = setInterval(() => {
          if (typeof window !== 'undefined' && window.google?.maps) {
            calculateETA(assignmentData, orderData)
            clearInterval(checkGoogleMaps)
          }
        }, 500)
        setTimeout(() => clearInterval(checkGoogleMaps), 10000) // Give up after 10 seconds
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStatusUpdates = async (assignmentId: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('delivery_status_updates')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setStatusUpdates(
          data.map((update) => ({
            status: update.status,
            timestamp: update.created_at,
            location: update.location as { lat: number; lng: number } | undefined,
            notes: update.notes || undefined,
          }))
        )
      }
    } catch (error) {
      console.error('Error fetching status updates:', error)
    }
  }

  const calculateETA = async (assignment: any, order: Order) => {
    if (!driver?.current_location || !order.delivery_info?.latitude || !order.delivery_info?.longitude) {
      return
    }

    // Check if Google Maps is loaded
    if (typeof window === 'undefined' || !window.google?.maps) {
      // Fallback: estimate based on distance
      const distance = calculateDistance(
        driver.current_location.lat,
        driver.current_location.lng,
        order.delivery_info.latitude,
        order.delivery_info.longitude
      )
      const estimatedMinutes = Math.ceil(distance / 0.5) // Assuming ~0.5 km/min average speed
      setEta(`~${estimatedMinutes} minutes`)
      return
    }

    try {
      // Use Google Maps Directions API to calculate ETA
      if (!driver.current_location || !order.delivery_info?.latitude || !order.delivery_info?.longitude) {
        return
      }

      const currentLocation = driver.current_location
      const deliveryLat = order.delivery_info.latitude
      const deliveryLng = order.delivery_info.longitude

      const directionsService = new window.google.maps.DirectionsService()
      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route(
          {
            origin: new window.google.maps.LatLng(
              currentLocation.lat,
              currentLocation.lng
            ),
            destination: new window.google.maps.LatLng(
              deliveryLat,
              deliveryLng
            ),
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK && result) {
              resolve(result)
            } else {
              reject(new Error(`Directions request failed: ${status}`))
            }
          }
        )
      })

      // Get duration from result
      const duration = result.routes[0]?.legs[0]?.duration
      if (duration) {
        const minutes = Math.ceil(duration.value / 60)
        setEta(`${minutes} minutes`)
      }
    } catch (error) {
      console.error('Error calculating ETA:', error)
      // Fallback: estimate based on distance
      if (driver.current_location && order.delivery_info?.latitude && order.delivery_info?.longitude) {
        const distance = calculateDistance(
          driver.current_location.lat,
          driver.current_location.lng,
          order.delivery_info.latitude,
          order.delivery_info.longitude
        )
        const estimatedMinutes = Math.ceil(distance / 0.5) // Assuming ~0.5 km/min average speed
        setEta(`~${estimatedMinutes} minutes`)
      }
    }
  }

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371 // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'in_transit':
        return <Truck className="w-5 h-5 text-blue-600" />
      case 'picked_up':
        return <Package className="w-5 h-5 text-purple-600" />
      case 'assigned':
        return <Clock className="w-5 h-5 text-yellow-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
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
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">We couldn't find this order</p>
          <Link href="/profile/orders">
            <Button>Back to Orders</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href={`/profile/orders/${orderId}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Order Details</span>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Track Package</h1>
            <p className="text-sm sm:text-base text-gray-600">Order #{order.id.slice(0, 8)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Tracking Info */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Current Status */}
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Current Status</h2>
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  order.status === 'delivered'
                    ? 'bg-green-100'
                    : order.status === 'shipped' || assignment?.status === 'in_transit'
                    ? 'bg-blue-100'
                    : 'bg-yellow-100'
                }`}>
                  {order.status === 'delivered' ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : assignment?.status === 'in_transit' ? (
                    <Truck className="w-8 h-8 text-blue-600" />
                  ) : (
                    <Package className="w-8 h-8 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {assignment?.status ? getStatusLabel(assignment.status) : getStatusLabel(order.status)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {assignment?.delivered_at
                      ? `Delivered on ${new Date(assignment.delivered_at).toLocaleString()}`
                      : assignment?.picked_up_at
                      ? `Picked up on ${new Date(assignment.picked_up_at).toLocaleString()}`
                      : assignment?.assigned_at
                      ? `Assigned on ${new Date(assignment.assigned_at).toLocaleString()}`
                      : `Order placed on ${new Date(order.created_at).toLocaleString()}`}
                  </p>
                  {eta && assignment?.status === 'in_transit' && (
                    <p className="text-sm text-blue-600 font-medium mt-1">
                      Estimated arrival: {eta}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Status Timeline */}
            {(statusUpdates.length > 0 || assignment) && (
              <Card className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Delivery Timeline</h2>
                <div className="space-y-4">
                  {/* Order Created */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Order Created</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Status Updates */}
                  {statusUpdates.map((update, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        {getStatusIcon(update.status)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{getStatusLabel(update.status)}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(update.timestamp).toLocaleString()}
                        </p>
                        {update.notes && (
                          <p className="text-sm text-gray-500 mt-1">{update.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Current Status if no updates yet */}
                  {statusUpdates.length === 0 && assignment && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                        {getStatusIcon(assignment.status)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{getStatusLabel(assignment.status)}</p>
                        <p className="text-sm text-gray-600">
                          {assignment.assigned_at
                            ? `Assigned on ${new Date(assignment.assigned_at).toLocaleString()}`
                            : 'Waiting for driver'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Delivery Map */}
            {assignment && driver?.current_location && order.delivery_info?.latitude && order.delivery_info?.longitude && (
              <Card className="p-0 overflow-hidden">
                <div className="p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Delivery Route</h2>
                </div>
                <div className="rounded-lg overflow-hidden">
                  <DeliveryMap
                    pickupAddress="Pickup Location"
                    deliveryAddress={order.delivery_info.address || 'Delivery Address'}
                    pickupCoords={driver.current_location}
                    deliveryCoords={{
                      lat: order.delivery_info.latitude,
                      lng: order.delivery_info.longitude,
                    }}
                  />
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-4 sm:space-y-6">
            {/* Driver Info */}
            {driver && (
              <Card className="p-4 sm:p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Driver</h2>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">{driver.name}</p>
                  {driver.phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {driver.phone}
                    </p>
                  )}
                  {driver.vehicle_type && (
                    <p className="text-sm text-gray-600 capitalize">Vehicle: {driver.vehicle_type}</p>
                  )}
                  {driver.current_location && (
                    <p className="text-xs text-gray-500 mt-2">
                      Location updated: {driver.last_location_update ? new Date(driver.last_location_update).toLocaleTimeString() : 'Recently'}
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Delivery Address */}
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Delivery Address</h2>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-gray-900">{order.delivery_info?.name || 'N/A'}</p>
                <p className="text-gray-600">{order.delivery_info?.address || 'N/A'}</p>
                {order.delivery_info?.city && (
                  <p className="text-gray-600">
                    {order.delivery_info.city}
                    {order.delivery_info.postal_code && ` ${order.delivery_info.postal_code}`}
                  </p>
                )}
                {order.delivery_info?.phone && (
                  <p className="text-gray-600">{order.delivery_info.phone}</p>
                )}
              </div>
            </Card>

            {/* Order Summary */}
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID</span>
                  <span className="font-mono text-gray-900">{order.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Items</span>
                  <span className="font-semibold text-gray-900">
                    {order.items?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-jeffy-yellow">R{order.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

