-- Fix Favorites RLS Policies
-- This fixes the 406 error when checking favorites during add to cart
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. FIX SELECT POLICY - Allow users to read their own favorites
-- ============================================
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
CREATE POLICY "Users can view their own favorites" 
  ON favorites FOR SELECT 
  USING (auth.uid() = user_id);

-- ============================================
-- 2. FIX INSERT POLICY - Ensure it's correct
-- ============================================
DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
CREATE POLICY "Users can insert their own favorites" 
  ON favorites FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. FIX DELETE POLICY - Ensure it's correct
-- ============================================
DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;
CREATE POLICY "Users can delete their own favorites" 
  ON favorites FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- 4. VERIFY POLICIES EXIST
-- ============================================
SELECT 
  'SELECT policy exists' as check_name,
  EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'favorites' 
    AND policyname = 'Users can view their own favorites'
  ) as status
UNION ALL
SELECT 
  'INSERT policy exists' as check_name,
  EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'favorites' 
    AND policyname = 'Users can insert their own favorites'
  ) as status
UNION ALL
SELECT 
  'DELETE policy exists' as check_name,
  EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'favorites' 
    AND policyname = 'Users can delete their own favorites'
  ) as status;

