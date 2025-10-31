// QuickBooks Integration
// This file provides the framework for QuickBooks accounting integration

export interface QuickBooksCustomer {
  id?: string
  Name: string
  CompanyName?: string
  PrimaryEmailAddr?: {
    Address: string
  }
  PrimaryPhone?: {
    FreeFormNumber: string
  }
  BillAddr?: {
    Line1: string
    City: string
    CountrySubDivisionCode: string
    PostalCode: string
  }
}

export interface QuickBooksItem {
  id?: string
  Name: string
  Description?: string
  UnitPrice: number
  IncomeAccountRef?: {
    value: string
  }
}

export interface QuickBooksInvoice {
  id?: string
  CustomerRef: {
    value: string
  }
  Line: Array<{
    DetailType: string
    SalesItemLineDetail: {
      ItemRef: {
        value: string
      }
      Qty: number
      UnitPrice: number
    }
    Amount: number
    Description?: string
  }>
  TxnDate: string
  DueDate?: string
  TotalAmt: number
}

export interface QuickBooksConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  environment: 'sandbox' | 'production'
}

export class QuickBooksService {
  private config: QuickBooksConfig
  private accessToken?: string
  private refreshToken?: string
  private companyId?: string

  constructor(config: QuickBooksConfig) {
    this.config = config
  }

