import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// GET - Fetch franchises
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('active_only') === 'true'

    const supabase = createAdminClient()

    let query = supabase
      .from('locations')
      .select('*')
      .eq('is_franchise', true)
      .order('name')

    if (activeOnly) {
      query = query.eq('is_active', true).eq('franchise_status', 'active')
    }

    const { data, error } = await query

    if (error) {
      console.error('[Franchises API] Error:', error)
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
    console.error('[Franchises API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch franchises' },
      { status: 500 }
    )
  }
}

// POST - Create new franchise
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      code,
      franchise_code,
      franchise_name,
      franchise_owner_name,
      franchise_owner_email,
      franchise_owner_phone,
      address,
      city,
      postal_code,
      country,
      franchise_start_date
    } = body

    if (!name || !franchise_code) {
      return NextResponse.json(
        { success: false, error: 'Name and franchise code are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('locations')
      .insert({
        name,
        code: code || null,
        franchise_code,
        franchise_name: franchise_name || name,
        is_franchise: true,
        franchise_owner_name: franchise_owner_name || null,
        franchise_owner_email: franchise_owner_email || null,
        franchise_owner_phone: franchise_owner_phone || null,
        franchise_start_date: franchise_start_date || null,
        franchise_status: 'active',
        is_active: true,
        address: address || null,
        city: city || null,
        postal_code: postal_code || null,
        country: country || 'South Africa'
      })
      .select()
      .single()

    if (error) {
      console.error('[Franchises API] Error:', error)
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
    console.error('[Franchises API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create franchise' },
      { status: 500 }
    )
  }
}

// PUT - Update franchise
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
      .from('locations')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Franchises API] Error:', error)
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
    console.error('[Franchises API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update franchise' },
      { status: 500 }
    )
  }
}

