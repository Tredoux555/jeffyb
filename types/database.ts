// Database Types
export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string | null
  images: string[] // Array of image URLs
  video_url: string | null // URL to external video (YouTube, Vimeo, etc.)
  video_file_url: string | null // URL to uploaded video file in storage
  stock: number
  has_variants: boolean
  is_active: boolean // Whether the product is visible to customers
  cost?: number // Cost per unit for profit calculation
  reorder_point?: number // Stock level that triggers reorder alert
  reorder_quantity?: number // Default quantity to reorder when stock is low
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
  cost?: number | null // Cost per unit for this variant (overrides product cost if set)
  reorder_point?: number | null // Stock level that triggers reorder (inherits from product if null)
  reorder_quantity?: number | null // Quantity to reorder (inherits from product if null)
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  is_active: boolean // Whether the category is visible to customers
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  user_id?: string | null // New field for authenticated users (nullable for backward compatibility)
  user_email: string // Maintained for guest checkout and backward compatibility
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
  variant_id?: string // Variant ID if product has variants
  quantity: number
  price: number
  cost?: number // Cost at time of sale for profit calculation
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

// User Profile Types
export interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface SavedAddress {
  id: string
  user_id: string
  label: string
  address: string
  city: string | null
  postal_code: string | null
  country: string
  latitude: number | null
  longitude: number | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface SavedPaymentMethod {
  id: string
  user_id: string
  type: 'card' | 'paypal' | 'other'
  last4: string | null
  brand: string | null
  expiry_month: number | null
  expiry_year: number | null
  is_default: boolean
  stripe_payment_method_id: string | null
  created_at: string
  updated_at: string
}

export interface Favorite {
  id: string
  user_id: string
  product_id: string
  created_at: string
  product?: Product // Joined product data
}

export interface UserCart {
  id: string
  user_id: string
  items: CartItem[]
  updated_at: string
}

export interface OrderNotification {
  id: string
  user_id: string
  order_id: string
  type: 'status_update' | 'driver_assigned' | 'delivered' | 'payment_received' | 'other'
  message: string
  read: boolean
  created_at: string
  order?: Order // Joined order data
}

// Driver and Delivery Types (for admin driver location tracking)
export interface Driver {
  id: string
  name: string
  email: string
  phone: string
  password_hash: string
  vehicle_type?: string
  license_number?: string
  status: 'active' | 'inactive' | 'busy'
  current_location?: { lat: number; lng: number }
  last_location_update?: string
  created_at: string
  updated_at: string
}

export interface DeliveryAssignment {
  id: string
  order_id: string
  driver_id: string
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'cancelled'
  assigned_at: string
  picked_up_at?: string
  delivered_at?: string
  delivery_notes?: string
  delivery_photo_url?: string
  customer_signature_url?: string
  created_at: string
  updated_at: string
  order?: Order
  driver?: Driver
}

export interface DeliveryStatusUpdate {
  id: string
  assignment_id: string
  status: string
  location?: { lat: number; lng: number }
  notes?: string
  updated_by: 'driver' | 'admin' | 'system'
  created_at: string
}

export interface DriverLocationHistory {
  id: string
  driver_id: string
  location: { lat: number; lng: number }
  created_at: string
}

// Commerce Management System Types
export interface StockHistory {
  id: string
  product_id: string
  variant_id: string | null
  change_type: 'sale' | 'purchase' | 'adjustment' | 'return' | 'reorder'
  quantity_change: number // Positive for increases, negative for decreases
  previous_stock: number
  new_stock: number
  reason: string | null
  order_id: string | null
  created_at: string
  created_by: string | null
}

export interface FinancialTransaction {
  id: string
  order_id: string | null
  transaction_type: 'sale' | 'refund' | 'adjustment'
  amount: number // Total transaction amount (revenue)
  tax_amount: number
  cost_amount: number // Total cost of goods sold
  import_vat_amount: number // Import VAT (15% on cost, reclaimable)
  corporate_tax_amount: number // Corporate income tax (27% on profit)
  profit_amount: number // Profit before corporate tax (amount - cost_amount - tax_amount)
  net_profit_after_tax: number // Net profit after corporate tax
  currency: string
  created_at: string
}

export interface TaxConfiguration {
  id: string
  tax_name: string
  tax_rate: number // e.g., 15.00 for 15%
  import_vat_rate: number // Import VAT rate (on cost)
  corporate_tax_rate: number // Corporate income tax rate (on profit)
  is_active: boolean
  applies_to_all: boolean
  tax_inclusive: boolean // Whether prices include tax
  created_at: string
  updated_at: string
}

export interface ReorderRequest {
  id: string
  product_id: string
  variant_id: string | null
  current_stock: number
  reorder_point: number
  suggested_quantity: number
  status: 'pending' | 'ordered' | 'received' | 'cancelled'
  notes: string | null
  created_at: string
  fulfilled_at: string | null
  created_by: string | null
  product?: Product
  variant?: ProductVariant
}
