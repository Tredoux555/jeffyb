import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { calculateDiscount } from '@/lib/referrals'

/**
 * GET /api/promo-codes?code=XXX&subtotal=XXX
 * Validate a promo code and calculate discount
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')?.toUpperCase()
    const subtotal = parseFloat(searchParams.get('subtotal') || '0')

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Promo code is required' },
        { status: 400 }
      )
    }

    // Find the promo code
    const { data: promoCode } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code)
      .single()

    if (!promoCode) {
      return NextResponse.json({
        success: false,
        isValid: false,
        error: 'Invalid promo code'
      })
    }

    // Calculate discount
    const result = calculateDiscount(subtotal, promoCode)

    return NextResponse.json({
      success: true,
      isValid: result.isValid,
      discountAmount: result.discountAmount,
      message: result.message,
      promoCode: {
        code: promoCode.code,
        type: promoCode.type,
        value: promoCode.value,
        maxDiscountValue: promoCode.max_discount_value
      }
    })
  } catch (error: any) {
    console.error('[Promo Codes] GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to validate code' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/promo-codes/apply
 * Apply a promo code to an order (increment usage)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { code, orderId, userId } = body

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Promo code is required' },
        { status: 400 }
      )
    }

    // Find and validate the promo code
    const { data: promoCode } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (!promoCode) {
      return NextResponse.json(
        { success: false, error: 'Invalid promo code' },
        { status: 400 }
      )
    }

    // Check if code is still valid
    if (!promoCode.is_active) {
      return NextResponse.json(
        { success: false, error: 'This promo code is no longer active' },
        { status: 400 }
      )
    }

    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This promo code has expired' },
        { status: 400 }
      )
    }

    if (promoCode.max_uses && promoCode.times_used >= promoCode.max_uses) {
      return NextResponse.json(
        { success: false, error: 'This promo code has been fully redeemed' },
        { status: 400 }
      )
    }

    // If it's a user-specific code, check user
    if (promoCode.user_id && promoCode.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'This promo code is not valid for your account' },
        { status: 400 }
      )
    }

    // Increment usage count
    const { error: updateError } = await supabase
      .from('promo_codes')
      .update({
        times_used: promoCode.times_used + 1,
        // Deactivate if max uses reached
        is_active: promoCode.max_uses ? (promoCode.times_used + 1 < promoCode.max_uses) : true
      })
      .eq('id', promoCode.id)

    if (updateError) {
      console.error('[Promo Codes] Apply error:', updateError)
      throw updateError
    }

    // If this was a referral discount code, mark it as used
    if (promoCode.referral_id) {
      await supabase
        .from('referrals')
        .update({ discount_used: true })
        .eq('id', promoCode.referral_id)
    }

    // If this was a free product reward, mark user as having claimed
    if (promoCode.type === 'free_product' && promoCode.user_id) {
      await supabase
        .from('user_profiles')
        .update({
          has_claimed_free_product: true,
          free_product_claimed_at: new Date().toISOString()
        })
        .eq('id', promoCode.user_id)

      // Mark the campaign reward as claimed
      if (promoCode.campaign_id) {
        await supabase
          .from('referral_campaigns')
          .update({ reward_claimed: true })
          .eq('id', promoCode.campaign_id)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Promo code applied successfully'
    })
  } catch (error: any) {
    console.error('[Promo Codes] POST error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to apply code' },
      { status: 500 }
    )
  }
}

