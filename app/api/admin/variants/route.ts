import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_id, variants } = body

    if (!product_id || !variants || !Array.isArray(variants)) {
      return NextResponse.json(
        { success: false, error: 'Product ID and variants array required' },
        { status: 400 }
      )
    }

    console.log('[API] Creating variants for product:', product_id, 'Count:', variants.length)
    
    const supabase = createAdminClient()
    
    // Filter out temp IDs and convert to database format
    const variantsToInsert = variants.map(v => ({
      product_id,
      sku: v.sku || null,
      variant_attributes: v.variant_attributes || v.attributes || {},
      price: v.price || null,
      stock: parseInt(v.stock) || 0,
      image_url: v.image_url || null
    }))
    
    console.log('[API] Variants to insert:', JSON.stringify(variantsToInsert, null, 2))
    
    // Insert variants
    const { data, error } = await supabase
      .from('product_variants')
      .insert(variantsToInsert)
      .select()

    if (error) {
      console.error('[API] Error creating variants:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    console.log('[API] Variants created successfully:', data?.length)
    return NextResponse.json({
      success: true,
      variants: data
    })
  } catch (error) {
    console.error('[API] Variant creation failed:', error)
    return NextResponse.json(
      { success: false, error: 'Variant creation failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const product_id = searchParams.get('product_id')

    if (!product_id) {
      return NextResponse.json(
        { success: false, error: 'Product ID required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    console.log('[API] Deleting variants for product:', product_id)

    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', product_id)

    if (error) {
      console.error('[API] Error deleting variants:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    console.log('[API] Variants deleted successfully')
    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('[API] Variant deletion failed:', error)
    return NextResponse.json(
      { success: false, error: 'Variant deletion failed' },
      { status: 500 }
    )
  }
}

