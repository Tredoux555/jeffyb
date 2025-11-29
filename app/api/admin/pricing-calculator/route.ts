import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { calculateCostBreakdown, calculateProductCostProportion } from '@/lib/pricing/calculator'

/**
 * GET /api/admin/pricing-calculator
 * - Get custom duty rates by category
 * - Get product cost breakdown if exists
 * - Get tax configuration
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const productId = searchParams.get('productId')
    const variantId = searchParams.get('variantId')
    const category = searchParams.get('category')

    const supabase = createAdminClient()

    // Get custom duty rates
    if (action === 'duty-rates') {
      const { data: dutyRates, error } = await supabase
        .from('custom_duty_rates')
        .select('*')
        .eq('is_active', true)
        .order('category')

      if (error) {
        console.error('[Pricing Calculator] Error fetching duty rates:', error)
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: dutyRates || []
      })
    }

    // Get duty rate for a specific category
    if (action === 'duty-rate' && category) {
      const { data: dutyRate, error } = await supabase
        .from('custom_duty_rates')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('[Pricing Calculator] Error fetching duty rate:', error)
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: dutyRate || { duty_rate: 0 }
      })
    }

    // Get existing cost breakdown for a product/variant
    if (action === 'breakdown' && productId) {
      let query = supabase
        .from('product_cost_breakdown')
        .select('*')
        .eq('product_id', productId)

      if (variantId) {
        query = query.eq('variant_id', variantId)
      } else {
        query = query.is('variant_id', null)
      }

      const { data: breakdown, error } = await query.single()

      if (error && error.code !== 'PGRST116') {
        console.error('[Pricing Calculator] Error fetching breakdown:', error)
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: breakdown || null
      })
    }

    // Get product details for calculator
    if (action === 'product' && productId) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (productError) {
        return NextResponse.json(
          { success: false, error: productError.message },
          { status: 500 }
        )
      }

      let variant = null
      if (variantId) {
        const { data: variantData, error: variantError } = await supabase
          .from('product_variants')
          .select('*')
          .eq('id', variantId)
          .single()

        if (!variantError) {
          variant = variantData
        }
      }

      // Get duty rate for category
      const { data: dutyRate } = await supabase
        .from('custom_duty_rates')
        .select('duty_rate')
        .eq('category', product.category)
        .eq('is_active', true)
        .single()

      return NextResponse.json({
        success: true,
        data: {
          product,
          variant,
          dutyRate: dutyRate?.duty_rate || 0
        }
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action or missing parameters' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('[Pricing Calculator] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/pricing-calculator
 * - Calculate cost breakdown
 * - Save cost breakdown to database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, productId, variantId, ...calculationInput } = body

    const supabase = createAdminClient()

    // Calculate cost breakdown
    if (action === 'calculate') {
      const {
        baseCost,
        transportCostPerUnit = 0,
        transportCostPerShipment = 0,
        customDutyRate,
        importVatRate = 15.00,
        salesVatRate = 15.00,
        corporateTaxRate = 27.00,
        desiredProfitMargin = 30.00,
        totalProductsInShipment = 1,
        productCostProportion = 1.0
      } = calculationInput

      // Validate required fields
      if (!baseCost || baseCost <= 0) {
        return NextResponse.json(
          { success: false, error: 'Base cost is required and must be greater than 0' },
          { status: 400 }
        )
      }

      if (customDutyRate === undefined || customDutyRate < 0) {
        return NextResponse.json(
          { success: false, error: 'Custom duty rate is required' },
          { status: 400 }
        )
      }

      // Calculate breakdown
      const breakdown = calculateCostBreakdown({
        baseCost: parseFloat(baseCost),
        transportCostPerUnit: parseFloat(transportCostPerUnit) || 0,
        transportCostPerShipment: parseFloat(transportCostPerShipment) || 0,
        customDutyRate: parseFloat(customDutyRate),
        importVatRate: parseFloat(importVatRate) || 15.00,
        salesVatRate: parseFloat(salesVatRate) || 15.00,
        corporateTaxRate: parseFloat(corporateTaxRate) || 27.00,
        desiredProfitMargin: parseFloat(desiredProfitMargin) || 30.00,
        totalProductsInShipment: parseInt(totalProductsInShipment) || 1,
        productCostProportion: parseFloat(productCostProportion) || 1.0
      })

      return NextResponse.json({
        success: true,
        data: breakdown
      })
    }

    // Save cost breakdown to database
    if (action === 'save' && productId) {
      const {
        baseCost,
        transportCostPerUnit,
        transportCostPerShipment,
        customDutyRate,
        customDutyAmount,
        importVatAmount,
        totalLandedCost,
        effectiveCost,
        suggestedSellingPrice,
        desiredProfitMargin,
        notes
      } = calculationInput

      // Check if breakdown already exists
      let query = supabase
        .from('product_cost_breakdown')
        .select('id')
        .eq('product_id', productId)

      if (variantId) {
        query = query.eq('variant_id', variantId)
      } else {
        query = query.is('variant_id', null)
      }

      const { data: existing } = await query.single()

      const breakdownData = {
        product_id: productId,
        variant_id: variantId || null,
        base_cost: parseFloat(baseCost),
        transport_cost_per_unit: parseFloat(transportCostPerUnit) || 0,
        transport_cost_per_shipment: parseFloat(transportCostPerShipment) || 0,
        custom_duty_rate: parseFloat(customDutyRate),
        custom_duty_amount: parseFloat(customDutyAmount),
        import_vat_amount: parseFloat(importVatAmount),
        total_landed_cost: parseFloat(totalLandedCost),
        effective_cost: parseFloat(effectiveCost),
        suggested_selling_price: suggestedSellingPrice ? parseFloat(suggestedSellingPrice) : null,
        desired_profit_margin: parseFloat(desiredProfitMargin) || 30.00,
        calculated_by: 'admin', // TODO: Get from auth
        notes: notes || null
      }

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('product_cost_breakdown')
          .update(breakdownData)
          .eq('id', existing.id)

        if (error) {
          console.error('[Pricing Calculator] Error updating breakdown:', error)
          return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
          )
        }
      } else {
        // Create new
        const { error } = await supabase
          .from('product_cost_breakdown')
          .insert(breakdownData)

        if (error) {
          console.error('[Pricing Calculator] Error creating breakdown:', error)
          return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
          )
        }
      }

      // Also update product/variant with transport cost and duty rate
      if (variantId) {
        await supabase
          .from('product_variants')
          .update({
            transport_cost: parseFloat(transportCostPerUnit) || 0,
            custom_duty_rate: parseFloat(customDutyRate),
            custom_duty_amount: parseFloat(customDutyAmount)
          })
          .eq('id', variantId)
      } else {
        await supabase
          .from('products')
          .update({
            transport_cost: parseFloat(transportCostPerUnit) || 0,
            custom_duty_rate: parseFloat(customDutyRate),
            custom_duty_amount: parseFloat(customDutyAmount),
            category_duty_rate: parseFloat(customDutyRate)
          })
          .eq('id', productId)
      }

      return NextResponse.json({
        success: true,
        message: 'Cost breakdown saved successfully'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('[Pricing Calculator] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


