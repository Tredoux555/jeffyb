import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      product_name,
      description,
      category,
      estimated_price_range,
      quantity_needed,
      urgency,
      requester_name,
      requester_email,
      requester_phone
    } = body

    // Validate required fields
    if (!product_name || !requester_email) {
      return NextResponse.json(
        { success: false, error: 'Product name and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(requester_email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Insert product request
    const { data, error } = await supabase
      .from('product_requests')
      .insert({
        product_name,
        description: description || null,
        category: category || null,
        estimated_price_range: estimated_price_range || null,
        quantity_needed: quantity_needed || null,
        urgency: urgency || 'normal',
        requester_name: requester_name || null,
        requester_email,
        requester_phone: requester_phone || null,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product request:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to submit product request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('Error in product request API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('product_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching product requests:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch product requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Error in product request GET API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

