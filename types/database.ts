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
  transport_cost?: number // Transport cost per unit
  custom_duty_rate?: number // Custom duty rate percentage
  custom_duty_amount?: number // Calculated custom duty amount
  category_duty_rate?: number // Duty rate from category lookup
  // Financial/Accounting System fields
  location_id?: string | null // Which location this product belongs to
  hs_code?: string | null // HS code for customs
  hs_code_manual_override?: boolean // If true, don't auto-update HS code
  procurement_status?: string | null // 'not_requested', 'pending', 'sent_to_agent', 'ordered', 'shipped', 'received'
  procurement_link?: string | null // 1688.com link
  target_cost_rmb?: number | null // Expected cost in RMB
  procurement_priority?: string | null // 'low', 'normal', 'high', 'urgent'
  china_agent_notes?: string | null // Notes for China Agent
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
  transport_cost?: number | null // Transport cost per unit for this variant
  custom_duty_rate?: number | null // Custom duty rate percentage for this variant
  custom_duty_amount?: number | null // Calculated custom duty amount for this variant
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
  discount_code?: string | null // Reseller discount code
  reseller_id?: string | null // Reseller who generated the sale
  shipping_discount_applied?: number // Amount of shipping discount applied
  shipping_cost?: number // Actual shipping cost (for accounting)
  is_reseller_order?: boolean // Flag for reseller orders
  franchise_location_id?: string | null // Franchise location for this order
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

// Stock Orders System Types
export interface StockOrder {
  id: string
  order_number: string // PO-2024-001 format
  supplier_name: string
  supplier_email?: string | null
  supplier_phone?: string | null
  supplier_address?: string | null
  supplier_city?: string | null
  supplier_postal_code?: string | null
  supplier_country?: string | null
  
  // Shipping information
  shipping_address: string
  shipping_city: string
  shipping_postal_code: string
  shipping_country?: string | null
  shipping_contact_name?: string | null
  shipping_contact_phone?: string | null
  shipping_method?: string | null
  expected_delivery_date?: string | null
  
  // Order details
  order_date: string
  order_status: 'draft' | 'submitted' | 'confirmed' | 'in_transit' | 'received' | 'cancelled'
  notes?: string | null
  total_quantity: number
  total_cost: number
  
  // Metadata
  created_by?: string | null
  created_at: string
  updated_at: string
  
  // Relations
  items?: StockOrderItem[]
}

export interface ComingSoonSignup {
  id: string
  email: string
  name?: string | null
  created_at: string
  notified: boolean
  notification_sent_at?: string | null
}

export interface ProductRequest {
  id: string
  product_name: string
  description?: string | null
  category?: string | null
  estimated_price_range?: string | null
  quantity_needed?: number | null
  urgency: 'low' | 'normal' | 'high' | 'urgent'
  requester_name?: string | null
  requester_email?: string | null
  requester_phone?: string | null
  status: 'pending' | 'reviewing' | 'sourcing' | 'found' | 'unavailable' | 'completed'
  admin_notes?: string | null
  admin_response?: string | null
  created_at: string
  updated_at: string
  reviewed_by?: string | null
  reviewed_at?: string | null
}

export interface StockOrderItem {
  id: string
  stock_order_id: string
  product_id?: string | null
  variant_id?: string | null
  
  // Product details (stored for reference)
  product_name: string
  product_sku?: string | null
  product_description?: string | null
  
  // Variant details (if applicable)
  variant_attributes?: Record<string, string> | null
  
  // Ordering details
  quantity: number
  unit_cost: number
  line_total: number
  
  // Shipping details (for shipping calculations)
  unit_weight_kg?: number | null
  unit_length_cm?: number | null
  unit_width_cm?: number | null
  unit_height_cm?: number | null
  
  // Status
  received_quantity: number
  notes?: string | null
  
  created_at: string
  updated_at: string
  
  // Relations
  product?: Product
  variant?: ProductVariant
}

