import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// GET /api/admin/accounting?endpoint=dashboard|products-profit|tax-config
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint') || 'dashboard'
    
    // Route to appropriate handler based on endpoint query param
    if (endpoint === 'dashboard') {
      return handleDashboard(request)
    } else if (endpoint === 'products-profit') {
      return handleProductsProfit(request)
    } else if (endpoint === 'tax-config') {
      return handleGetTaxConfig(request)
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid endpoint. Use ?endpoint=dashboard|products-profit|tax-config' },
      { status: 404 }
    )
  } catch (error: any) {
    console.error('[Accounting API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/accounting?endpoint=tax-config
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')
    
    if (endpoint === 'tax-config') {
      return handleUpdateTaxConfig(request)
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid endpoint. Use ?endpoint=tax-config' },
      { status: 404 }
    )
  } catch (error: any) {
    console.error('[Accounting API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleDashboard(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || 'month'
  const startDate = searchParams.get('start') || ''
  const endDate = searchParams.get('end') || ''
  
  const supabase = createAdminClient()
  
  // Calculate date range
  const now = new Date()
  let start: Date
  let end: Date = now
  
  switch (range) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'year':
      start = new Date(now.getFullYear(), 0, 1)
      break
    case 'all':
    default:
      start = new Date(0) // Beginning of time
      break
  }
  
  if (startDate && endDate) {
    start = new Date(startDate)
    end = new Date(endDate)
  }
  
  // Fetch financial transactions
  let query = supabase
    .from('financial_transactions')
    .select('*')
    .eq('transaction_type', 'sale')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
  
  const { data: transactions, error } = await query
  
  if (error) {
    console.error('[Accounting API] Error fetching transactions:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
  
  // Calculate stats
  const totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
  const totalCosts = transactions?.reduce((sum, t) => sum + (t.cost_amount || 0), 0) || 0
  const totalTax = transactions?.reduce((sum, t) => sum + (t.tax_amount || 0), 0) || 0
  const totalImportVat = transactions?.reduce((sum, t) => sum + (t.import_vat_amount || 0), 0) || 0
  const totalCorporateTax = transactions?.reduce((sum, t) => sum + (t.corporate_tax_amount || 0), 0) || 0
  const totalProfit = transactions?.reduce((sum, t) => sum + (t.profit_amount || 0), 0) || 0
  const totalNetProfitAfterTax = transactions?.reduce((sum, t) => sum + (t.net_profit_after_tax || 0), 0) || 0
  
  // Effective cost after reclaiming import VAT
  const effectiveCosts = totalCosts - totalImportVat
  
  // Profit margin based on net profit after tax
  const profitMargin = totalRevenue > 0 ? (totalNetProfitAfterTax / totalRevenue) * 100 : 0
  
  return NextResponse.json({
    success: true,
    data: {
      totalRevenue,
      totalCosts,
      effectiveCosts, // Cost after reclaiming import VAT
      netProfit: totalNetProfitAfterTax, // Net profit after corporate tax
      profitBeforeTax: totalProfit, // Profit before corporate tax
      taxOwed: totalTax, // VAT on sales
      importVatPaid: totalImportVat, // Import VAT paid (reclaimable)
      importVatReclaimable: totalImportVat, // Same as paid (fully reclaimable)
      corporateTaxOwed: totalCorporateTax, // Corporate income tax
      profitMargin
    }
  })
}

async function handleProductsProfit(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || 'month'
  const startDate = searchParams.get('start') || ''
  const endDate = searchParams.get('end') || ''
  
  const supabase = createAdminClient()
  
  // Calculate date range
  const now = new Date()
  let start: Date
  let end: Date = now
  
  switch (range) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'year':
      start = new Date(now.getFullYear(), 0, 1)
      break
    case 'all':
    default:
      start = new Date(0)
      break
  }
  
  if (startDate && endDate) {
    start = new Date(startDate)
    end = new Date(endDate)
  }
  
  // Fetch orders in date range
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('items, total, created_at')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .in('status', ['confirmed', 'processing', 'shipped', 'delivered'])
  
  if (ordersError) {
    console.error('[Accounting API] Error fetching orders:', ordersError)
    return NextResponse.json(
      { success: false, error: ordersError.message },
      { status: 500 }
    )
  }
  
  // Aggregate product data
  const productMap = new Map<string, {
    product_id: string
    product_name: string
    category: string
    selling_price: number
    cost: number
    units_sold: number
    revenue: number
    total_cost: number
  }>()
  
  orders?.forEach((order) => {
    if (!order.items || !Array.isArray(order.items)) return
    
    order.items.forEach((item: any) => {
      const key = item.product_id
      const existing = productMap.get(key)
      
      const itemCost = item.cost || 0
      const itemPrice = item.price || 0
      const itemQuantity = item.quantity || 0
      
      if (existing) {
        existing.units_sold += itemQuantity
        existing.revenue += itemPrice * itemQuantity
        existing.total_cost += itemCost * itemQuantity
        // Update average selling price and cost
        existing.selling_price = existing.revenue / existing.units_sold
        existing.cost = existing.total_cost / existing.units_sold
      } else {
        productMap.set(key, {
          product_id: item.product_id,
          product_name: item.product_name || 'Unknown',
          category: '', // Will fetch from products table
          selling_price: itemPrice,
          cost: itemCost,
          units_sold: itemQuantity,
          revenue: itemPrice * itemQuantity,
          total_cost: itemCost * itemQuantity
        })
      }
    })
  })
  
  // Fetch product categories
  const productIds = Array.from(productMap.keys())
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, category')
      .in('id', productIds)
    
    products?.forEach((product) => {
      const productData = productMap.get(product.id)
      if (productData) {
        productData.category = product.category
      }
    })
  }
  
  // Calculate profit and margin for each product
  const productsProfit = Array.from(productMap.values()).map((product) => ({
    ...product,
    profit: product.revenue - product.total_cost,
    profit_margin: product.revenue > 0 ? ((product.revenue - product.total_cost) / product.revenue) * 100 : 0
  })).sort((a, b) => b.profit - a.profit) // Sort by profit descending
  
  return NextResponse.json({
    success: true,
    data: productsProfit
  })
}

async function handleGetTaxConfig(request: NextRequest) {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('tax_configuration')
    .select('*')
    .eq('is_active', true)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    console.error('[Accounting API] Error fetching tax config:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
  
  return NextResponse.json({
    success: true,
    data: data || {
      tax_rate: 15.00,
      import_vat_rate: 15.00,
      corporate_tax_rate: 27.00,
      tax_inclusive: false
    }
  })
}

async function handleUpdateTaxConfig(request: NextRequest) {
  const body = await request.json()
  const { tax_rate, import_vat_rate, corporate_tax_rate, tax_inclusive } = body
  
  if (tax_rate === undefined) {
    return NextResponse.json(
      { success: false, error: 'Tax rate is required' },
      { status: 400 }
    )
  }
  
  const supabase = createAdminClient()
  
  // Get existing active config
  const { data: existing } = await supabase
    .from('tax_configuration')
    .select('id')
    .eq('is_active', true)
    .single()
  
  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('tax_configuration')
      .update({
        tax_rate: parseFloat(tax_rate),
        import_vat_rate: import_vat_rate !== undefined ? parseFloat(import_vat_rate) : 15.00,
        corporate_tax_rate: corporate_tax_rate !== undefined ? parseFloat(corporate_tax_rate) : 27.00,
        tax_inclusive: tax_inclusive || false,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
    
    if (error) {
      console.error('[Accounting API] Error updating tax config:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
  } else {
    // Create new
    const { error } = await supabase
      .from('tax_configuration')
      .insert({
        tax_rate: parseFloat(tax_rate),
        import_vat_rate: import_vat_rate !== undefined ? parseFloat(import_vat_rate) : 15.00,
        corporate_tax_rate: corporate_tax_rate !== undefined ? parseFloat(corporate_tax_rate) : 27.00,
        tax_inclusive: tax_inclusive || false,
        is_active: true,
        applies_to_all: true
      })
    
    if (error) {
      console.error('[Accounting API] Error creating tax config:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
  }
  
  return NextResponse.json({
    success: true
  })
}

