import { NextRequest, NextResponse } from 'next/server'

// Dynamic import to prevent build-time errors when Stripe is not configured
async function getStripeService() {
  // Only import if Stripe key exists
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe is not configured. STRIPE_SECRET_KEY environment variable is missing.')
  }
  const module = await import('@/lib/payments/stripe')
  return module.default
}

export async function POST(request: NextRequest) {
  try {
    const StripeService = await getStripeService()
    const body = await request.json()
    const { amount, currency, customer_email, metadata } = body

    const result = await StripeService.createPaymentIntent({
      amount,
      currency: currency || 'usd',
      customer_email,
      metadata,
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Stripe payment intent creation failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Payment processing failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const StripeService = await getStripeService()
    const { searchParams } = new URL(request.url)
    const paymentIntentId = searchParams.get('paymentIntentId')

    if (!paymentIntentId) {
      return NextResponse.json(
        { success: false, error: 'Payment intent ID required' },
        { status: 400 }
      )
    }

    const paymentIntent = await StripeService.getPaymentIntent(paymentIntentId)

    return NextResponse.json({
      success: true,
      paymentIntent,
    })
  } catch (error) {
    console.error('Failed to retrieve payment intent:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to retrieve payment intent' },
      { status: 500 }
    )
  }
}
