import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// GET /api/admin/reorders
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Use the database function to get low stock items
    const { data, error } = await supabase.rpc('check_low_stock')
    
    if (error) {
      console.error('[Reorder API] Error fetching low stock:', error)
      // Fallback: manual query if function doesn't exist
      return handleManualLowStockQuery(supabase)
    }
    
    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error: any) {
    console.error('[Reorder API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/reorders/mark-ordered
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_id, variant_id } = body
    
    if (!product_id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = createAdminClient()
    
    // Create reorder request entry
    const { data: product } = await supabase
      .from('products')
      .select('name, stock, reorder_point, reorder_quantity')
      .eq('id', product_id)
      .single()
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }
    
    const reorderPoint = variant_id 
      ? (await supabase.from('product_variants').select('reorder_point, stock').eq('id', variant_id).single()).data?.reorder_point || product.reorder_point
      : product.reorder_point
    
    const currentStock = variant_id
      ? (await supabase.from('product_variants').select('stock').eq('id', variant_id).single()).data?.stock || 0
      : product.stock
    
    const suggestedQuantity = variant_id
      ? (await supabase.from('product_variants').select('reorder_quantity').eq('id', variant_id).single()).data?.reorder_quantity || product.reorder_quantity
      : product.reorder_quantity
    
    const { error: insertError } = await supabase
      .from('reorder_requests')
      .insert({
        product_id,
        variant_id: variant_id || null,
        current_stock: currentStock,
        reorder_point: reorderPoint,
        suggested_quantity: suggestedQuantity || 50,
        status: 'ordered',
        created_by: 'admin'
      })
    
    if (insertError) {
      console.error('[Reorder API] Error creating reorder request:', insertError)
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true
    })
  } catch (error: any) {
    console.error('[Reorder API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleManualLowStockQuery(supabase: any) {
  // Fallback manual query
  const { data: products } = await supabase
    .from('products')
    .select('id, name, stock, reorder_point, reorder_quantity, category')
    .eq('is_active', true)
  
  const lowStockProducts = products?.filter((p: any) => {
    const reorderPoint = p.reorder_point || 10
    return p.stock < reorderPoint && !p.has_variants
  }).map((p: any) => ({
    product_id: p.id,
    variant_id: null,
    product_name: p.name,
    variant_attributes: null,
    current_stock: p.stock,
    reorder_point: p.reorder_point || 10,
    suggested_quantity: p.reorder_quantity || 50
  })) || []
  
  const { data: variants } = await supabase
    .from('product_variants')
    .select('id, product_id, stock, reorder_point, reorder_quantity, variant_attributes, product:products(name, reorder_point, reorder_quantity)')
  
  const lowStockVariants = variants?.filter((v: any) => {
    const reorderPoint = v.reorder_point || v.product?.reorder_point || 10
    return v.stock < reorderPoint
  }).map((v: any) => ({
    product_id: v.product_id,
    variant_id: v.id,
    product_name: v.product?.name || 'Unknown',
    variant_attributes: v.variant_attributes,
    current_stock: v.stock,
    reorder_point: v.reorder_point || v.product?.reorder_point || 10,
    suggested_quantity: v.reorder_quantity || v.product?.reorder_quantity || 50
  })) || []
  
  return NextResponse.json({
    success: true,
    data: [...lowStockProducts, ...lowStockVariants]
  })
}

