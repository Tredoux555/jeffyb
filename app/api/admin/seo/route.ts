import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, description, seo_title, meta_description } = body

    console.log('[SEO API] Received update request for product:', productId)

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }

    let supabase
    try {
      supabase = createAdminClient()
    } catch (clientError: any) {
      console.error('[SEO API] Failed to create admin client:', clientError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Server configuration error. Please check SUPABASE_SERVICE_ROLE_KEY environment variable.',
          details: clientError?.message 
        },
        { status: 500 }
      )
    }

    // Build update object - only include fields that were provided
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }
    
    if (description !== undefined) updateData.description = description
    if (seo_title !== undefined) updateData.seo_title = seo_title
    if (meta_description !== undefined) updateData.meta_description = meta_description

    console.log('[SEO API] Updating with data:', Object.keys(updateData))

    // Update the product with new SEO content
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      console.error('[SEO API] Database error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    console.log('[SEO API] Update successful for product:', productId)

    // Revalidate cached pages so changes appear immediately
    try {
      revalidatePath(`/products/${productId}`)
      revalidatePath('/products')
      revalidatePath('/') // Home page may show products
      // Revalidate category pages
      if (data?.category) {
        revalidatePath(`/products/category/${data.category}`)
      }
      console.log('[SEO API] Cache revalidated for product pages')
    } catch (revalidateError) {
      console.warn('[SEO API] Cache revalidation warning:', revalidateError)
      // Don't fail the request if revalidation has issues
    }

    return NextResponse.json({
      success: true,
      data,
      revalidated: true
    })
  } catch (error: any) {
    console.error('[SEO API] Error:', error)
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

    console.log('[SEO API Bulk] Received bulk update for', products?.length, 'products')

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { success: false, error: 'Products array is required' },
        { status: 400 }
      )
    }

    let supabase
    try {
      supabase = createAdminClient()
    } catch (clientError: any) {
      console.error('[SEO API Bulk] Failed to create admin client:', clientError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Server configuration error. Please check SUPABASE_SERVICE_ROLE_KEY environment variable.',
          details: clientError?.message 
        },
        { status: 500 }
      )
    }
    
    const results = []
    const errors = []
    const categories = new Set<string>()

    for (const product of products) {
      const { id, description, seo_title, meta_description, category } = product

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
        if (category) categories.add(category)
      }
    }

    // Revalidate all affected pages
    try {
      revalidatePath('/products')
      revalidatePath('/')
      for (const category of categories) {
        revalidatePath(`/products/category/${category}`)
      }
      for (const id of results) {
        revalidatePath(`/products/${id}`)
      }
      console.log('[SEO API Bulk] Cache revalidated for', results.length, 'products')
    } catch (revalidateError) {
      console.warn('[SEO API Bulk] Cache revalidation warning:', revalidateError)
    }

    return NextResponse.json({
      success: true,
      updated: results.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      revalidated: true
    })
  } catch (error: any) {
    console.error('[SEO API Bulk] Error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Test endpoint to verify environment variable is set correctly
// Visit: https://www.jeffy.co.za/api/admin/seo (GET request)
export async function GET() {
  try {
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKeyLength = process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    
    // Try to create admin client
    let canCreateClient = false
    let clientError = null
    try {
      const supabase = createAdminClient()
      canCreateClient = !!supabase
    } catch (error: any) {
      clientError = error.message
    }
    
    return NextResponse.json({
      success: true,
      environment: {
        hasServiceKey,
        hasUrl,
        serviceKeyLength,
        canCreateClient,
        clientError
      },
      message: canCreateClient 
        ? '✅ Environment variables are configured correctly'
        : '❌ Environment variables are missing or incorrect. Check Vercel settings.'
    })
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to check environment variables' 
      },
      { status: 500 }
    )
  }
}

