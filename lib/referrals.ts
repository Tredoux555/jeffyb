/**
 * Referral System Utilities
 * Handles referral campaigns, tracking, and promo code generation
 */

export interface ReferralSettings {
  id: string
  referrals_required: number
  referral_discount_percent: number
  max_free_product_value: number
  referral_expiry_days: number
  is_active: boolean
}

export interface ReferralCampaign {
  id: string
  user_id: string
  referral_code: string
  referral_count: number
  is_completed: boolean
  reward_claimed: boolean
  reward_promo_code: string | null
  expires_at: string
  created_at: string
}

export interface Referral {
  id: string
  campaign_id: string
  email: string
  email_verified: boolean
  verification_token: string | null
  discount_code: string | null
  discount_used: boolean
  created_at: string
  verified_at: string | null
}

export interface PromoCode {
  id: string
  code: string
  type: 'percentage' | 'fixed' | 'free_product'
  value: number
  max_uses: number
  times_used: number
  min_order_value: number
  max_discount_value: number | null
  user_id: string | null
  is_active: boolean
  expires_at: string | null
}

/**
 * Generate a unique referral code
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'JEFFY-'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Generate a unique promo code
 */
export function generatePromoCode(prefix: string = 'PROMO'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = `${prefix}-`
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Generate a verification token
 */
export function generateVerificationToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let token = ''
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(
  subtotal: number,
  promoCode: PromoCode
): { discountAmount: number; isValid: boolean; message: string } {
  // Check if code is active
  if (!promoCode.is_active) {
    return { discountAmount: 0, isValid: false, message: 'This promo code is no longer active' }
  }

  // Check if expired
  if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
    return { discountAmount: 0, isValid: false, message: 'This promo code has expired' }
  }

  // Check max uses
  if (promoCode.max_uses && promoCode.times_used >= promoCode.max_uses) {
    return { discountAmount: 0, isValid: false, message: 'This promo code has been fully redeemed' }
  }

  // Check minimum order value
  if (subtotal < promoCode.min_order_value) {
    return { 
      discountAmount: 0, 
      isValid: false, 
      message: `Minimum order of R${promoCode.min_order_value.toFixed(2)} required` 
    }
  }

  let discountAmount = 0

  switch (promoCode.type) {
    case 'percentage':
      discountAmount = (subtotal * promoCode.value) / 100
      // Cap at max discount if set
      if (promoCode.max_discount_value && discountAmount > promoCode.max_discount_value) {
        discountAmount = promoCode.max_discount_value
      }
      break

    case 'fixed':
      discountAmount = promoCode.value
      // Don't discount more than the subtotal
      if (discountAmount > subtotal) {
        discountAmount = subtotal
      }
      break

    case 'free_product':
      // For free product, the max_discount_value is the max product value allowed
      discountAmount = promoCode.max_discount_value || 0
      break
  }

  return {
    discountAmount,
    isValid: true,
    message: promoCode.type === 'free_product' 
      ? `Free product up to R${(promoCode.max_discount_value || 0).toFixed(2)}!`
      : `R${discountAmount.toFixed(2)} off!`
  }
}

/**
 * Generate share URLs for social platforms
 */
export function generateShareUrls(referralCode: string, baseUrl: string) {
  const referralUrl = `${baseUrl}/free-product?ref=${referralCode}`
  const shareText = encodeURIComponent(
    `🎁 Get a FREE product from Jeffy! Sign up and you could get a free product too. Use my link:`
  )
  const shareTextWhatsApp = encodeURIComponent(
    `🎁 Hey! I found this awesome deal - you can get a FREE product from Jeffy! Just sign up with my link and verify your email to get 30% off. Plus, you can get your own free product by sharing too!\n\n${referralUrl}`
  )

  return {
    referralUrl,
    whatsapp: `https://wa.me/?text=${shareTextWhatsApp}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}&quote=${shareText}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(referralUrl)}&text=${shareText}`,
    // Instagram doesn't have a direct share URL, but we can copy to clipboard
    instagram: referralUrl, // Will need to be handled differently in UI
    // TikTok also doesn't have direct sharing
    tiktok: referralUrl, // Will need to be handled differently in UI
    copyLink: referralUrl
  }
}

/**
 * Format time remaining
 */
export function formatTimeRemaining(expiresAt: string): string {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffMs = expiry.getTime() - now.getTime()

  if (diffMs <= 0) return 'Expired'

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'} left`
  }
  return `${hours} hour${hours === 1 ? '' : 's'} left`
}

