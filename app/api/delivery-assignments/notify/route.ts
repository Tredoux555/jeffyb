/**
 * Delivery Assignment Notification API
 * Triggered when a delivery assignment is created or updated
 * Creates notifications for users
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { notifyDriverAssigned, notifyOrderDelivered } from '@/lib/notifications'

/**
 * POST /api/delivery-assignments/notify
 * Called when a delivery assignment is created or updated
 */
export async function POST(request: NextRequest) {
  try {
    const { assignmentId, eventType } = await request.json()

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: 'Assignment ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Fetch assignment with order and driver
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('delivery_assignments')
      .select('*, order:orders(user_id, user_email), driver:drivers(name)')
      .eq('id', assignmentId)
      .single()

    if (assignmentError || !assignmentData) {
      console.error('Error fetching assignment:', assignmentError)
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      )
    }

    const assignment = assignmentData as any
    const order = assignment.order
    const driver = assignment.driver

    // If order has user_id, create notifications
    if (order?.user_id) {
      // Notify when driver is assigned
      if (eventType === 'INSERT' || (assignment.status === 'assigned' && eventType === 'UPDATE')) {
        await notifyDriverAssigned(
          order.user_id,
          assignment.order_id,
          driver?.name
        )
      }

      // Notify when order is delivered
      if (assignment.status === 'delivered' && eventType === 'UPDATE') {
        await notifyOrderDelivered(order.user_id, assignment.order_id)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications created successfully',
    })
  } catch (error) {
    console.error('Error creating delivery notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create notifications' },
      { status: 500 }
    )
  }
}

