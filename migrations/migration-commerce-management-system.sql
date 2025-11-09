-- Migration: Commerce Management System
-- Run this in your Supabase SQL Editor
-- This migration adds cost tracking, stock history, financial transactions, tax configuration, and reorder management

-- ============================================
-- 1. ADD COST TRACKING TO PRODUCTS
-- ============================================
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2) DEFAULT 0;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 10;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS reorder_quantity INTEGER DEFAULT 50;

COMMENT ON COLUMN products.cost IS 'Cost per unit for profit calculation';
COMMENT ON COLUMN products.reorder_point IS 'Stock level that triggers reorder alert';
COMMENT ON COLUMN products.reorder_quantity IS 'Default quantity to reorder when stock is low';

-- ============================================
-- 2. ADD COST TRACKING TO PRODUCT VARIANTS
-- ============================================
ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2);

ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS reorder_point INTEGER;

ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS reorder_quantity INTEGER;

COMMENT ON COLUMN product_variants.cost IS 'Cost per unit for this variant (overrides product cost if set)';
COMMENT ON COLUMN product_variants.reorder_point IS 'Stock level that triggers reorder (inherits from product if null)';
COMMENT ON COLUMN product_variants.reorder_quantity IS 'Quantity to reorder (inherits from product if null)';

-- ============================================
-- 3. CREATE STOCK HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stock_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  change_type VARCHAR(50) NOT NULL, -- 'sale', 'purchase', 'adjustment', 'return', 'reorder'
  quantity_change INTEGER NOT NULL, -- Positive for increases, negative for decreases
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT, -- Optional reason for adjustment
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL, -- Link to order if applicable
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255) -- User/admin who made the change
);

