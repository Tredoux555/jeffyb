-- Migration: Reseller System (PartnerHub)
-- Run this in your Supabase SQL Editor
-- This migration creates tables for resellers, discount codes, commissions, and cost breakdown

-- ============================================
-- 1. CREATE CUSTOM DUTY RATES LOOKUP TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS custom_duty_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(100) NOT NULL, -- e.g., 'kitchen', 'gym', 'camping', 'beauty'
  product_type VARCHAR(255), -- More specific product type
  hs_code VARCHAR(20), -- Harmonized System code (optional)
  duty_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- Percentage (0-100)
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default duty rates by category
INSERT INTO custom_duty_rates (category, duty_rate, description) VALUES
  ('kitchen', 10.00, 'Kitchen equipment and utensils'),
  ('gym', 15.00, 'Gym and fitness equipment'),
  ('camping', 12.00, 'Camping and outdoor gear'),
  ('beauty', 20.00, 'Beauty and personal care products')
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_custom_duty_rates_category ON custom_duty_rates(category);
CREATE INDEX IF NOT EXISTS idx_custom_duty_rates_active ON custom_duty_rates(is_active);

-- ============================================
-- 2. CREATE RESELLERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS resellers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  token VARCHAR(20) UNIQUE NOT NULL, -- e.g., "PH-HADEEL2024" or "PH-1234"
  password_hash VARCHAR(255) NOT NULL, -- For login
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'inactive', 'suspended'
  commission_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage of net profit after tax
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  verification_code VARCHAR(10), -- For email/phone verification
  verification_code_expires_at TIMESTAMP WITH TIME ZONE,
  approved_by VARCHAR(255), -- Admin who approved
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT, -- Admin notes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resellers_token ON resellers(token);
CREATE INDEX IF NOT EXISTS idx_resellers_email ON resellers(email);
CREATE INDEX IF NOT EXISTS idx_resellers_status ON resellers(status);

