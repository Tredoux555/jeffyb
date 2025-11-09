-- Migration: Add Video Support to Products
-- Run this in your Supabase SQL Editor

-- Add video_url column for external video links (YouTube, Vimeo, etc.)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add video_file_url column for uploaded video files
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS video_file_url TEXT;

-- Add comment to columns
COMMENT ON COLUMN products.video_url IS 'URL to external video (YouTube, Vimeo, etc.)';
COMMENT ON COLUMN products.video_file_url IS 'URL to uploaded video file in storage';

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('video_url', 'video_file_url');

