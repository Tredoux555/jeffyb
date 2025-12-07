import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const inStock = searchParams.get('inStock') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    const supabase = createServerClient()

    // Build the query
    let dbQuery = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)

    // Text search - search in name and description
    // Using ilike for case-insensitive partial matching
    dbQuery = dbQuery.or(
      `name.ilike.%${query}%,description.ilike.%${query}%`
    )

    // Apply filters
    if (category) {
      dbQuery = dbQuery.eq('category', category)
    }

    if (minPrice) {
      dbQuery = dbQuery.gte('price', parseFloat(minPrice))
    }

    if (maxPrice) {
      dbQuery = dbQuery.lte('price', parseFloat(maxPrice))
    }

    if (inStock) {
      dbQuery = dbQuery.gt('stock', 0)
    }

    // Order by relevance (products with name match first, then by stock)
    // We'll do a simple ordering - name matches are usually more relevant
    dbQuery = dbQuery
      .order('stock', { ascending: false })
      .limit(limit)

    const { data, error } = await dbQuery

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json(
        { success: false, error: 'Search failed' },
        { status: 500 }
      )
    }

    // Sort results to prioritize name matches
    const sortedResults = (data || []).sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(query.toLowerCase())
      const bNameMatch = b.name.toLowerCase().includes(query.toLowerCase())
      
      if (aNameMatch && !bNameMatch) return -1
      if (!aNameMatch && bNameMatch) return 1
      
      // Then by exact match at start of name
      const aStartsWith = a.name.toLowerCase().startsWith(query.toLowerCase())
      const bStartsWith = b.name.toLowerCase().startsWith(query.toLowerCase())
      
      if (aStartsWith && !bStartsWith) return -1
      if (!aStartsWith && bStartsWith) return 1
      
      return 0
    })

    return NextResponse.json({
      success: true,
      data: sortedResults,
      meta: {
        query,
        count: sortedResults.length,
        filters: {
          category: category || null,
          minPrice: minPrice ? parseFloat(minPrice) : null,
          maxPrice: maxPrice ? parseFloat(maxPrice) : null,
          inStock
        }
      }
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST for more complex searches with body payload
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, filters = {}, page = 1, limit = 20 } = body

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: { total: 0, page, limit }
      })
    }

    const supabase = createServerClient()

    // Build the base query
    let dbQuery = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)

    // Apply filters
    if (filters.category) {
      dbQuery = dbQuery.eq('category', filters.category)
    }

    if (filters.priceRange) {
      const [min, max] = filters.priceRange
      if (min > 0) dbQuery = dbQuery.gte('price', min)
      if (max < 10000) dbQuery = dbQuery.lte('price', max)
    }

    if (filters.inStock) {
      dbQuery = dbQuery.gt('stock', 0)
    }

    // Pagination
    const offset = (page - 1) * limit
    dbQuery = dbQuery.range(offset, offset + limit - 1)

    // Execute query
    const { data, error, count } = await dbQuery

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json(
        { success: false, error: 'Search failed' },
        { status: 500 }
      )
    }

    // Add highlighting info
    const resultsWithHighlight = (data || []).map(product => ({
      ...product,
      highlight: {
        name: highlightText(product.name, query),
        description: highlightText(product.description || '', query)
      }
    }))

    return NextResponse.json({
      success: true,
      data: resultsWithHighlight,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        query,
        filters
      }
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper to add highlighting markers
function highlightText(text: string, query: string): string {
  if (!text || !query) return text
  
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi')
  return text.replace(regex, '**$1**')
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

