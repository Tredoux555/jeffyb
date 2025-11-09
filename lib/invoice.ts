/**
 * Invoice Generation Utility
 * Generates PDF invoices for orders using @react-pdf/renderer
 */

import { Order } from '@/types/database'

/**
 * Generate invoice as PDF blob
 */
export async function generateInvoicePDF(order: Order): Promise<Blob> {
  const { PDFDocument, rgb } = await import('pdf-lib')
  const doc = await PDFDocument.create()

  // Add page
  const page = doc.addPage([612, 792]) // US Letter size

  // Set up fonts - use standard fonts
  const helveticaFont = await doc.embedFont('Helvetica')
  const helveticaBoldFont = await doc.embedFont('Helvetica-Bold')

  // Colors
  const yellow = rgb(0.99, 0.83, 0.30) // Jeffy yellow
  const dark = rgb(0.1, 0.1, 0.1)
  const gray = rgb(0.5, 0.5, 0.5)

  let y = 750
  const margin = 50
  const lineHeight = 20

  // Header
  page.drawRectangle({
    x: 0,
    y: 750,
    width: 612,
    height: 50,
    color: yellow,
  })

  page.drawText('JEFFY COMMERCE', {
    x: margin,
    y: 765,
    size: 20,
    font: helveticaBoldFont,
    color: dark,
  })

  page.drawText('Invoice', {
    x: 450,
    y: 765,
    size: 18,
    font: helveticaBoldFont,
    color: dark,
  })

  y = 680

  // Order Info
  page.drawText(`Order ID: ${order.id.slice(0, 8)}`, {
    x: margin,
    y,
    size: 12,
    font: helveticaFont,
    color: dark,
  })
  y -= lineHeight

  page.drawText(`Date: ${new Date(order.created_at).toLocaleDateString()}`, {
    x: margin,
    y,
    size: 12,
    font: helveticaFont,
    color: dark,
  })
  y -= lineHeight

  page.drawText(`Status: ${order.status}`, {
    x: margin,
    y,
    size: 12,
    font: helveticaFont,
    color: dark,
  })
  y -= lineHeight * 2

  // Customer Info
  page.drawText('Bill To:', {
    x: margin,
    y,
    size: 14,
    font: helveticaBoldFont,
    color: dark,
  })
  y -= lineHeight

  page.drawText(order.delivery_info.name, {
    x: margin,
    y,
    size: 12,
    font: helveticaFont,
    color: dark,
  })
  y -= lineHeight

  page.drawText(order.user_email, {
    x: margin,
    y,
    size: 10,
    font: helveticaFont,
    color: gray,
  })
  y -= lineHeight

  page.drawText(order.delivery_info.address, {
    x: margin,
    y,
    size: 10,
    font: helveticaFont,
    color: gray,
  })
  y -= lineHeight

  if (order.delivery_info.city) {
    page.drawText(
      `${order.delivery_info.city}${order.delivery_info.postal_code ? ` ${order.delivery_info.postal_code}` : ''}`,
      {
        x: margin,
        y,
        size: 10,
        font: helveticaFont,
        color: gray,
      }
    )
    y -= lineHeight
  }
  y -= lineHeight * 2

  // Items Table Header
  page.drawText('Item', {
    x: margin,
    y,
    size: 12,
    font: helveticaBoldFont,
    color: dark,
  })
  page.drawText('Qty', {
    x: 350,
    y,
    size: 12,
    font: helveticaBoldFont,
    color: dark,
  })
  page.drawText('Price', {
    x: 420,
    y,
    size: 12,
    font: helveticaBoldFont,
    color: dark,
  })
  page.drawText('Total', {
    x: 500,
    y,
    size: 12,
    font: helveticaBoldFont,
    color: dark,
  })
  y -= lineHeight * 1.5

  // Draw line
  page.drawLine({
    start: { x: margin, y },
    end: { x: 562, y },
    thickness: 1,
    color: gray,
  })
  y -= lineHeight

  // Order Items
  order.items.forEach((item) => {
    const itemTotal = (item.price || 0) * (item.quantity || 0)

    page.drawText(item.product_name || 'Unknown Product', {
      x: margin,
      y,
      size: 10,
      font: helveticaFont,
      color: dark,
    })
    page.drawText(`${item.quantity || 0}`, {
      x: 350,
      y,
      size: 10,
      font: helveticaFont,
      color: dark,
    })
    page.drawText(`R${(item.price || 0).toFixed(2)}`, {
      x: 420,
      y,
      size: 10,
      font: helveticaFont,
      color: dark,
    })
    page.drawText(`R${itemTotal.toFixed(2)}`, {
      x: 500,
      y,
      size: 10,
      font: helveticaFont,
      color: dark,
    })
    y -= lineHeight * 1.5

    if (y < 150) {
      // Add new page if needed
      const newPage = doc.addPage([612, 792])
      y = 750
      return newPage
    }
  })

  y -= lineHeight

  // Total Line
  page.drawLine({
    start: { x: margin, y },
    end: { x: 562, y },
    thickness: 1,
    color: dark,
  })
  y -= lineHeight

  page.drawText('Total:', {
    x: 450,
    y,
    size: 14,
    font: helveticaBoldFont,
    color: dark,
  })
  page.drawText(`R${order.total.toFixed(2)}`, {
    x: 520,
    y,
    size: 14,
    font: helveticaBoldFont,
    color: dark,
  })

  // Footer
  y = 50
  page.drawText('Thank you for shopping with Jeffy!', {
    x: margin,
    y,
    size: 10,
    font: helveticaFont,
    color: gray,
  })

  // Return PDF as blob
  const pdfBytes = await doc.save()
  // pdfBytes is Uint8Array which is compatible with Blob
  return new Blob([pdfBytes as any], { type: 'application/pdf' })
}

/**
 * Download invoice as PDF
 */
export async function downloadInvoice(order: Order): Promise<void> {
  try {
    const blob = await generateInvoicePDF(order)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice-${order.id.slice(0, 8)}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error generating invoice:', error)
    alert('Error generating invoice. Please try again.')
  }
}

