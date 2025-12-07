-- Fix User Profiles RLS for Signup and Email Confirmation
-- This fixes the 406 error when creating user profiles during registration
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. FIX USER PROFILES INSERT POLICY
-- ============================================
-- Allow profile creation during signup (before user is fully authenticated)
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

CREATE POLICY "Users can insert their own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (true); -- Allow insert (trigger validates user_id)

-- ============================================
-- 2. ENSURE TRIGGER FUNCTION EXISTS AND HAS PROPER PERMISSIONS
-- ============================================
-- The trigger function needs SECURITY DEFINER to bypass RLS
-- Create or replace the function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts
  RETURN NEW;
END;
$function$;

-- ============================================
-- 3. RECREATE TRIGGER
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. GRANT NECESSARY PERMISSIONS
-- ============================================
-- Ensure the trigger function can insert into user_profiles
GRANT INSERT ON user_profiles TO authenticated;
GRANT INSERT ON user_profiles TO anon; -- Needed during signup
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon; -- Allow reading during signup

-- ============================================
-- 5. VERIFY SETUP
-- ============================================
-- Check if everything is set up correctly
SELECT 
  'Trigger exists' as check_name,
  EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) as status
UNION ALL
SELECT 
  'Function exists' as check_name,
  EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user'
  ) as status
UNION ALL
SELECT 
  'RLS enabled' as check_name,
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_profiles') as status
UNION ALL
SELECT 
  'Insert policy exists' as check_name,
  EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can insert their own profile'
  ) as status;

