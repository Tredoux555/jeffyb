import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// GET /api/admin/analytics?endpoint=best-sellers|profit-leaders|trends|categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')
    const range = searchParams.get('range') || 'month'
    
    if (endpoint === 'best-sellers') {
      return handleBestSellers(request, range)
    } else if (endpoint === 'profit-leaders') {
      return handleProfitLeaders(request, range)
    } else if (endpoint === 'trends') {
      return handleSalesTrends(request, range)
    } else if (endpoint === 'categories') {
      return handleCategoryPerformance(request, range)
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid endpoint' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('[Analytics API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

function getDateRange(range: string) {
  const now = new Date()
  let start: Date
  let end: Date = now
  
  switch (range) {
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
  
  return { start, end }
}

async function handleBestSellers(request: NextRequest, range: string) {
  const supabase = createAdminClient()
  const { start, end } = getDateRange(range)
  
  // Fetch orders in date range
  const { data: orders, error } = await supabase
    .from('orders')
    .select('items, created_at')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .in('status', ['confirmed', 'processing', 'shipped', 'delivered'])
  
  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
  
  // Aggregate by product
  const productMap = new Map<string, {
    product_id: string
    product_name: string
    category: string
    units_sold: number
    revenue: number
    profit: number
    profit_margin: number
  }>()
  
  orders?.forEach((order) => {
    if (!order.items || !Array.isArray(order.items)) return
    
    order.items.forEach((item: any) => {
      const key = item.product_id
      const existing = productMap.get(key)
      
      const itemPrice = item.price || 0
      const itemCost = item.cost || 0
      const itemQuantity = item.quantity || 0
      const itemRevenue = itemPrice * itemQuantity
      const itemCostTotal = itemCost * itemQuantity
      const itemProfit = itemRevenue - itemCostTotal
      
      if (existing) {
        existing.units_sold += itemQuantity
        existing.revenue += itemRevenue
        existing.profit += itemProfit
        existing.profit_margin = existing.revenue > 0 ? (existing.profit / existing.revenue) * 100 : 0
      } else {
        productMap.set(key, {
          product_id: item.product_id,
          product_name: item.product_name || 'Unknown',
          category: '',
          units_sold: itemQuantity,
          revenue: itemRevenue,
          profit: itemProfit,
          profit_margin: itemRevenue > 0 ? (itemProfit / itemRevenue) * 100 : 0
        })
      }
    })
  })
  
  // Fetch categories
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
  
  const bestSellers = Array.from(productMap.values())
    .sort((a, b) => b.units_sold - a.units_sold)
    .slice(0, 10)
  
  return NextResponse.json({
    success: true,
    data: bestSellers
  })
}

async function handleProfitLeaders(request: NextRequest, range: string) {
  const supabase = createAdminClient()
  const { start, end } = getDateRange(range)
  
  // Fetch orders in date range
  const { data: orders, error } = await supabase
    .from('orders')
    .select('items, created_at')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .in('status', ['confirmed', 'processing', 'shipped', 'delivered'])
  
  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
  
  // Aggregate by product (same logic as best sellers)
  const productMap = new Map<string, {
    product_id: string
    product_name: string
    category: string
    units_sold: number
    revenue: number
    profit: number
    profit_margin: number
  }>()
  
  orders?.forEach((order) => {
    if (!order.items || !Array.isArray(order.items)) return
    
    order.items.forEach((item: any) => {
      const key = item.product_id
      const existing = productMap.get(key)
      
      const itemPrice = item.price || 0
      const itemCost = item.cost || 0
      const itemQuantity = item.quantity || 0
      const itemRevenue = itemPrice * itemQuantity
      const itemCostTotal = itemCost * itemQuantity
      const itemProfit = itemRevenue - itemCostTotal
      
      if (existing) {
        existing.units_sold += itemQuantity
        existing.revenue += itemRevenue
        existing.profit += itemProfit
        existing.profit_margin = existing.revenue > 0 ? (existing.profit / existing.revenue) * 100 : 0
      } else {
        productMap.set(key, {
          product_id: item.product_id,
          product_name: item.product_name || 'Unknown',
          category: '',
          units_sold: itemQuantity,
          revenue: itemRevenue,
          profit: itemProfit,
          profit_margin: itemRevenue > 0 ? (itemProfit / itemRevenue) * 100 : 0
        })
      }
    })
  })
  
  // Fetch categories
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
  
  const profitLeaders = Array.from(productMap.values())
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10)
  
  return NextResponse.json({
    success: true,
    data: profitLeaders
  })
}

async function handleSalesTrends(request: NextRequest, range: string) {
  const supabase = createAdminClient()
  const { start, end } = getDateRange(range)
  
  // Fetch orders grouped by date
  const { data: orders, error } = await supabase
    .from('orders')
    .select('items, total, created_at')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .in('status', ['confirmed', 'processing', 'shipped', 'delivered'])
    .order('created_at', { ascending: true })
  
  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
  
  // Group by date
  const dateMap = new Map<string, {
    date: string
    revenue: number
    orders: number
    profit: number
  }>()
  
  orders?.forEach((order) => {
    const date = new Date(order.created_at).toISOString().split('T')[0]
    const existing = dateMap.get(date)
    
    const orderProfit = order.items?.reduce((sum: number, item: any) => {
      const itemPrice = item.price || 0
      const itemCost = item.cost || 0
      const itemQuantity = item.quantity || 0
      return sum + ((itemPrice - itemCost) * itemQuantity)
    }, 0) || 0
    
    if (existing) {
      existing.revenue += order.total || 0
      existing.orders += 1
      existing.profit += orderProfit
    } else {
      dateMap.set(date, {
        date,
        revenue: order.total || 0,
        orders: 1,
        profit: orderProfit
      })
    }
  })
  
  const trends = Array.from(dateMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
  
  return NextResponse.json({
    success: true,
    data: trends
  })
}

async function handleCategoryPerformance(request: NextRequest, range: string) {
  const supabase = createAdminClient()
  const { start, end } = getDateRange(range)
  
  // Fetch orders in date range
  const { data: orders, error } = await supabase
    .from('orders')
    .select('items, created_at')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .in('status', ['confirmed', 'processing', 'shipped', 'delivered'])
  
  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
  
  // Get product categories
  const productIds = new Set<string>()
  orders?.forEach((order) => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        productIds.add(item.product_id)
      })
    }
  })
  
  const { data: products } = await supabase
    .from('products')
    .select('id, category')
    .in('id', Array.from(productIds))
  
  const productCategoryMap = new Map<string, string>()
  products?.forEach((product) => {
    productCategoryMap.set(product.id, product.category)
  })
  
  // Aggregate by category
  const categoryMap = new Map<string, {
    category: string
    revenue: number
    profit: number
    units_sold: number
    profit_margin: number
  }>()
  
  orders?.forEach((order) => {
    if (!order.items || !Array.isArray(order.items)) return
    
    order.items.forEach((item: any) => {
      const category = productCategoryMap.get(item.product_id) || 'Uncategorized'
      const existing = categoryMap.get(category)
      
      const itemPrice = item.price || 0
      const itemCost = item.cost || 0
      const itemQuantity = item.quantity || 0
      const itemRevenue = itemPrice * itemQuantity
      const itemCostTotal = itemCost * itemQuantity
      const itemProfit = itemRevenue - itemCostTotal
      
      if (existing) {
        existing.units_sold += itemQuantity
        existing.revenue += itemRevenue
        existing.profit += itemProfit
        existing.profit_margin = existing.revenue > 0 ? (existing.profit / existing.revenue) * 100 : 0
      } else {
        categoryMap.set(category, {
          category,
          units_sold: itemQuantity,
          revenue: itemRevenue,
          profit: itemProfit,
          profit_margin: itemRevenue > 0 ? (itemProfit / itemRevenue) * 100 : 0
        })
      }
    })
  })
  
  const categoryPerformance = Array.from(categoryMap.values())
    .sort((a, b) => b.revenue - a.revenue)
  
  return NextResponse.json({
    success: true,
    data: categoryPerformance
  })
}

