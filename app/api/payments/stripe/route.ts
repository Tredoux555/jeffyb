import { NextRequest, NextResponse } from 'next/server'
import StripeService from '@/lib/payments/stripe'

export async function POST(request: NextRequest) {
  try {
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
      { success: false, error: 'Payment processing failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
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
      { success: false, error: 'Failed to retrieve payment intent' },
      { status: 500 }
    )
  }
}
