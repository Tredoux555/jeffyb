-- =============================================
-- JEFFY WANTS - 50% OFF INTEGRATION
-- =============================================
-- Updates the Jeffy Wants system to give 50% off promo codes
-- instead of free products (protects margins while still rewarding)
-- Run this AFTER migration-jeffy-wants.sql and migration-referral-system.sql

-- =============================================
-- 1. ADD PROMO CODE COLUMN TO JEFFY_REQUESTS
-- =============================================
ALTER TABLE jeffy_requests 
ADD COLUMN IF NOT EXISTS reward_promo_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS reward_used BOOLEAN DEFAULT false;

-- Rename misleading columns (keep old ones for backwards compatibility)
-- is_free_product_earned -> is_discount_earned (50% off)
ALTER TABLE jeffy_requests 
ADD COLUMN IF NOT EXISTS is_discount_earned BOOLEAN DEFAULT false;

-- Sync existing data
UPDATE jeffy_requests 
SET is_discount_earned = is_free_product_earned 
WHERE is_free_product_earned = true;

-- =============================================
-- 2. UPDATE TRIGGER TO GENERATE PROMO CODE
-- =============================================
CREATE OR REPLACE FUNCTION update_jeffy_approval_count()
RETURNS TRIGGER AS $$
DECLARE
  chars VARCHAR(36) := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  promo_code VARCHAR(20);
  i INTEGER;
  request_record RECORD;
BEGIN
  -- Update the approval count on the request
  UPDATE jeffy_requests
  SET 
    approvals_received = (
      SELECT COUNT(*) FROM jeffy_approvals 
      WHERE request_id = NEW.request_id 
      AND approval_type IN ('good_idea', 'want_it_too')
    ),
    updated_at = NOW()
  WHERE id = NEW.request_id;
  
  -- Get the updated request
  SELECT * INTO request_record FROM jeffy_requests WHERE id = NEW.request_id;
  
  -- Check if completed (reached 10 approvals) and no promo code yet
  IF request_record.approvals_received >= request_record.approvals_needed 
     AND request_record.status = 'active' 
     AND request_record.reward_promo_code IS NULL THEN
    
    -- Generate unique promo code: WANT-XXXXXX
    promo_code := 'WANT-';
    FOR i IN 1..6 LOOP
      promo_code := promo_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Create the 50% off promo code in promo_codes table
    INSERT INTO promo_codes (code, type, value, max_uses, is_active)
    VALUES (promo_code, 'percentage', 50, 1, true)
    ON CONFLICT (code) DO NOTHING;
    
    -- Update the request with completion info
    UPDATE jeffy_requests
    SET 
      status = 'completed',
      is_free_product_earned = true, -- legacy
      is_discount_earned = true,
      reward_promo_code = promo_code,
      completed_at = NOW()
    WHERE id = NEW.request_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_update_approval_count ON jeffy_approvals;
CREATE TRIGGER trigger_update_approval_count
AFTER INSERT ON jeffy_approvals
FOR EACH ROW
EXECUTE FUNCTION update_jeffy_approval_count();

-- =============================================
-- 3. INDEX FOR PROMO CODE LOOKUPS
-- =============================================
CREATE INDEX IF NOT EXISTS idx_jeffy_requests_promo_code ON jeffy_requests(reward_promo_code);

-- =============================================
-- DONE!
-- =============================================
-- Now when someone gets 10 approvals on their Jeffy Wants request,
-- they automatically get a 50% off promo code (WANT-XXXXXX)
-- 
-- The promo code works at checkout for 50% off ANY product,
-- including the product they requested when you stock it!

