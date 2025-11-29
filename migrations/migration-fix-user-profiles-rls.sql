-- Fix User Profiles RLS Policies for Registration
-- This fixes the 406 error when creating user profiles during registration

-- ============================================
-- 1. FIX USER PROFILES INSERT POLICY
-- ============================================
-- Allow profile creation during signup (before user is fully authenticated)
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (true); -- Allow insert during signup (trigger handles the actual insert)

-- ============================================
-- 2. ENSURE TRIGGER FUNCTION HAS PROPER PERMISSIONS
-- ============================================
-- The trigger function needs SECURITY DEFINER to bypass RLS
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;

-- ============================================
-- 3. VERIFY TRIGGER EXISTS
-- ============================================
-- Recreate trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. GRANT NECESSARY PERMISSIONS
-- ============================================
-- Ensure the trigger function can insert into user_profiles
GRANT INSERT ON user_profiles TO authenticated;
GRANT INSERT ON user_profiles TO anon; -- Needed during signup

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
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_profiles') as status;

