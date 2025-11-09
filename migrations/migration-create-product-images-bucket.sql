-- Migration: Create Storage Bucket for Product Images
-- Run this in your Supabase SQL Editor

-- Step 1: Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "product_images_public_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_public_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_public_delete" ON storage.objects;

-- Step 3: Allow public read access (for displaying images)
CREATE POLICY "product_images_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Step 4: Allow public insert (for admin uploads - admin uses localStorage, not Supabase auth)
-- In production, you may want to restrict this to authenticated users only
CREATE POLICY "product_images_public_insert"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'product-images');

-- Step 5: Allow public update (for admin updates)
CREATE POLICY "product_images_public_update"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'product-images');

-- Step 6: Allow public delete (for admin deletes)
CREATE POLICY "product_images_public_delete"
ON storage.objects
FOR DELETE
USING (bucket_id = 'product-images');

-- Step 7: Verify bucket was created
SELECT id, name, public FROM storage.buckets WHERE id = 'product-images';

