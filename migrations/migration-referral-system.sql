-- =============================================
-- REFERRAL SYSTEM DATABASE SETUP
-- =============================================
-- This creates the tables needed for the Free Product referral system
-- Run this in Supabase SQL Editor

-- =============================================
-- 1. REFERRAL SETTINGS TABLE (Admin configurable)
-- =============================================
CREATE TABLE IF NOT EXISTS referral_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrals_required INTEGER NOT NULL DEFAULT 10,
  referral_discount_percent INTEGER NOT NULL DEFAULT 30,
  max_free_product_value DECIMAL(10,2) NOT NULL DEFAULT 300.00,
  referral_expiry_days INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
-- Note: max_free_product_value is kept for legacy but reward is now 50% off (percentage type)
INSERT INTO referral_settings (referrals_required, referral_discount_percent, max_free_product_value, referral_expiry_days)
VALUES (10, 30, 300.00, 30)
ON CONFLICT DO NOTHING;

-- The reward system now gives 50% off any product (percentage type) instead of free product
-- This ensures you always cover your costs while still offering a great incentive

-- =============================================
-- 2. REFERRAL CAMPAIGNS TABLE (One per user)
-- =============================================
CREATE TABLE IF NOT EXISTS referral_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  referral_count INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  reward_promo_code VARCHAR(20),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =============================================
-- 3. REFERRALS TABLE (Individual referrals)
-- =============================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES referral_campaigns(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  verification_token VARCHAR(100),
  verification_expires_at TIMESTAMP WITH TIME ZONE,
  discount_code VARCHAR(20),
  discount_used BOOLEAN NOT NULL DEFAULT false,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Prevent same email from being referred multiple times
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_email ON referrals(email);

-- =============================================
-- 4. PROMO CODES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed', 'free_product')),
  value DECIMAL(10,2) NOT NULL, -- percentage (0-100) or fixed amount
  max_uses INTEGER DEFAULT 1,
  times_used INTEGER NOT NULL DEFAULT 0,
  min_order_value DECIMAL(10,2) DEFAULT 0,
  max_discount_value DECIMAL(10,2), -- For free_product type, this is the max product value
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- If tied to specific user
  referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL, -- If from referral
  campaign_id UUID REFERENCES referral_campaigns(id) ON DELETE SET NULL, -- If reward code
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. ADD COLUMNS TO USER_PROFILES
-- =============================================
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS has_claimed_free_product BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS free_product_claimed_at TIMESTAMP WITH TIME ZONE;

-- =============================================
-- 6. INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_user ON referral_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_code ON referral_campaigns(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_campaign ON referrals(campaign_id);
CREATE INDEX IF NOT EXISTS idx_referrals_verification_token ON referrals(verification_token);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_user ON promo_codes(user_id);

-- =============================================
-- 7. ROW LEVEL SECURITY
-- =============================================

-- Referral Settings (read-only for all, write for admins via service role)
ALTER TABLE referral_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read referral settings" ON referral_settings;
CREATE POLICY "Anyone can read referral settings" ON referral_settings FOR SELECT USING (true);

-- Referral Campaigns
ALTER TABLE referral_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own campaigns" ON referral_campaigns;
DROP POLICY IF EXISTS "Users can create their own campaigns" ON referral_campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON referral_campaigns;
CREATE POLICY "Users can view their own campaigns" ON referral_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own campaigns" ON referral_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own campaigns" ON referral_campaigns FOR UPDATE USING (auth.uid() = user_id);

-- Referrals (public insert for email signup, restricted read)
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can create referrals" ON referrals;
DROP POLICY IF EXISTS "Anyone can view referrals by verification token" ON referrals;
DROP POLICY IF EXISTS "Anyone can update referrals for verification" ON referrals;
CREATE POLICY "Anyone can create referrals" ON referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view referrals by verification token" ON referrals FOR SELECT USING (true);
CREATE POLICY "Anyone can update referrals for verification" ON referrals FOR UPDATE USING (true);

-- Promo Codes
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read active promo codes" ON promo_codes;
DROP POLICY IF EXISTS "Users can view their own promo codes" ON promo_codes;
CREATE POLICY "Anyone can read active promo codes" ON promo_codes FOR SELECT USING (is_active = true);
CREATE POLICY "Users can view their own promo codes" ON promo_codes FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- 8. HELPER FUNCTIONS
-- =============================================

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  chars VARCHAR(36) := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result VARCHAR(20) := 'JEFFY-';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate promo codes
CREATE OR REPLACE FUNCTION generate_promo_code(prefix VARCHAR DEFAULT 'PROMO')
RETURNS VARCHAR(20) AS $$
DECLARE
  chars VARCHAR(36) := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result VARCHAR(20);
  i INTEGER;
BEGIN
  result := prefix || '-';
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update referral count when a referral is verified
CREATE OR REPLACE FUNCTION update_referral_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_verified = true AND OLD.email_verified = false THEN
    UPDATE referral_campaigns 
    SET 
      referral_count = referral_count + 1,
      updated_at = NOW()
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update referral count
DROP TRIGGER IF EXISTS trigger_update_referral_count ON referrals;
CREATE TRIGGER trigger_update_referral_count
  AFTER UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_count();

-- =============================================
-- DONE! Run this in Supabase SQL Editor
-- =============================================

