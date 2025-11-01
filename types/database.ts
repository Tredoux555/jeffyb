// Database Types
export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string | null
  images: string[] // Array of image URLs
  stock: number
  has_variants: boolean
  variants?: ProductVariant[] // Loaded when needed
  created_at: string
  updated_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  sku: string | null
  variant_attributes: Record<string, string> // e.g., {size: "L", color: "Red"}
  price: number | null // null means use product base price
  stock: number
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string
}

export interface Order {
  id: string
  user_email: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
  delivery_info: DeliveryInfo
  qr_code?: string // QR code data URL for order tracking
  ready_for_delivery?: boolean
  ready_for_delivery_at?: string
  created_at: string
}

export interface OrderItem {
  product_id: string
  product_name: string
  quantity: number
  price: number
}

export interface DeliveryInfo {
  name: string
  phone: string
  address: string
  city: string
  postal_code: string
  // Optional coordinates for precise location
  latitude?: number
  longitude?: number
}

export interface DeliveryRequest {
  id: string
  type: 'pickup' | 'send_products'
  shop_name?: string
  shop_address?: string
  product_description?: string
  products?: OrderItem[]
  sender_info?: {
    name: string
    phone: string
    address: string
  }
  recipient_info?: {
    name: string
    phone: string
    address: string
  }
  delivery_address: string
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled'
  estimated_arrival?: string
  special_instructions?: string
  created_at: string
}

export interface CartItem {
  product_id: string
  variant_id?: string // Optional: if product has variants
  product_name: string
  variant_display?: string // e.g., "Size: L, Color: Red"
  price: number
  quantity: number
  image_url?: string
}

export interface AdminUser {
  id: string
  email: string
  password_hash: string
}
