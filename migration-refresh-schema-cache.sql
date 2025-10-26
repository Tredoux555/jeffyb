-- Force Supabase schema cache refresh
-- Run this in Supabase SQL Editor

-- First, let's verify the column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'has_variants';

-- If the column exists, we need to refresh PostgREST cache
-- Method 1: Drop and recreate the column
DO $$
BEGIN
    -- Drop the column if it exists
    ALTER TABLE products DROP COLUMN IF EXISTS has_variants;
    
    -- Recreate it fresh
    ALTER TABLE products ADD COLUMN has_variants BOOLEAN DEFAULT false NOT NULL;
    
    RAISE NOTICE 'Column has_variants recreated successfully';
END $$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the column was recreated
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'has_variants';