// Reseller System Types
export interface Reseller {
  id: string
  name: string
  email: string
  phone: string
  token: string // e.g., "PH-HADEEL2024"
  password_hash: string
  status: 'pending' | 'active' | 'inactive' | 'suspended'
  commission_rate: number // Percentage of net profit after tax
  email_verified: boolean
  phone_verified: boolean
  verification_code?: string | null
  verification_code_expires_at?: string | null
  approved_by?: string | null
  approved_at?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface DiscountCode {
  id: string
  reseller_id: string
  code: string // Same as reseller token
  discount_type: 'shipping' | 'percentage' | 'fixed'
  discount_value: number
  is_active: boolean
  usage_count: number
  max_uses?: number | null
  created_at: string
  updated_at: string
  reseller?: Reseller
}

export interface CustomDutyRate {
  id: string
  category: string
  product_type?: string | null
  hs_code?: string | null
  duty_rate: number // Percentage
  description?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductCostBreakdown {
  id: string
  product_id: string
  variant_id?: string | null
  
  // Cost components
  base_cost: number // Cost from China
  transport_cost_per_unit: number // Per product transport cost
  transport_cost_per_shipment: number // Overall shipment cost (allocated)
  
  // Duties and taxes
  custom_duty_rate: number // Percentage
  custom_duty_amount: number // Calculated amount
  import_vat_amount: number // 15% on (base_cost + transport + duties)
  total_landed_cost: number // Before VAT reclaim
  effective_cost: number // After reclaiming import VAT
  
  // Suggested pricing
  suggested_selling_price?: number | null
  desired_profit_margin: number // Percentage
  
  // Metadata
  calculated_at: string
  calculated_by?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  
  // Relations
  product?: Product
  variant?: ProductVariant
}

export interface ResellerCommission {
  id: string
  reseller_id: string
  order_id?: string | null
  
  // Commission calculation
  order_total: number
  order_cost: number
  order_profit_before_tax: number
  order_tax_amount: number
  order_net_profit_after_tax: number
  commission_rate: number // Percentage at time of calculation
  commission_amount: number // Calculated commission
  
  // Payment tracking
  payment_status: 'pending' | 'paid' | 'cancelled'
  payment_period?: string | null // 'weekly', 'monthly'
  paid_at?: string | null
  payment_reference?: string | null
  
  created_at: string
  updated_at: string
  
  // Relations
  reseller?: Reseller
  order?: Order
}

export interface ResellerPurchase {
  id: string
  reseller_id: string
  order_number: string // PO-RESELLER-2024-001
  
  total_quantity: number
  subtotal: number // Before discount
  discount_percentage: number // Fixed discount (e.g., 30%)
  discount_amount: number
  total_amount: number // After discount
  
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'refunded'
  
  notes?: string | null
  created_at: string
  updated_at: string
  
  // Relations
  reseller?: Reseller
  items?: ResellerPurchaseItem[]
}

export interface ResellerPurchaseItem {
  id: string
  purchase_id: string
  product_id?: string | null
  variant_id?: string | null
  
  product_name: string
  quantity: number
  retail_price: number // Retail price (reseller doesn't see cost)
  discount_percentage: number // Fixed discount
  unit_price: number // After discount
  line_total: number
  
  created_at: string
  
  // Relations
  purchase?: ResellerPurchase
  product?: Product
  variant?: ProductVariant
}

// Financial & Accounting System Types
export interface Location {
  id: string
  name: string // 'Johannesburg', 'Newcastle', 'Port Shepstone'
  code?: string | null // 'JHB', 'NCL', 'PSP'
  distributor_id?: string | null
  is_active: boolean
  address?: string | null
  city?: string | null
  postal_code?: string | null
  country: string
  notes?: string | null
  // Franchise fields
  franchise_code?: string | null
  franchise_name?: string | null
  is_franchise?: boolean
  franchise_owner_name?: string | null
  franchise_owner_email?: string | null
  franchise_owner_phone?: string | null
  franchise_start_date?: string | null
  franchise_status?: string | null
  created_at: string
  updated_at: string
  distributor?: Distributor
}

export interface HSCode {
  id: string
  hs_code: string // e.g., '0101.21', '0101.29'
  description: string // 'Pure-bred breeding animals'
  duty_rate_general: number // General duty rate percentage
  duty_rate_eu: number
  duty_rate_efta: number
  duty_rate_sadc: number
  duty_rate_mercosur: number
  duty_rate_afcfta: number
  statistical_unit?: string | null // 'u', 'kg', 't', etc.
  chapter?: string | null // '01', '02', etc.
  section?: string | null // 'I', 'II', etc.
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LocationStock {
  id: string
  location_id: string
  product_id: string
  variant_id?: string | null
  stock_quantity: number
  reorder_point?: number | null
  reorder_quantity?: number | null
  created_at: string
  updated_at: string
  location?: Location
  product?: Product
  variant?: ProductVariant
}

export interface ProcurementQueueItem {
  id: string
  product_id: string
  variant_id?: string | null
  location_id?: string | null
  
