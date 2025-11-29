import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// GET - Fetch procurement queue items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const locationId = searchParams.get('location_id')

    const supabase = createAdminClient()

    let query = supabase
      .from('procurement_queue')
      .select(`
        *,
        product:products(*),
        variant:product_variants(*),
        location:locations(*)
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Procurement Queue API] Error:', error)
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
    console.error('[Procurement Queue API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch procurement queue' },
      { status: 500 }
    )
  }
}

// POST - Create new procurement queue item (manual addition)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      product_id,
      variant_id,
      location_id,
      quantity_needed,
      procurement_link,
      target_cost_rmb,
      description,
      china_agent_notes,
      priority
    } = body

    if (!product_id || !quantity_needed) {
      return NextResponse.json(
        { success: false, error: 'Product ID and quantity needed are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('procurement_queue')
      .insert({
        product_id,
        variant_id: variant_id || null,
        location_id: location_id || null,
        quantity_needed,
        procurement_link: procurement_link || null,
        target_cost_rmb: target_cost_rmb || null,
        description: description || null,
        china_agent_notes: china_agent_notes || null,
        priority: priority || 'normal',
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('[Procurement Queue API] Error:', error)
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
    console.error('[Procurement Queue API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create procurement queue item' },
      { status: 500 }
    )
  }
}

// PUT - Update procurement queue item
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
      .from('procurement_queue')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Procurement Queue API] Error:', error)
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
    console.error('[Procurement Queue API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update procurement queue item' },
      { status: 500 }
    )
  }
}

// DELETE - Remove procurement queue item
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('procurement_queue')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[Procurement Queue API] Error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })
  } catch (error: any) {
    console.error('[Procurement Queue API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete procurement queue item' },
      { status: 500 }
    )
  }
}

