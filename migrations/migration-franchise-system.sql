-- Migration: Franchise System
-- Run this in your Supabase SQL Editor
-- This migration extends the locations system to support franchises with stock allocation and financial tracking

-- ============================================
-- 1. EXTEND LOCATIONS TABLE FOR FRANCHISES
-- ============================================
ALTER TABLE locations 
  ADD COLUMN IF NOT EXISTS franchise_code VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS franchise_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_franchise BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS franchise_owner_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS franchise_owner_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS franchise_owner_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS franchise_start_date DATE,
  ADD COLUMN IF NOT EXISTS franchise_status VARCHAR(50) DEFAULT 'active'; -- 'active', 'inactive', 'suspended'

CREATE INDEX IF NOT EXISTS idx_locations_franchise_code ON locations(franchise_code);
CREATE INDEX IF NOT EXISTS idx_locations_is_franchise ON locations(is_franchise);

-- Update existing Johannesburg location to be the first franchise
UPDATE locations 
SET 
  is_franchise = true,
  franchise_code = 'JHB',
  franchise_name = 'Johannesburg Franchise',
  franchise_status = 'active'
WHERE name = 'Johannesburg' AND is_franchise IS NULL;

-- ============================================
-- 2. CREATE FRANCHISE STOCK ALLOCATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_stock_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  franchise_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  
  -- Allocation details
  quantity_allocated INTEGER NOT NULL DEFAULT 0,
  quantity_received INTEGER DEFAULT 0,
  quantity_pending INTEGER GENERATED ALWAYS AS (quantity_allocated - quantity_received) STORED,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_transit', 'received', 'partial'
  allocated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shipped_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  
  -- Cost tracking
  unit_cost_zar DECIMAL(10,2), -- Cost per unit at allocation time
  total_cost_zar DECIMAL(10,2), -- Total cost for this allocation
  
  -- Notes
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique allocation per shipment/product/variant/franchise
  UNIQUE(shipment_id, franchise_location_id, product_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_franchise_allocations_shipment ON franchise_stock_allocations(shipment_id);
CREATE INDEX IF NOT EXISTS idx_franchise_allocations_franchise ON franchise_stock_allocations(franchise_location_id);
CREATE INDEX IF NOT EXISTS idx_franchise_allocations_product ON franchise_stock_allocations(product_id);
CREATE INDEX IF NOT EXISTS idx_franchise_allocations_status ON franchise_stock_allocations(status);

-- ============================================
-- 3. ADD FRANCHISE_ID TO ORDERS (BACKWARD COMPATIBLE)
-- ============================================
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS franchise_location_id UUID REFERENCES locations(id);

CREATE INDEX IF NOT EXISTS idx_orders_franchise ON orders(franchise_location_id);

-- Update existing orders to link to default franchise (Johannesburg) if location exists
UPDATE orders o
SET franchise_location_id = (
  SELECT id FROM locations WHERE name = 'Johannesburg' AND is_franchise = true LIMIT 1
)
WHERE o.franchise_location_id IS NULL 
AND EXISTS (SELECT 1 FROM locations WHERE name = 'Johannesburg' AND is_franchise = true);

-- ============================================
-- 4. CREATE FRANCHISE FINANCIAL TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_financials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type VARCHAR(20) DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly', 'yearly'
  
  -- Revenue metrics
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  average_order_value DECIMAL(10,2) DEFAULT 0,
  
  -- Cost metrics
  total_cost DECIMAL(12,2) DEFAULT 0, -- Cost of goods sold
  total_shipping_cost DECIMAL(10,2) DEFAULT 0,
  total_operational_cost DECIMAL(10,2) DEFAULT 0, -- Franchise operational costs
  
  -- Profit metrics
  gross_profit DECIMAL(12,2) DEFAULT 0, -- Revenue - COGS
  net_profit DECIMAL(12,2) DEFAULT 0, -- Gross profit - operational costs
  profit_margin DECIMAL(5,2) DEFAULT 0, -- Percentage
  
  -- Tax metrics
  total_tax DECIMAL(10,2) DEFAULT 0,
  corporate_tax DECIMAL(10,2) DEFAULT 0,
  
  -- Stock metrics
  units_sold INTEGER DEFAULT 0,
  stock_turnover_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Metadata
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique financial record per franchise/period
  UNIQUE(franchise_location_id, period_start, period_end, period_type)
);

