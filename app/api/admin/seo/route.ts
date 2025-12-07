import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, description, seo_title, meta_description } = body

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Update the product with new SEO content
    const { data, error } = await supabase
      .from('products')
      .update({
        description,
        seo_title,
        meta_description,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      console.error('Error updating product SEO:', error)
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
    console.error('SEO API error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Bulk update endpoint
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { products } = body

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { success: false, error: 'Products array is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const results = []
    const errors = []

    for (const product of products) {
      const { id, description, seo_title, meta_description } = product

      const { error } = await supabase
        .from('products')
        .update({
          description,
          seo_title,
          meta_description,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        errors.push({ id, error: error.message })
      } else {
        results.push(id)
      }
    }

    return NextResponse.json({
      success: true,
      updated: results.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('Bulk SEO API error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

