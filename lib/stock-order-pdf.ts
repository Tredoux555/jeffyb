/**
 * Stock Order PDF Generation Utility
 * Generates shipping-compliant purchase order documents using pdf-lib
 */

import { StockOrder } from '@/types/database'

/**
 * Generate stock order as PDF blob (shipping-compliant format)
 */
export async function generateStockOrderPDF(order: StockOrder): Promise<Blob> {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib')
  const doc = await PDFDocument.create()

  // Add page (A4 size: 595 x 842 points)
  const page = doc.addPage([595, 842])

  // Set up fonts
  const helveticaFont = await doc.embedFont(StandardFonts.Helvetica)
  const helveticaBoldFont = await doc.embedFont(StandardFonts.HelveticaBold)
  const helveticaObliqueFont = await doc.embedFont(StandardFonts.HelveticaOblique)

  // Colors
  const yellow = rgb(0.92, 0.70, 0.03) // Jeffy yellow
  const dark = rgb(0.1, 0.1, 0.1)
  const gray = rgb(0.5, 0.5, 0.5)
  const lightGray = rgb(0.9, 0.9, 0.9)

  let y = 800
  const margin = 50
  const lineHeight = 16
  const sectionSpacing = 20

  // ============================================
  // HEADER SECTION
  // ============================================
  page.drawRectangle({
    x: 0,
    y: 780,
    width: 595,
    height: 62,
    color: yellow,
  })

  page.drawText('PURCHASE ORDER', {
    x: margin,
    y: 810,
    size: 24,
    font: helveticaBoldFont,
    color: dark,
  })

  page.drawText(`PO Number: ${order.order_number}`, {
    x: 400,
    y: 810,
    size: 12,
    font: helveticaBoldFont,
    color: dark,
  })

  page.drawText(`Date: ${new Date(order.order_date).toLocaleDateString('en-ZA')}`, {
    x: 400,
    y: 795,
    size: 10,
    font: helveticaFont,
    color: dark,
  })

  y = 750

  // ============================================
  // SUPPLIER INFORMATION SECTION
  // ============================================
  page.drawText('SUPPLIER INFORMATION', {
    x: margin,
    y,
    size: 12,
    font: helveticaBoldFont,
    color: dark,
  })
  y -= lineHeight

  page.drawText(order.supplier_name, {
    x: margin,
    y,
    size: 11,
    font: helveticaBoldFont,
    color: dark,
  })
  y -= lineHeight

  if (order.supplier_address) {
    page.drawText(order.supplier_address, {
      x: margin,
      y,
      size: 10,
      font: helveticaFont,
      color: dark,
    })
    y -= lineHeight
  }

  if (order.supplier_city) {
    const cityLine = `${order.supplier_city}${order.supplier_postal_code ? ` ${order.supplier_postal_code}` : ''}${order.supplier_country ? `, ${order.supplier_country}` : ''}`
    page.drawText(cityLine, {
      x: margin,
      y,
      size: 10,
      font: helveticaFont,
      color: dark,
    })
    y -= lineHeight
  }

  if (order.supplier_phone) {
    page.drawText(`Phone: ${order.supplier_phone}`, {
      x: margin,
      y,
      size: 10,
      font: helveticaFont,
      color: dark,
    })
    y -= lineHeight
  }

  if (order.supplier_email) {
    page.drawText(`Email: ${order.supplier_email}`, {
      x: margin,
      y,
      size: 10,
      font: helveticaFont,
      color: dark,
    })
    y -= lineHeight
  }

  y -= sectionSpacing

  // ============================================
  // SHIPPING INFORMATION SECTION
  // ============================================
  page.drawText('SHIP TO:', {
    x: margin,
    y,
    size: 12,
    font: helveticaBoldFont,
    color: dark,
  })
  y -= lineHeight

  if (order.shipping_contact_name) {
    page.drawText(order.shipping_contact_name, {
      x: margin,
      y,
      size: 11,
      font: helveticaBoldFont,
      color: dark,
    })
    y -= lineHeight
  }

  page.drawText(order.shipping_address, {
    x: margin,
    y,
    size: 10,
    font: helveticaFont,
    color: dark,
  })
  y -= lineHeight

  const shippingCityLine = `${order.shipping_city} ${order.shipping_postal_code}${order.shipping_country ? `, ${order.shipping_country}` : ''}`
  page.drawText(shippingCityLine, {
    x: margin,
    y,
    size: 10,
    font: helveticaFont,
    color: dark,
  })
  y -= lineHeight

  if (order.shipping_contact_phone) {
    page.drawText(`Phone: ${order.shipping_contact_phone}`, {
      x: margin,
      y,
      size: 10,
      font: helveticaFont,
      color: dark,
    })
    y -= lineHeight
  }

  if (order.shipping_method) {
    page.drawText(`Shipping Method: ${order.shipping_method}`, {
      x: margin,
      y,
      size: 10,
      font: helveticaFont,
      color: dark,
    })
    y -= lineHeight
  }

  if (order.expected_delivery_date) {
    page.drawText(`Expected Delivery: ${new Date(order.expected_delivery_date).toLocaleDateString('en-ZA')}`, {
      x: margin,
      y,
      size: 10,
      font: helveticaFont,
      color: dark,
    })
    y -= lineHeight
  }

  y -= sectionSpacing

  // ============================================
  // ORDER ITEMS TABLE HEADER
  // ============================================
  const tableTop = y
  const colWidths = {
    sku: 80,
    description: 200,
    qty: 50,
    unitCost: 70,
    dimensions: 90,
    lineTotal: 70
  }
  const colX = {
    sku: margin,
    description: margin + colWidths.sku,
    qty: margin + colWidths.sku + colWidths.description,
    unitCost: margin + colWidths.sku + colWidths.description + colWidths.qty,
    dimensions: margin + colWidths.sku + colWidths.description + colWidths.qty + colWidths.unitCost,
    lineTotal: margin + colWidths.sku + colWidths.description + colWidths.qty + colWidths.unitCost + colWidths.dimensions
  }

  // Table header background
  page.drawRectangle({
    x: margin,
    y: y - 5,
    width: 495,
    height: 20,
    color: lightGray,
  })

  page.drawText('SKU', { x: colX.sku, y: y + 2, size: 9, font: helveticaBoldFont, color: dark })
  page.drawText('Description', { x: colX.description, y: y + 2, size: 9, font: helveticaBoldFont, color: dark })
  page.drawText('Qty', { x: colX.qty, y: y + 2, size: 9, font: helveticaBoldFont, color: dark })
  page.drawText('Unit Cost', { x: colX.unitCost, y: y + 2, size: 9, font: helveticaBoldFont, color: dark })
  page.drawText('Dimensions', { x: colX.dimensions, y: y + 2, size: 9, font: helveticaBoldFont, color: dark })
  page.drawText('Total', { x: colX.lineTotal, y: y + 2, size: 9, font: helveticaBoldFont, color: dark })

  y -= 25

  // Draw header separator line
  page.drawLine({
    start: { x: margin, y },
    end: { x: 545, y },
    thickness: 1,
    color: dark,
  })

  y -= 5

  // ============================================
  // ORDER ITEMS
  // ============================================
  if (order.items && order.items.length > 0) {
    order.items.forEach((item, index) => {
      // Check if we need a new page
      if (y < 150) {
        const newPage = doc.addPage([595, 842])
        y = 800
        return newPage
      }

      // Item row
      const sku = item.product_sku || 'N/A'
      const description = item.product_name + (item.variant_attributes ? ` (${Object.values(item.variant_attributes).join(', ')})` : '')
      const qty = item.quantity.toString()
      const unitCost = `R${item.unit_cost.toFixed(2)}`
      const dimensions = item.unit_length_cm && item.unit_width_cm && item.unit_height_cm
        ? `${item.unit_length_cm}×${item.unit_width_cm}×${item.unit_height_cm}cm`
        : item.unit_weight_kg ? `${item.unit_weight_kg}kg` : '-'
      const lineTotal = `R${item.line_total.toFixed(2)}`

      // Wrap description if too long
      const maxDescWidth = colWidths.description - 5
      const descLines = description.length > 40 ? [
        description.substring(0, 40),
        description.substring(40)
      ] : [description]

      descLines.forEach((line, lineIdx) => {
        if (lineIdx === 0) {
          page.drawText(sku, { x: colX.sku, y, size: 8, font: helveticaFont, color: dark })
          page.drawText(line, { x: colX.description, y, size: 8, font: helveticaFont, color: dark })
          page.drawText(qty, { x: colX.qty, y, size: 8, font: helveticaFont, color: dark })
          page.drawText(unitCost, { x: colX.unitCost, y, size: 8, font: helveticaFont, color: dark })
          page.drawText(dimensions, { x: colX.dimensions, y, size: 8, font: helveticaFont, color: dark })
          page.drawText(lineTotal, { x: colX.lineTotal, y, size: 8, font: helveticaFont, color: dark })
        } else {
          y -= 12
          page.drawText(line, { x: colX.description, y, size: 8, font: helveticaFont, color: dark })
        }
      })

      y -= 15

      // Draw row separator
      page.drawLine({
        start: { x: margin, y },
        end: { x: 545, y },
        thickness: 0.5,
        color: gray,
      })

      y -= 5
    })
  }

  y -= 10

  // ============================================
  // TOTALS SECTION
  // ============================================
  page.drawLine({
    start: { x: margin, y },
    end: { x: 545, y },
    thickness: 1,
    color: dark,
  })
  y -= 15

  page.drawText('Total Quantity:', {
    x: colX.description,
    y,
    size: 10,
    font: helveticaBoldFont,
    color: dark,
  })
  page.drawText(order.total_quantity.toString(), {
    x: colX.qty,
    y,
    size: 10,
    font: helveticaBoldFont,
    color: dark,
  })

  y -= 15

  page.drawText('Total Cost:', {
    x: colX.description,
    y,
    size: 12,
    font: helveticaBoldFont,
    color: dark,
  })
  page.drawText(`R${order.total_cost.toFixed(2)}`, {
    x: colX.lineTotal - 20,
    y,
    size: 12,
    font: helveticaBoldFont,
    color: dark,
  })

  y -= sectionSpacing

  // ============================================
  // NOTES SECTION
  // ============================================
  if (order.notes) {
    page.drawText('NOTES:', {
      x: margin,
      y,
      size: 10,
      font: helveticaBoldFont,
      color: dark,
    })
    y -= lineHeight

    const notesLines = order.notes.split('\n')
    notesLines.forEach((line: string) => {
      if (y < 100) {
        const newPage = doc.addPage([595, 842])
        y = 800
        return newPage
      }
      page.drawText(line, {
        x: margin,
        y,
        size: 9,
        font: helveticaFont,
        color: dark,
      })
      y -= lineHeight
    })
  }

  // ============================================
  // FOOTER
  // ============================================
  y = 50
  page.drawText('This is a computer-generated purchase order. Please confirm receipt.', {
    x: margin,
    y,
    size: 8,
    font: helveticaObliqueFont,
    color: gray,
  })

  y -= 15
  page.drawText('Jeffy Commerce - www.jeffy.co.za', {
    x: margin,
    y,
    size: 8,
    font: helveticaFont,
    color: gray,
  })

  // Return PDF as blob
  const pdfBytes = await doc.save()
  return new Blob([pdfBytes as any], { type: 'application/pdf' })
}

/**
 * Download stock order as PDF
 */
export async function downloadStockOrderPDF(order: StockOrder): Promise<void> {
  try {
    const blob = await generateStockOrderPDF(order)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `purchase-order-${order.order_number}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error generating stock order PDF:', error)
    alert('Error generating purchase order PDF. Please try again.')
  }
}

