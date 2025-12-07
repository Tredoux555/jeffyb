import { NextRequest, NextResponse } from 'next/server'
import { generateAnalyticsSummary } from '@/lib/ai/anthropic'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Fetch real analytics data from Supabase
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Get orders from last 30 days
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('*, items:order_items(*, product:products(name, category_id))')
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Get orders from 30-60 days ago for comparison
    const { data: previousOrders } = await supabase
      .from('orders')
      .select('total')
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString())

    // Calculate totals
    const totalRevenue = recentOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
    const totalOrders = recentOrders?.length || 0
    const previousRevenue = previousOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
    const previousOrderCount = previousOrders?.length || 0

    // Calculate trends
    const revenueChange = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0
    const ordersChange = previousOrderCount > 0 
      ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100 
      : 0

    // Get top products
    const productSales: Record<string, { name: string; sales: number; revenue: number }> = {}
    recentOrders?.forEach(order => {
      order.items?.forEach((item: any) => {
        const productName = item.product?.name || item.product_name || 'Unknown Product'
        if (!productSales[productName]) {
          productSales[productName] = { name: productName, sales: 0, revenue: 0 }
        }
        productSales[productName].sales += item.quantity || 1
        productSales[productName].revenue += (item.price || 0) * (item.quantity || 1)
      })
    })

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Get low stock count
    const { data: lowStockProducts } = await supabase
      .from('products')
      .select('id, stock, reorder_point')
      .eq('is_active', true)

    const lowStockCount = lowStockProducts?.filter(p => {
      const reorderPoint = p.reorder_point || 10
      return p.stock < reorderPoint
    }).length || 0

    // Get pending orders count
    const { count: pendingOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Get category breakdown
    const { data: categories } = await supabase.from('categories').select('id, name')
    const categoryMap = new Map(categories?.map(c => [c.id, c.name]) || [])

    const categoryBreakdown: Record<string, { category: string; revenue: number; count: number }> = {}
    recentOrders?.forEach(order => {
      order.items?.forEach((item: any) => {
        const categoryId = item.product?.category_id
        const categoryName = categoryId ? (categoryMap.get(categoryId) || 'Other') : 'Other'
        if (!categoryBreakdown[categoryName]) {
          categoryBreakdown[categoryName] = { category: categoryName, revenue: 0, count: 0 }
        }
        categoryBreakdown[categoryName].revenue += (item.price || 0) * (item.quantity || 1)
        categoryBreakdown[categoryName].count += 1
      })
    })

    const analyticsData = {
      totalRevenue,
      totalOrders,
      topProducts,
      recentTrends: {
        revenueChange,
        ordersChange
      },
      lowStockCount,
      pendingOrders: pendingOrders || 0,
      categoryBreakdown: Object.values(categoryBreakdown).sort((a, b) => b.revenue - a.revenue)
    }

    const result = await generateAnalyticsSummary(analyticsData)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: result.content,
        rawData: analyticsData,
        usage: result.usage
      }
    })
  } catch (error) {
    console.error('Analytics summary generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate analytics summary' },
      { status: 500 }
    )
  }
}
