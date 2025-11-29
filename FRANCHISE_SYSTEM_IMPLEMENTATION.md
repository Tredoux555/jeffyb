# Franchise System Implementation

## ✅ What's Been Built

### 1. Database Migration (`migrations/migration-franchise-system.sql`)
- **Extended Locations Table**: Added franchise-specific fields (franchise_code, franchise_name, franchise_owner, etc.)
- **Franchise Stock Allocations Table**: Tracks stock allocated from shipments to franchises
- **Franchise Financials Table**: Tracks financial performance per franchise
- **Franchise Stock Transfers Table**: Tracks stock movements between locations
- **Orders Extended**: Added `franchise_location_id` (backward compatible - nullable)

### 2. Franchise Management
- **Franchise API**: CRUD operations for franchises
- **Franchise Admin Page**: `/admin/franchises` - Manage franchise locations
- **Franchise Frontend Routes**: `/franchise/[code]` - Each franchise has its own storefront

### 3. Stock Allocation System
- **Stock Allocation API**: Allocate stock from shipments to franchises
- **Stock Allocation UI**: Admin interface to allocate stock to franchises
- **Automatic Stock Updates**: When allocation is marked "received", updates `location_stock`

### 4. Franchise Frontend
- **Franchise Products Page**: `/franchise/[code]` - Shows only products with stock at that franchise
- **Franchise Product Detail**: `/franchise/[code]/products/[id]` - Product detail page for franchise
- **Location-Specific Stock**: Products show franchise-specific stock levels

### 5. Order Processing
- **Franchise-Aware Orders**: Orders include `franchise_location_id`
- **Location Stock Validation**: Franchise orders check `location_stock` instead of product stock
- **Location Stock Decrement**: Franchise orders decrement `location_stock`

### 6. Financial Tracking
- **Franchise Financials API**: Calculate and track financials per franchise
- **Franchise Financials Dashboard**: View performance across all franchises
- **Aggregate Stats**: Overall performance metrics

## 🔄 How It Works

### Stock Flow
```
1. Shipment Arrives → Admin receives shipment
2. Stock Allocation → Admin allocates stock to franchises
3. Franchise Receives → Mark allocation as "received" → Updates location_stock
4. Franchise Sells → Order decrements location_stock (not main product stock)
5. Admin Tracks → See all franchise sales and stock levels
```

### Franchise Frontend Flow
```
1. User visits /franchise/JHB → Sees Johannesburg franchise products
2. Products filtered by location_stock > 0 for that franchise
3. User adds to cart → Franchise code stored in localStorage
4. Checkout → Order includes franchise_location_id
5. Order processes → Decrements location_stock for that franchise
```

### Financial Tracking Flow
```
1. Orders Created → Linked to franchise_location_id
2. Financial Calculation → Aggregates orders by franchise
3. Period Reports → Monthly/weekly/yearly financials per franchise
4. Admin Dashboard → View all franchises or individual performance
```

## 📋 Database Tables Created

1. **franchise_stock_allocations** - Stock allocated from shipments to franchises
2. **franchise_financials** - Financial performance per franchise
3. **franchise_stock_transfers** - Stock movements between locations
4. **franchise_stock_transfer_items** - Items in stock transfers

## 🔧 API Endpoints Created

- `/api/admin/franchises` - Manage franchises
- `/api/admin/franchise-allocations` - Manage stock allocations
- `/api/admin/franchise-financials` - Financial tracking

## 🎨 Frontend Components

- `/app/admin/franchises/page.tsx` - Franchise management
- `/app/admin/accounting/components/StockAllocationSection.tsx` - Stock allocation UI
- `/app/admin/accounting/components/FranchiseFinancialsSection.tsx` - Financial dashboard
- `/app/franchise/[code]/page.tsx` - Franchise products page
- `/app/franchise/[code]/products/[id]/page.tsx` - Franchise product detail

## 🚀 How to Use

### 1. Run Database Migration
```sql
-- Run in Supabase SQL Editor
migrations/migration-franchise-system.sql
```

### 2. Create First Franchise
- Go to `/admin/franchises`
- Click "Add Franchise"
- Fill in details (name, code, owner info)
- Save

### 3. Allocate Stock to Franchise
- Go to `/admin/accounting` → Stock Allocation tab
- Select a shipment
- Click "Allocate Stock"
- Distribute quantities to franchises
- Save allocation

### 4. Mark Stock as Received
- When franchise receives stock, update allocation status to "received"
- This automatically updates `location_stock`

### 5. Franchise Sells Products
- Customers visit `/franchise/[code]`
- See only products with stock at that franchise
- Add to cart and checkout
- Order automatically linked to franchise

### 6. Track Performance
- Go to `/admin/accounting` → Franchise Financials tab
- View performance by franchise
- See revenue, profit, orders per franchise

## 🔒 Safety Features

- **Backward Compatible**: Existing orders work without franchise_id
- **Gradual Rollout**: Can enable franchises one at a time
- **Data Isolation**: Each franchise only sees their stock
- **Admin Control**: Full visibility and control from admin panel

## 📊 Key Features

✅ Scalable - Add unlimited franchises
✅ Stock Isolation - Each franchise has separate stock
✅ Financial Tracking - Per-franchise financials
✅ Stock Allocation - Allocate from shipments to franchises
✅ Franchise Storefronts - Each franchise has own URL
✅ Admin Dashboard - Track all franchises

## 🎯 Next Steps (Optional Enhancements)

1. **Franchise Login**: Separate login for franchise owners
2. **Franchise Dashboard**: Franchise-specific admin dashboard
3. **Stock Transfers**: Transfer stock between franchises
4. **Franchise Reports**: Detailed reports per franchise
5. **Multi-Location Cart**: Allow customers to shop from multiple franchises

## ⚠️ Important Notes

- **Stock Allocation**: Must allocate stock before franchise can sell
- **Location Stock**: Franchise orders use `location_stock`, not `products.stock`
- **Franchise Code**: Must be unique (used in URL)
- **Backward Compatible**: Existing system continues to work

