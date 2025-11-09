import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { notifyPaymentReceived, notifyOrderStatusChange } from '@/lib/notifications'

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

    // Get order before update to get user_id and old status
    const supabase = createAdminClient()
    const { data: orderData } = await supabase
      .from('orders')
      .select('user_id, status')
      .eq('id', orderId)
      .single()

    const oldStatus = orderData?.status || 'pending'

    // Update order with successful payment status
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

    // Create notifications if user_id exists
    if (orderData?.user_id) {
      // Notify payment received
      await notifyPaymentReceived(orderData.user_id, orderId)
      
      // Notify status change if status changed
      if (oldStatus !== 'confirmed') {
        await notifyOrderStatusChange(orderData.user_id, orderId, oldStatus, 'confirmed')
      }
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

