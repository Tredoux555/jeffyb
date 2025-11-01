// QR Code utility functions for order tracking
import QRCode from 'qrcode'

/**
 * Generate a QR code data URL from order ID
 * @param orderId - The order ID to encode in the QR code
 * @returns Promise<string> - Data URL of the QR code image
 */
export async function generateQRCode(orderId: string): Promise<string> {
  try {
    // Create tracking URL that includes order ID
    const trackingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeffy.co.za'}/admin/orders?orderId=${orderId}`
    
    // Generate QR code as data URL (base64 encoded image)
    const qrCodeDataUrl = await QRCode.toDataURL(trackingUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
    })
    
    return qrCodeDataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Generate QR code for printing (higher quality)
 * @param orderId - The order ID to encode in the QR code
 * @returns Promise<string> - Data URL of the QR code image (larger size)
 */
export async function generateQRCodeForPrint(orderId: string): Promise<string> {
  try {
    const trackingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeffy.co.za'}/admin/orders?orderId=${orderId}`
    
    // Larger size for printing
    const qrCodeDataUrl = await QRCode.toDataURL(trackingUrl, {
      errorCorrectionLevel: 'H', // High error correction for printing
      type: 'image/png',
      width: 500,
      margin: 3,
    })
    
    return qrCodeDataUrl
  } catch (error) {
    console.error('Error generating QR code for print:', error)
    throw new Error('Failed to generate QR code for print')
  }
}

/**
 * Alias for generateQRCode - used by checkout page
 * @param orderId - The order ID to encode in the QR code
 * @returns Promise<string> - Data URL of the QR code image
 */
export async function generateOrderQRCode(orderId: string): Promise<string> {
  return generateQRCode(orderId)
}
