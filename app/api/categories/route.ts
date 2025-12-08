import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  try {
    // Use admin client which works reliably in Vercel API routes
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, image_url, is_active')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('[Categories API] Error fetching categories:', error)
      // Return empty array instead of error to prevent site breakage
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error: any) {
    console.error('[Categories API] Exception:', error?.message)
    // Return empty array to prevent site breakage
    return NextResponse.json({
      success: true,
      data: []
    })
  }
}

