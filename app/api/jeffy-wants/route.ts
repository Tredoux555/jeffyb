import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { nanoid } from 'nanoid'

// Generate a unique referral code
function generateReferralCode(): string {
  // Create a 6-character alphanumeric code (uppercase)
  return nanoid(6).toUpperCase()
}

// POST - Create a new Jeffy request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      request_text,
      voice_transcript,
      image_urls,
      reference_links,
      requester_name,
      requester_email,
      requester_phone,
      product_category,
      price_concern
    } = body

    // Validate required fields
    if (!request_text || !requester_name || !requester_email) {
      return NextResponse.json(
        { success: false, error: 'Request text, name, and email are required' },
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

    // Generate unique referral code
    let referral_code = generateReferralCode()
    
    // Make sure code is unique
    let attempts = 0
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('jeffy_requests')
        .select('id')
        .eq('referral_code', referral_code)
        .single()
      
      if (!existing) break
      referral_code = generateReferralCode()
      attempts++
    }

    // Extract keywords from request (simple extraction)
    const keywords = request_text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word: string) => word.length > 3)
      .slice(0, 10)

    // Insert the request
    const { data, error } = await supabase
      .from('jeffy_requests')
      .insert({
        request_text,
        voice_transcript: voice_transcript || null,
        image_urls: image_urls || null,
        reference_links: reference_links || null,
        requester_name,
        requester_email,
        requester_phone: requester_phone || null,
        referral_code,
        product_category: product_category || null,
        product_keywords: keywords.length > 0 ? keywords : null,
        price_concern: price_concern || null,
        approvals_needed: 10,
        approvals_received: 0,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating Jeffy request:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create request' },
        { status: 500 }
      )
    }

    // Generate the shareable link
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jeffy.co.za'
    const shareableLink = `${baseUrl}/want/${referral_code}`

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        shareable_link: shareableLink
      }
    })

  } catch (error) {
    console.error('Error in Jeffy wants API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get all requests (for admin) or popular requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'popular'
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')

    const supabase = createAdminClient()

    if (type === 'popular') {
      // Get popular/trending requests
      let query = supabase
        .from('jeffy_requests')
        .select(`
          *,
          approvals:jeffy_approvals(count)
        `)
        .in('status', ['active', 'completed'])
        .order('approvals_received', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)

      const { data, error } = await query

      if (error) throw error

      return NextResponse.json({
        success: true,
        data: data || []
      })

    } else if (type === 'all') {
      // Admin view - all requests
      let query = supabase
        .from('jeffy_requests')
        .select(`
          *,
          approvals:jeffy_approvals(
            id,
            approver_name,
            approver_email,
            approval_type,
            wants_updates,
            created_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error

      return NextResponse.json({
        success: true,
        data: data || []
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid request type'
    }, { status: 400 })

  } catch (error) {
    console.error('Error fetching Jeffy requests:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

