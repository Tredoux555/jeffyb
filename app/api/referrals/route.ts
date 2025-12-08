import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { generateReferralCode, generatePromoCode, generateVerificationToken } from '@/lib/referrals'

/**
 * GET /api/referrals
 * Get referral settings and user's campaign (if logged in)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const referralCode = searchParams.get('code')

    // Get referral settings
    const { data: settings } = await supabase
      .from('referral_settings')
      .select('*')
      .eq('is_active', true)
      .single()

    // If looking up by referral code (for referral landing page)
    if (referralCode) {
      const { data: campaign } = await supabase
        .from('referral_campaigns')
        .select('id, referral_code, expires_at')
        .eq('referral_code', referralCode)
        .gt('expires_at', new Date().toISOString())
        .single()

      return NextResponse.json({
        success: true,
        settings,
        campaign: campaign || null,
        isValidCode: !!campaign
      })
    }

    // If user is logged in, get their campaign
    if (userId) {
      const { data: campaign } = await supabase
        .from('referral_campaigns')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Get their referrals
      let referrals: any[] = []
      if (campaign) {
        const { data: refs } = await supabase
          .from('referrals')
          .select('id, email, email_verified, created_at, verified_at')
          .eq('campaign_id', campaign.id)
          .order('created_at', { ascending: false })

        referrals = refs || []
      }

      // Check if user has already claimed free product
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('has_claimed_free_product')
        .eq('id', userId)
        .single()

      return NextResponse.json({
        success: true,
        settings,
        campaign,
        referrals,
        hasClaimedFreeProduct: profile?.has_claimed_free_product || false
      })
    }

    return NextResponse.json({
      success: true,
      settings
    })
  } catch (error: any) {
    console.error('[Referrals API] GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get referral data' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/referrals
 * Create a new referral campaign for a user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user already has a campaign
    const { data: existingCampaign } = await supabase
      .from('referral_campaigns')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existingCampaign) {
      return NextResponse.json({
        success: true,
        campaign: existingCampaign,
        message: 'Campaign already exists'
      })
    }

    // Check if user has already claimed a free product
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('has_claimed_free_product')
      .eq('id', userId)
      .single()

    if (profile?.has_claimed_free_product) {
      return NextResponse.json(
        { success: false, error: 'You have already claimed your free product' },
        { status: 400 }
      )
    }

    // Get settings for expiry
    const { data: settings } = await supabase
      .from('referral_settings')
      .select('referral_expiry_days')
      .eq('is_active', true)
      .single()

    const expiryDays = settings?.referral_expiry_days || 30
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiryDays)

    // Generate unique referral code
    let referralCode = generateReferralCode()
    let attempts = 0
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('referral_campaigns')
        .select('id')
        .eq('referral_code', referralCode)
        .single()

      if (!existing) break
      referralCode = generateReferralCode()
      attempts++
    }

    // Create campaign
    const { data: campaign, error } = await supabase
      .from('referral_campaigns')
      .insert({
        user_id: userId,
        referral_code: referralCode,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('[Referrals API] Create campaign error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      campaign,
      message: 'Campaign created successfully'
    })
  } catch (error: any) {
    console.error('[Referrals API] POST error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create campaign' },
      { status: 500 }
    )
  }
}

