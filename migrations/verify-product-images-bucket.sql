-- Verification Query: Check if product-images bucket is set up correctly
-- Run this in your Supabase SQL Editor to verify the migration

-- Step 1: Check if bucket exists
SELECT 
  'Bucket Check' as check_type,
  id,
  name,
  public,
  CASE 
    WHEN id = 'product-images' AND public = true THEN '✅ PASS'
    WHEN id = 'product-images' AND public = false THEN '⚠️ WARNING: Bucket exists but is not public'
    ELSE '❌ FAIL: Bucket not found'
  END as status
FROM storage.buckets 
WHERE id = 'product-images';

-- Step 2: Check if all policies exist
SELECT 
  'Policy Check' as check_type,
  policyname,
  CASE 
    WHEN policyname IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname IN (
    'product_images_public_read',
    'product_images_public_insert',
    'product_images_public_update',
    'product_images_public_delete'
  )
ORDER BY policyname;

-- Step 3: Detailed policy information
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE 'product_images%'
ORDER BY policyname, cmd;

-- Step 4: Summary
SELECT 
  'Summary' as check_type,
  (SELECT COUNT(*) FROM storage.buckets WHERE id = 'product-images') as bucket_exists,
  (SELECT COUNT(*) FROM pg_policies 
   WHERE tablename = 'objects' 
   AND schemaname = 'storage'
   AND policyname LIKE 'product_images%') as policies_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM storage.buckets WHERE id = 'product-images' AND public = true) = 1 
     AND (SELECT COUNT(*) FROM pg_policies 
          WHERE tablename = 'objects' 
          AND schemaname = 'storage'
          AND policyname LIKE 'product_images%') = 4
    THEN '✅ ALL CHECKS PASSED'
    ELSE '❌ SOME CHECKS FAILED - Review above'
  END as overall_status;

