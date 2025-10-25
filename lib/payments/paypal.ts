// PayPal Payment Integration
// This file provides the framework for PayPal payment processing

export interface PayPalOrderData {
  amount: number
  currency: string
  description?: string
  custom_id?: string
  return_url: string
  cancel_url: string
}

export interface PayPalOrderResult {
  success: boolean
  orderId?: string
  approvalUrl?: string
  error?: string
}

export interface PayPalCaptureResult {
  success: boolean
  transactionId?: string
  amount?: number
  error?: string
}

export class PayPalService {
  private clientId: string
  private clientSecret: string
  private baseUrl: string

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID!
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET!
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com'
  }

  /**
   * Get PayPal access token
   */
  private async getAccessToken(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en_US',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      })

      const data = await response.json()
      return data.access_token
    } catch (error) {
      console.error('Failed to get PayPal access token:', error)
      throw error
    }
  }

  /**
   * Create a PayPal order
   */
  async createOrder(orderData: PayPalOrderData): Promise<PayPalOrderResult> {
    try {
      const accessToken = await this.getAccessToken()

      const orderPayload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: orderData.currency.toUpperCase(),
              value: orderData.amount.toFixed(2),
            },
            description: orderData.description,
            custom_id: orderData.custom_id,
          },
        ],
        application_context: {
          return_url: orderData.return_url,
          cancel_url: orderData.cancel_url,
        },
      }

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(orderPayload),
      })

      const data = await response.json()

      if (response.ok) {
        return {
          success: true,
          orderId: data.id,
          approvalUrl: data.links.find((link: any) => link.rel === 'approve')?.href,
        }
      } else {
        return {
          success: false,
          error: data.message || 'Failed to create PayPal order',
        }
      }
    } catch (error) {
      console.error('PayPal order creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PayPal order creation failed',
      }
    }
  }

  /**
   * Capture a PayPal order
   */
  async captureOrder(orderId: string): Promise<PayPalCaptureResult> {
    try {
      const accessToken = await this.getAccessToken()

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      const data = await response.json()

      if (response.ok && data.status === 'COMPLETED') {
        const capture = data.purchase_units[0].payments.captures[0]
        return {
          success: true,
          transactionId: capture.id,
          amount: parseFloat(capture.amount.value),
        }
      } else {
        return {
          success: false,
          error: data.message || 'Failed to capture PayPal order',
        }
      }
    } catch (error) {
      console.error('PayPal order capture failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PayPal order capture failed',
      }
    }
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string) {
    try {
      const accessToken = await this.getAccessToken()

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      return await response.json()
    } catch (error) {
      console.error('Failed to get PayPal order:', error)
      throw error
    }
  }

  /**
   * Refund a PayPal payment
   */
  async refundPayment(captureId: string, amount?: number) {
    try {
      const accessToken = await this.getAccessToken()

      const refundPayload: any = {
        amount: {
          value: amount?.toFixed(2),
          currency_code: 'USD',
        },
      }

      const response = await fetch(`${this.baseUrl}/v2/payments/captures/${captureId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(refundPayload),
      })

      return await response.json()
    } catch (error) {
      console.error('Failed to refund PayPal payment:', error)
      throw error
    }
  }
}

// PayPal webhook handler
export async function handlePayPalWebhook(body: string, headers: Record<string, string>) {
  try {
    // Verify webhook signature
    // This is a simplified version - in production, you should verify the webhook signature
    
    const event = JSON.parse(body)
    
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        console.log('PayPal payment completed:', event.resource.id)
        // Update order status in database
        // await updateOrderStatus(event.resource.custom_id, 'paid')
        break

      case 'PAYMENT.CAPTURE.DENIED':
        console.log('PayPal payment denied:', event.resource.id)
        // Handle denied payment
        break

      default:
        console.log(`Unhandled PayPal event type: ${event.event_type}`)
    }

    return { success: true }
  } catch (error) {
    console.error('PayPal webhook error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'PayPal webhook processing failed' }
  }
}

export default PayPalService
