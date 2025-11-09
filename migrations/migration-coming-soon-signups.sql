-- Migration: Coming Soon Email Signups
-- Run this in your Supabase SQL Editor
-- This migration creates a table to store email signups for the coming soon campaign

-- ============================================
-- 1. CREATE COMING SOON SIGNUPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS coming_soon_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notified BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_coming_soon_signups_email ON coming_soon_signups(email);
CREATE INDEX IF NOT EXISTS idx_coming_soon_signups_notified ON coming_soon_signups(notified);
CREATE INDEX IF NOT EXISTS idx_coming_soon_signups_created_at ON coming_soon_signups(created_at);

COMMENT ON TABLE coming_soon_signups IS 'Stores email signups for coming soon campaign';

-- ============================================
-- 2. ENABLE RLS
-- ============================================
ALTER TABLE coming_soon_signups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to insert (sign up)
DROP POLICY IF EXISTS "Anyone can sign up for coming soon" ON coming_soon_signups;
CREATE POLICY "Anyone can sign up for coming soon" 
ON coming_soon_signups 
FOR INSERT 
WITH CHECK (true);

-- Allow admins to view all signups (we'll use service role for admin operations)
DROP POLICY IF EXISTS "Admins can view coming soon signups" ON coming_soon_signups;
CREATE POLICY "Admins can view coming soon signups" 
ON coming_soon_signups 
FOR SELECT 
USING (true);

-- Allow admins to update (mark as notified)
DROP POLICY IF EXISTS "Admins can update coming soon signups" ON coming_soon_signups;
CREATE POLICY "Admins can update coming soon signups" 
ON coming_soon_signups 
FOR UPDATE 
USING (true);

-- ============================================
-- 3. VERIFICATION QUERIES
-- ============================================
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coming_soon_signups';
SELECT policyname, tablename FROM pg_policies WHERE tablename = 'coming_soon_signups';