CREATE INDEX IF NOT EXISTS idx_franchise_financials_franchise ON franchise_financials(franchise_location_id);
CREATE INDEX IF NOT EXISTS idx_franchise_financials_period ON franchise_financials(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_franchise_financials_type ON franchise_financials(period_type);

-- ============================================
-- 5. CREATE FRANCHISE STOCK TRANSFERS TABLE
-- ============================================
-- Tracks stock movements between central warehouse and franchises
CREATE TABLE IF NOT EXISTS franchise_stock_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_reference VARCHAR(100) UNIQUE NOT NULL, -- 'TRANSFER-2024-001'
  
  -- Transfer details
  from_location_id UUID REFERENCES locations(id), -- NULL = central warehouse
  to_location_id UUID NOT NULL REFERENCES locations(id), -- Franchise location
  transfer_type VARCHAR(50) DEFAULT 'allocation', -- 'allocation', 'transfer', 'return', 'adjustment'
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_transit', 'received', 'cancelled'
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shipped_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  
  -- Totals
  total_items INTEGER DEFAULT 0,
  total_quantity INTEGER DEFAULT 0,
  total_value DECIMAL(12,2) DEFAULT 0,
  
  -- Notes
  notes TEXT,
  created_by VARCHAR(255), -- Admin user
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_transfers_from ON franchise_stock_transfers(from_location_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_to ON franchise_stock_transfers(to_location_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON franchise_stock_transfers(status);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_reference ON franchise_stock_transfers(transfer_reference);

-- ============================================
-- 6. CREATE FRANCHISE STOCK TRANSFER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id UUID NOT NULL REFERENCES franchise_stock_transfers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),
  line_total DECIMAL(10,2),
  
  quantity_received INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfer_items_transfer ON franchise_stock_transfer_items(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_items_product ON franchise_stock_transfer_items(product_id);

-- ============================================
-- 7. ENABLE RLS ON NEW TABLES
-- ============================================
ALTER TABLE franchise_stock_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_stock_transfer_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin can manage all
DROP POLICY IF EXISTS "Admins can manage franchise allocations" ON franchise_stock_allocations;
CREATE POLICY "Admins can manage franchise allocations" 
ON franchise_stock_allocations FOR ALL 
USING (true);

DROP POLICY IF EXISTS "Admins can manage franchise financials" ON franchise_financials;
CREATE POLICY "Admins can manage franchise financials" 
ON franchise_financials FOR ALL 
USING (true);

DROP POLICY IF EXISTS "Admins can manage stock transfers" ON franchise_stock_transfers;
CREATE POLICY "Admins can manage stock transfers" 
ON franchise_stock_transfers FOR ALL 
USING (true);

DROP POLICY IF EXISTS "Admins can manage transfer items" ON franchise_stock_transfer_items;
CREATE POLICY "Admins can manage transfer items" 
ON franchise_stock_transfer_items FOR ALL 
USING (true);

-- ============================================
-- 8. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================
DROP TRIGGER IF EXISTS update_franchise_allocations_updated_at ON franchise_stock_allocations;
CREATE TRIGGER update_franchise_allocations_updated_at 
  BEFORE UPDATE ON franchise_stock_allocations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_franchise_financials_updated_at ON franchise_financials;
CREATE TRIGGER update_franchise_financials_updated_at 
  BEFORE UPDATE ON franchise_financials 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stock_transfers_updated_at ON franchise_stock_transfers;
CREATE TRIGGER update_stock_transfers_updated_at 
  BEFORE UPDATE ON franchise_stock_transfers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. CREATE FUNCTION TO AUTO-UPDATE LOCATION STOCK ON ALLOCATION
-- ============================================
CREATE OR REPLACE FUNCTION update_location_stock_on_allocation()
RETURNS TRIGGER AS $$
BEGIN
  -- When allocation is received, update location_stock
  IF NEW.status = 'received' AND (OLD.status IS NULL OR OLD.status != 'received') THEN
    INSERT INTO location_stock (location_id, product_id, variant_id, stock_quantity)
    VALUES (NEW.franchise_location_id, NEW.product_id, NEW.variant_id, NEW.quantity_received)
    ON CONFLICT (location_id, product_id, variant_id) 
    DO UPDATE SET 
      stock_quantity = location_stock.stock_quantity + NEW.quantity_received,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_location_stock_on_allocation ON franchise_stock_allocations;
CREATE TRIGGER trigger_update_location_stock_on_allocation
  AFTER UPDATE OF status ON franchise_stock_allocations
  FOR EACH ROW
  WHEN (NEW.status = 'received' AND (OLD.status IS NULL OR OLD.status != 'received'))
  EXECUTE FUNCTION update_location_stock_on_allocation();

-- ============================================
-- 10. VERIFICATION QUERIES
-- ============================================
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'franchise_stock_allocations', 
  'franchise_financials',
  'franchise_stock_transfers',
  'franchise_stock_transfer_items'
);

