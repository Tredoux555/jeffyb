-- Migration: Add Visibility Toggles for Products and Categories
-- Run this in your Supabase SQL Editor
-- This migration adds is_active columns to products and creates/updates a categories table

-- ============================================
-- 1. ADD is_active COLUMN TO PRODUCTS TABLE
-- ============================================
-- Add is_active column to products table (defaults to true for backward compatibility)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE products 
    ADD COLUMN is_active BOOLEAN DEFAULT true;
    
    -- Set all existing products to active
    UPDATE products SET is_active = true WHERE is_active IS NULL;
  END IF;
END $$;

-- ============================================
-- 2. CREATE CATEGORIES TABLE (IF NOT EXISTS)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2a. ADD is_active COLUMN TO EXISTING CATEGORIES TABLE
-- ============================================
-- Add is_active column if categories table exists but column doesn't
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'categories'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE categories 
    ADD COLUMN is_active BOOLEAN DEFAULT true;
    
    -- Set all existing categories to active
    UPDATE categories SET is_active = true WHERE is_active IS NULL;
  END IF;
END $$;

-- ============================================
-- 2b. ADD created_at and updated_at COLUMNS IF MISSING
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'categories'
  ) THEN
    -- Add created_at if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'created_at'
    ) THEN
      ALTER TABLE categories 
      ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE categories 
      ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
  END IF;
END $$;

-- ============================================
-- 3. INSERT DEFAULT CATEGORIES
-- ============================================
-- Insert default categories if they don't exist
INSERT INTO categories (name, slug, icon, is_active) 
VALUES 
  ('Gym', 'gym', 'Dumbbell', true),
  ('Camping', 'camping', 'Tent', true),
  ('Kitchen', 'kitchen', 'ChefHat', true),
  ('Beauty', 'beauty', 'Sparkles', true),
  ('Baby Toys', 'baby-toys', 'Baby', true),
  ('Archery', 'archery', 'Target', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- ============================================
-- 5. CREATE TRIGGER FOR CATEGORIES updated_at
-- ============================================
-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to categories table
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at 
  BEFORE UPDATE ON categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ADD COMMENTS TO COLUMNS
-- ============================================
COMMENT ON COLUMN products.is_active IS 'Whether the product is visible to customers';
COMMENT ON COLUMN categories.is_active IS 'Whether the category is visible to customers';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the migration:

-- Check products table has is_active column
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'is_active';

-- Check categories table exists and has correct structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- Check indexes were created
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('products', 'categories')
AND (indexname LIKE '%is_active%' OR indexname LIKE '%slug%')
ORDER BY tablename, indexname;

-- Check default categories were inserted
SELECT name, slug, is_active FROM categories ORDER BY name;
