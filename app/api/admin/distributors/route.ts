import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// GET - Fetch distributors
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const locationId = searchParams.get('location_id')
    const status = searchParams.get('status')

    const supabase = createAdminClient()

    let query = supabase
      .from('distributors')
      .select(`
        *,
        location:locations(*)
      `)
      .order('created_at', { ascending: false })

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Distributors API] Error:', error)
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
    console.error('[Distributors API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch distributors' },
      { status: 500 }
    )
  }
}

// POST - Create new distributor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      location_id,
      business_name,
      tax_number,
      vat_number,
      bank_name,
      bank_account_number,
      bank_account_type,
      branch_code,
      notes
    } = body

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('distributors')
      .insert({
        name,
        email,
        phone: phone || null,
        location_id: location_id || null,
        business_name: business_name || null,
        tax_number: tax_number || null,
        vat_number: vat_number || null,
        bank_name: bank_name || null,
        bank_account_number: bank_account_number || null,
        bank_account_type: bank_account_type || null,
        branch_code: branch_code || null,
        status: 'active',
        contract_signed: false,
        notes: notes || null
      })
      .select()
      .single()

    if (error) {
      console.error('[Distributors API] Error:', error)
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
    console.error('[Distributors API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create distributor' },
      { status: 500 }
    )
  }
}

// PUT - Update distributor
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
      .from('distributors')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Distributors API] Error:', error)
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
    console.error('[Distributors API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update distributor' },
      { status: 500 }
    )
  }
}

// DELETE - Remove distributor
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
      .from('distributors')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[Distributors API] Error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })
  } catch (error: any) {
    console.error('[Distributors API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete distributor' },
      { status: 500 }
    )
  }
}