  // Auto-calculated from sales
  quantity_needed: number // Sum of all sales since last procurement
  
  // Manual override/addition by admin
  procurement_link?: string | null // 1688.com link
  images?: string[] | null // Additional images for China Agent
  description?: string | null // Additional description
  target_cost_rmb?: number | null // Expected cost
  china_agent_notes?: string | null // Notes for China Agent
  
  // Status tracking
  status: 'pending' | 'sent_to_agent' | 'ordered' | 'shipped' | 'received'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  procurement_batch_id?: string | null
  sent_to_agent_at?: string | null
  
  created_at: string
  updated_at: string
  
  // Relations
  product?: Product
  variant?: ProductVariant
  location?: Location
  batch?: ProcurementBatch
}

export interface ProcurementBatch {
  id: string
  batch_number: string // 'PROC-2024-W01', 'PROC-2024-M01'
  batch_type: 'weekly' | 'monthly'
  status: 'draft' | 'sent' | 'processing' | 'completed'
  sent_to_agent_at?: string | null
  agent_notes?: string | null
  total_items: number
  total_quantity: number
  created_at: string
  updated_at: string
  items?: ProcurementBatchItem[]
}

export interface ProcurementBatchItem {
  id: string
  batch_id: string
  queue_item_id: string
  quantity: number
  created_at: string
  batch?: ProcurementBatch
  queue_item?: ProcurementQueueItem
}

export interface Shipment {
  id: string
  shipment_reference: string // 'SHIP-2024-001'
  procurement_batch_id?: string | null
  
  // Costs
  total_cost_rmb?: number | null
  total_cost_zar?: number | null
  shipping_cost?: number | null
  insurance_cost?: number | null
  exchange_rate?: number | null
  
  // Customs
  total_import_duty?: number | null
  total_vat?: number | null
  total_landed_cost?: number | null
  
  // Status
  status: 'ordered' | 'in_transit' | 'arrived' | 'cleared' | 'received'
  ordered_at?: string | null
  shipped_at?: string | null
  arrived_at?: string | null
  cleared_at?: string | null
  received_at?: string | null
  
  // Verification
  china_agent_customs_calculation?: Record<string, any> | null
  our_customs_calculation?: Record<string, any> | null
  
  notes?: string | null
  created_at: string
  updated_at: string
  
  // Relations
  batch?: ProcurementBatch
  items?: ShipmentItem[]
}

export interface ShipmentItem {
  id: string
  shipment_id: string
  product_id: string
  variant_id?: string | null
  
  quantity: number
  
  // Costs
  unit_cost_rmb?: number | null
  unit_cost_zar?: number | null
  line_total_rmb?: number | null
  line_total_zar?: number | null
  
  // Customs
  hs_code?: string | null
  import_duty_rate?: number | null
  import_duty_amount?: number | null
  vat_amount?: number | null
  landed_cost_per_unit?: number | null
  
  // Physical attributes
  weight_kg?: number | null
  length_cm?: number | null
  width_cm?: number | null
  height_cm?: number | null
  
  created_at: string
  
  // Relations
  shipment?: Shipment
  product?: Product
  variant?: ProductVariant
  hsCode?: HSCode
}

export interface Distributor {
  id: string
  name: string
  email: string
  phone?: string | null
  location_id?: string | null
  
  // Business details
  business_name?: string | null
  tax_number?: string | null
  vat_number?: string | null
  
  // Bank details
  bank_name?: string | null
  bank_account_number?: string | null
  bank_account_type?: string | null
  branch_code?: string | null
  
  // Status
  status: 'active' | 'inactive' | 'suspended'
  contract_signed: boolean
  contract_signed_at?: string | null
  
  notes?: string | null
  created_at: string
  updated_at: string
  
  // Relations
  location?: Location
}

// Franchise System Types
export interface FranchiseStockAllocation {
  id: string
  shipment_id?: string | null
  franchise_location_id: string
  product_id: string
  variant_id?: string | null
  