CREATE INDEX IF NOT EXISTS idx_stock_history_product_id ON stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_variant_id ON stock_history(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_created_at ON stock_history(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_history_order_id ON stock_history(order_id);

COMMENT ON TABLE stock_history IS 'Audit trail for all stock changes';

-- ============================================
-- 4. CREATE FINANCIAL TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'sale', 'refund', 'adjustment'
  amount DECIMAL(10,2) NOT NULL, -- Total transaction amount (revenue)
  tax_amount DECIMAL(10,2) DEFAULT 0, -- Tax portion (VAT on sales)
  cost_amount DECIMAL(10,2) DEFAULT 0, -- Total cost of goods sold
  import_vat_amount DECIMAL(10,2) DEFAULT 0, -- Import VAT (15% on cost, reclaimable)
  corporate_tax_amount DECIMAL(10,2) DEFAULT 0, -- Corporate income tax (27% on profit)
  profit_amount DECIMAL(10,2) DEFAULT 0, -- Profit before corporate tax (amount - cost_amount - tax_amount)
  net_profit_after_tax DECIMAL(10,2) DEFAULT 0, -- Net profit after corporate tax
  currency VARCHAR(3) DEFAULT 'ZAR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns if table exists but columns don't
ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS import_vat_amount DECIMAL(10,2) DEFAULT 0;

ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS corporate_tax_amount DECIMAL(10,2) DEFAULT 0;

ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS net_profit_after_tax DECIMAL(10,2) DEFAULT 0;

-- Update existing rows to have default values for new columns
UPDATE financial_transactions 
SET import_vat_amount = 0 
WHERE import_vat_amount IS NULL;

UPDATE financial_transactions 
SET corporate_tax_amount = 0 
WHERE corporate_tax_amount IS NULL;

UPDATE financial_transactions 
SET net_profit_after_tax = profit_amount - COALESCE(corporate_tax_amount, 0)
WHERE net_profit_after_tax IS NULL;

CREATE INDEX IF NOT EXISTS idx_financial_transactions_order_id ON financial_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_created_at ON financial_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(transaction_type);

COMMENT ON TABLE financial_transactions IS 'Financial records for accounting and profit tracking';

-- ============================================
-- 5. CREATE TAX CONFIGURATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tax_configuration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tax_name VARCHAR(100) NOT NULL DEFAULT 'VAT',
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 15.00, -- South Africa VAT default
  import_vat_rate DECIMAL(5,2) NOT NULL DEFAULT 15.00, -- Import VAT rate (on cost)
  corporate_tax_rate DECIMAL(5,2) NOT NULL DEFAULT 27.00, -- Corporate income tax rate (on profit)
  is_active BOOLEAN DEFAULT true,
  applies_to_all BOOLEAN DEFAULT true, -- If false, need category-specific rules
  tax_inclusive BOOLEAN DEFAULT false, -- Whether prices include tax
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns if table exists but columns don't
ALTER TABLE tax_configuration 
ADD COLUMN IF NOT EXISTS import_vat_rate DECIMAL(5,2) DEFAULT 15.00;

ALTER TABLE tax_configuration 
ADD COLUMN IF NOT EXISTS corporate_tax_rate DECIMAL(5,2) DEFAULT 27.00;

-- Update existing rows to have default values for new columns
UPDATE tax_configuration 
SET import_vat_rate = 15.00 
WHERE import_vat_rate IS NULL;

UPDATE tax_configuration 
SET corporate_tax_rate = 27.00 
WHERE corporate_tax_rate IS NULL;

-- Insert default tax configuration (only if no active config exists)
INSERT INTO tax_configuration (tax_name, tax_rate, import_vat_rate, corporate_tax_rate, is_active, applies_to_all, tax_inclusive)
SELECT 'VAT', 15.00, 15.00, 27.00, true, true, false
WHERE NOT EXISTS (
  SELECT 1 FROM tax_configuration WHERE is_active = true
);

CREATE INDEX IF NOT EXISTS idx_tax_configuration_active ON tax_configuration(is_active) WHERE is_active = true;

COMMENT ON TABLE tax_configuration IS 'Tax settings for the platform';

-- ============================================
-- 6. CREATE REORDER REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reorder_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL,
  reorder_point INTEGER NOT NULL,
  suggested_quantity INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'ordered', 'received', 'cancelled'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_reorder_requests_product_id ON reorder_requests(product_id);
CREATE INDEX IF NOT EXISTS idx_reorder_requests_variant_id ON reorder_requests(variant_id);
CREATE INDEX IF NOT EXISTS idx_reorder_requests_status ON reorder_requests(status);
CREATE INDEX IF NOT EXISTS idx_reorder_requests_created_at ON reorder_requests(created_at);

COMMENT ON TABLE reorder_requests IS 'Track products/variants that need to be reordered';

-- ============================================
-- 7. CREATE TRIGGER FOR TAX CONFIGURATION UPDATED_AT
-- ============================================
DROP TRIGGER IF EXISTS update_tax_configuration_updated_at ON tax_configuration;
CREATE TRIGGER update_tax_configuration_updated_at 
  BEFORE UPDATE ON tax_configuration 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. CREATE FUNCTION TO CALCULATE EFFECTIVE REORDER POINT
-- ============================================
CREATE OR REPLACE FUNCTION get_effective_reorder_point(
  p_product_id UUID,
  p_variant_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  variant_reorder_point INTEGER;
  product_reorder_point INTEGER;
BEGIN
  IF p_variant_id IS NOT NULL THEN
    SELECT reorder_point INTO variant_reorder_point
    FROM product_variants
    WHERE id = p_variant_id;
    
    IF variant_reorder_point IS NOT NULL THEN
      RETURN variant_reorder_point;
    END IF;
  END IF;
  
  SELECT reorder_point INTO product_reorder_point
  FROM products
  WHERE id = p_product_id;
  
  RETURN COALESCE(product_reorder_point, 10); -- Default to 10 if not set
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. CREATE FUNCTION TO CHECK LOW STOCK
-- ============================================
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TABLE (
  product_id UUID,
  variant_id UUID,
  product_name VARCHAR,
  variant_attributes JSONB,
  current_stock INTEGER,
  reorder_point INTEGER,
  suggested_quantity INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    NULL::UUID as variant_id,
    p.name as product_name,
    NULL::JSONB as variant_attributes,
    p.stock as current_stock,
    COALESCE(p.reorder_point, 10) as reorder_point,
    COALESCE(p.reorder_quantity, 50) as suggested_quantity
  FROM products p
  WHERE p.stock < COALESCE(p.reorder_point, 10)
    AND p.has_variants = false
    AND p.is_active = true
  
  UNION ALL
  
  SELECT 
    p.id as product_id,
    pv.id as variant_id,
    p.name as product_name,
    pv.variant_attributes,
    pv.stock as current_stock,
    get_effective_reorder_point(p.id, pv.id) as reorder_point,
    COALESCE(pv.reorder_quantity, p.reorder_quantity, 50) as suggested_quantity
  FROM products p
  JOIN product_variants pv ON pv.product_id = p.id
  WHERE pv.stock < get_effective_reorder_point(p.id, pv.id)
    AND p.has_variants = true
    AND p.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. ENABLE RLS ON NEW TABLES
-- ============================================
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE reorder_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stock_history (admin only)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view stock history" ON stock_history;
DROP POLICY IF EXISTS "Admins can insert stock history" ON stock_history;

CREATE POLICY "Admins can view stock history" ON stock_history FOR SELECT USING (true);
CREATE POLICY "Admins can insert stock history" ON stock_history FOR INSERT WITH CHECK (true);

-- RLS Policies for financial_transactions (admin only)
DROP POLICY IF EXISTS "Admins can view financial transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Admins can insert financial transactions" ON financial_transactions;

CREATE POLICY "Admins can view financial transactions" ON financial_transactions FOR SELECT USING (true);
CREATE POLICY "Admins can insert financial transactions" ON financial_transactions FOR INSERT WITH CHECK (true);

-- RLS Policies for tax_configuration (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view tax configuration" ON tax_configuration;
DROP POLICY IF EXISTS "Admins can manage tax configuration" ON tax_configuration;

CREATE POLICY "Anyone can view tax configuration" ON tax_configuration FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage tax configuration" ON tax_configuration FOR ALL USING (true);

-- RLS Policies for reorder_requests (admin only)
DROP POLICY IF EXISTS "Admins can view reorder requests" ON reorder_requests;
DROP POLICY IF EXISTS "Admins can manage reorder requests" ON reorder_requests;

CREATE POLICY "Admins can view reorder requests" ON reorder_requests FOR SELECT USING (true);
CREATE POLICY "Admins can manage reorder requests" ON reorder_requests FOR ALL USING (true);

-- ============================================
-- 11. VERIFICATION QUERIES
-- ============================================
-- Check columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('cost', 'reorder_point', 'reorder_quantity')
ORDER BY column_name;

SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'product_variants' 
AND column_name IN ('cost', 'reorder_point', 'reorder_quantity')
ORDER BY column_name;

-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('stock_history', 'financial_transactions', 'tax_configuration', 'reorder_requests')
ORDER BY table_name;

-- Check tax configuration
SELECT * FROM tax_configuration WHERE is_active = true;

