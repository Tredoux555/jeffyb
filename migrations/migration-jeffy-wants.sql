-- Migration: Jeffy's Free Product Program
-- A viral referral system where users request products and get them free with 10 friend approvals
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. CREATE JEFFY REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS jeffy_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Request details
  request_text TEXT NOT NULL,
  voice_transcript TEXT,
  image_urls TEXT[],
  reference_links TEXT[],
  
  -- Parsed product info (can be AI-enhanced later)
  product_category VARCHAR(100),
  product_keywords TEXT[],
  price_concern VARCHAR(50), -- 'too_cheap', 'too_expensive', 'quality_concern', 'cant_find'
  
  -- Requester info
  requester_name VARCHAR(255) NOT NULL,
  requester_email VARCHAR(255) NOT NULL,
  requester_phone VARCHAR(50),
  
  -- Referral tracking
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  approvals_needed INTEGER DEFAULT 10,
  approvals_received INTEGER DEFAULT 0,
  
  -- Status workflow
  status VARCHAR(50) DEFAULT 'active',
  -- 'active' = collecting approvals
  -- 'completed' = got 10 approvals, pending fulfillment
  -- 'fulfilled' = free product shipped
  -- 'product_added' = product added to store
  -- 'cancelled' = cancelled by user/admin
  
  -- Product matching (if we already have it or will add it)
  matched_product_id UUID REFERENCES products(id),
  matched_product_name VARCHAR(255),
  
  -- Fulfillment tracking
  is_free_product_earned BOOLEAN DEFAULT false,
  free_product_shipped BOOLEAN DEFAULT false,
  shipping_address JSONB,
  shipping_tracking VARCHAR(255),
  
  -- Analytics
  total_link_clicks INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  
  -- Admin
  admin_notes TEXT,
  priority VARCHAR(20) DEFAULT 'normal',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  fulfilled_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_jeffy_requests_referral_code ON jeffy_requests(referral_code);
CREATE INDEX IF NOT EXISTS idx_jeffy_requests_status ON jeffy_requests(status);
CREATE INDEX IF NOT EXISTS idx_jeffy_requests_email ON jeffy_requests(requester_email);
CREATE INDEX IF NOT EXISTS idx_jeffy_requests_created ON jeffy_requests(created_at DESC);

