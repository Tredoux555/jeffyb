import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// GET - Fetch franchise financials
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const franchiseId = searchParams.get('franchise_id')
    const periodType = searchParams.get('period_type') || 'monthly'
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    const supabase = createAdminClient()

    let query = supabase
      .from('franchise_financials')
      .select(`
        *,
        franchise:locations(*)
      `)
      .order('period_start', { ascending: false })

    if (franchiseId) {
      query = query.eq('franchise_location_id', franchiseId)
    }

    if (periodType) {
      query = query.eq('period_type', periodType)
    }

    if (startDate) {
      query = query.gte('period_start', startDate)
    }

    if (endDate) {
      query = query.lte('period_end', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Franchise Financials API] Error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error: any) {
    console.error('[Franchise Financials API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch franchise financials' },
      { status: 500 }
    )
  }
}

// POST - Calculate and create franchise financial record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      franchise_location_id,
      period_start,
      period_end,
      period_type = 'monthly'
    } = body

    if (!franchise_location_id || !period_start || !period_end) {
      return NextResponse.json(
        { success: false, error: 'Franchise ID, period start, and period end are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Fetch orders for this franchise in the period
    const { data: orders } = await supabase
      .from('orders')
      .select('*, items')
      .eq('franchise_location_id', franchise_location_id)
      .gte('created_at', period_start)
      .lte('created_at', period_end)
      .in('status', ['confirmed', 'processing', 'shipped', 'delivered'])

    // Calculate metrics
    let totalRevenue = 0
    let totalCost = 0
    let totalShippingCost = 0
    let totalTax = 0
    let totalOrders = orders?.length || 0
    let unitsSold = 0

    orders?.forEach((order: any) => {
      totalRevenue += order.total || 0
      totalShippingCost += order.shipping_cost || 0

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          unitsSold += item.quantity || 0
          totalCost += (item.cost || 0) * (item.quantity || 0)
        })
      }
    })

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const grossProfit = totalRevenue - totalCost
    const netProfit = grossProfit - totalShippingCost // Simplified - operational costs can be added
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // Get financial transaction data for tax
    const { data: transactions } = await supabase
      .from('financial_transactions')
      .select('tax_amount, corporate_tax_amount')
      .eq('reference_type', 'order')
      .in('reference_id', orders?.map((o: any) => o.id) || [])

    const totalTaxAmount = transactions?.reduce((sum: number, t: any) => sum + (t.tax_amount || 0), 0) || 0
    const corporateTaxAmount = transactions?.reduce((sum: number, t: any) => sum + (t.corporate_tax_amount || 0), 0) || 0

    // Create or update financial record
    const { data, error } = await supabase
      .from('franchise_financials')
      .upsert({
        franchise_location_id,
        period_start,
        period_end,
        period_type,
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        average_order_value: averageOrderValue,
        total_cost: totalCost,
        total_shipping_cost: totalShippingCost,
        total_operational_cost: 0, // Can be updated manually
        gross_profit: grossProfit,
        net_profit: netProfit,
        profit_margin: profitMargin,
        total_tax: totalTaxAmount,
        corporate_tax: corporateTaxAmount,
        units_sold: unitsSold,
        stock_turnover_rate: 0, // Can be calculated separately
        calculated_at: new Date().toISOString()
      }, {
        onConflict: 'franchise_location_id,period_start,period_end,period_type'
      })
      .select()
      .single()

    if (error) {
      console.error('[Franchise Financials API] Error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('[Franchise Financials API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to calculate franchise financials' },
      { status: 500 }
    )
  }
}

