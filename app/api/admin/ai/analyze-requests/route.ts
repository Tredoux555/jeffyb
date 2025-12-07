import { NextRequest, NextResponse } from 'next/server'
import { analyzeProductRequests } from '@/lib/ai/anthropic'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Fetch Jeffy Wants requests
    const { data: requests, error: requestsError } = await supabase
      .from('jeffy_wants')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (requestsError) {
      console.error('Error fetching requests:', requestsError)
      // If table doesn't exist, return empty analysis
      if (requestsError.code === '42P01') {
        return NextResponse.json({
          success: true,
          data: {
            analysis: '📭 **No product requests table found.**\n\nThe "jeffy_wants" table hasn\'t been set up yet. Once customers start submitting product requests through the "Jeffy Wants" feature, you\'ll see AI analysis here.',
            requestCount: 0,
            usage: { input_tokens: 0, output_tokens: 0 }
          }
        })
      }
      throw requestsError
    }

    // Transform for analysis
    const requestsForAnalysis = requests?.map(r => ({
      request_text: r.request_text || '',
      requester_name: r.requester_name || 'Anonymous',
      created_at: r.created_at,
      status: r.status || 'pending',
      referral_count: r.referral_count || 0
    })) || []

    const result = await analyzeProductRequests(requestsForAnalysis)

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
        requestCount: requests?.length || 0,
        usage: result.usage
      }
    })
  } catch (error) {
    console.error('Product request analysis error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to analyze product requests' },
      { status: 500 }
    )
  }
}
