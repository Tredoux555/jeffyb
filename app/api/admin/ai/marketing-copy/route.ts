import { NextRequest, NextResponse } from 'next/server'
import { generateMarketingCopy } from '@/lib/ai/anthropic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, product, promotion, tone, platform } = body

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Copy type is required' },
        { status: 400 }
      )
    }

    const validTypes = ['social_post', 'email_subject', 'email_body', 'promo_banner', 'product_highlight']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const result = await generateMarketingCopy({
      type,
      product,
      promotion,
      tone: tone || 'friendly',
      platform
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        copy: result.content,
        usage: result.usage
      }
    })
  } catch (error) {
    console.error('Marketing copy generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate marketing copy' },
      { status: 500 }
    )
  }
}
