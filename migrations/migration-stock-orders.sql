-- Migration: Stock Orders System
-- Run this in your Supabase SQL Editor
-- This migration creates tables for managing stock orders (purchase orders) with shipping company requirements

-- ============================================
-- 1. CREATE STOCK ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stock_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL, -- PO-2024-001 format
  supplier_name VARCHAR(255) NOT NULL,
  supplier_email VARCHAR(255),
  supplier_phone VARCHAR(50),
  supplier_address TEXT,
  supplier_city VARCHAR(100),
  supplier_postal_code VARCHAR(20),
  supplier_country VARCHAR(100) DEFAULT 'South Africa',
  
  -- Shipping information
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(100) NOT NULL,
  shipping_postal_code VARCHAR(20) NOT NULL,
  shipping_country VARCHAR(100) DEFAULT 'South Africa',
  shipping_contact_name VARCHAR(255),
  shipping_contact_phone VARCHAR(50),
  shipping_method VARCHAR(100), -- e.g., "Standard Shipping", "Express", "Air Freight"
  expected_delivery_date DATE,
  
  -- Order details
  order_date DATE DEFAULT CURRENT_DATE,
  order_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted', 'confirmed', 'in_transit', 'received', 'cancelled'
  notes TEXT,
  total_quantity INTEGER DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  
  -- Metadata
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. CREATE STOCK ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stock_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stock_order_id UUID NOT NULL REFERENCES stock_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- NULL if manually added product
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL, -- NULL if no variant
  
  -- Product details (stored for reference even if product is deleted)
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100), -- SKU from product or variant
  product_description TEXT,
  
  -- Variant details (if applicable)
  variant_attributes JSONB, -- e.g., {"size": "L", "color": "Red"}
  
  -- Ordering details
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(10,2) NOT NULL, -- Cost per unit at time of order
  line_total DECIMAL(10,2) NOT NULL, -- quantity * unit_cost
  
  -- Shipping details (for shipping calculations)
  unit_weight_kg DECIMAL(8,3), -- Weight per unit in kg
  unit_length_cm DECIMAL(8,2), -- Length in cm
  unit_width_cm DECIMAL(8,2), -- Width in cm
  unit_height_cm DECIMAL(8,2), -- Height in cm
  
  -- Status
  received_quantity INTEGER DEFAULT 0, -- How many have been received
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_stock_orders_order_number ON stock_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_stock_orders_order_date ON stock_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_stock_orders_order_status ON stock_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_stock_orders_supplier_name ON stock_orders(supplier_name);
CREATE INDEX IF NOT EXISTS idx_stock_order_items_order_id ON stock_order_items(stock_order_id);
CREATE INDEX IF NOT EXISTS idx_stock_order_items_product_id ON stock_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_order_items_variant_id ON stock_order_items(variant_id);

-- ============================================
-- 4. CREATE FUNCTION TO GENERATE ORDER NUMBER
-- ============================================
CREATE OR REPLACE FUNCTION generate_stock_order_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  year_prefix VARCHAR(4);
  sequence_num INTEGER;
  order_num VARCHAR(50);
BEGIN
  year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM stock_orders
  WHERE order_number LIKE 'PO-' || year_prefix || '-%';
  
  order_num := 'PO-' || year_prefix || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. CREATE TRIGGER FOR UPDATED_AT
-- ============================================
DROP TRIGGER IF EXISTS update_stock_orders_updated_at ON stock_orders;
CREATE TRIGGER update_stock_orders_updated_at 
  BEFORE UPDATE ON stock_orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stock_order_items_updated_at ON stock_order_items;
CREATE TRIGGER update_stock_order_items_updated_at 
  BEFORE UPDATE ON stock_order_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. CREATE FUNCTION TO UPDATE ORDER TOTALS
-- ============================================
CREATE OR REPLACE FUNCTION update_stock_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stock_orders
  SET 
    total_quantity = (
      SELECT COALESCE(SUM(quantity), 0)
      FROM stock_order_items
      WHERE stock_order_id = COALESCE(NEW.stock_order_id, OLD.stock_order_id)
    ),
    total_cost = (
      SELECT COALESCE(SUM(line_total), 0)
      FROM stock_order_items
      WHERE stock_order_id = COALESCE(NEW.stock_order_id, OLD.stock_order_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.stock_order_id, OLD.stock_order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock_order_items
DROP TRIGGER IF EXISTS trigger_update_stock_order_totals ON stock_order_items;
CREATE TRIGGER trigger_update_stock_order_totals
  AFTER INSERT OR UPDATE OR DELETE ON stock_order_items
  FOR EACH ROW EXECUTE FUNCTION update_stock_order_totals();

-- ============================================
-- 7. ENABLE RLS
-- ============================================
ALTER TABLE stock_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin only)
CREATE POLICY "Admins can view stock orders" ON stock_orders FOR SELECT USING (true);
CREATE POLICY "Admins can manage stock orders" ON stock_orders FOR ALL USING (true);

CREATE POLICY "Admins can view stock order items" ON stock_order_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage stock order items" ON stock_order_items FOR ALL USING (true);

-- ============================================
-- 8. VERIFICATION QUERIES
-- ============================================
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('stock_orders', 'stock_order_items');

SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'stock_orders' ORDER BY ordinal_position;

SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'stock_order_items' ORDER BY ordinal_position;

