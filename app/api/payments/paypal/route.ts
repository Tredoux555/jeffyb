import { NextRequest, NextResponse } from 'next/server'
import PayPalService from '@/lib/payments/paypal'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency, description, custom_id, return_url, cancel_url } = body

    const paypalService = new PayPalService()
    
    const result = await paypalService.createOrder({
      amount,
      currency: currency || 'USD',
      description,
      custom_id,
      return_url,
      cancel_url,
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        orderId: result.orderId,
        approvalUrl: result.approvalUrl,
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('PayPal order creation failed:', error)
    return NextResponse.json(
      { success: false, error: 'PayPal order creation failed' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID required' },
        { status: 400 }
      )
    }

    const paypalService = new PayPalService()
    const result = await paypalService.captureOrder(orderId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        transactionId: result.transactionId,
        amount: result.amount,
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('PayPal order capture failed:', error)
    return NextResponse.json(
      { success: false, error: 'PayPal order capture failed' },
      { status: 500 }
    )
  }
}
