-- Jeffy Commerce App Database Schema
-- This file contains the SQL commands to set up the Supabase database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, slug, icon) VALUES
('Gym', 'gym', 'Dumbbell'),
('Camping', 'camping', 'Tent'),
('Kitchen', 'kitchen', 'ChefHat'),
('Beauty', 'beauty', 'Sparkles'),
('Baby Toys', 'baby-toys', 'Baby');

-- Create products table
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image_url TEXT,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  delivery_info JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery_requests table
CREATE TABLE delivery_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK (type IN ('pickup', 'send_products')),
  shop_name VARCHAR(255),
  shop_address TEXT,
  product_description TEXT,
  products JSONB,
  sender_info JSONB,
  recipient_info JSONB,
  delivery_address TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_transit', 'delivered', 'cancelled')),
  estimated_arrival VARCHAR(255),
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_users table
CREATE TABLE admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin user (password: jeffy123)
INSERT INTO admin_users (email, password_hash) VALUES
('admin@jeffy.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_orders_user_email ON orders(user_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_delivery_requests_type ON delivery_requests(type);
CREATE INDEX idx_delivery_requests_status ON delivery_requests(status);
CREATE INDEX idx_delivery_requests_created_at ON delivery_requests(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_requests_updated_at BEFORE UPDATE ON delivery_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Set up Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Products: Public read access
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);

-- Orders: Users can only see their own orders
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Delivery requests: Public read access for now (can be restricted later)
CREATE POLICY "Delivery requests are viewable by everyone" ON delivery_requests FOR SELECT USING (true);

-- Admin users: Only accessible by authenticated admin users
CREATE POLICY "Admin users are viewable by authenticated users" ON admin_users FOR SELECT USING (auth.role() = 'authenticated');

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Create storage policies for product images
CREATE POLICY "Product images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Product images can be uploaded by authenticated users" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "Product images can be updated by authenticated users" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "Product images can be deleted by authenticated users" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Insert some sample products
INSERT INTO products (name, description, price, category, stock) VALUES
('Premium Dumbbells', 'High-quality rubber-coated dumbbells perfect for home workouts', 89.99, 'gym', 25),
('Camping Tent', 'Waterproof 4-person tent for outdoor adventures', 199.99, 'camping', 15),
('Chef Knife Set', 'Professional-grade stainless steel knife set', 149.99, 'kitchen', 30),
('Moisturizing Cream', 'Natural ingredients for healthy, glowing skin', 29.99, 'beauty', 50),
('Yoga Mat', 'Non-slip yoga mat with carrying strap', 39.99, 'gym', 40),
('Sleeping Bag', 'Warm and comfortable sleeping bag for camping', 79.99, 'camping', 20),
('Coffee Maker', 'Programmable drip coffee maker', 89.99, 'kitchen', 15),
('Face Serum', 'Anti-aging vitamin C serum', 49.99, 'beauty', 35);
