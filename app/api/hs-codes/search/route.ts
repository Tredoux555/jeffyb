import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// GET - Search HS codes
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20')

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        results: []
      })
    }

    const supabase = createAdminClient()

    // Search by HS code or description
    const { data, error } = await supabase
      .from('hs_codes')
      .select('*')
      .or(`hs_code.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(limit)
      .order('hs_code')

    if (error) {
      console.error('[HS Codes Search API] Error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      results: data || []
    })
  } catch (error: any) {
    console.error('[HS Codes Search API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search HS codes' },
      { status: 500 }
    )
  }
}

