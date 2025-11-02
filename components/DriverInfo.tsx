'use client'

import React from 'react'
import { Driver, Order } from '@/types/database'
import { Card } from './Card'
import { Truck, Phone, Mail, Car, Clock, Navigation } from 'lucide-react'

interface DriverInfoProps {
  driver: Driver
  order: Order
}

export function DriverInfo({ driver, order }: DriverInfoProps) {
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
    return null
  }

  const driverLocation = getDriverLocation()
  const deliveryCoords = getDeliveryCoords()

  return (
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

        {driver.email && (
          <div>
            <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              Email
            </p>
            <a
              href={`mailto:${driver.email}`}
              className="font-semibold text-jeffy-yellow hover:underline"
            >
              {driver.email}
            </a>
          </div>
        )}

        {driver.phone && (
          <div>
            <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              Phone
            </p>
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
            <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
              <Car className="w-3 h-3" />
              Vehicle
            </p>
            <p className="font-semibold text-gray-900 capitalize">{driver.vehicle_type}</p>
          </div>
        )}

        {driver.current_location && (
          <div>
            <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Current Location
            </p>
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

        {driverLocation && deliveryCoords && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${deliveryCoords.lat},${deliveryCoords.lng}&origin=${driverLocation.lat},${driverLocation.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-jeffy-yellow text-gray-900 rounded-lg font-medium hover:bg-yellow-400 transition-colors mt-2"
          >
            <Navigation className="w-4 h-4" />
            Open in Google Maps
          </a>
        )}
      </div>
    </Card>
  )
}

