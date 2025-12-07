-- ============================================
-- Migration: Add SEO fields to products table
-- ============================================
-- Run this in your Supabase SQL Editor
-- This adds SEO-related columns for better search engine optimization

-- Add SEO columns to products table if they don't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS features TEXT[],
ADD COLUMN IF NOT EXISTS benefits TEXT[],
ADD COLUMN IF NOT EXISTS target_keywords TEXT[],
ADD COLUMN IF NOT EXISTS brand TEXT;

-- Add comments for documentation
COMMENT ON COLUMN products.seo_title IS 'SEO-optimized page title for product';
COMMENT ON COLUMN products.meta_description IS 'Meta description for search engines (max 160 chars)';
COMMENT ON COLUMN products.features IS 'Array of product features for SEO content';
COMMENT ON COLUMN products.benefits IS 'Array of product benefits for SEO content';
COMMENT ON COLUMN products.target_keywords IS 'Target SEO keywords for the product';
COMMENT ON COLUMN products.brand IS 'Product brand name';

-- Create full-text search index for better search performance
-- This creates a GIN index on name and description for fast text search
DROP INDEX IF EXISTS idx_products_search;
CREATE INDEX idx_products_search 
ON products USING gin(to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '')));

-- Create index on category for faster category filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Create index on price for price range queries
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- Create index on stock for in-stock filtering
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_products_active_category 
ON products(is_active, category) 
WHERE is_active = true;

-- ============================================
-- Verify the migration
-- ============================================
-- After running, you can verify with:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'products' 
-- AND column_name IN ('seo_title', 'meta_description', 'features', 'benefits', 'target_keywords', 'brand');

-- ============================================
-- Sample update to test
-- ============================================
-- UPDATE products 
-- SET 
--   seo_title = name || ' - Premium ' || category || ' | Jeffy Store',
--   meta_description = 'Shop ' || name || ' for R' || price || '. Free shipping available!'
-- WHERE seo_title IS NULL
-- LIMIT 1;