-- ============================================
-- 3. CREATE DISCOUNT CODES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reseller_id UUID REFERENCES resellers(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL, -- Same as reseller token
  discount_type VARCHAR(50) DEFAULT 'shipping', -- 'shipping' (free shipping)
  discount_value DECIMAL(10,2) DEFAULT 0.00, -- For shipping: 0 = free
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  max_uses INTEGER, -- NULL = unlimited
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_reseller ON discount_codes(reseller_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active);

-- ============================================
-- 4. ADD FIELDS TO PRODUCTS TABLE
-- ============================================
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS transport_cost DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS custom_duty_rate DECIMAL(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS custom_duty_amount DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS category_duty_rate DECIMAL(5,2) DEFAULT 0.00; -- Lookup from custom_duty_rates

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS transport_cost DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS custom_duty_rate DECIMAL(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS custom_duty_amount DECIMAL(10,2) DEFAULT 0.00;

-- ============================================
-- 5. CREATE PRODUCT COST BREAKDOWN TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS product_cost_breakdown (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  
  -- Cost components
  base_cost DECIMAL(10,2) NOT NULL, -- Cost from China
  transport_cost_per_unit DECIMAL(10,2) DEFAULT 0.00, -- Per product transport cost
  transport_cost_per_shipment DECIMAL(10,2) DEFAULT 0.00, -- Overall shipment cost (allocated proportionally)
  
  -- Duties and taxes
  custom_duty_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
  custom_duty_amount DECIMAL(10,2) DEFAULT 0.00, -- Calculated amount
  import_vat_amount DECIMAL(10,2) DEFAULT 0.00, -- 15% on (base_cost + transport + duties)
  total_landed_cost DECIMAL(10,2) NOT NULL, -- Before VAT reclaim
  effective_cost DECIMAL(10,2) NOT NULL, -- After reclaiming import VAT
  
  -- Suggested pricing
  suggested_selling_price DECIMAL(10,2), -- Calculated with desired margin
  desired_profit_margin DECIMAL(5,2) DEFAULT 30.00, -- Percentage
  
  -- Metadata
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  calculated_by VARCHAR(255), -- Admin user who calculated
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cost_breakdown_product ON product_cost_breakdown(product_id);
CREATE INDEX IF NOT EXISTS idx_cost_breakdown_variant ON product_cost_breakdown(variant_id);

-- ============================================
-- 6. UPDATE ORDERS TABLE FOR RESELLER SUPPORT
-- ============================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS discount_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS reseller_id UUID REFERENCES resellers(id),
  ADD COLUMN IF NOT EXISTS shipping_discount_applied DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0.00, -- Actual shipping cost (for accounting)
  ADD COLUMN IF NOT EXISTS is_reseller_order BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_orders_discount_code ON orders(discount_code);
CREATE INDEX IF NOT EXISTS idx_orders_reseller ON orders(reseller_id);

-- ============================================
-- 7. CREATE RESELLER COMMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reseller_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reseller_id UUID REFERENCES resellers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Commission calculation
  order_total DECIMAL(10,2) NOT NULL,
  order_cost DECIMAL(10,2) NOT NULL,
  order_profit_before_tax DECIMAL(10,2) NOT NULL,
  order_tax_amount DECIMAL(10,2) NOT NULL,
  order_net_profit_after_tax DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL, -- Percentage at time of calculation
  commission_amount DECIMAL(10,2) NOT NULL, -- Calculated commission
  
  -- Payment tracking
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
  payment_period VARCHAR(50), -- 'weekly', 'monthly'
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_reference VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissions_reseller ON reseller_commissions(reseller_id);
CREATE INDEX IF NOT EXISTS idx_commissions_order ON reseller_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_payment_status ON reseller_commissions(payment_status);

-- ============================================
-- 8. CREATE RESELLER PURCHASES TABLE (Future)
-- ============================================
CREATE TABLE IF NOT EXISTS reseller_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reseller_id UUID REFERENCES resellers(id) ON DELETE CASCADE,
  order_number VARCHAR(50) UNIQUE NOT NULL, -- PO-RESELLER-2024-001
  
  -- Purchase details
  total_quantity INTEGER NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL, -- Before discount
  discount_percentage DECIMAL(5,2) NOT NULL, -- Fixed discount (e.g., 30%)
  discount_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL, -- After discount
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reseller_purchase_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID REFERENCES reseller_purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  retail_price DECIMAL(10,2) NOT NULL, -- Retail price (reseller doesn't see cost)
  discount_percentage DECIMAL(5,2) NOT NULL, -- Fixed discount
  unit_price DECIMAL(10,2) NOT NULL, -- After discount
  line_total DECIMAL(10,2) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. ENABLE RLS
-- ============================================
ALTER TABLE resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_cost_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_duty_rates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resellers
DROP POLICY IF EXISTS "Resellers can view own profile" ON resellers;
CREATE POLICY "Resellers can view own profile" 
ON resellers FOR SELECT 
USING (true); -- Will be filtered by application logic

-- Allow admins to manage resellers (using service role)
DROP POLICY IF EXISTS "Admins can manage resellers" ON resellers;
CREATE POLICY "Admins can manage resellers" 
ON resellers FOR ALL 
USING (true);

-- RLS Policies for discount codes (public read for validation)
DROP POLICY IF EXISTS "Anyone can validate discount codes" ON discount_codes;
CREATE POLICY "Anyone can validate discount codes" 
ON discount_codes FOR SELECT 
USING (is_active = true);

-- RLS Policies for commissions (resellers see own)
DROP POLICY IF EXISTS "Resellers can view own commissions" ON reseller_commissions;
CREATE POLICY "Resellers can view own commissions" 
ON reseller_commissions FOR SELECT 
USING (true); -- Will be filtered by reseller_id in application

-- Admins can manage all
DROP POLICY IF EXISTS "Admins can manage commissions" ON reseller_commissions;
CREATE POLICY "Admins can manage commissions" 
ON reseller_commissions FOR ALL 
USING (true);

-- Similar policies for other tables (using service role for admin operations)
-- Note: In production, you'll use service role key for admin operations

-- ============================================
-- 10. CREATE TRIGGER FOR UPDATED_AT
-- ============================================
-- Check if function exists, create if not
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_resellers_updated_at ON resellers;
CREATE TRIGGER update_resellers_updated_at 
  BEFORE UPDATE ON resellers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_discount_codes_updated_at ON discount_codes;
CREATE TRIGGER update_discount_codes_updated_at 
  BEFORE UPDATE ON discount_codes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_cost_breakdown_updated_at ON product_cost_breakdown;
CREATE TRIGGER update_product_cost_breakdown_updated_at 
  BEFORE UPDATE ON product_cost_breakdown 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reseller_commissions_updated_at ON reseller_commissions;
CREATE TRIGGER update_reseller_commissions_updated_at 
  BEFORE UPDATE ON reseller_commissions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reseller_purchases_updated_at ON reseller_purchases;
CREATE TRIGGER update_reseller_purchases_updated_at 
  BEFORE UPDATE ON reseller_purchases 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. VERIFICATION QUERIES
-- ============================================
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
  'resellers', 'discount_codes', 'product_cost_breakdown', 
  'reseller_commissions', 'reseller_purchases', 'custom_duty_rates'
);


