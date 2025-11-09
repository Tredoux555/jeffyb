import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, category, stock, image_url, images, video_url, video_file_url, has_variants, is_active, cost, reorder_point, reorder_quantity } = body

    // Validate required fields
    if (!name || !price || !category) {
      return NextResponse.json(
        { success: false, error: 'Name, price, and category are required' },
        { status: 400 }
      )
    }

    let supabase
    try {
      supabase = createAdminClient()
    } catch (error: any) {
      console.error('[API] Failed to create admin client:', error.message)
      return NextResponse.json(
        { success: false, error: `Configuration error: ${error.message}` },
        { status: 500 }
      )
    }
    
    const productData = {
      name,
      description: description || null,
      price: parseFloat(price),
      category,
      stock: parseInt(stock) || 0,
      image_url: image_url || null,
      images: images || [],
      video_url: video_url || null,
      video_file_url: video_file_url || null,
      has_variants: has_variants || false,
      is_active: is_active !== undefined ? is_active : true,
      cost: cost !== undefined ? parseFloat(cost) : 0,
      reorder_point: reorder_point !== undefined ? parseInt(reorder_point) : 10,
      reorder_quantity: reorder_quantity !== undefined ? parseInt(reorder_quantity) : 50
    }

    console.log('[API] Creating product with data:', JSON.stringify(productData, null, 2))
    console.log('[API] has_variants value:', has_variants, 'Type:', typeof has_variants)

    let data, error
    try {
      const result = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()
      data = result.data
      error = result.error
    } catch (supabaseError: any) {
      console.error('[API] Supabase operation failed:', supabaseError)
      console.error('[API] Error type:', typeof supabaseError)
      console.error('[API] Error message:', supabaseError?.message)
      console.error('[API] Error stack:', supabaseError?.stack)
      return NextResponse.json(
        { 
          success: false, 
          error: `Database operation failed: ${supabaseError?.message || 'Unknown error'}` 
        },
        { status: 500 }
      )
    }

    if (error) {
      console.error('[API] Error creating product:', JSON.stringify(error, null, 2))
      console.error('[API] Full error object:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to create product' },
        { status: 500 }
      )
    }

    console.log('[API] Product created successfully:', data?.id)

    return NextResponse.json({
      success: true,
      product: data
    })
  } catch (error: any) {
    console.error('[API] Product creation failed with exception:', error)
    console.error('[API] Error type:', typeof error)
    console.error('[API] Error message:', error?.message)
    console.error('[API] Error stack:', error?.stack)
    console.error('[API] Error name:', error?.name)
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Product creation failed',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description, price, category, stock, image_url, images, video_url, video_file_url, has_variants, is_active, cost, reorder_point, reorder_quantity } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }

    let supabase
    try {
      supabase = createAdminClient()
    } catch (error: any) {
      console.error('[API] Failed to create admin client:', error.message)
      return NextResponse.json(
        { success: false, error: `Configuration error: ${error.message}` },
        { status: 500 }
      )
    }
    
    // Build productData object, only including fields that are provided
    const productData: any = {}
    if (name !== undefined) productData.name = name
    if (description !== undefined) productData.description = description || null
    if (price !== undefined) productData.price = parseFloat(price)
    if (category !== undefined) productData.category = category
    if (stock !== undefined) productData.stock = parseInt(stock) || 0
    if (image_url !== undefined) productData.image_url = image_url || null
    if (images !== undefined) productData.images = images || []
    if (video_url !== undefined) productData.video_url = video_url || null
    if (video_file_url !== undefined) productData.video_file_url = video_file_url || null
    if (has_variants !== undefined) productData.has_variants = has_variants || false
    if (is_active !== undefined) productData.is_active = is_active
    if (cost !== undefined) productData.cost = parseFloat(cost) || 0
    if (reorder_point !== undefined) productData.reorder_point = parseInt(reorder_point) || 10
    if (reorder_quantity !== undefined) productData.reorder_quantity = parseInt(reorder_quantity) || 50

    let data, error
    try {
      const result = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single()
      data = result.data
      error = result.error
    } catch (supabaseError: any) {
      console.error('[API] Supabase update operation failed:', supabaseError)
      console.error('[API] Error type:', typeof supabaseError)
      console.error('[API] Error message:', supabaseError?.message)
      console.error('[API] Error stack:', supabaseError?.stack)
      return NextResponse.json(
        { 
          success: false, 
          error: `Database operation failed: ${supabaseError?.message || 'Unknown error'}` 
        },
        { status: 500 }
      )
    }

    if (error) {
      console.error('[API] Error updating product:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to update product' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      product: data
    })
  } catch (error: any) {
    console.error('[API] Product update failed with exception:', error)
    console.error('[API] Error type:', typeof error)
    console.error('[API] Error message:', error?.message)
    console.error('[API] Error stack:', error?.stack)
    console.error('[API] Error name:', error?.name)
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Product update failed',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }

    let supabase
    try {
      supabase = createAdminClient()
    } catch (error: any) {
      console.error('[API] Failed to create admin client:', error.message)
      return NextResponse.json(
        { success: false, error: `Configuration error: ${error.message}` },
        { status: 500 }
      )
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting product:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Product deletion failed:', error)
    return NextResponse.json(
      { success: false, error: 'Product deletion failed' },
      { status: 500 }
    )
  }
}
