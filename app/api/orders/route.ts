import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { OrderItem } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, user_email, items, total, delivery_info } = body

    if (!user_email || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Step 1: Validate stock availability and prepare stock updates
    const stockUpdates: Array<{
      product_id: string
      variant_id?: string
      quantity: number
      previous_stock: number
    }> = []

    for (const item of items as OrderItem[]) {
      if (item.variant_id) {
        // Check variant stock
        const { data: variant, error: variantError } = await supabase
          .from('product_variants')
          .select('stock')
          .eq('id', item.variant_id)
          .single()

        if (variantError || !variant) {
          return NextResponse.json(
            { success: false, error: `Variant ${item.variant_id} not found` },
            { status: 400 }
          )
        }

        if (variant.stock < item.quantity) {
          return NextResponse.json(
            { success: false, error: `Insufficient stock for variant. Available: ${variant.stock}, Requested: ${item.quantity}` },
            { status: 400 }
          )
        }

        stockUpdates.push({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          previous_stock: variant.stock
        })
      } else {
        // Check product stock
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('stock, has_variants')
          .eq('id', item.product_id)
          .single()

        if (productError || !product) {
          return NextResponse.json(
            { success: false, error: `Product ${item.product_id} not found` },
            { status: 400 }
          )
        }

        if (product.has_variants) {
          return NextResponse.json(
            { success: false, error: `Product requires variant selection` },
            { status: 400 }
          )
        }

        if (product.stock < item.quantity) {
          return NextResponse.json(
            { success: false, error: `Insufficient stock for product. Available: ${product.stock}, Requested: ${item.quantity}` },
            { status: 400 }
          )
        }

        stockUpdates.push({
          product_id: item.product_id,
          quantity: item.quantity,
          previous_stock: product.stock
        })
      }
    }

    // Step 2: Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user_id || null,
        user_email,
        items,
        total,
        status: 'pending',
        delivery_info
      })
      .select()
      .single()

    if (orderError) {
      console.error('[Order API] Error creating order:', orderError)
      return NextResponse.json(
        { success: false, error: orderError.message },
        { status: 500 }
      )
    }

    // Step 3: Decrement stock and create stock history entries
    for (const update of stockUpdates) {
      if (update.variant_id) {
        // Update variant stock
        const newStock = update.previous_stock - update.quantity
        const { error: stockError } = await supabase
          .from('product_variants')
          .update({ stock: newStock })
          .eq('id', update.variant_id)

        if (stockError) {
          console.error('[Order API] Error updating variant stock:', stockError)
          // Continue with other updates, but log error
        }

        // Create stock history entry
        await supabase.from('stock_history').insert({
          product_id: update.product_id,
          variant_id: update.variant_id,
          change_type: 'sale',
          quantity_change: -update.quantity,
          previous_stock: update.previous_stock,
          new_stock: newStock,
          order_id: order.id,
          created_by: 'system'
        })
      } else {
        // Update product stock
        const newStock = update.previous_stock - update.quantity
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', update.product_id)

        if (stockError) {
          console.error('[Order API] Error updating product stock:', stockError)
        }

        // Create stock history entry
        await supabase.from('stock_history').insert({
          product_id: update.product_id,
          variant_id: null,
          change_type: 'sale',
          quantity_change: -update.quantity,
          previous_stock: update.previous_stock,
          new_stock: newStock,
          order_id: order.id,
          created_by: 'system'
        })
      }
    }

    // Step 4: Calculate costs and create financial transaction
    const totalCost = items.reduce((sum: number, item: OrderItem) => {
      return sum + ((item.cost || 0) * item.quantity)
    }, 0)

    // Get tax configuration
    const { data: taxConfig } = await supabase
      .from('tax_configuration')
      .select('tax_rate, tax_inclusive, import_vat_rate, corporate_tax_rate')
      .eq('is_active', true)
      .single()

    const taxRate = taxConfig?.tax_rate || 15.00
    const taxInclusive = taxConfig?.tax_inclusive || false
    const importVatRate = taxConfig?.import_vat_rate || 15.00
    const corporateTaxRate = taxConfig?.corporate_tax_rate || 27.00

    // Calculate VAT on sales
    let taxAmount = 0
    let revenueAmount = total

    if (taxInclusive) {
      // Tax is included in price
      taxAmount = total * (taxRate / (100 + taxRate))
      revenueAmount = total - taxAmount
    } else {
      // Tax is added to price
      taxAmount = total * (taxRate / 100)
      revenueAmount = total
    }

    // Calculate Import VAT (15% on cost, reclaimable - reduces effective cost)
    // Import VAT is paid on the cost of goods, but can be reclaimed
    const importVatAmount = totalCost * (importVatRate / 100)
    // Effective cost after reclaiming import VAT (cost - reclaimable VAT)
    const effectiveCost = totalCost - importVatAmount

    // Calculate profit before corporate tax
    const profitAmount = revenueAmount - effectiveCost - taxAmount

    // Calculate Corporate Income Tax (27% on profit)
    const corporateTaxAmount = profitAmount > 0 ? profitAmount * (corporateTaxRate / 100) : 0

    // Calculate net profit after corporate tax
    const netProfitAfterTax = profitAmount - corporateTaxAmount

    // Create financial transaction
    await supabase.from('financial_transactions').insert({
      order_id: order.id,
      transaction_type: 'sale',
      amount: revenueAmount,
      tax_amount: taxAmount,
      cost_amount: totalCost, // Store original cost before import VAT reclaim
      import_vat_amount: importVatAmount, // Import VAT paid (reclaimable)
      corporate_tax_amount: corporateTaxAmount,
      profit_amount: profitAmount,
      net_profit_after_tax: netProfitAfterTax,
      currency: 'ZAR'
    })

    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error: any) {
    console.error('[Order API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}

