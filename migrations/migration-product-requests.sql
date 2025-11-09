-- Migration: Product Requests
-- Run this in your Supabase SQL Editor
-- This migration creates a table to store product requests from customers

-- ============================================
-- 1. CREATE PRODUCT REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS product_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  estimated_price_range VARCHAR(50), -- e.g., "R100-R500", "Under R1000"
  quantity_needed INTEGER,
  urgency VARCHAR(50) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  requester_name VARCHAR(255),
  requester_email VARCHAR(255),
  requester_phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reviewing', 'sourcing', 'found', 'unavailable', 'completed'
  admin_notes TEXT,
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_requests_status ON product_requests(status);
CREATE INDEX IF NOT EXISTS idx_product_requests_category ON product_requests(category);
CREATE INDEX IF NOT EXISTS idx_product_requests_created_at ON product_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_product_requests_requester_email ON product_requests(requester_email);

COMMENT ON TABLE product_requests IS 'Stores customer product requests for items they are looking for';

-- ============================================
-- 2. ENABLE RLS
-- ============================================
ALTER TABLE product_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to insert (submit requests)
DROP POLICY IF EXISTS "Anyone can submit product requests" ON product_requests;
CREATE POLICY "Anyone can submit product requests" 
ON product_requests 
FOR INSERT 
WITH CHECK (true);

-- Allow admins to view all requests
DROP POLICY IF EXISTS "Admins can view product requests" ON product_requests;
CREATE POLICY "Admins can view product requests" 
ON product_requests 
FOR SELECT 
USING (true);

-- Allow admins to update requests
DROP POLICY IF EXISTS "Admins can update product requests" ON product_requests;
CREATE POLICY "Admins can update product requests" 
ON product_requests 
FOR UPDATE 
USING (true);

-- Allow admins to delete requests
DROP POLICY IF EXISTS "Admins can delete product requests" ON product_requests;
CREATE POLICY "Admins can delete product requests" 
ON product_requests 
FOR DELETE 
USING (true);

-- ============================================
-- 3. CREATE TRIGGER FOR UPDATED_AT
-- ============================================
DROP TRIGGER IF EXISTS update_product_requests_updated_at ON product_requests;
CREATE TRIGGER update_product_requests_updated_at 
  BEFORE UPDATE ON product_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. VERIFICATION QUERIES
-- ============================================
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_requests';
SELECT policyname, tablename FROM pg_policies WHERE tablename = 'product_requests';

