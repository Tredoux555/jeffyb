'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { GoogleMap, LoadScript, DirectionsRenderer, Marker } from '@react-google-maps/api'
import { useGoogleMaps } from '@/lib/hooks/useGoogleMaps'

interface DeliveryMapProps {
  pickupAddress: string
  deliveryAddress: string
  pickupCoords?: { lat: number; lng: number }
  deliveryCoords?: { lat: number; lng: number }
  driverLocation?: { lat: number; lng: number }
}

const containerStyle = {
  width: '100%',
  height: '400px',
}

const defaultCenter = {
  lat: -26.2041, // Johannesburg default
  lng: 28.0473,
}

export function DeliveryMap({
  pickupAddress,
  deliveryAddress,
  pickupCoords,
  deliveryCoords,
  driverLocation,
}: DeliveryMapProps) {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)

  // Google Maps API key
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  // Validate API key format
  const isValidApiKey = apiKey && 
                        apiKey !== '' && 
                        !apiKey.includes('placeholder') &&
                        !apiKey.includes('your_') &&
                        !apiKey.includes('YOUR_') &&
                        apiKey.length > 20

  // Check if Google Maps is already loaded
  const { isLoaded: googleMapsLoaded, scriptLoaded, error: scriptError } = useGoogleMaps()

  // Update isLoaded state if Google Maps is already loaded
  useEffect(() => {
    if (googleMapsLoaded || (typeof window !== 'undefined' && window.google?.maps)) {
      setIsLoaded(true)
    }
  }, [googleMapsLoaded])

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map)
    setIsLoaded(true)
  }, [])

  const handleScriptLoad = useCallback(() => {
    setIsLoaded(true)
  }, [])

  const handleScriptError = useCallback((error: Error) => {
    console.error('Google Maps LoadScript error:', error)
    // Check for specific error types
    if (error.message?.includes('InvalidKeyMapError') || error.message?.includes('InvalidKey')) {
      setMapError('Invalid API key. Please check your Google Maps API key configuration and ensure all required APIs are enabled.')
    } else {
      setMapError('Failed to load Google Maps. Please check your API key configuration.')
    }
  }, [])

  useEffect(() => {
    if (!isValidApiKey) {
      setMapError('Google Maps API key not configured or invalid')
      return
    }

    if (!isLoaded || !window.google?.maps) {
      return
    }

    // Calculate route once Google Maps is loaded
    const calculateRoute = () => {
      try {
        if (!window.google?.maps) return

        const directionsService = new window.google.maps.DirectionsService()

        const origin = pickupCoords 
          ? new window.google.maps.LatLng(pickupCoords.lat, pickupCoords.lng)
          : pickupAddress
        
        const destination = deliveryCoords
          ? new window.google.maps.LatLng(deliveryCoords.lat, deliveryCoords.lng)
          : deliveryAddress

        if (!origin || !destination) return

        directionsService.route(
          {
            origin,
            destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK && result) {
              setDirections(result)
              setMapError(null)
            } else {
              let errorMessage = 'Could not calculate route. Please check addresses.'
              if (status === 'REQUEST_DENIED') {
                errorMessage = 'Directions API access denied. Please check your API key permissions.'
              } else if (status === 'OVER_QUERY_LIMIT') {
                errorMessage = 'API quota exceeded. Please check your Google Cloud billing.'
              }
              setMapError(errorMessage)
            }
          }
        )
      } catch (error) {
        console.error('Error calculating route:', error)
        setMapError('Error loading map directions')
      }
    }

    // Small delay to ensure maps is fully loaded
    const timer = setTimeout(calculateRoute, 500)
    return () => clearTimeout(timer)
  }, [pickupAddress, deliveryAddress, pickupCoords, deliveryCoords, isValidApiKey, isLoaded])

  if (!isValidApiKey) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-600">Google Maps API key not configured</p>
        <p className="text-sm text-gray-500 mt-2">Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file</p>
      </div>
    )
  }

  // If Google Maps is already loaded, render map directly without LoadScript
  if (scriptLoaded || (typeof window !== 'undefined' && window.google?.maps)) {
    return (
      <div className="relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={12}
          onLoad={handleMapLoad}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                polylineOptions: {
                  strokeColor: '#22c55e',
                  strokeWeight: 5,
                },
              }}
            />
          )}
        </GoogleMap>
        {mapError && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-2 rounded shadow-lg text-sm z-10">
            {mapError}
          </div>
        )}
      </div>
    )
  }

  // Otherwise, use LoadScript to load Google Maps
  return (
    <LoadScript 
      googleMapsApiKey={apiKey} 
      onLoad={handleScriptLoad}
      onError={handleScriptError}
      loadingElement={
        <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-600">Loading map...</p>
        </div>
      }
    >
      <div className="relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={12}
          onLoad={handleMapLoad}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                polylineOptions: {
                  strokeColor: '#22c55e',
                  strokeWeight: 5,
                },
              }}
            />
          )}
        </GoogleMap>
        {mapError && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-2 rounded shadow-lg text-sm z-10">
            {mapError}
          </div>
        )}
      </div>
    </LoadScript>
  )
}

