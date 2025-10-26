-- Migration: Add images column to products table
-- Run this in your Supabase SQL Editor

-- Add images column to products table
ALTER TABLE products 
ADD COLUMN images JSONB DEFAULT '[]'::jsonb;

-- Update existing products to have empty images array
UPDATE products 
SET images = '[]'::jsonb 
WHERE images IS NULL;

-- Add comment to the column
COMMENT ON COLUMN products.images IS 'Array of image URLs for the product';

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'images';
