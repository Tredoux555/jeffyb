import { NextRequest, NextResponse } from 'next/server'
import GoogleMapsService from '@/lib/maps/distance'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pickupLocation, deliveryLocation, includeTraffic, departureTime } = body

    if (!pickupLocation || !deliveryLocation) {
      return NextResponse.json(
        { success: false, error: 'Pickup and delivery locations are required' },
        { status: 400 }
      )
    }

    const mapsService = new GoogleMapsService()
    
    const result = await mapsService.calculateDeliveryETA(
      pickupLocation,
      deliveryLocation,
      {
        includeTraffic: includeTraffic || false,
        departureTime: departureTime ? new Date(departureTime) : undefined,
      }
    )

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('ETA calculation failed:', error)
    return NextResponse.json(
      { success: false, error: 'ETA calculation failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address is required' },
        { status: 400 }
      )
    }

    const mapsService = new GoogleMapsService()
    const coordinates = await mapsService.geocodeAddress(address)

    if (coordinates) {
      return NextResponse.json({
        success: true,
        coordinates,
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Address not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Geocoding failed:', error)
    return NextResponse.json(
      { success: false, error: 'Geocoding failed' },
      { status: 500 }
    )
  }
}
