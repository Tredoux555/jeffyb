-- Fix Login Issues and Profile Access
-- This fixes:
-- 1. 406 errors on user_profiles SELECT
-- 2. Unconfirmed users preventing login
-- 3. RLS policies for profile access
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. FIX SELECT POLICY - Ensure users can read their own profile
-- ============================================
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = id);

-- ============================================
-- 2. FIX UPDATE POLICY - Ensure users can update their own profile
-- ============================================
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id);

-- ============================================
-- 3. FIX INSERT POLICY - Already done, but ensure it's correct
-- ============================================
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (true); -- Allow insert (trigger validates user_id)

-- ============================================
-- 4. MANUALLY CONFIRM ALL EXISTING USERS
-- ============================================
-- This confirms all users who haven't confirmed their email yet
-- This allows them to log in immediately
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- ============================================
-- 5. ENSURE ALL USERS HAVE PROFILES
-- ============================================
-- Create profiles for any users that don't have one yet
INSERT INTO public.user_profiles (id, full_name)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as full_name
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. VERIFY SETUP
-- ============================================
-- Check user confirmation status
SELECT 
  'Unconfirmed users' as check_name,
  COUNT(*) as count
FROM auth.users
WHERE email_confirmed_at IS NULL
UNION ALL
SELECT 
  'Users without profiles' as check_name,
  COUNT(*) as count
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
WHERE p.id IS NULL
UNION ALL
SELECT 
  'Total users' as check_name,
  COUNT(*) as count
FROM auth.users;

-- Check RLS policies
SELECT 
  'SELECT policy exists' as check_name,
  EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can view their own profile'
  ) as status
UNION ALL
SELECT 
  'UPDATE policy exists' as check_name,
  EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can update their own profile'
  ) as status
UNION ALL
SELECT 
  'INSERT policy exists' as check_name,
  EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can insert their own profile'
  ) as status;

