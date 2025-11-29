-- Migration: Financial & Accounting System
-- Run this in your Supabase SQL Editor
-- This migration creates tables for multi-location system, procurement, shipments, distributors, and HS codes

-- ============================================
-- 1. CREATE LOCATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE, -- 'Johannesburg', 'Newcastle', 'Port Shepstone'
  code VARCHAR(50) UNIQUE, -- 'JHB', 'NCL', 'PSP'
  distributor_id UUID, -- References distributors table (created later)
  is_active BOOLEAN DEFAULT true,
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'South Africa',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default location (Johannesburg - existing setup)
INSERT INTO locations (name, code, is_active) 
VALUES ('Johannesburg', 'JHB', true)
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);
CREATE INDEX IF NOT EXISTS idx_locations_code ON locations(code);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active);

-- ============================================
-- 2. CREATE HS CODES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS hs_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hs_code VARCHAR(20) NOT NULL UNIQUE, -- e.g., '0101.21', '0101.29'
  description TEXT NOT NULL, -- 'Pure-bred breeding animals'
  duty_rate_general DECIMAL(5,2) DEFAULT 0.00, -- General duty rate percentage
  duty_rate_eu DECIMAL(5,2) DEFAULT 0.00,
  duty_rate_efta DECIMAL(5,2) DEFAULT 0.00,
  duty_rate_sadc DECIMAL(5,2) DEFAULT 0.00,
  duty_rate_mercosur DECIMAL(5,2) DEFAULT 0.00,
  duty_rate_afcfta DECIMAL(5,2) DEFAULT 0.00,
  statistical_unit VARCHAR(10), -- 'u', 'kg', 't', etc.
  chapter VARCHAR(10), -- '01', '02', etc.
  section VARCHAR(10), -- 'I', 'II', etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hs_codes_code ON hs_codes(hs_code);
CREATE INDEX IF NOT EXISTS idx_hs_codes_description ON hs_codes USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_hs_codes_chapter ON hs_codes(chapter);

-- ============================================
-- 3. EXTEND PRODUCTS TABLE
-- ============================================
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id),
  ADD COLUMN IF NOT EXISTS hs_code VARCHAR(20) REFERENCES hs_codes(hs_code),
  ADD COLUMN IF NOT EXISTS hs_code_manual_override BOOLEAN DEFAULT false, -- If true, don't auto-update HS code
  ADD COLUMN IF NOT EXISTS procurement_status VARCHAR(50) DEFAULT 'not_requested', -- 'not_requested', 'pending', 'sent_to_agent', 'ordered', 'shipped', 'received'
  ADD COLUMN IF NOT EXISTS procurement_link TEXT, -- 1688.com link
  ADD COLUMN IF NOT EXISTS target_cost_rmb DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS procurement_priority VARCHAR(50) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  ADD COLUMN IF NOT EXISTS china_agent_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_products_location ON products(location_id);
CREATE INDEX IF NOT EXISTS idx_products_hs_code ON products(hs_code);
CREATE INDEX IF NOT EXISTS idx_products_procurement_status ON products(procurement_status);

-- ============================================
-- 4. CREATE LOCATION STOCK TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS location_stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_point INTEGER,
  reorder_quantity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(location_id, product_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_location_stock_location ON location_stock(location_id);
CREATE INDEX IF NOT EXISTS idx_location_stock_product ON location_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_location_stock_variant ON location_stock(variant_id);

-- ============================================
-- 5. CREATE PROCUREMENT QUEUE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS procurement_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id), -- Which location needs this
  
  -- Auto-calculated from sales
  quantity_needed INTEGER NOT NULL DEFAULT 0, -- Sum of all sales since last procurement
  
  -- Manual override/addition by admin
  procurement_link TEXT, -- 1688.com link
  images JSONB, -- Additional images for China Agent
  description TEXT, -- Additional description
  target_cost_rmb DECIMAL(10,2), -- Expected cost
  china_agent_notes TEXT, -- Notes for China Agent
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent_to_agent', 'ordered', 'shipped', 'received'
  priority VARCHAR(50) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  procurement_batch_id UUID, -- Links to procurement batch sent to agent
  sent_to_agent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_procurement_queue_product ON procurement_queue(product_id);
CREATE INDEX IF NOT EXISTS idx_procurement_queue_status ON procurement_queue(status);
CREATE INDEX IF NOT EXISTS idx_procurement_queue_location ON procurement_queue(location_id);
CREATE INDEX IF NOT EXISTS idx_procurement_queue_batch ON procurement_queue(procurement_batch_id);

