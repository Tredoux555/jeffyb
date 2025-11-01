'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import { useGoogleMaps } from '@/lib/hooks/useGoogleMaps'
import { Driver } from '@/types/database'
import { Truck, MapPin, Clock } from 'lucide-react'

interface DriversMapProps {
  drivers: Driver[]
  onDriverClick?: (driver: Driver) => void
}

const containerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '600px',
}

const defaultCenter = {
  lat: -26.2041, // Johannesburg default
  lng: 28.0473,
}

// Marker icon colors
const getMarkerIcon = (status: Driver['status']): google.maps.Symbol | null => {
  if (!window.google?.maps) return null

  const colors: Record<string, string> = {
    active: '#22c55e', // Green
    busy: '#eab308', // Yellow
    inactive: '#ef4444', // Red
  }

  const color = colors[status] || '#9ca3af' // Gray for unknown

  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 10,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
  }
}

export function DriversMap({ drivers, onDriverClick }: DriversMapProps) {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null)
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)

  // Check if Google Maps is already loaded
  const { isLoaded: googleMapsLoaded, scriptLoaded } = useGoogleMaps()

  // Filter drivers with valid locations
  const driversWithLocations = useMemo(() => {
    return drivers.filter(
      (driver) =>
        driver.current_location &&
        typeof driver.current_location.lat === 'number' &&
        typeof driver.current_location.lng === 'number' &&
        !isNaN(driver.current_location.lat) &&
        !isNaN(driver.current_location.lng)
    )
  }, [drivers])

  // Calculate bounds to fit all drivers
  useEffect(() => {
    if (!mapInstance || driversWithLocations.length === 0 || !window.google?.maps) return

    const latLngBounds = new window.google.maps.LatLngBounds()

    driversWithLocations.forEach((driver) => {
      if (driver.current_location) {
        latLngBounds.extend(
          new window.google.maps.LatLng(
            driver.current_location.lat,
            driver.current_location.lng
          )
        )
      }
    })

    // Only fit bounds if we have drivers, otherwise use default center
    if (driversWithLocations.length > 0) {
      setBounds(latLngBounds)
      mapInstance.fitBounds(latLngBounds)
    }
  }, [mapInstance, driversWithLocations])

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map)
  }, [])

  const handleMarkerClick = useCallback(
    (driver: Driver) => {
      setSelectedDriver(driver)
      if (onDriverClick) {
        onDriverClick(driver)
      }
    },
    [onDriverClick]
  )

  const handleInfoWindowClose = useCallback(() => {
    setSelectedDriver(null)
  }, [])

  const formatLastUpdate = (timestamp?: string) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  const isValidApiKey =
    apiKey &&
    apiKey !== '' &&
    !apiKey.includes('placeholder') &&
    !apiKey.includes('your_') &&
    !apiKey.includes('YOUR_') &&
    apiKey.length > 20

  if (!isValidApiKey) {
    return (
      <div className="w-full h-full min-h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Google Maps API key not configured</p>
          <p className="text-sm text-gray-500 mt-2">
            Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file
          </p>
        </div>
      </div>
    )
  }

  // If Google Maps is already loaded, render map directly
  const mapContent = (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={driversWithLocations.length === 0 ? 12 : undefined}
        onLoad={handleMapLoad}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          disableDefaultUI: false,
        }}
      >
        {driversWithLocations.map((driver) => {
          if (!driver.current_location) return null

          const icon = window.google?.maps ? getMarkerIcon(driver.status) : undefined

          return (
            <Marker
              key={driver.id}
              position={{
                lat: driver.current_location.lat,
                lng: driver.current_location.lng,
              }}
              icon={icon || undefined}
              onClick={() => handleMarkerClick(driver)}
            >
              {selectedDriver?.id === driver.id && (
                <InfoWindow onCloseClick={handleInfoWindowClose}>
                  <div className="p-2 min-w-[200px]">
                    <div className="font-semibold text-gray-900 mb-2">{driver.name}</div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            driver.status === 'active'
                              ? 'bg-green-500'
                              : driver.status === 'busy'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                        />
                        <span className="capitalize">{driver.status}</span>
                      </div>
                      {driver.vehicle_type && (
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4" />
                          <span className="capitalize">{driver.vehicle_type}</span>
                        </div>
                      )}
                      {driver.last_location_update && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatLastUpdate(driver.last_location_update)}</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        {driver.email}
                      </div>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Marker>
          )
        })}
      </GoogleMap>

      {driversWithLocations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No drivers with location data</p>
            <p className="text-sm text-gray-500 mt-2">
              Drivers need to have their location tracked to appear on the map
            </p>
          </div>
        </div>
      )}
    </div>
  )

  // If Google Maps is already loaded, render directly without LoadScript
  if (scriptLoaded || (typeof window !== 'undefined' && window.google?.maps)) {
    return mapContent
  }

  // Otherwise, use LoadScript to load Google Maps
  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      loadingElement={
        <div className="w-full h-full min-h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jeffy-yellow mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      }
    >
      {mapContent}
    </LoadScript>
  )
}

