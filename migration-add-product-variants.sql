-- Migration: Add Product Variants System
-- Run this in your Supabase SQL Editor

-- Add has_variants column to products table
ALTER TABLE products 
ADD COLUMN has_variants BOOLEAN DEFAULT false;

-- Create product_variants table
CREATE TABLE product_variants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE,
  variant_attributes JSONB NOT NULL, -- e.g., {"size": "Large", "color": "Red"}
  price DECIMAL(10,2), -- Optional: overrides product price if set
  stock INTEGER DEFAULT 0,
  image_url TEXT, -- Optional: variant-specific image
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);

-- Create updated_at trigger for product_variants
CREATE TRIGGER update_product_variants_updated_at 
BEFORE UPDATE ON product_variants 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on product_variants
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for product_variants
CREATE POLICY "Product variants are viewable by everyone" 
ON product_variants FOR SELECT USING (true);

-- Add comment to the column
COMMENT ON COLUMN products.has_variants IS 'Whether this product has variants (size, color, etc.)';
COMMENT ON COLUMN product_variants.variant_attributes IS 'JSON object containing variant attributes like {"size": "L", "color": "Red"}';
COMMENT ON COLUMN product_variants.price IS 'Optional price override for this variant. NULL means use product base price';

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'has_variants';

SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'product_variants';
