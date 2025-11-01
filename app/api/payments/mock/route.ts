import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

/**
 * Mock Payment API Route
 * Simulates successful payment processing for testing
 * This endpoint processes a mock payment and automatically marks orders as ready for delivery
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId, amount } = await request.json()

    if (!orderId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Order ID and amount are required' },
        { status: 400 }
      )
    }

    // Simulate realistic payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Update order with successful payment status
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        ready_for_delivery: true,
        ready_for_delivery_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (error) {
      console.error('Error updating order payment:', error)
      return NextResponse.json(
        { success: false, error: 'Payment processing failed' },
        { status: 500 }
      )
    }

    // Return success response with mock payment details
    return NextResponse.json({
      success: true,
      paymentId: `mock_pay_${Date.now()}`,
      transactionId: `mock_txn_${orderId}`,
      amount: amount,
      message: 'Payment successful! Order ready for delivery.'
    })
  } catch (error) {
    console.error('Mock payment error:', error)
    return NextResponse.json(
      { success: false, error: 'Payment processing failed' },
      { status: 500 }
    )
  }
}

