// Google Maps Distance Matrix API Integration
// This file provides the framework for calculating distances and ETAs

export interface Location {
  address: string
  lat?: number
  lng?: number
}

export interface DistanceMatrixRequest {
  origins: Location[]
  destinations: Location[]
  mode?: 'driving' | 'walking' | 'bicycling' | 'transit'
  units?: 'metric' | 'imperial'
  avoid?: ('tolls' | 'highways' | 'ferries' | 'indoor')[]
  traffic_model?: 'best_guess' | 'pessimistic' | 'optimistic'
  departure_time?: number
  arrival_time?: number
}

export interface DistanceMatrixResponse {
  origin_addresses: string[]
  destination_addresses: string[]
  rows: Array<{
    elements: Array<{
      status: string
      duration?: {
        text: string
        value: number
      }
      distance?: {
        text: string
        value: number
      }
      duration_in_traffic?: {
        text: string
        value: number
      }
    }>
  }>
}

export interface ETAEstimate {
  duration: string
  durationInSeconds: number
  distance: string
  distanceInMeters: number
  trafficDuration?: string
  trafficDurationInSeconds?: number
}

export class GoogleMapsService {
  private apiKey: string
  private baseUrl = 'https://maps.googleapis.com/maps/api'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  }

  /**
   * Geocode an address to get coordinates
   */
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`
      )
      
      const data = await response.json()
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location
        return {
          lat: location.lat,
          lng: location.lng,
        }
      }
      
      return null
    } catch (error) {
      console.error('Geocoding failed:', error)
      return null
    }
  }

  /**
   * Get distance matrix between origins and destinations
   */
  async getDistanceMatrix(request: DistanceMatrixRequest): Promise<DistanceMatrixResponse | null> {
    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        origins: request.origins.map(origin => 
          origin.lat && origin.lng 
            ? `${origin.lat},${origin.lng}` 
            : origin.address
        ).join('|'),
        destinations: request.destinations.map(dest => 
          dest.lat && dest.lng 
            ? `${dest.lat},${dest.lng}` 
            : dest.address
        ).join('|'),
        mode: request.mode || 'driving',
        units: request.units || 'metric',
      })

      if (request.avoid && request.avoid.length > 0) {
        params.append('avoid', request.avoid.join('|'))
      }

      if (request.traffic_model) {
        params.append('traffic_model', request.traffic_model)
      }

      if (request.departure_time) {
        params.append('departure_time', request.departure_time.toString())
      }

      if (request.arrival_time) {
        params.append('arrival_time', request.arrival_time.toString())
      }

      const response = await fetch(`${this.baseUrl}/distancematrix/json?${params.toString()}`)
      const data = await response.json()

      if (data.status === 'OK') {
        return data
      } else {
        console.error('Distance Matrix API error:', data.error_message)
        return null
      }
    } catch (error) {
      console.error('Distance matrix request failed:', error)
      return null
    }
  }

  /**
   * Calculate ETA between two locations
   */
  async calculateETA(
    origin: Location,
    destination: Location,
    options?: {
      mode?: 'driving' | 'walking' | 'bicycling' | 'transit'
      includeTraffic?: boolean
      departureTime?: Date
    }
  ): Promise<ETAEstimate | null> {
    try {
      // Geocode addresses if coordinates not provided
      let originCoords = origin
      let destCoords = destination

      if (!origin.lat || !origin.lng) {
        const geocoded = await this.geocodeAddress(origin.address)
        if (!geocoded) return null
        originCoords = { ...origin, ...geocoded }
      }

      if (!destination.lat || !destination.lng) {
        const geocoded = await this.geocodeAddress(destination.address)
        if (!geocoded) return null
        destCoords = { ...destination, ...geocoded }
      }

      const request: DistanceMatrixRequest = {
        origins: [originCoords],
        destinations: [destCoords],
        mode: options?.mode || 'driving',
        traffic_model: options?.includeTraffic ? 'best_guess' : undefined,
        departure_time: options?.departureTime ? Math.floor(options.departureTime.getTime() / 1000) : undefined,
      }

      const response = await this.getDistanceMatrix(request)
      
      if (!response || response.rows.length === 0 || response.rows[0].elements.length === 0) {
        return null
      }

      const element = response.rows[0].elements[0]
      
      if (element.status !== 'OK') {
        return null
      }

      const result: ETAEstimate = {
        duration: element.duration?.text || 'Unknown',
        durationInSeconds: element.duration?.value || 0,
        distance: element.distance?.text || 'Unknown',
        distanceInMeters: element.distance?.value || 0,
      }

      if (element.duration_in_traffic) {
        result.trafficDuration = element.duration_in_traffic.text
        result.trafficDurationInSeconds = element.duration_in_traffic.value
      }

      return result
    } catch (error) {
      console.error('ETA calculation failed:', error)
      return null
    }
  }

  /**
   * Calculate ETA for delivery route
   */
  async calculateDeliveryETA(
    pickupLocation: string,
    deliveryLocation: string,
    options?: {
      includeTraffic?: boolean
      departureTime?: Date
    }
  ): Promise<{
    pickupToDelivery: ETAEstimate | null
    totalDistance: string
    totalDuration: string
    estimatedArrival: Date | null
  }> {
    try {
      const eta = await this.calculateETA(
        { address: pickupLocation },
        { address: deliveryLocation },
        {
          mode: 'driving',
          includeTraffic: options?.includeTraffic,
          departureTime: options?.departureTime,
        }
      )

      if (!eta) {
        return {
          pickupToDelivery: null,
          totalDistance: 'Unknown',
          totalDuration: 'Unknown',
          estimatedArrival: null,
        }
      }

      const departureTime = options?.departureTime || new Date()
      const estimatedArrival = new Date(
        departureTime.getTime() + (eta.trafficDurationInSeconds || eta.durationInSeconds) * 1000
      )

      return {
        pickupToDelivery: eta,
        totalDistance: eta.distance,
        totalDuration: eta.trafficDuration || eta.duration,
        estimatedArrival,
      }
    } catch (error) {
      console.error('Delivery ETA calculation failed:', error)
      return {
        pickupToDelivery: null,
        totalDistance: 'Unknown',
        totalDuration: 'Unknown',
        estimatedArrival: null,
      }
    }
  }

  /**
   * Get directions between two points
   */
  async getDirections(
    origin: Location,
    destination: Location,
    options?: {
      mode?: 'driving' | 'walking' | 'bicycling' | 'transit'
      avoid?: ('tolls' | 'highways' | 'ferries' | 'indoor')[]
      waypoints?: Location[]
    }
  ) {
    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        origin: origin.lat && origin.lng 
          ? `${origin.lat},${origin.lng}` 
          : origin.address,
        destination: destination.lat && destination.lng 
          ? `${destination.lat},${destination.lng}` 
          : destination.address,
        mode: options?.mode || 'driving',
      })

      if (options?.avoid && options.avoid.length > 0) {
        params.append('avoid', options.avoid.join('|'))
      }

      if (options?.waypoints && options.waypoints.length > 0) {
        const waypointStr = options.waypoints.map(wp => 
          wp.lat && wp.lng ? `${wp.lat},${wp.lng}` : wp.address
        ).join('|')
        params.append('waypoints', waypointStr)
      }

      const response = await fetch(`${this.baseUrl}/directions/json?${params.toString()}`)
      const data = await response.json()

      if (data.status === 'OK') {
        return data
      } else {
        console.error('Directions API error:', data.error_message)
        return null
      }
    } catch (error) {
      console.error('Directions request failed:', error)
      return null
    }
  }

  /**
   * Format duration for display
   */
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  /**
   * Format distance for display
   */
  static formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    } else {
      return `${meters} m`
    }
  }
}

export default GoogleMapsService