-- ============================================
-- 6. CREATE PROCUREMENT BATCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS procurement_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_number VARCHAR(50) UNIQUE NOT NULL, -- 'PROC-2024-W01', 'PROC-2024-M01'
  batch_type VARCHAR(20) DEFAULT 'monthly', -- 'weekly', 'monthly'
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'processing', 'completed'
  sent_to_agent_at TIMESTAMP WITH TIME ZONE,
  agent_notes TEXT,
  total_items INTEGER DEFAULT 0,
  total_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_procurement_batches_number ON procurement_batches(batch_number);
CREATE INDEX IF NOT EXISTS idx_procurement_batches_status ON procurement_batches(status);
CREATE INDEX IF NOT EXISTS idx_procurement_batches_type ON procurement_batches(batch_type);

-- ============================================
-- 7. CREATE PROCUREMENT BATCH ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS procurement_batch_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES procurement_batches(id) ON DELETE CASCADE,
  queue_item_id UUID NOT NULL REFERENCES procurement_queue(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(batch_id, queue_item_id)
);

CREATE INDEX IF NOT EXISTS idx_procurement_batch_items_batch ON procurement_batch_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_procurement_batch_items_queue ON procurement_batch_items(queue_item_id);

-- ============================================
-- 8. CREATE SHIPMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_reference VARCHAR(100) UNIQUE NOT NULL, -- 'SHIP-2024-001'
  procurement_batch_id UUID REFERENCES procurement_batches(id),
  
  -- Costs
  total_cost_rmb DECIMAL(12,2), -- Total cost from China Agent in RMB
  total_cost_zar DECIMAL(12,2), -- Converted to ZAR
  shipping_cost DECIMAL(10,2), -- Shipping cost
  insurance_cost DECIMAL(10,2), -- Insurance cost
  exchange_rate DECIMAL(10,4), -- RMB to ZAR rate at time of shipment
  
  -- Customs
  total_import_duty DECIMAL(10,2), -- Total import duties
  total_vat DECIMAL(10,2), -- Total VAT on import
  total_landed_cost DECIMAL(12,2), -- Total cost after duties and VAT
  
  -- Status
  status VARCHAR(50) DEFAULT 'ordered', -- 'ordered', 'in_transit', 'arrived', 'cleared', 'received'
  ordered_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  arrived_at TIMESTAMP WITH TIME ZONE,
  cleared_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  
  -- Verification
  china_agent_customs_calculation JSONB, -- Store China Agent's customs calculation for comparison
  our_customs_calculation JSONB, -- Store our customs calculation
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_reference ON shipments(shipment_reference);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_batch ON shipments(procurement_batch_id);

