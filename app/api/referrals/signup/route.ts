import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { generateVerificationToken, generatePromoCode } from '@/lib/referrals'

/**
 * POST /api/referrals/signup
 * Sign up as a referred user (just email verification)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { email, referralCode } = body

    if (!email || !referralCode) {
      return NextResponse.json(
        { success: false, error: 'Email and referral code are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Check if email already used
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id, email_verified')
      .eq('email', email.toLowerCase())
      .single()

    if (existingReferral) {
      if (existingReferral.email_verified) {
        return NextResponse.json(
          { success: false, error: 'This email has already been used' },
          { status: 400 }
        )
      }
      // If email exists but not verified, we'll resend verification
    }

    // Find the campaign
    const { data: campaign } = await supabase
      .from('referral_campaigns')
      .select('id, referral_code, expires_at, is_completed')
      .eq('referral_code', referralCode)
      .single()

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Invalid referral code' },
        { status: 400 }
      )
    }

    // Check if campaign expired
    if (new Date(campaign.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This referral link has expired' },
        { status: 400 }
      )
    }

    // Generate verification token
    const verificationToken = generateVerificationToken()
    const verificationExpires = new Date()
    verificationExpires.setHours(verificationExpires.getHours() + 24) // 24 hour expiry

    // Create or update referral
    if (existingReferral) {
      // Update existing unverified referral
      await supabase
        .from('referrals')
        .update({
          verification_token: verificationToken,
          verification_expires_at: verificationExpires.toISOString()
        })
        .eq('id', existingReferral.id)
    } else {
      // Create new referral
      const { error: insertError } = await supabase
        .from('referrals')
        .insert({
          campaign_id: campaign.id,
          email: email.toLowerCase(),
          verification_token: verificationToken,
          verification_expires_at: verificationExpires.toISOString()
        })

      if (insertError) {
        // Check if it's a duplicate email error
        if (insertError.code === '23505') {
          return NextResponse.json(
            { success: false, error: 'This email has already been used' },
            { status: 400 }
          )
        }
        throw insertError
      }
    }

    // In a real app, you'd send an email here
    // For now, we'll return the verification link
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jeffy.co.za'
    const verificationUrl = `${baseUrl}/free-product/verify?token=${verificationToken}`

    // TODO: Send actual email using your email service
    // For now, we'll auto-verify in development or return the link
    console.log('[Referral Signup] Verification URL:', verificationUrl)

    return NextResponse.json({
      success: true,
      message: 'Please check your email to verify and claim your discount!',
      // Remove this in production - just for testing
      verificationUrl: process.env.NODE_ENV === 'development' ? verificationUrl : undefined
    })
  } catch (error: any) {
    console.error('[Referral Signup] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Something went wrong' },
      { status: 500 }
    )
  }
}

