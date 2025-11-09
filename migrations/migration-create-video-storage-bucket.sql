-- Migration: Create Storage Bucket for Product Videos
-- Run this in your Supabase SQL Editor

-- Step 1: Create storage bucket for product videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-videos', 'product-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "product_videos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "product_videos_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_videos_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "product_videos_authenticated_delete" ON storage.objects;

-- Step 3: Allow public read access
CREATE POLICY "product_videos_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-videos');

-- Step 4: Allow authenticated users to upload videos
CREATE POLICY "product_videos_authenticated_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-videos' AND
  auth.role() = 'authenticated'
);

-- Step 5: Allow authenticated users to update their videos
CREATE POLICY "product_videos_authenticated_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'product-videos' AND
  auth.role() = 'authenticated'
);

-- Step 6: Allow authenticated users to delete videos
CREATE POLICY "product_videos_authenticated_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'product-videos' AND
  auth.role() = 'authenticated'
);

-- Step 7: Verify bucket was created
SELECT id, name, public FROM storage.buckets WHERE id = 'product-videos';

