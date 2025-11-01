'use client'

import React, { useState, useRef, useCallback } from 'react'
import { LoadScript, Autocomplete } from '@react-google-maps/api'
import { Input } from './Input'
import { MapPin, CheckCircle2, AlertCircle } from 'lucide-react'

interface AddressInputProps {
  label?: string
  value: string
  onChange: (address: string) => void
  onAddressSelect?: (data: {
    address: string
    city: string
    postal_code: string
    latitude?: number
    longitude?: number
  }) => void
  placeholder?: string
  required?: boolean
  error?: string
  helperText?: string
  className?: string
}

export function AddressInput({
  label = 'Delivery Address',
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Type and select an address (e.g., 123 Main St, Johannesburg)',
  required = false,
  error,
  helperText,
  className
}: AddressInputProps) {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [isValidated, setIsValidated] = useState(false)
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [geocodeError, setGeocodeError] = useState<string | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  // Validate API key format
  const isValidApiKey = apiKey && 
                        apiKey !== '' && 
                        !apiKey.includes('placeholder') &&
                        !apiKey.includes('your_') &&
                        !apiKey.includes('YOUR_') &&
                        apiKey.length > 20

  const handleLoad = useCallback(() => {
    setMapsLoaded(true)
  }, [])

  const handleError = useCallback((error: Error) => {
    console.error('Google Maps LoadScript error:', error)
    setMapsLoaded(false)
    setGeocodeError('Google Maps failed to load. You can still enter your address manually.')
  }, [])

  const handlePlaceSelect = useCallback(() => {
    try {
      if (!autocompleteRef.current) return

      const place = autocompleteRef.current.getPlace()
      
      if (!place || !place.geometry) {
        setGeocodeError('Please select an address from the suggestions.')
        setIsValidated(false)
        return
      }

      setIsGeocoding(true)
      setGeocodeError(null)
      setIsValidated(false)

      // Get formatted address
      const formattedAddress = place.formatted_address || place.name || value
      
      // Get coordinates
      const lat = place.geometry.location?.lat()
      const lng = place.geometry.location?.lng()

      // Extract city and postal code from address components
      let city = ''
      let postalCode = ''

      place.address_components?.forEach((component) => {
        if (component.types.includes('locality')) {
          city = component.long_name
        }
        if (component.types.includes('postal_code')) {
          postalCode = component.long_name
        }
      })

      // Update address value
      onChange(formattedAddress)

      // Callback with all address data including coordinates
      if (onAddressSelect) {
        onAddressSelect({
          address: formattedAddress,
          city,
          postal_code: postalCode,
          latitude: lat,
          longitude: lng
        })
      }

      setIsValidated(true)
      setIsGeocoding(false)
      setGeocodeError(null)
    } catch (error) {
      console.error('Error processing selected address:', error)
      setGeocodeError('Error processing address. Please try again or enter manually.')
      setIsValidated(false)
      setIsGeocoding(false)
    }
  }, [value, onChange, onAddressSelect])

  const handleAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete
    setAutocomplete(autocomplete)
  }, [])

  // Fallback to manual input if API key is missing or invalid
  if (!isValidApiKey) {
    return (
      <div className={className}>
        <Input
          label={label}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setIsValidated(false)
            setGeocodeError(null)
          }}
          placeholder={placeholder || 'Enter your full delivery address'}
          required={required}
          error={error || geocodeError || undefined}
          helperText={helperText || 'Please enter complete address including street, city, and postal code'}
          className="relative"
        />
      </div>
    )
  }

  // With valid API key, use Google Places Autocomplete
  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={['places']}
      onLoad={handleLoad}
      onError={handleError}
      loadingElement={
        <div className="w-full">
          <Input
            label={label}
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              setIsValidated(false)
              setGeocodeError(null)
            }}
            placeholder={placeholder || 'Loading address suggestions...'}
            required={required}
            error={error}
            helperText={helperText}
            disabled
          />
        </div>
      }
    >
      <div className={className}>
        <div className="relative">
          {/* MapPin Icon */}
          <MapPin className="absolute left-3 top-[42px] w-5 h-5 text-gray-400 pointer-events-none z-10" />
          
          {/* Validation Icons */}
          {isGeocoding && (
            <div className="absolute right-3 top-[42px] w-5 h-5 pointer-events-none z-10">
              <div className="w-5 h-5 border-2 border-jeffy-yellow border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {isValidated && !isGeocoding && (
            <CheckCircle2 className="absolute right-3 top-[42px] w-5 h-5 text-green-500 pointer-events-none z-10" />
          )}
          {geocodeError && (
            <AlertCircle className="absolute right-3 top-[42px] w-5 h-5 text-yellow-500 pointer-events-none z-10" />
          )}

          {mapsLoaded ? (
            <Autocomplete
              onLoad={handleAutocompleteLoad}
              onPlaceChanged={handlePlaceSelect}
              options={{
                componentRestrictions: { country: 'za' }, // Restrict to South Africa
                fields: ['formatted_address', 'geometry', 'address_components', 'name'],
                types: ['address']
              }}
            >
              <Input
                label={label}
                value={value}
                onChange={(e) => {
                  onChange(e.target.value)
                  setIsValidated(false)
                  setGeocodeError(null)
                }}
                placeholder={placeholder || 'Type and select an address...'}
                required={required}
                error={error || geocodeError || undefined}
                helperText={
                  isValidated 
                    ? 'Address validated! Coordinates captured.' 
                    : helperText || 'Start typing your address and select from suggestions'
                }
                className="pl-10 pr-10"
              />
            </Autocomplete>
          ) : (
            <Input
              label={label}
              value={value}
              onChange={(e) => {
                onChange(e.target.value)
                setIsValidated(false)
                setGeocodeError(null)
              }}
              placeholder={placeholder || 'Enter your delivery address'}
              required={required}
              error={error || geocodeError || undefined}
              helperText={helperText || 'Enter your full address'}
              className="pl-10"
            />
          )}
        </div>
      </div>
    </LoadScript>
  )
}

