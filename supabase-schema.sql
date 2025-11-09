-- ROLLBACK SCRIPT: Remove jeffyb commerce schema from SSP database
-- Run this in Supabase SQL Editor to clean up the wrong schema

-- Step 1: Drop RLS Policies
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Delivery requests are viewable by everyone" ON delivery_requests;
DROP POLICY IF EXISTS "Admin users are viewable by authenticated users" ON admin_users;

-- Step 2: Drop Storage Policies
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Product images can be uploaded by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Product images can be updated by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Product images can be deleted by authenticated users" ON storage.objects;

-- Step 3: Drop Storage Bucket
DELETE FROM storage.buckets WHERE id = 'product-images';

-- Step 4: Drop Triggers
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_delivery_requests_updated_at ON delivery_requests;
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;

-- Step 5: Drop Indexes
DROP INDEX IF EXISTS idx_products_category;
DROP INDEX IF EXISTS idx_products_created_at;
DROP INDEX IF EXISTS idx_orders_user_email;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_created_at;
DROP INDEX IF EXISTS idx_delivery_requests_type;
DROP INDEX IF EXISTS idx_delivery_requests_status;
DROP INDEX IF EXISTS idx_delivery_requests_created_at;

-- Step 6: Drop Tables (in reverse order - no foreign keys between these tables)
DROP TABLE IF EXISTS delivery_requests CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- Note: We keep the update_updated_at_column() function because SSP schema uses it too