-- ============================================
-- 2. CREATE APPROVALS TABLE (the 10 friends)
-- ============================================
CREATE TABLE IF NOT EXISTS jeffy_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES jeffy_requests(id) ON DELETE CASCADE,
  
  -- Approver info
  approver_name VARCHAR(255),
  approver_email VARCHAR(255) NOT NULL,
  approver_phone VARCHAR(50),
  
  -- Their response
  approval_type VARCHAR(50) NOT NULL DEFAULT 'good_idea',
  -- 'good_idea' = agrees it's a good product idea
  -- 'want_it_too' = they also want this product
  -- 'already_have' = they have something similar (feedback)
  
  comment TEXT, -- optional comment
  wants_updates BOOLEAN DEFAULT false, -- wants to be notified when product is available
  wants_own_link BOOLEAN DEFAULT false, -- wants their own referral link
  
  -- Tracking for fraud prevention
  ip_address VARCHAR(50),
  user_agent TEXT,
  referral_source VARCHAR(50), -- 'whatsapp', 'facebook', 'instagram', 'tiktok', 'email', 'direct', 'other'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate approvals from same email
  UNIQUE(request_id, approver_email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jeffy_approvals_request ON jeffy_approvals(request_id);
CREATE INDEX IF NOT EXISTS idx_jeffy_approvals_email ON jeffy_approvals(approver_email);

-- ============================================
-- 3. CREATE LINK CLICKS TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS jeffy_link_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES jeffy_requests(id) ON DELETE CASCADE,
  
  ip_address VARCHAR(50),
  user_agent TEXT,
  referrer TEXT,
  referral_source VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jeffy_clicks_request ON jeffy_link_clicks(request_id);

-- ============================================
-- 4. FUNCTION TO UPDATE APPROVAL COUNT
-- ============================================
CREATE OR REPLACE FUNCTION update_jeffy_approval_count()
RETURNS TRIGGER AS $$
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
  
  -- Check if completed (reached 10 approvals)
  UPDATE jeffy_requests
  SET 
    status = 'completed',
    is_free_product_earned = true,
    completed_at = NOW()
  WHERE id = NEW.request_id 
  AND approvals_received >= approvals_needed
  AND status = 'active';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_approval_count ON jeffy_approvals;
CREATE TRIGGER trigger_update_approval_count
AFTER INSERT ON jeffy_approvals
FOR EACH ROW
EXECUTE FUNCTION update_jeffy_approval_count();

-- ============================================
-- 5. FUNCTION TO UPDATE CLICK COUNT
-- ============================================
CREATE OR REPLACE FUNCTION update_jeffy_click_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE jeffy_requests
  SET 
    total_link_clicks = total_link_clicks + 1,
    updated_at = NOW()
  WHERE id = NEW.request_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_click_count ON jeffy_link_clicks;
CREATE TRIGGER trigger_update_click_count
AFTER INSERT ON jeffy_link_clicks
FOR EACH ROW
EXECUTE FUNCTION update_jeffy_click_count();

-- ============================================
-- 6. ENABLE RLS
-- ============================================
ALTER TABLE jeffy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE jeffy_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE jeffy_link_clicks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jeffy_requests
DROP POLICY IF EXISTS "Anyone can create requests" ON jeffy_requests;
CREATE POLICY "Anyone can create requests" 
ON jeffy_requests FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view requests by code" ON jeffy_requests;
CREATE POLICY "Anyone can view requests by code" 
ON jeffy_requests FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Requesters can update own requests" ON jeffy_requests;
CREATE POLICY "Requesters can update own requests" 
ON jeffy_requests FOR UPDATE 
USING (true);

-- RLS Policies for jeffy_approvals
DROP POLICY IF EXISTS "Anyone can submit approvals" ON jeffy_approvals;
CREATE POLICY "Anyone can submit approvals" 
ON jeffy_approvals FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view approvals" ON jeffy_approvals;
CREATE POLICY "Anyone can view approvals" 
ON jeffy_approvals FOR SELECT 
USING (true);

-- RLS Policies for jeffy_link_clicks
DROP POLICY IF EXISTS "Anyone can log clicks" ON jeffy_link_clicks;
CREATE POLICY "Anyone can log clicks" 
ON jeffy_link_clicks FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view clicks" ON jeffy_link_clicks;
CREATE POLICY "Anyone can view clicks" 
ON jeffy_link_clicks FOR SELECT 
USING (true);

-- ============================================
-- 7. POPULAR REQUESTS VIEW (for trending)
-- ============================================
CREATE OR REPLACE VIEW jeffy_popular_requests AS
SELECT 
  jr.*,
  COUNT(DISTINCT ja.id) as total_approvals,
  COUNT(DISTINCT CASE WHEN ja.approval_type = 'want_it_too' THEN ja.id END) as want_it_too_count,
  COUNT(DISTINCT CASE WHEN ja.wants_updates THEN ja.id END) as interested_count
FROM jeffy_requests jr
LEFT JOIN jeffy_approvals ja ON jr.id = ja.request_id
WHERE jr.status IN ('active', 'completed')
GROUP BY jr.id
ORDER BY total_approvals DESC, jr.created_at DESC;

-- Grant access to the view
GRANT SELECT ON jeffy_popular_requests TO authenticated, anon;

-- ============================================
-- 8. COMMENTS
-- ============================================
COMMENT ON TABLE jeffy_requests IS 'Stores product requests from the Jeffy Free Product Program';
COMMENT ON TABLE jeffy_approvals IS 'Stores friend approvals for Jeffy requests';
COMMENT ON TABLE jeffy_link_clicks IS 'Tracks clicks on referral links';
COMMENT ON COLUMN jeffy_requests.referral_code IS 'Unique short code for sharing (e.g., ABC123)';
COMMENT ON COLUMN jeffy_requests.approvals_needed IS 'Number of approvals needed for free product (default 10)';

