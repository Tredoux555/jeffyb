import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { generatePromoCode } from '@/lib/referrals'

/**
 * POST /api/referrals/verify
 * Verify a referral email and issue discount code
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Find the referral
    const { data: referral } = await supabase
      .from('referrals')
      .select('*, campaign:referral_campaigns(*)')
      .eq('verification_token', token)
      .single()

    if (!referral) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification link' },
        { status: 400 }
      )
    }

    // Check if already verified
    if (referral.email_verified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        discountCode: referral.discount_code,
        message: 'Email already verified! Use your discount code at checkout.'
      })
    }

    // Check if token expired
    if (new Date(referral.verification_expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Verification link has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Get referral settings
    const { data: settings } = await supabase
      .from('referral_settings')
      .select('referral_discount_percent')
      .eq('is_active', true)
      .single()

    const discountPercent = settings?.referral_discount_percent || 30

    // Generate discount code
    let discountCode = generatePromoCode('WELCOME')
    
    // Create promo code in database
    const { error: promoError } = await supabase
      .from('promo_codes')
      .insert({
        code: discountCode,
        type: 'percentage',
        value: discountPercent,
        max_uses: 1,
        referral_id: referral.id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      })

    if (promoError) {
      console.error('[Verify] Error creating promo code:', promoError)
      // Generate a new code if duplicate
      discountCode = generatePromoCode('WELCOME')
      await supabase
        .from('promo_codes')
        .insert({
          code: discountCode,
          type: 'percentage',
          value: discountPercent,
          max_uses: 1,
          referral_id: referral.id,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
    }

    // Update referral as verified
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        email_verified: true,
        discount_code: discountCode,
        verification_token: null, // Clear token after use
        verified_at: new Date().toISOString()
      })
      .eq('id', referral.id)

    if (updateError) {
      console.error('[Verify] Error updating referral:', updateError)
      throw updateError
    }

    // The trigger will automatically update the campaign's referral_count

    // Check if campaign is now complete (reached 10 referrals)
    const { data: updatedCampaign } = await supabase
      .from('referral_campaigns')
      .select('referral_count, is_completed, user_id')
      .eq('id', referral.campaign_id)
      .single()

    const { data: settingsFull } = await supabase
      .from('referral_settings')
      .select('referrals_required, max_free_product_value')
      .eq('is_active', true)
      .single()

    const requiredReferrals = settingsFull?.referrals_required || 10
    const maxFreeProductValue = settingsFull?.max_free_product_value || 300

    // If campaign just completed, generate reward code for the referrer
    if (updatedCampaign && 
        updatedCampaign.referral_count >= requiredReferrals && 
        !updatedCampaign.is_completed) {
      
      const rewardCode = generatePromoCode('FREE')
      
      // Create the free product promo code
      await supabase
        .from('promo_codes')
        .insert({
          code: rewardCode,
          type: 'free_product',
          value: maxFreeProductValue,
          max_uses: 1,
          max_discount_value: maxFreeProductValue,
          user_id: updatedCampaign.user_id,
          campaign_id: referral.campaign_id
        })

      // Mark campaign as completed
      await supabase
        .from('referral_campaigns')
        .update({
          is_completed: true,
          reward_promo_code: rewardCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', referral.campaign_id)

      // TODO: Send email to referrer notifying them they earned their free product!
      console.log('[Verify] Campaign completed! Referrer can now claim free product:', rewardCode)
    }

    return NextResponse.json({
      success: true,
      verified: true,
      discountCode,
      discountPercent,
      message: `🎉 Email verified! You've got ${discountPercent}% off your first order! Use code: ${discountCode}`
    })
  } catch (error: any) {
    console.error('[Verify] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/referrals/verify
 * Check verification status by token
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    const { data: referral } = await supabase
      .from('referrals')
      .select('email, email_verified, discount_code, verification_expires_at')
      .eq('verification_token', token)
      .single()

    if (!referral) {
      return NextResponse.json({
        success: false,
        error: 'Invalid verification link'
      })
    }

    return NextResponse.json({
      success: true,
      email: referral.email,
      isVerified: referral.email_verified,
      discountCode: referral.discount_code,
      isExpired: new Date(referral.verification_expires_at) < new Date()
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

