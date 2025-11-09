import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name } = body

    // Validate email
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Check if email already exists
    const { data: existing } = await supabase
      .from('coming_soon_signups')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Insert signup
    const { data, error } = await supabase
      .from('coming_soon_signups')
      .insert({
        email,
        name: name || null,
        notified: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating signup:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to sign up' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('Error in coming soon API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('coming_soon_signups')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching signups:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch signups' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    })
  } catch (error) {
    console.error('Error in coming soon GET API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

