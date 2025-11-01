'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { DeliveryMap } from './DeliveryMap'
import { createClient } from '@/lib/supabase'
import { DeliveryAssignment, Driver, Order } from '@/types/database'
import { Card } from './Card'
import { Truck, MapPin, Clock, Package, CheckCircle, Navigation, XCircle } from 'lucide-react'

interface OrderTrackingProps {
  order: Order
  assignment: DeliveryAssignment | null
  driver: Driver | null
  onDriverUpdate?: (driver: Driver | null) => void
  onAssignmentUpdate?: (assignment: DeliveryAssignment | null) => void
}

export function OrderTracking({
  order,
  assignment,
  driver,
  onDriverUpdate,
  onAssignmentUpdate,
}: OrderTrackingProps) {
  const [eta, setEta] = useState<string | null>(null)
  const [distance, setDistance] = useState<string | null>(null)

  // Real-time subscription for driver location updates
  useEffect(() => {
    if (!assignment?.driver_id || !driver) return

    const supabase = createClient()

    const channel = supabase
      .channel(`driver-location-${assignment.driver_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drivers',
          filter: `id=eq.${assignment.driver_id}`,
        },
        async (payload) => {
          const updatedDriver = payload.new as Driver
          if (onDriverUpdate) {
            onDriverUpdate(updatedDriver)
          }

          // Calculate ETA when driver location updates
          if (
            updatedDriver.current_location &&
            order.delivery_info?.latitude &&
            order.delivery_info?.longitude
          ) {
            await calculateETA(
              updatedDriver.current_location.lat,
              updatedDriver.current_location.lng,
              order.delivery_info.latitude,
              order.delivery_info.longitude
            )
          }
        }
      )
      .subscribe()

    // Initial ETA calculation
    if (
      driver.current_location &&
      order.delivery_info?.latitude &&
      order.delivery_info?.longitude
    ) {
      calculateETA(
        driver.current_location.lat,
        driver.current_location.lng,
        order.delivery_info.latitude,
        order.delivery_info.longitude
      )
    }

    return () => {
      supabase.removeChannel(channel)
    }
  }, [assignment?.driver_id, driver, order.delivery_info])

  const calculateETA = async (
    driverLat: number,
    driverLng: number,
    deliveryLat: number,
    deliveryLng: number
  ) => {
    try {
      // Use Google Maps Distance Matrix API
      const response = await fetch(
        `/api/maps/eta?origin=${driverLat},${driverLng}&destination=${deliveryLat},${deliveryLng}`
      )

      if (response.ok) {
        const data = await response.json()
        if (data.duration) {
          setEta(data.duration.text)
          setDistance(data.distance?.text || null)
        }
      }
    } catch (error) {
      console.error('Error calculating ETA:', error)
      // Fallback: Calculate rough ETA based on distance
      const roughEta = calculateRoughETA(driverLat, driverLng, deliveryLat, deliveryLng)
      setEta(roughEta)
    }
  }

  const calculateRoughETA = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): string => {
    // Haversine formula for distance
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distanceKm = R * c

    // Rough estimate: 40km/h average speed in city
    const minutes = Math.round((distanceKm / 40) * 60)
    if (minutes < 60) {
      return `${minutes} minutes`
    } else {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}h ${mins}m`
    }
  }

  const getDriverLocation = () => {
    if (!driver?.current_location) return null
    return {
      lat: driver.current_location.lat,
      lng: driver.current_location.lng,
    }
  }

  const getDeliveryCoords = () => {
    if (order.delivery_info?.latitude && order.delivery_info?.longitude) {
      return {
        lat: order.delivery_info.latitude,
        lng: order.delivery_info.longitude,
      }
    }
    return undefined
  }

  if (!assignment) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="text-center py-8">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Driver Assigned Yet</h3>
          <p className="text-gray-600">
            Your order is being processed. A driver will be assigned soon.
          </p>
        </div>
      </Card>
    )
  }

  if ((assignment.status as string) === 'delivered') {
    return (
      <Card className="p-4 sm:p-6">
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Delivered!</h3>
          <p className="text-gray-600">
            {assignment.delivered_at &&
              `Delivered on ${new Date(assignment.delivered_at).toLocaleString()}`}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ETA Card */}
      {(assignment.status as string) === 'in_transit' && driver?.current_location && eta && (
        <Card className="p-4 sm:p-6 bg-jeffy-yellow-light border-2 border-jeffy-yellow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Estimated Arrival</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{eta}</p>
              {distance && (
                <p className="text-sm text-gray-600 mt-1">About {distance} away</p>
              )}
            </div>
            <Clock className="w-12 h-12 text-jeffy-yellow" />
          </div>
        </Card>
      )}

      {/* Map */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Delivery Route
        </h3>
        <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: '400px' }}>
          <DeliveryMap
            pickupAddress="123 Main Street, Johannesburg, 2000"
            deliveryAddress={order.delivery_info?.address || 'N/A'}
            deliveryCoords={getDeliveryCoords()}
            driverLocation={getDriverLocation() || undefined}
          />
        </div>
      </Card>

      {/* Driver Information */}
      {driver && (
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Driver Information
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">Driver Name</p>
              <p className="font-semibold text-gray-900">{driver.name}</p>
            </div>
            {driver.phone && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Phone</p>
                <a
                  href={`tel:${driver.phone}`}
                  className="font-semibold text-jeffy-yellow hover:underline"
                >
                  {driver.phone}
                </a>
              </div>
            )}
            {driver.vehicle_type && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Vehicle</p>
                <p className="font-semibold text-gray-900 capitalize">{driver.vehicle_type}</p>
              </div>
            )}
            {driver.current_location && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Location</p>
                <p className="text-xs font-mono text-gray-700">
                  {driver.current_location.lat.toFixed(6)}, {driver.current_location.lng.toFixed(6)}
                </p>
                {driver.last_location_update && (
                  <p className="text-xs text-gray-500 mt-1">
                    Updated {new Date(driver.last_location_update).toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}
            {driver.current_location && order.delivery_info?.latitude && order.delivery_info?.longitude && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${order.delivery_info.latitude},${order.delivery_info.longitude}&origin=${driver.current_location.lat},${driver.current_location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-jeffy-yellow text-gray-900 rounded-lg font-medium hover:bg-yellow-400 transition-colors"
              >
                <Navigation className="w-4 h-4" />
                Open in Google Maps
              </a>
            )}
          </div>
        </Card>
      )}

      {/* Status Timeline */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Delivery Status</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            {(assignment.status as string) === 'delivered' ? (
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            ) : (assignment.status as string) === 'failed' ? (
              <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            ) : (
              <Clock className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className="font-semibold text-gray-900">Order Confirmed</p>
              <p className="text-xs text-gray-600">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {(assignment.status as string) === 'assigned' || (assignment.status as string) === 'picked_up' || (assignment.status as string) === 'in_transit' || (assignment.status as string) === 'delivered' ? (
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Driver Assigned</p>
                {assignment.assigned_at && (
                  <p className="text-xs text-gray-600">
                    {new Date(assignment.assigned_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-500">Awaiting Driver Assignment</p>
              </div>
            </div>
          )}

          {(assignment.status as string) === 'picked_up' || (assignment.status as string) === 'in_transit' || (assignment.status as string) === 'delivered' ? (
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Picked Up</p>
                {assignment.picked_up_at && (
                  <p className="text-xs text-gray-600">
                    {new Date(assignment.picked_up_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ) : (assignment.status as string) === 'assigned' ? (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-500">Awaiting Pickup</p>
              </div>
            </div>
          ) : null}

          {(assignment.status as string) === 'in_transit' && (
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0 animate-pulse" />
              <div>
                <p className="font-semibold text-blue-600">In Transit</p>
                <p className="text-xs text-gray-600">On the way to you</p>
                {eta && (
                  <p className="text-xs text-jeffy-yellow font-medium mt-1">ETA: {eta}</p>
                )}
              </div>
            </div>
          )}

          {(assignment.status as string) === 'delivered' ? (
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-600">Delivered</p>
                {assignment.delivered_at && (
                  <p className="text-xs text-gray-600">
                    {new Date(assignment.delivered_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ) : (assignment.status as string) === 'in_transit' ? (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-500">Awaiting Delivery</p>
              </div>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  )
}

