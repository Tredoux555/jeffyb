# Reseller System (PartnerHub) - Implementation Plan

## Overview
A comprehensive reseller/affiliate system where individuals like "Hadeel" can have unique discount codes, promote products, and earn commissions on sales.

## Platform Name
**PartnerHub** - Modern, professional, scalable

## Key Features

### 1. Reseller Management
- Unique token generation (format: `PH-{NAME}{YEAR}` or `PH-{NUMBER}`)
- Manual approval process with email/phone verification
- Reseller dashboard at `/partner-hub`
- Commission tracking (percentage of net profit after tax)

### 2. Discount Code System
- Zero shipping cost for customers using reseller codes
- Code validation on cart/checkout pages
- "Local Seller" badge display
- Usage tracking

### 3. Cost Calculation Engine
- **Admin Tool**: `/admin/pricing-calculator`
- Calculates:
  1. Base Cost (from China)
  2. + Transport Cost (per product + per shipment allocation)
  3. + Custom Duties (lookup by category)
  4. + Import VAT (15% on cost, reclaimable)
  5. = Total Landed Cost
  6. - Import VAT Reclaimable
  7. = Effective Cost
  8. + Desired Profit Margin
  9. + Sales VAT (15%)
  10. = Final Selling Price

### 4. Commission Structure
- Percentage of net profit after all tax deductions
- Calculated automatically on order completion
- Payment schedule: Weekly or Monthly
- Tracked in `reseller_commissions` table

## Implementation Phases

### Phase 1: Database & Types ✅
- [x] Migration file created
- [x] TypeScript types defined

### Phase 2: Cost Calculator (Admin)
- [ ] Create `/admin/pricing-calculator` page
- [ ] Build cost calculation logic
- [ ] Integrate custom duty lookup
- [ ] Save cost breakdowns to database

### Phase 3: Discount Code System
- [ ] Add discount code input to cart page
- [ ] Add discount code input to checkout page
- [ ] Create API endpoint for code validation
- [ ] Apply zero shipping on valid code
- [ ] Display "Local Seller" badge

### Phase 4: Reseller Platform
- [ ] Create `/partner-hub` login page
- [ ] Build reseller dashboard
- [ ] Display unique token
- [ ] Show sales/commission stats
- [ ] Product catalog access
- [ ] Marketing materials section

### Phase 5: Admin Reseller Management
- [ ] Create `/admin/resellers` page
- [ ] Reseller registration/approval
- [ ] Email/phone verification system
- [ ] Commission management
- [ ] Performance analytics

### Phase 6: Order Integration
- [ ] Update order creation to track reseller
- [ ] Calculate commissions on order completion
- [ ] Update accounting to include reseller sales

### Phase 7: Future Features
- [ ] Reseller product purchases (wholesale)
- [ ] Social media promotion tools
- [ ] Automated commission payments

## File Structure

```
app/
├── partner-hub/              # Reseller platform
│   ├── page.tsx             # Login/Dashboard
│   ├── products/page.tsx    # Product catalog
│   └── analytics/page.tsx   # Performance metrics
├── admin/
│   ├── pricing-calculator/  # Cost calculator
│   │   └── page.tsx
│   └── resellers/           # Reseller management
│       ├── page.tsx
│       └── [id]/page.tsx
components/
├── DiscountCodeInput.tsx     # Discount code component
├── PricingCalculator.tsx    # Cost calculation tool
└── ResellerBadge.tsx        # "Local Seller" badge
lib/
├── pricing/
│   ├── calculator.ts        # Cost calculation logic
│   └── tax-calculator.ts   # Tax calculations
└── resellers/
    ├── tokens.ts           # Token generation
    └── discount.ts         # Discount code logic
app/api/
├── discount-codes/          # Code validation
├── resellers/              # Reseller CRUD
└── admin/
    ├── pricing-calculator/ # Cost calculation API
    └── resellers/          # Reseller management API
```

## Database Schema Summary

### New Tables
1. **custom_duty_rates** - Lookup table for duty rates by category
2. **resellers** - Reseller accounts and profiles
3. **discount_codes** - Discount codes linked to resellers
4. **product_cost_breakdown** - Detailed cost calculations per product
5. **reseller_commissions** - Commission tracking and payments
6. **reseller_purchases** - Future: Reseller wholesale purchases
7. **reseller_purchase_items** - Future: Items in reseller purchases

### Updated Tables
- **products** - Added: `transport_cost`, `custom_duty_rate`, `custom_duty_amount`, `category_duty_rate`
- **product_variants** - Added: `transport_cost`, `custom_duty_rate`, `custom_duty_amount`
- **orders** - Added: `discount_code`, `reseller_id`, `shipping_discount_applied`, `shipping_cost`, `is_reseller_order`

## Cost Calculation Formula

```
1. Base Cost (from China)
2. + Transport Cost Per Unit
3. + Transport Cost Per Shipment (allocated proportionally by product cost)
4. = Subtotal Before Duties
5. + Custom Duties (Subtotal × Duty Rate %)
6. = Cost Before Import VAT
7. + Import VAT (15% on Cost Before Import VAT) [Reclaimable]
8. = Total Landed Cost
9. - Import VAT Reclaimable (15% on cost)
10. = Effective Cost
11. + Desired Profit Margin (Effective Cost × Margin %)
12. = Price Before Sales VAT
13. + Sales VAT (15% on Price Before Sales VAT)
14. = Final Selling Price
```

## Commission Calculation

```
Commission = (Net Profit After Tax) × (Commission Rate %)

Where:
- Net Profit After Tax = Revenue - Effective Cost - Sales VAT - Corporate Tax (27%)
- Commission Rate = Set per reseller (e.g., 10%)
```

## Next Steps
1. ✅ Run database migration in Supabase
2. ✅ Update TypeScript types
3. Build cost calculator admin tool
4. Implement discount code system
5. Create PartnerHub platform
6. Build admin reseller management