  /**
   * Set authentication tokens
   */
  setTokens(accessToken: string, refreshToken: string, companyId: string) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    this.companyId = companyId
  }

  /**
   * Get base URL for QuickBooks API
   */
  private getBaseUrl(): string {
    return this.config.environment === 'production'
      ? 'https://quickbooks.api.intuit.com'
      : 'https://sandbox-quickbooks.api.intuit.com'
  }

  /**
   * Make authenticated request to QuickBooks API
   */
  private async makeRequest(endpoint: string, method: string = 'GET', data?: unknown) {
    if (!this.accessToken || !this.companyId) {
      throw new Error('QuickBooks not authenticated')
    }

    const url = `${this.getBaseUrl()}/v3/company/${this.companyId}${endpoint}`
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      throw new Error(`QuickBooks API error: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Create a customer in QuickBooks
   */
  async createCustomer(customerData: QuickBooksCustomer): Promise<QuickBooksCustomer> {
    try {
      const response = await this.makeRequest('/customers', 'POST', {
        Name: customerData.Name,
        CompanyName: customerData.CompanyName,
        PrimaryEmailAddr: customerData.PrimaryEmailAddr,
        PrimaryPhone: customerData.PrimaryPhone,
        BillAddr: customerData.BillAddr,
      })

      return response.QueryResponse.Customer[0]
    } catch (error) {
      console.error('Failed to create QuickBooks customer:', error)
      throw error
    }
  }

  /**
   * Get customer by email
   */
  async getCustomerByEmail(email: string): Promise<QuickBooksCustomer | null> {
    try {
      const response = await this.makeRequest(`/customers?query=PrimaryEmailAddr='${email}'`)
      
      if (response.QueryResponse.Customer && response.QueryResponse.Customer.length > 0) {
        return response.QueryResponse.Customer[0]
      }
      
      return null
    } catch (error) {
      console.error('Failed to get QuickBooks customer:', error)
      throw error
    }
  }

  /**
   * Create an item in QuickBooks
   */
  async createItem(itemData: QuickBooksItem): Promise<QuickBooksItem> {
    try {
      const response = await this.makeRequest('/items', 'POST', {
        Name: itemData.Name,
        Description: itemData.Description,
        UnitPrice: itemData.UnitPrice,
        IncomeAccountRef: itemData.IncomeAccountRef,
      })

      return response.QueryResponse.Item[0]
    } catch (error) {
      console.error('Failed to create QuickBooks item:', error)
      throw error
    }
  }

  /**
   * Get item by name
   */
  async getItemByName(name: string): Promise<QuickBooksItem | null> {
    try {
      const response = await this.makeRequest(`/items?query=Name='${name}'`)
      
      if (response.QueryResponse.Item && response.QueryResponse.Item.length > 0) {
        return response.QueryResponse.Item[0]
      }
      
      return null
    } catch (error) {
      console.error('Failed to get QuickBooks item:', error)
      throw error
    }
  }

  /**
   * Create an invoice in QuickBooks
   */
  async createInvoice(invoiceData: QuickBooksInvoice): Promise<QuickBooksInvoice> {
    try {
      const response = await this.makeRequest('/invoices', 'POST', {
        CustomerRef: invoiceData.CustomerRef,
        Line: invoiceData.Line,
        TxnDate: invoiceData.TxnDate,
        DueDate: invoiceData.DueDate,
        TotalAmt: invoiceData.TotalAmt,
      })

      return response.QueryResponse.Invoice[0]
    } catch (error) {
      console.error('Failed to create QuickBooks invoice:', error)
      throw error
    }
  }

  /**
   * Export order to QuickBooks
   */
  async exportOrder(orderData: {
    customerEmail: string
    customerName: string
    customerPhone?: string
    customerAddress?: {
      line1: string
      city: string
      state: string
      postalCode: string
    }
    items: Array<{
      name: string
      description?: string
      quantity: number
      price: number
    }>
    total: number
    orderDate: string
  }) {
    try {
      // Get or create customer
      let customer = await this.getCustomerByEmail(orderData.customerEmail)
      
      if (!customer) {
        customer = await this.createCustomer({
          Name: orderData.customerName,
          PrimaryEmailAddr: {
            Address: orderData.customerEmail,
          },
          PrimaryPhone: orderData.customerPhone ? {
            FreeFormNumber: orderData.customerPhone,
          } : undefined,
          BillAddr: orderData.customerAddress ? {
            Line1: orderData.customerAddress.line1,
            City: orderData.customerAddress.city,
            CountrySubDivisionCode: orderData.customerAddress.state,
            PostalCode: orderData.customerAddress.postalCode,
          } : undefined,
        })
      }

      // Create invoice lines
      const invoiceLines = []
      
      for (const item of orderData.items) {
        // Get or create item
        let quickBooksItem = await this.getItemByName(item.name)
        
        if (!quickBooksItem) {
          quickBooksItem = await this.createItem({
            Name: item.name,
            Description: item.description,
            UnitPrice: item.price,
          })
        }

        invoiceLines.push({
          DetailType: 'SalesItemLineDetail',
          SalesItemLineDetail: {
            ItemRef: {
              value: quickBooksItem.id!,
            },
            Qty: item.quantity,
            UnitPrice: item.price,
          },
          Amount: item.price * item.quantity,
          Description: item.description,
        })
      }

      // Create invoice
      const invoice = await this.createInvoice({
        CustomerRef: {
          value: customer.id!,
        },
        Line: invoiceLines,
        TxnDate: orderData.orderDate,
        TotalAmt: orderData.total,
      })

      return {
        success: true,
        invoiceId: invoice.id,
        customerId: customer.id,
      }
    } catch (error) {
      console.error('Failed to export order to QuickBooks:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export order',
      }
    }
  }

  /**
   * Get company info
   */
  async getCompanyInfo() {
    try {
      return await this.makeRequest('/companyinfo/1')
    } catch (error) {
      console.error('Failed to get QuickBooks company info:', error)
      throw error
    }
  }
}

// OAuth helper functions
export function getQuickBooksAuthUrl(config: QuickBooksConfig, state: string): string {
  const baseUrl = config.environment === 'production'
    ? 'https://appcenter.intuit.com'
    : 'https://appcenter.intuit.com'

  const params = new URLSearchParams({
    client_id: config.clientId,
    scope: 'com.intuit.quickbooks.accounting',
    redirect_uri: config.redirectUri,
    response_type: 'code',
    state,
  })

  return `${baseUrl}/connect/oauth2?${params.toString()}`
}

export async function exchangeCodeForTokens(
  config: QuickBooksConfig,
  code: string
): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
}> {
  const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
    }),
  })

  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(`QuickBooks token exchange failed: ${data.error_description}`)
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  }
}

export default QuickBooksService
