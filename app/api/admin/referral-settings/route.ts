import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

/**
 * GET /api/admin/referral-settings
 * Get referral settings and stats
 */
export async function GET() {
  try {
    const supabase = createAdminClient()

    // Get settings
    const { data: settings, error: settingsError } = await supabase
      .from('referral_settings')
      .select('*')
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('[Referral Settings] Error fetching settings:', settingsError)
    }

    // Get campaign stats
    const { data: campaigns } = await supabase
      .from('referral_campaigns')
      .select('id, is_completed, reward_claimed, expires_at')

    const { data: referrals } = await supabase
      .from('referrals')
      .select('id, email_verified')

    const now = new Date()
    const stats = {
      total_campaigns: campaigns?.length || 0,
      active_campaigns: campaigns?.filter(c => 
        !c.is_completed && new Date(c.expires_at) > now
      ).length || 0,
      completed_campaigns: campaigns?.filter(c => c.is_completed).length || 0,
      total_referrals: referrals?.length || 0,
      verified_referrals: referrals?.filter(r => r.email_verified).length || 0,
      rewards_claimed: campaigns?.filter(c => c.reward_claimed).length || 0
    }

    return NextResponse.json({
      success: true,
      settings: settings || {
        referrals_required: 10,
        referral_discount_percent: 30,
        max_free_product_value: 300,
        referral_expiry_days: 30,
        is_active: true
      },
      stats
    })
  } catch (error: any) {
    console.error('[Referral Settings] GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/referral-settings
 * Update referral settings
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const {
      referrals_required,
      referral_discount_percent,
      max_free_product_value,
      referral_expiry_days,
      is_active
    } = body

    // Validate
    if (referrals_required < 1 || referrals_required > 100) {
      return NextResponse.json(
        { success: false, error: 'Referrals required must be between 1 and 100' },
        { status: 400 }
      )
    }

    if (referral_discount_percent < 1 || referral_discount_percent > 100) {
      return NextResponse.json(
        { success: false, error: 'Discount must be between 1 and 100%' },
        { status: 400 }
      )
    }

    // Check if settings exist
    const { data: existing } = await supabase
      .from('referral_settings')
      .select('id')
      .single()

    if (existing) {
      // Update
      const { error } = await supabase
        .from('referral_settings')
        .update({
          referrals_required,
          referral_discount_percent,
          max_free_product_value,
          referral_expiry_days,
          is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) throw error
    } else {
      // Insert
      const { error } = await supabase
        .from('referral_settings')
        .insert({
          referrals_required,
          referral_discount_percent,
          max_free_product_value,
          referral_expiry_days,
          is_active
        })

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Referral Settings] PUT error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: 500 }
    )
  }
}

