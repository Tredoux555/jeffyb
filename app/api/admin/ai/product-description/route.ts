import { NextRequest, NextResponse } from 'next/server'
import { generateProductDescription } from '@/lib/ai/anthropic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productName, category, features, price } = body

    if (!productName || !category) {
      return NextResponse.json(
        { success: false, error: 'Product name and category are required' },
        { status: 400 }
      )
    }

    const result = await generateProductDescription(productName, category, features, price)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        description: result.content,
        usage: result.usage
      }
    })
  } catch (error) {
    console.error('Product description generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate product description' },
      { status: 500 }
    )
  }
}
