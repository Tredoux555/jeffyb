import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// GET - Fetch shipments
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    const supabase = createAdminClient()

    let query = supabase
      .from('shipments')
      .select(`
        *,
        batch:procurement_batches(*),
        items:shipment_items(
          *,
          product:products(*),
          variant:product_variants(*),
          hsCode:hs_codes(*)
        )
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Shipments API] Error:', error)
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
    console.error('[Shipments API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch shipments' },
      { status: 500 }
    )
  }
}

// POST - Create new shipment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      procurement_batch_id,
      total_cost_rmb,
      shipping_cost,
      insurance_cost,
      exchange_rate,
      items
    } = body

    if (!procurement_batch_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Procurement batch ID and items are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Generate shipment reference
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('shipments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01`)
    
    const shipmentNumber = (count || 0) + 1
    const shipmentReference = `SHIP-${year}-${String(shipmentNumber).padStart(3, '0')}`

    // Calculate totals
    const totalCostZar = total_cost_rmb && exchange_rate ? total_cost_rmb * exchange_rate : 0

    // Create shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .insert({
        shipment_reference: shipmentReference,
        procurement_batch_id,
        total_cost_rmb: total_cost_rmb || null,
        total_cost_zar: totalCostZar,
        shipping_cost: shipping_cost || null,
        insurance_cost: insurance_cost || null,
        exchange_rate: exchange_rate || null,
        status: 'ordered',
        ordered_at: new Date().toISOString()
      })
      .select()
      .single()

    if (shipmentError) {
      console.error('[Shipments API] Error creating shipment:', shipmentError)
      return NextResponse.json(
        { success: false, error: shipmentError.message },
        { status: 500 }
      )
    }

    // Create shipment items
    const shipmentItems = items.map((item: any) => ({
      shipment_id: shipment.id,
      product_id: item.product_id,
      variant_id: item.variant_id || null,
      quantity: item.quantity,
      unit_cost_rmb: item.unit_cost_rmb || null,
      unit_cost_zar: item.unit_cost_zar || null,
      line_total_rmb: item.line_total_rmb || null,
      line_total_zar: item.line_total_zar || null,
      hs_code: item.hs_code || null,
      import_duty_rate: item.import_duty_rate || null,
      import_duty_amount: item.import_duty_amount || null,
      vat_amount: item.vat_amount || null,
      landed_cost_per_unit: item.landed_cost_per_unit || null,
      weight_kg: item.weight_kg || null,
      length_cm: item.length_cm || null,
      width_cm: item.width_cm || null,
      height_cm: item.height_cm || null
    }))

    const { error: itemsError } = await supabase
      .from('shipment_items')
      .insert(shipmentItems)

    if (itemsError) {
      console.error('[Shipments API] Error creating shipment items:', itemsError)
      // Rollback shipment
      await supabase.from('shipments').delete().eq('id', shipment.id)
      return NextResponse.json(
        { success: false, error: itemsError.message },
        { status: 500 }
      )
    }

    // Calculate customs totals
    const totalImportDuty = items.reduce((sum: number, item: any) => sum + (item.import_duty_amount || 0), 0)
    const totalVat = items.reduce((sum: number, item: any) => sum + (item.vat_amount || 0), 0)
    const totalLandedCost = totalCostZar + (shipping_cost || 0) + (insurance_cost || 0) + totalImportDuty + totalVat

    // Update shipment with calculated totals
    await supabase
      .from('shipments')
      .update({
        total_import_duty: totalImportDuty,
        total_vat: totalVat,
        total_landed_cost: totalLandedCost
      })
      .eq('id', shipment.id)

    // Fetch complete shipment
    const { data: completeShipment } = await supabase
      .from('shipments')
      .select(`
        *,
        batch:procurement_batches(*),
        items:shipment_items(
          *,
          product:products(*),
          variant:product_variants(*),
          hsCode:hs_codes(*)
        )
      `)
      .eq('id', shipment.id)
      .single()

    return NextResponse.json({
      success: true,
      data: completeShipment
    })
  } catch (error: any) {
    console.error('[Shipments API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create shipment' },
      { status: 500 }
    )
  }
}

// PUT - Update shipment
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

    const { data, error } = await supabase
      .from('shipments')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Shipments API] Error:', error)
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
    console.error('[Shipments API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update shipment' },
      { status: 500 }
    )
  }
}

