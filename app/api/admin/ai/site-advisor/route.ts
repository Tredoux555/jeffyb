import { NextRequest, NextResponse } from 'next/server'
import { analyzeSiteForImprovements, askSiteAdvisor } from '@/lib/ai/anthropic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, question, context, issues, feedback, goals } = body

    if (action === 'analyze') {
      // Full site analysis
      const siteData = {
        currentFeatures: [
          'Product catalog with categories (Gym, Camping, Kitchen, Beauty, etc.)',
          'Shopping cart and checkout flow',
          'User authentication and profiles',
          'Order tracking and history',
          'Delivery request system',
          'Admin dashboard with analytics',
          'Product management with image uploads',
          'Franchise management system',
          'Jeffy Wants - viral referral product requests',
          'Payment integration (Stripe, PayPal)',
          'Real-time notifications',
          'Mobile-responsive design',
          'Driver location tracking',
          'Stock management and reorder alerts'
        ],
        recentIssues: issues || [],
        userFeedback: feedback || [],
        techStack: [
          'Next.js 14+ (App Router)',
          'TypeScript',
          'Tailwind CSS',
          'Supabase (PostgreSQL, Auth, Storage)',
          'Lucide React icons',
          'Stripe & PayPal payments',
          'Google Maps API'
        ],
        businessGoals: goals || [
          'Increase conversion rate',
          'Improve mobile experience',
          'Reduce cart abandonment',
          'Enhance admin efficiency'
        ]
      }

      const result = await analyzeSiteForImprovements(siteData)

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          analysis: result.content,
          usage: result.usage
        }
      })
    } else if (action === 'ask') {
      // Single question to the advisor
      if (!question) {
        return NextResponse.json(
          { success: false, error: 'Question is required' },
          { status: 400 }
        )
      }

      const result = await askSiteAdvisor(question, context)

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          response: result.content,
          usage: result.usage
        }
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "analyze" or "ask"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Site advisor error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get site advisor response' },
      { status: 500 }
    )
  }
}
