import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, category, stock, image_url, images, has_variants } = body

    // Validate required fields
    if (!name || !price || !category) {
      return NextResponse.json(
        { success: false, error: 'Name, price, and category are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    
    const productData = {
      name,
      description: description || null,
      price: parseFloat(price),
      category,
      stock: parseInt(stock) || 0,
      image_url: image_url || null,
      images: images || [],
      has_variants: has_variants || false
    }

    console.log('[API] Creating product with data:', JSON.stringify(productData, null, 2))
    console.log('[API] has_variants value:', has_variants, 'Type:', typeof has_variants)

    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single()

    if (error) {
      console.error('[API] Error creating product:', JSON.stringify(error, null, 2))
      console.error('[API] Full error object:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    console.log('[API] Product created successfully:', data?.id)

    return NextResponse.json({
      success: true,
      product: data
    })
  } catch (error) {
    console.error('Product creation failed:', error)
    return NextResponse.json(
      { success: false, error: 'Product creation failed' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description, price, category, stock, image_url, images, has_variants } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    
    const productData = {
      name,
      description: description || null,
      price: parseFloat(price),
      category,
      stock: parseInt(stock) || 0,
      image_url: image_url || null,
      images: images || [],
      has_variants: has_variants || false
    }

    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating product:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      product: data
    })
  } catch (error) {
    console.error('Product update failed:', error)
    return NextResponse.json(
      { success: false, error: 'Product update failed' },
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

    const supabase = createAdminClient()

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
