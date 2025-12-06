import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// GET - Get a specific request by referral code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const { searchParams } = new URL(request.url)
    const trackClick = searchParams.get('track') === 'true'
    const source = searchParams.get('source') || 'direct'

    const supabase = createAdminClient()

    // Get the request
    const { data, error } = await supabase
      .from('jeffy_requests')
      .select(`
        id,
        request_text,
        requester_name,
        referral_code,
        approvals_needed,
        approvals_received,
        status,
        is_free_product_earned,
        matched_product_name,
        created_at,
        approvals:jeffy_approvals(
          id,
          approver_name,
          approval_type,
          comment,
          created_at
        )
      `)
      .eq('referral_code', code.toUpperCase())
      .single()

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      )
    }

    // Track the click if requested
    if (trackClick) {
      const forwarded = request.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
      const userAgent = request.headers.get('user-agent') || ''
      const referer = request.headers.get('referer') || ''

      await supabase
        .from('jeffy_link_clicks')
        .insert({
          request_id: data.id,
          ip_address: ip,
          user_agent: userAgent,
          referrer: referer,
          referral_source: source
        })
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Error fetching Jeffy request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch request' },
      { status: 500 }
    )
  }
}

// POST - Submit an approval for a request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const body = await request.json()
    const {
      approver_name,
      approver_email,
      approver_phone,
      approval_type,
      comment,
      wants_updates,
      wants_own_link,
      referral_source
    } = body

    // Validate required fields
    if (!approver_email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(approver_email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get the request first
    const { data: requestData, error: requestError } = await supabase
      .from('jeffy_requests')
      .select('id, status, requester_email, approvals_received, approvals_needed')
      .eq('referral_code', code.toUpperCase())
      .single()

    if (requestError || !requestData) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      )
    }

    // Check if request is still active
    if (requestData.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'This request is no longer accepting approvals' },
        { status: 400 }
      )
    }

    // Prevent self-approval
    if (approver_email.toLowerCase() === requestData.requester_email.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'You cannot approve your own request' },
        { status: 400 }
      )
    }

    // Check for duplicate approval
    const { data: existingApproval } = await supabase
      .from('jeffy_approvals')
      .select('id')
      .eq('request_id', requestData.id)
      .eq('approver_email', approver_email.toLowerCase())
      .single()

    if (existingApproval) {
      return NextResponse.json(
        { success: false, error: 'You have already approved this request' },
        { status: 400 }
      )
    }

    // Get IP and user agent for tracking
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    const userAgent = request.headers.get('user-agent') || ''

    // Insert the approval
    const { data, error } = await supabase
      .from('jeffy_approvals')
      .insert({
        request_id: requestData.id,
        approver_name: approver_name || null,
        approver_email: approver_email.toLowerCase(),
        approver_phone: approver_phone || null,
        approval_type: approval_type || 'good_idea',
        comment: comment || null,
        wants_updates: wants_updates || false,
        wants_own_link: wants_own_link || false,
        ip_address: ip,
        user_agent: userAgent,
        referral_source: referral_source || 'direct'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating approval:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to submit approval' },
        { status: 500 }
      )
    }

    // Get updated request status
    const { data: updatedRequest } = await supabase
      .from('jeffy_requests')
      .select('approvals_received, approvals_needed, status, is_free_product_earned')
      .eq('id', requestData.id)
      .single()

    return NextResponse.json({
      success: true,
      data: {
        approval: data,
        request: updatedRequest,
        message: updatedRequest?.is_free_product_earned 
          ? '🎉 Congratulations! This request has earned a FREE product!'
          : `Thanks for your approval! ${updatedRequest?.approvals_received}/${updatedRequest?.approvals_needed} approvals received.`
      }
    })

  } catch (error) {
    console.error('Error submitting approval:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update request (for shipping address after completion)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const body = await request.json()
    const { shipping_address, requester_email } = body

    if (!requester_email) {
      return NextResponse.json(
        { success: false, error: 'Email verification required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get the request and verify ownership
    const { data: requestData, error: requestError } = await supabase
      .from('jeffy_requests')
      .select('id, requester_email, is_free_product_earned')
      .eq('referral_code', code.toUpperCase())
      .single()

    if (requestError || !requestData) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      )
    }

    // Verify email matches
    if (requestData.requester_email.toLowerCase() !== requester_email.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Email does not match request owner' },
        { status: 403 }
      )
    }

    // Check if eligible for free product
    if (!requestData.is_free_product_earned) {
      return NextResponse.json(
        { success: false, error: 'This request has not yet earned a free product' },
        { status: 400 }
      )
    }

    // Update shipping address
    const { error } = await supabase
      .from('jeffy_requests')
      .update({
        shipping_address,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestData.id)

    if (error) {
      console.error('Error updating shipping address:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update shipping address' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Shipping address saved! We will process your free product soon.'
    })

  } catch (error) {
    console.error('Error updating request:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

