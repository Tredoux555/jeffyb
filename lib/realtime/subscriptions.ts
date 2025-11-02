/**
 * Real-Time Subscription Manager
 * Centralized management for Supabase Realtime subscriptions
 * Prevents duplicate subscriptions and manages cleanup
 */

import { createClient } from '../supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface SubscriptionConfig {
  channel: string
  table: string
  filter?: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  callback: (payload: any) => void
}

interface ActiveSubscription {
  channel: RealtimeChannel
  config: SubscriptionConfig
}

class SubscriptionManager {
  private subscriptions: Map<string, ActiveSubscription> = new Map()
  private supabase = createClient()

  /**
   * Subscribe to database changes
   */
  subscribe(config: SubscriptionConfig): () => void {
    const key = `${config.channel}-${config.table}-${config.filter || ''}`

    // If already subscribed, return unsubscribe function
    if (this.subscriptions.has(key)) {
      const existing = this.subscriptions.get(key)!
      return () => this.unsubscribe(key)
    }

    const channel = this.supabase
      .channel(config.channel)
      .on(
        'postgres_changes' as any,
        {
          event: config.event || 'UPDATE',
          schema: 'public',
          table: config.table,
          ...(config.filter && { filter: config.filter }),
        },
        config.callback
      )
      .subscribe()

    this.subscriptions.set(key, { channel, config })

    // Return unsubscribe function
    return () => this.unsubscribe(key)
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(key: string): void {
    const subscription = this.subscriptions.get(key)
    if (subscription) {
      this.supabase.removeChannel(subscription.channel)
      this.subscriptions.delete(key)
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((subscription) => {
      this.supabase.removeChannel(subscription.channel)
    })
    this.subscriptions.clear()
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys())
  }

  /**
   * Check if a subscription exists
   */
  hasSubscription(key: string): boolean {
    return this.subscriptions.has(key)
  }
}

// Singleton instance
let subscriptionManager: SubscriptionManager | null = null

/**
 * Get the subscription manager instance
 */
export function getSubscriptionManager(): SubscriptionManager {
  if (!subscriptionManager) {
    subscriptionManager = new SubscriptionManager()
  }
  return subscriptionManager
}

/**
 * Helper function to subscribe to order updates for a user
 */
export function subscribeToUserOrders(
  userId: string,
  callback: (order: any) => void
): () => void {
  const manager = getSubscriptionManager()
  return manager.subscribe({
    channel: `user-orders-${userId}`,
    table: 'orders',
    filter: `user_id=eq.${userId}`,
    event: 'UPDATE',
    callback: (payload) => {
      callback(payload.new)
    },
  })
}

/**
 * Helper function to subscribe to delivery assignments for an order
 */
export function subscribeToOrderAssignment(
  orderId: string,
  callback: (assignment: any) => void
): () => void {
  const manager = getSubscriptionManager()
  return manager.subscribe({
    channel: `order-assignment-${orderId}`,
    table: 'delivery_assignments',
    filter: `order_id=eq.${orderId}`,
    event: '*',
    callback: (payload) => {
      if (payload.eventType === 'DELETE') {
        callback(null)
      } else {
        callback(payload.new)
      }
    },
  })
}

/**
 * Helper function to subscribe to driver location updates
 */
export function subscribeToDriverLocation(
  driverId: string,
  callback: (driver: any) => void
): () => void {
  const manager = getSubscriptionManager()
  return manager.subscribe({
    channel: `driver-location-${driverId}`,
    table: 'drivers',
    filter: `id=eq.${driverId}`,
    event: 'UPDATE',
    callback: (payload) => {
      if (payload.new?.current_location) {
        callback(payload.new)
      }
    },
  })
}

/**
 * Helper function to subscribe to delivery status updates
 */
export function subscribeToDeliveryStatus(
  orderId: string,
  callback: (assignment: any) => void
): () => void {
  const manager = getSubscriptionManager()
  return manager.subscribe({
    channel: `delivery-status-${orderId}`,
    table: 'delivery_assignments',
    filter: `order_id=eq.${orderId}`,
    event: 'UPDATE',
    callback: (payload) => {
      callback(payload.new)
    },
  })
}

/**
 * Cleanup all subscriptions (useful on unmount)
 */
export function cleanupAllSubscriptions(): void {
  const manager = getSubscriptionManager()
  manager.unsubscribeAll()
}

