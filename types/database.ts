// Database Types
export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string | null
  stock: number
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
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  delivery_info: DeliveryInfo
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
  product_name: string
  price: number
  quantity: number
  image_url?: string
}

export interface AdminUser {
  id: string
  email: string
  password_hash: string
}
