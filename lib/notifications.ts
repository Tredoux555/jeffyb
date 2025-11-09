/**
 * Order Notifications System
 * Creates and manages order-related notifications for users
 */

import { createClient } from './supabase'
import { OrderNotification } from '@/types/database'

export type NotificationType = 'status_update' | 'driver_assigned' | 'delivered' | 'payment_received' | 'other'

/**
 * Create an order notification
 */
export async function createOrderNotification(
  userId: string,
  orderId: string,
  type: NotificationType,
  message: string
): Promise<OrderNotification | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('order_notifications')
      .insert({
        user_id: userId,
        order_id: orderId,
        type,
        message,
        read: false,
      })
      .select()
      .single()

    if (error) {
      try {
        console.error('Error creating order notification:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          errorString: JSON.stringify(error, Object.getOwnPropertyNames(error))
        })
      } catch (stringifyError) {
        console.error('Error creating order notification:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
          errorKeys: error ? Object.keys(error) : []
        })
      }
      return null
    }

    return data as OrderNotification
  } catch (error) {
    console.error('Unexpected error creating order notification:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorObject: error
    })
    return null
  }
}

/**
 * Create notification when order status changes
 */
export async function notifyOrderStatusChange(
  userId: string,
  orderId: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  const statusMessages: Record<string, string> = {
    confirmed: 'Your order has been confirmed!',
    processing: 'Your order is being processed.',
    shipped: 'Your order has been shipped!',
    delivered: 'Your order has been delivered!',
    cancelled: 'Your order has been cancelled.',
  }

  const message = statusMessages[newStatus] || `Your order status has been updated to ${newStatus}.`

  await createOrderNotification(userId, orderId, 'status_update', message)
}

/**
 * Create notification when driver is assigned
 */
export async function notifyDriverAssigned(
  userId: string,
  orderId: string,
  driverName?: string
): Promise<void> {
  const message = driverName
    ? `Driver ${driverName} has been assigned to your order!`
    : 'A driver has been assigned to your order!'

  await createOrderNotification(userId, orderId, 'driver_assigned', message)
}

/**
 * Create notification when order is delivered
 */
export async function notifyOrderDelivered(
  userId: string,
  orderId: string
): Promise<void> {
  await createOrderNotification(userId, orderId, 'delivered', 'Your order has been delivered! Thank you for shopping with us.')
}

/**
 * Create notification when payment is received
 */
export async function notifyPaymentReceived(
  userId: string,
  orderId: string
): Promise<void> {
  await createOrderNotification(userId, orderId, 'payment_received', 'Your payment has been received! Your order is being processed.')
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('order_notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) {
      try {
        console.error('Error marking notification as read:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          errorString: JSON.stringify(error, Object.getOwnPropertyNames(error))
        })
      } catch (stringifyError) {
        console.error('Error marking notification as read:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
          errorKeys: error ? Object.keys(error) : []
        })
      }
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error marking notification as read:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorObject: error
    })
    return false
  }
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: string): Promise<OrderNotification[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('order_notifications')
      .select('*, order:orders(*)')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false })

    if (error) {
      try {
        console.error('Error fetching unread notifications:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          errorString: JSON.stringify(error, Object.getOwnPropertyNames(error))
        })
      } catch (stringifyError) {
        // Fallback if JSON.stringify fails
        console.error('Error fetching unread notifications:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
          errorKeys: error ? Object.keys(error) : []
        })
      }
      return []
    }

    return (data || []) as OrderNotification[]
  } catch (error) {
    console.error('Unexpected error fetching unread notifications:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorObject: error
    })
    return []
  }
}

/**
 * Get all notifications for a user
 */
export async function getAllNotifications(userId: string, limit = 50): Promise<OrderNotification[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('order_notifications')
      .select('*, order:orders(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      try {
        console.error('Error fetching all notifications:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          errorString: JSON.stringify(error, Object.getOwnPropertyNames(error))
        })
      } catch (stringifyError) {
        console.error('Error fetching all notifications:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
          errorKeys: error ? Object.keys(error) : []
        })
      }
      return []
    }

    return (data || []) as OrderNotification[]
  } catch (error) {
    console.error('Unexpected error fetching all notifications:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorObject: error
    })
    return []
  }
}

