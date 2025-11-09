'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/Card'
import { DeliveryMap } from '@/components/DeliveryMap'
import { Order, DeliveryAssignment, Driver } from '@/types/database'
import { Truck, MapPin, Clock, CheckCircle, User, Phone, Package } from 'lucide-react'

interface OrderTrackingProps {
  order: Order
  assignment: DeliveryAssignment | null
  driver: Driver | null
  onDriverUpdate?: (driver: Driver) => void
  onAssignmentUpdate?: (assignment: DeliveryAssignment) => void
}

export function OrderTracking({
  order,
  assignment,
  driver,
  onDriverUpdate,
  onAssignmentUpdate,
}: OrderTrackingProps) {
  const [eta, setEta] = useState<string | null>(null)

  // Calculate ETA if driver and locations are available
  useEffect(() => {
    if (driver?.current_location && order.delivery_info?.latitude && order.delivery_info?.longitude) {
      // Simple ETA calculation (can be enhanced with Google Maps Directions API)
      const distance = calculateDistance(
        driver.current_location.lat,
        driver.current_location.lng,
        order.delivery_info.latitude,
        order.delivery_info.longitude
      )
      const estimatedMinutes = Math.ceil(distance / 0.5) // Assuming average speed of 30km/h
      setEta(`${estimatedMinutes} minutes`)
    }
  }, [driver, order])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'in_transit':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'picked_up':
        return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'assigned':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5" />
      case 'in_transit':
      case 'picked_up':
        return <Truck className="w-5 h-5" />
      case 'assigned':
        return <Package className="w-5 h-5" />
      default:
        return <Clock className="w-5 h-5" />
    }
  }

  if (!assignment) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="text-center py-8">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Waiting for Driver Assignment</h3>
          <p className="text-gray-600">Your order is ready and waiting to be assigned to a driver.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Status Card */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Delivery Status
        </h2>
        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize border-2 ${getStatusColor(
                assignment.status
              )}`}
            >
              <span className="flex items-center gap-2">
                {getStatusIcon(assignment.status)}
                {getStatusLabel(assignment.status)}
              </span>
            </span>
            {eta && (
              <div className="flex items-center gap-2 text-jeffy-yellow">
                <Clock className="w-4 h-4" />
                <span className="font-semibold">ETA: {eta}</span>
              </div>
            )}
          </div>

          {/* Driver Info */}
          {driver && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Driver Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Name:</span>
                  <span className="font-medium text-gray-900">{driver.name}</span>
                </div>
                {driver.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{driver.phone}</span>
                  </div>
                )}
                {driver.vehicle_type && (
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 capitalize">{driver.vehicle_type}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-4 border-t border-gray-200 space-y-2">
            {assignment.assigned_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Assigned:</span>
                <span className="text-gray-900">
                  {new Date(assignment.assigned_at).toLocaleString()}
                </span>
              </div>
            )}
            {assignment.picked_up_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Picked Up:</span>
                <span className="text-gray-900">
                  {new Date(assignment.picked_up_at).toLocaleString()}
                </span>
              </div>
            )}
            {assignment.delivered_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Delivered:</span>
                <span className="text-green-600 font-semibold">
                  {new Date(assignment.delivered_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Delivery Map */}
      {driver?.current_location &&
        order.delivery_info?.latitude &&
        order.delivery_info?.longitude && (
          <Card className="p-0 overflow-hidden">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Delivery Route
              </h2>
            </div>
            <div className="rounded-lg overflow-hidden">
              <DeliveryMap
                pickupAddress="Driver Location"
                deliveryAddress={order.delivery_info.address || 'Delivery Address'}
                pickupCoords={driver.current_location}
                deliveryCoords={{
                  lat: order.delivery_info.latitude,
                  lng: order.delivery_info.longitude,
                }}
                driverLocation={driver.current_location}
              />
            </div>
          </Card>
        )}

      {/* Delivery Notes */}
      {assignment.delivery_notes && (
        <Card className="p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Delivery Notes</h3>
          <p className="text-sm text-gray-600">{assignment.delivery_notes}</p>
        </Card>
      )}
    </div>
  )
}

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in km
}
