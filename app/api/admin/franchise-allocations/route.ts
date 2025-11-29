import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// GET - Fetch franchise stock allocations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const franchiseId = searchParams.get('franchise_id')
    const shipmentId = searchParams.get('shipment_id')
    const status = searchParams.get('status')

    const supabase = createAdminClient()

    let query = supabase
      .from('franchise_stock_allocations')
      .select(`
        *,
        franchise:locations(*),
        product:products(*),
        variant:product_variants(*),
        shipment:shipments(*)
      `)
      .order('created_at', { ascending: false })

    if (franchiseId) {
      query = query.eq('franchise_location_id', franchiseId)
    }

    if (shipmentId) {
      query = query.eq('shipment_id', shipmentId)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Franchise Allocations API] Error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error: any) {
    console.error('[Franchise Allocations API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch allocations' },
      { status: 500 }
    )
  }
}

// POST - Create stock allocations for franchises
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shipment_id, allocations } = body

    if (!shipment_id || !allocations || !Array.isArray(allocations) || allocations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Shipment ID and allocations array are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get shipment items to calculate costs
    const { data: shipmentItems } = await supabase
      .from('shipment_items')
      .select('*')
      .eq('shipment_id', shipment_id)

    // Create allocations
    const allocationRecords = allocations.map((allocation: any) => {
      const shipmentItem = shipmentItems?.find(
        (item: any) => 
          item.product_id === allocation.product_id && 
          item.variant_id === (allocation.variant_id || null)
      )

      return {
        shipment_id,
        franchise_location_id: allocation.franchise_location_id,
        product_id: allocation.product_id,
        variant_id: allocation.variant_id || null,
        quantity_allocated: allocation.quantity,
        unit_cost_zar: shipmentItem?.landed_cost_per_unit || null,
        total_cost_zar: shipmentItem?.landed_cost_per_unit 
          ? (shipmentItem.landed_cost_per_unit * allocation.quantity)
          : null,
        status: 'pending',
        notes: allocation.notes || null
      }
    })

    const { data, error } = await supabase
      .from('franchise_stock_allocations')
      .insert(allocationRecords)
      .select()

    if (error) {
      console.error('[Franchise Allocations API] Error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('[Franchise Allocations API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create allocations' },
      { status: 500 }
    )
  }
}

// PUT - Update allocation (e.g., mark as received)
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const supabase = createAdminClient()

    const updateData: any = {
      ...body,
      updated_at: new Date().toISOString()
    }

    // If marking as received, set received_at
    if (body.status === 'received' && body.quantity_received) {
      updateData.received_at = new Date().toISOString()
      updateData.quantity_received = body.quantity_received
    }

    const { data, error } = await supabase
      .from('franchise_stock_allocations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Franchise Allocations API] Error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('[Franchise Allocations API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update allocation' },
      { status: 500 }
    )
  }
}

