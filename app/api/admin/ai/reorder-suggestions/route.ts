import { NextRequest, NextResponse } from 'next/server'
import { generateReorderSuggestions } from '@/lib/ai/anthropic'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Fetch products with inventory data
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, stock, reorder_point, price, category:categories(name)')
      .eq('is_active', true)
      .order('stock', { ascending: true })

    if (productsError) {
      throw productsError
    }

    // Fetch recent order items to calculate average daily sales
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, quantity, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Calculate average daily sales per product
    const productSales: Record<string, number> = {}
    orderItems?.forEach(item => {
      if (!productSales[item.product_id]) {
        productSales[item.product_id] = 0
      }
      productSales[item.product_id] += item.quantity || 1
    })

    // Transform products for AI analysis
    const inventoryData = {
      products: products?.map(p => ({
        name: p.name,
        currentStock: p.stock || 0,
        reorderPoint: p.reorder_point || 10,
        avgDailySales: (productSales[p.id] || 0) / 30,
        price: p.price || 0,
        category: (p.category as any)?.name || 'Uncategorized'
      })) || []
    }

    const result = await generateReorderSuggestions(inventoryData)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        suggestions: result.content,
        inventorySnapshot: inventoryData.products.slice(0, 10),
        usage: result.usage
      }
    })
  } catch (error) {
    console.error('Reorder suggestions generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate reorder suggestions' },
      { status: 500 }
    )
  }
}
