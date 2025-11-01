# Mock Payment Setup Instructions

## Overview
Mock payment functionality has been implemented to automatically mark orders as "ready for delivery" after successful payment. This allows full testing of the commerce-to-delivery app integration.

---

## Database Migration Required

Before using mock payments, run the database migration:

1. **Open Supabase SQL Editor**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click "SQL Editor" → "New query"

2. **Run Migration**
   - Open file: `/Users/tredouxwillemse/Desktop/jeffyb/migration-add-payment-status.sql`
   - Copy all contents
   - Paste into Supabase SQL Editor
   - Click "Run"

3. **Verify**
   - The `payment_status` column should be added to the `orders` table
   - Default value is 'pending' for existing orders

---

## How It Works

1. **Customer Checkout**
   - Customer adds items to cart
   - Goes through checkout (Step 1: Customer Info, Step 2: Delivery, Step 3: Payment)
   - Selects "Test Payment (Mock)" option
   - Clicks "Complete Order"

2. **Order Processing**
   - Order is created in database with status 'pending'
   - Mock payment API is called automatically
   - Payment processes instantly (simulates 1.5s delay)
   - Order is updated:
     - `payment_status: 'paid'`
     - `status: 'confirmed'`
     - `ready_for_delivery: true`
     - `ready_for_delivery_at: [current timestamp]`

3. **Delivery App**
   - Order immediately appears in delivery app's "Available Deliveries"
   - Driver can accept and deliver the order
   - Full flow can be tested end-to-end

---

## Testing the Flow

### Step 1: Run Database Migration
- See "Database Migration Required" above

### Step 2: Create Order with Mock Payment
1. Go to commerce app (local or deployed)
2. Add product(s) to cart
3. Go to checkout
4. Fill in customer and delivery information
5. In Payment step, select "Test Payment (Mock)"
6. Click "Complete Order"
7. You'll be redirected to success page

### Step 3: Verify in Admin
1. Go to `/admin/orders`
2. Find the newly created order
3. Verify:
   - Status shows as "Confirmed" (or "Paid")
   - "Ready for Delivery" button is visible (or already marked)
   - Payment status shows as "Paid"

### Step 4: Check Delivery App
1. Open delivery app (local or deployed)
2. Login with driver credentials:
   - Email: `driver@jeffy.com`
   - Password: `driver123`
3. Go to Dashboard
4. Check "Available Deliveries"
5. The order should appear there immediately

### Step 5: Complete Delivery
1. In delivery app, accept the order
2. Complete delivery (scan QR code, update status)
3. Verify order status updates in commerce app admin

---

## Code Changes Made

### Files Modified:
1. **types/database.ts**
   - Added `payment_status` field to Order interface
   - Added `ready_for_delivery` and `ready_for_delivery_at` fields
   - Updated status type to include 'confirmed'

2. **app/checkout/page.tsx**
   - Added 'mock' to payment method options
   - Integrated mock payment API call
   - Updated payment method UI with 3 options

### Files Created:
1. **app/api/payments/mock/route.ts**
   - Mock payment API endpoint
   - Processes payment and updates order status

2. **migration-add-payment-status.sql**
   - Database migration SQL
   - Adds payment_status column

---

## API Endpoint

**POST** `/api/payments/mock`

**Request Body:**
```json
{
  "orderId": "uuid-of-order",
  "amount": 150.00
}
```

**Success Response:**
```json
{
  "success": true,
  "paymentId": "mock_pay_1234567890",
  "transactionId": "mock_txn_uuid",
  "amount": 150.00,
  "message": "Payment successful! Order ready for delivery."
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## UI Changes

The checkout payment step now shows 3 options:
1. **Test Payment (Mock)** - Instant processing, automatically marks ready for delivery
2. **Credit/Debit Card (Stripe)** - Requires API keys (not configured yet)
3. **PayPal** - Requires API keys (not configured yet)

Mock payment is selected by default for easy testing.

---

## Benefits

- ✅ Full end-to-end testing without real payment gateway
- ✅ Orders automatically marked ready for delivery
- ✅ Instant processing (no waiting)
- ✅ No payment gateway setup required
- ✅ Easy to switch to real payment later

---

## Switching to Real Payment

When ready for production:
1. Remove or hide mock payment option
2. Configure Stripe/PayPal API keys in `.env.local`
3. Update checkout flow to use real payment APIs
4. Mock payment code can remain for testing

---

**Note:** Mock payment is for testing only. For production, use real payment gateways (Stripe, PayPal, etc.).