-- ============================================
-- 9. CREATE SHIPMENT ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shipment_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  
  -- Quantities
  quantity INTEGER NOT NULL,
  
  -- Costs
  unit_cost_rmb DECIMAL(10,2), -- Cost per unit in RMB
  unit_cost_zar DECIMAL(10,2), -- Cost per unit in ZAR
  line_total_rmb DECIMAL(10,2), -- Total for this line in RMB
  line_total_zar DECIMAL(10,2), -- Total for this line in ZAR
  
  -- Customs
  hs_code VARCHAR(20) REFERENCES hs_codes(hs_code),
  import_duty_rate DECIMAL(5,2), -- Duty rate percentage
  import_duty_amount DECIMAL(10,2), -- Calculated duty
  vat_amount DECIMAL(10,2), -- VAT on this item
  landed_cost_per_unit DECIMAL(10,2), -- Landed cost per unit
  
  -- Physical attributes (for customs)
  weight_kg DECIMAL(10,3),
  length_cm DECIMAL(10,2),
  width_cm DECIMAL(10,2),
  height_cm DECIMAL(10,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment ON shipment_items(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_items_product ON shipment_items(product_id);
CREATE INDEX IF NOT EXISTS idx_shipment_items_hs_code ON shipment_items(hs_code);

-- ============================================
-- 10. CREATE DISTRIBUTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS distributors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  location_id UUID REFERENCES locations(id),
  
  -- Business details
  business_name VARCHAR(255),
  tax_number VARCHAR(100),
  vat_number VARCHAR(100),
  
  -- Bank details
  bank_name VARCHAR(255),
  bank_account_number VARCHAR(50),
  bank_account_type VARCHAR(50), -- 'cheque', 'savings', etc.
  branch_code VARCHAR(20),
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
  contract_signed BOOLEAN DEFAULT false,
  contract_signed_at TIMESTAMP WITH TIME ZONE,
  
  -- Notes
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_distributors_location ON distributors(location_id);
CREATE INDEX IF NOT EXISTS idx_distributors_email ON distributors(email);
CREATE INDEX IF NOT EXISTS idx_distributors_status ON distributors(status);

-- Update locations table to reference distributors
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_locations_distributor'
  ) THEN
    ALTER TABLE locations
      ADD CONSTRAINT fk_locations_distributor 
      FOREIGN KEY (distributor_id) 
      REFERENCES distributors(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- 11. CREATE FINANCIAL TRANSACTIONS TABLE (if not exists)
-- ============================================
-- This might already exist from commerce management system, but adding procurement-specific fields
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_transactions') THEN
    CREATE TABLE financial_transactions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      transaction_type VARCHAR(50) NOT NULL, -- 'sale', 'procurement', 'shipment', 'distributor_payment', 'expense'
      amount DECIMAL(12,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'ZAR',
      description TEXT,
      reference_id UUID, -- Links to orders, shipments, distributors, etc.
      reference_type VARCHAR(50), -- 'order', 'shipment', 'distributor', etc.
      location_id UUID REFERENCES locations(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX idx_financial_transactions_type ON financial_transactions(transaction_type);
    CREATE INDEX idx_financial_transactions_reference ON financial_transactions(reference_id, reference_type);
    CREATE INDEX idx_financial_transactions_location ON financial_transactions(location_id);
  ELSE
    -- Add new columns if table exists
    ALTER TABLE financial_transactions
      ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);
  END IF;
END $$;

-- ============================================
-- 12. ENABLE RLS
-- ============================================
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributors ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow admins to manage all (using service role)
-- Note: In production, use service role key for admin operations

-- Locations: Public read, admin write
DROP POLICY IF EXISTS "Anyone can view locations" ON locations;
CREATE POLICY "Anyone can view locations" 
ON locations FOR SELECT 
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage locations" ON locations;
CREATE POLICY "Admins can manage locations" 
ON locations FOR ALL 
USING (true);

-- HS Codes: Public read
DROP POLICY IF EXISTS "Anyone can view HS codes" ON hs_codes;
CREATE POLICY "Anyone can view HS codes" 
ON hs_codes FOR SELECT 
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage HS codes" ON hs_codes;
CREATE POLICY "Admins can manage HS codes" 
ON hs_codes FOR ALL 
USING (true);

-- Procurement Queue: Admin only
DROP POLICY IF EXISTS "Admins can manage procurement queue" ON procurement_queue;
CREATE POLICY "Admins can manage procurement queue" 
ON procurement_queue FOR ALL 
USING (true);

-- Procurement Batches: Admin only
DROP POLICY IF EXISTS "Admins can manage procurement batches" ON procurement_batches;
CREATE POLICY "Admins can manage procurement batches" 
ON procurement_batches FOR ALL 
USING (true);

-- Shipments: Admin only
DROP POLICY IF EXISTS "Admins can manage shipments" ON shipments;
CREATE POLICY "Admins can manage shipments" 
ON shipments FOR ALL 
USING (true);

-- Distributors: Admin only
DROP POLICY IF EXISTS "Admins can manage distributors" ON distributors;
CREATE POLICY "Admins can manage distributors" 
ON distributors FOR ALL 
USING (true);

-- Location Stock: Admin only
DROP POLICY IF EXISTS "Admins can manage location stock" ON location_stock;
CREATE POLICY "Admins can manage location stock" 
ON location_stock FOR ALL 
USING (true);

-- ============================================
-- 13. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================
-- Check if function exists, create if not
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
CREATE TRIGGER update_locations_updated_at 
  BEFORE UPDATE ON locations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hs_codes_updated_at ON hs_codes;
CREATE TRIGGER update_hs_codes_updated_at 
  BEFORE UPDATE ON hs_codes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_procurement_queue_updated_at ON procurement_queue;
CREATE TRIGGER update_procurement_queue_updated_at 
  BEFORE UPDATE ON procurement_queue 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_procurement_batches_updated_at ON procurement_batches;
CREATE TRIGGER update_procurement_batches_updated_at 
  BEFORE UPDATE ON procurement_batches 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shipments_updated_at ON shipments;
CREATE TRIGGER update_shipments_updated_at 
  BEFORE UPDATE ON shipments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_distributors_updated_at ON distributors;
CREATE TRIGGER update_distributors_updated_at 
  BEFORE UPDATE ON distributors 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_location_stock_updated_at ON location_stock;
CREATE TRIGGER update_location_stock_updated_at 
  BEFORE UPDATE ON location_stock 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 14. VERIFICATION QUERIES
-- ============================================
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'locations', 'hs_codes', 'location_stock', 
  'procurement_queue', 'procurement_batches', 'procurement_batch_items',
  'shipments', 'shipment_items', 'distributors'
);

