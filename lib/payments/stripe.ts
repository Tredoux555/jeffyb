// Stripe Payment Integration
// This file provides the framework for Stripe payment processing

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

export interface PaymentIntentData {
  amount: number
  currency: string
  metadata?: Record<string, string>
  customer_email?: string
}

export interface PaymentResult {
  success: boolean
  clientSecret?: string
  paymentIntentId?: string
  error?: string
}

export class StripeService {
  /**
   * Create a payment intent for processing payments
   */
  static async createPaymentIntent(data: PaymentIntentData): Promise<PaymentResult> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency || 'usd',
        metadata: data.metadata || {},
        receipt_email: data.customer_email,
        automatic_payment_methods: {
          enabled: true,
        },
      })

      return {
        success: true,
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
      }
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      }
    }
  }

  /**
   * Retrieve a payment intent by ID
   */
  static async getPaymentIntent(paymentIntentId: string) {
    try {
      return await stripe.paymentIntents.retrieve(paymentIntentId)
    } catch (error) {
      console.error('Failed to retrieve payment intent:', error)
      throw error
    }
  }

  /**
   * Confirm a payment intent
   */
  static async confirmPaymentIntent(paymentIntentId: string) {
    try {
      return await stripe.paymentIntents.confirm(paymentIntentId)
    } catch (error) {
      console.error('Failed to confirm payment intent:', error)
      throw error
    }
  }

  /**
   * Cancel a payment intent
   */
  static async cancelPaymentIntent(paymentIntentId: string) {
    try {
      return await stripe.paymentIntents.cancel(paymentIntentId)
    } catch (error) {
      console.error('Failed to cancel payment intent:', error)
      throw error
    }
  }

  /**
   * Create a refund for a payment
   */
  static async createRefund(paymentIntentId: string, amount?: number) {
    try {
      const refundData: any = {
        payment_intent: paymentIntentId,
      }
      
      if (amount) {
        refundData.amount = Math.round(amount * 100) // Convert to cents
      }

      return await stripe.refunds.create(refundData)
    } catch (error) {
      console.error('Failed to create refund:', error)
      throw error
    }
  }

  /**
   * Create a customer for future payments
   */
  static async createCustomer(email: string, name?: string) {
    try {
      return await stripe.customers.create({
        email,
        name,
      })
    } catch (error) {
      console.error('Failed to create customer:', error)
      throw error
    }
  }

  /**
   * Get customer by ID
   */
  static async getCustomer(customerId: string) {
    try {
      return await stripe.customers.retrieve(customerId)
    } catch (error) {
      console.error('Failed to retrieve customer:', error)
      throw error
    }
  }
}

// Webhook handler for Stripe events
export async function handleStripeWebhook(body: string, signature: string) {
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment succeeded:', paymentIntent.id)
        // Update order status in database
        // await updateOrderStatus(paymentIntent.metadata.orderId, 'paid')
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent
        console.log('Payment failed:', failedPayment.id)
        // Handle failed payment
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Webhook error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Webhook processing failed' }
  }
}

export default StripeService
