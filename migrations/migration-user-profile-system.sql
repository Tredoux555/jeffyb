-- User Profile System Database Migration
-- Run this in Supabase SQL Editor
-- This migration adds user profile system while maintaining backward compatibility

-- ============================================
-- 1. USER PROFILES TABLE
-- ============================================
-- Extends Supabase auth.users with additional profile data
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. SAVED ADDRESSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS saved_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL, -- "Home", "Work", "Office", etc.
  address TEXT NOT NULL,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'South Africa',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. SAVED PAYMENT METHODS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS saved_payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'card', 'paypal', etc.
  last4 VARCHAR(4), -- Last 4 digits for cards
  brand VARCHAR(50), -- 'visa', 'mastercard', 'paypal', etc.
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  stripe_payment_method_id VARCHAR(255), -- Stripe payment method ID (if using Stripe)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. FAVORITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================
-- 5. USER CARTS TABLE (Persistent carts)
-- ============================================
CREATE TABLE IF NOT EXISTS user_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of cart items
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- 6. ORDER NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'status_update', 'driver_assigned', 'delivered', etc.
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. UPDATE ORDERS TABLE
-- ============================================
-- Add user_id column (nullable for backward compatibility)
-- Existing orders will have NULL user_id but keep user_email
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='user_id') THEN
    ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_saved_addresses_user_id ON saved_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_addresses_default ON saved_addresses(user_id, is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_user_id ON saved_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_default ON saved_payment_methods(user_id, is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_user_carts_user_id ON user_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_order_notifications_user_id ON order_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_order_notifications_read ON order_notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- ============================================
-- 9. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_addresses_updated_at ON saved_addresses;
CREATE TRIGGER update_saved_addresses_updated_at 
  BEFORE UPDATE ON saved_addresses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_payment_methods_updated_at ON saved_payment_methods;
CREATE TRIGGER update_saved_payment_methods_updated_at 
  BEFORE UPDATE ON saved_payment_methods 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. FUNCTION TO CREATE USER PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notifications ENABLE ROW LEVEL SECURITY;

-- User Profiles: Users can only see/edit their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Saved Addresses: Users can only manage their own addresses
DROP POLICY IF EXISTS "Users can view their own addresses" ON saved_addresses;
CREATE POLICY "Users can view their own addresses" 
  ON saved_addresses FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own addresses" ON saved_addresses;
CREATE POLICY "Users can insert their own addresses" 
  ON saved_addresses FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own addresses" ON saved_addresses;
CREATE POLICY "Users can update their own addresses" 
  ON saved_addresses FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own addresses" ON saved_addresses;
CREATE POLICY "Users can delete their own addresses" 
  ON saved_addresses FOR DELETE 
  USING (auth.uid() = user_id);

-- Saved Payment Methods: Users can only manage their own payment methods
DROP POLICY IF EXISTS "Users can view their own payment methods" ON saved_payment_methods;
CREATE POLICY "Users can view their own payment methods" 
  ON saved_payment_methods FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payment methods" ON saved_payment_methods;
CREATE POLICY "Users can insert their own payment methods" 
  ON saved_payment_methods FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own payment methods" ON saved_payment_methods;
CREATE POLICY "Users can update their own payment methods" 
  ON saved_payment_methods FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own payment methods" ON saved_payment_methods;
CREATE POLICY "Users can delete their own payment methods" 
  ON saved_payment_methods FOR DELETE 
  USING (auth.uid() = user_id);

-- Favorites: Users can only manage their own favorites
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
CREATE POLICY "Users can view their own favorites" 
  ON favorites FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
CREATE POLICY "Users can insert their own favorites" 
  ON favorites FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;
CREATE POLICY "Users can delete their own favorites" 
  ON favorites FOR DELETE 
  USING (auth.uid() = user_id);

-- User Carts: Users can only manage their own cart
DROP POLICY IF EXISTS "Users can view their own cart" ON user_carts;
CREATE POLICY "Users can view their own cart" 
  ON user_carts FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own cart" ON user_carts;
CREATE POLICY "Users can insert their own cart" 
  ON user_carts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own cart" ON user_carts;
CREATE POLICY "Users can update their own cart" 
  ON user_carts FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own cart" ON user_carts;
CREATE POLICY "Users can delete their own cart" 
  ON user_carts FOR DELETE 
  USING (auth.uid() = user_id);

-- Order Notifications: Users can only view their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON order_notifications;
CREATE POLICY "Users can view their own notifications" 
  ON order_notifications FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON order_notifications;
CREATE POLICY "Users can update their own notifications" 
  ON order_notifications FOR UPDATE 
  USING (auth.uid() = user_id);

-- Update existing Orders RLS to support both user_id and user_email
-- Keep existing policies, add support for user_id
DROP POLICY IF EXISTS "Users can view their own orders by user_id" ON orders;
CREATE POLICY "Users can view their own orders by user_id" 
  ON orders FOR SELECT 
  USING (
    (auth.uid() = user_id) OR
    (auth.jwt() IS NOT NULL AND auth.jwt() ->> 'email' = user_email) OR
    (auth.role() = 'service_role') OR
    (user_id IS NULL) -- Allow viewing guest orders for backward compatibility
  );

-- ============================================
-- 12. ENABLE REALTIME FOR NEW TABLES
-- ============================================
-- Note: Enable Realtime in Supabase Dashboard → Database → Replication
-- Tables to enable:
-- - orders (already enabled)
-- - delivery_assignments (already enabled)
-- - drivers (already enabled)
-- - order_notifications (enable for notifications)

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the migration:

-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'saved_addresses', 'saved_payment_methods', 'favorites', 'user_carts', 'order_notifications')
ORDER BY table_name;

-- Check orders table has user_id column
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'user_id';

-- Check indexes created
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('user_profiles', 'saved_addresses', 'saved_payment_methods', 'favorites', 'user_carts', 'order_notifications')
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'saved_addresses', 'saved_payment_methods', 'favorites', 'user_carts', 'order_notifications')
ORDER BY tablename, policyname;