  quantity_allocated: number
  quantity_received: number
  quantity_pending: number
  
  status: 'pending' | 'in_transit' | 'received' | 'partial'
  allocated_at?: string | null
  shipped_at?: string | null
  received_at?: string | null
  
  unit_cost_zar?: number | null
  total_cost_zar?: number | null
  
  notes?: string | null
  created_at: string
  updated_at: string
  
  // Relations
  shipment?: Shipment
  franchise?: Location
  product?: Product
  variant?: ProductVariant
}

export interface FranchiseFinancial {
  id: string
  franchise_location_id: string
  period_start: string
  period_end: string
  period_type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  
  total_revenue: number
  total_orders: number
  average_order_value: number
  
  total_cost: number
  total_shipping_cost: number
  total_operational_cost: number
  
  gross_profit: number
  net_profit: number
  profit_margin: number
  
  total_tax: number
  corporate_tax: number
  
  units_sold: number
  stock_turnover_rate: number
  
  calculated_at: string
  created_at: string
  updated_at: string
  
  // Relations
  franchise?: Location
}

export interface FranchiseStockTransfer {
  id: string
  transfer_reference: string
  
  from_location_id?: string | null
  to_location_id: string
  transfer_type: 'allocation' | 'transfer' | 'return' | 'adjustment'
  
  status: 'pending' | 'in_transit' | 'received' | 'cancelled'
  requested_at?: string | null
  shipped_at?: string | null
  received_at?: string | null
  
  total_items: number
  total_quantity: number
  total_value: number
  
  notes?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
  
  // Relations
  from_location?: Location
  to_location?: Location
  items?: FranchiseStockTransferItem[]
}

export interface FranchiseStockTransferItem {
  id: string
  transfer_id: string
  product_id: string
  variant_id?: string | null
  
  quantity: number
  unit_cost?: number | null
  line_total?: number | null
  
  quantity_received: number
  
  created_at: string
  
  // Relations
  transfer?: FranchiseStockTransfer
  product?: Product
  variant?: ProductVariant
}

// ============================================
// Jeffy's Free Product Program Types
// ============================================

export interface JeffyRequest {
  id: string
  
  // Request details
  request_text: string
  voice_transcript?: string | null
  image_urls?: string[] | null
  reference_links?: string[] | null
  
  // Parsed product info
  product_category?: string | null
  product_keywords?: string[] | null
  price_concern?: 'too_cheap' | 'too_expensive' | 'quality_concern' | 'cant_find' | null
  
  // Requester info
  requester_name: string
  requester_email: string
  requester_phone?: string | null
  
  // Referral tracking
  referral_code: string
  approvals_needed: number
  approvals_received: number
  
  // Status
  status: 'active' | 'completed' | 'fulfilled' | 'product_added' | 'cancelled'
  
  // Product matching
  matched_product_id?: string | null
  matched_product_name?: string | null
  
  // Fulfillment
  is_free_product_earned: boolean
  free_product_shipped: boolean
  shipping_address?: {
    name: string
    address: string
    city: string
    postal_code: string
    phone: string
  } | null
  shipping_tracking?: string | null
  
  // Analytics
  total_link_clicks: number
  unique_visitors: number
  
  // Admin
  admin_notes?: string | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
  
  created_at: string
  updated_at: string
  completed_at?: string | null
  fulfilled_at?: string | null
  
  // Relations
  approvals?: JeffyApproval[]
  matched_product?: Product
}

export interface JeffyApproval {
  id: string
  request_id: string
  
  // Approver info
  approver_name?: string | null
  approver_email: string
  approver_phone?: string | null
  
  // Response
  approval_type: 'good_idea' | 'want_it_too' | 'already_have'
  comment?: string | null
  wants_updates: boolean
  wants_own_link: boolean
  
  // Tracking
  ip_address?: string | null
  user_agent?: string | null
  referral_source?: 'whatsapp' | 'facebook' | 'instagram' | 'tiktok' | 'email' | 'direct' | 'other' | null
  
  created_at: string
  
  // Relations
  request?: JeffyRequest
}

export interface JeffyLinkClick {
  id: string
  request_id: string
  
  ip_address?: string | null
  user_agent?: string | null
  referrer?: string | null
  referral_source?: string | null
  
  created_at: string
}
