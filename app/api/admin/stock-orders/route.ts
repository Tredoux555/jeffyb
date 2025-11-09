import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { StockOrder, StockOrderItem } from '@/types/database'

// GET - Fetch all stock orders or a single order with items
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('id')

    if (orderId) {
      // Fetch single order with items
      const { data: order, error: orderError } = await supabase
        .from('stock_orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      const { data: items, error: itemsError } = await supabase
        .from('stock_order_items')
        .select('*')
        .eq('stock_order_id', orderId)
        .order('created_at', { ascending: true })

      if (itemsError) throw itemsError

      return NextResponse.json({
        success: true,
        data: { ...order, items: items || [] }
      })
    } else {
      // Fetch all orders
      const { data: orders, error } = await supabase
        .from('stock_orders')
        .select('*')
        .order('order_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      return NextResponse.json({
        success: true,
        data: orders || []
      })
    }
  } catch (error: any) {
    console.error('[API] Error fetching stock orders:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch stock orders' },
      { status: 500 }
    )
  }
}

// POST - Create new stock order
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const {
      supplier_name,
      supplier_email,
      supplier_phone,
      supplier_address,
      supplier_city,
      supplier_postal_code,
      supplier_country,
      shipping_address,
      shipping_city,
      shipping_postal_code,
      shipping_country,
      shipping_contact_name,
      shipping_contact_phone,
      shipping_method,
      expected_delivery_date,
      order_date,
      notes,
      items,
      created_by
    } = body

    // Validate required fields
    if (!supplier_name || !shipping_address || !shipping_city || !shipping_postal_code) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must have at least one item' },
        { status: 400 }
      )
    }

    // Generate order number
    const year = new Date().getFullYear()
    const { data: existingOrders, error: fetchError } = await supabase
      .from('stock_orders')
      .select('order_number')
      .like('order_number', `PO-${year}-%`)
      .order('order_number', { ascending: false })
      .limit(1)

    let order_number: string
    if (existingOrders && existingOrders.length > 0) {
      const lastNumber = existingOrders[0].order_number
      const lastSeq = parseInt(lastNumber.split('-')[2]) || 0
      order_number = `PO-${year}-${String(lastSeq + 1).padStart(4, '0')}`
    } else {
      order_number = `PO-${year}-0001`
    }

    // Create stock order
    const { data: order, error: orderError } = await supabase
      .from('stock_orders')
      .insert({
        order_number,
        supplier_name,
        supplier_email: supplier_email || null,
        supplier_phone: supplier_phone || null,
        supplier_address: supplier_address || null,
        supplier_city: supplier_city || null,
        supplier_postal_code: supplier_postal_code || null,
        supplier_country: supplier_country || 'South Africa',
        shipping_address,
        shipping_city,
        shipping_postal_code,
        shipping_country: shipping_country || 'South Africa',
        shipping_contact_name: shipping_contact_name || null,
        shipping_contact_phone: shipping_contact_phone || null,
        shipping_method: shipping_method || null,
        expected_delivery_date: expected_delivery_date || null,
        order_date: order_date || new Date().toISOString().split('T')[0],
        order_status: 'draft',
        notes: notes || null,
        created_by: created_by || null
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items
    const orderItems = items.map((item: any) => ({
      stock_order_id: order.id,
      product_id: item.product_id || null,
      variant_id: item.variant_id || null,
      product_name: item.product_name,
      product_sku: item.product_sku || null,
      product_description: item.product_description || null,
      variant_attributes: item.variant_attributes || null,
      quantity: parseInt(item.quantity),
      unit_cost: parseFloat(item.unit_cost) || 0,
      line_total: parseFloat(item.quantity) * (parseFloat(item.unit_cost) || 0),
      unit_weight_kg: item.unit_weight_kg ? parseFloat(item.unit_weight_kg) : null,
      unit_length_cm: item.unit_length_cm ? parseFloat(item.unit_length_cm) : null,
      unit_width_cm: item.unit_width_cm ? parseFloat(item.unit_width_cm) : null,
      unit_height_cm: item.unit_height_cm ? parseFloat(item.unit_height_cm) : null,
      notes: item.notes || null
    }))

    const { data: insertedItems, error: itemsError } = await supabase
      .from('stock_order_items')
      .insert(orderItems)
      .select()

    if (itemsError) throw itemsError

    // Fetch complete order with items
    const { data: completeOrder, error: fetchError } = await supabase
      .from('stock_orders')
      .select('*')
      .eq('id', order.id)
      .single()

    if (fetchError) throw fetchError

    return NextResponse.json({
      success: true,
      data: { ...completeOrder, items: insertedItems || [] }
    })
  } catch (error: any) {
    console.error('[API] Error creating stock order:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create stock order' },
      { status: 500 }
    )
  }
}

// PUT - Update stock order
export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Update order
    const { data: order, error: orderError } = await supabase
      .from('stock_orders')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (orderError) throw orderError

    // If items are provided, update them
    if (body.items && Array.isArray(body.items)) {
      // Delete existing items
      await supabase
        .from('stock_order_items')
        .delete()
        .eq('stock_order_id', id)

      // Insert new items
      const orderItems = body.items.map((item: any) => ({
        stock_order_id: id,
        product_id: item.product_id || null,
        variant_id: item.variant_id || null,
        product_name: item.product_name,
        product_sku: item.product_sku || null,
        product_description: item.product_description || null,
        variant_attributes: item.variant_attributes || null,
        quantity: parseInt(item.quantity),
        unit_cost: parseFloat(item.unit_cost) || 0,
        line_total: parseFloat(item.quantity) * (parseFloat(item.unit_cost) || 0),
        unit_weight_kg: item.unit_weight_kg ? parseFloat(item.unit_weight_kg) : null,
        unit_length_cm: item.unit_length_cm ? parseFloat(item.unit_length_cm) : null,
        unit_width_cm: item.unit_width_cm ? parseFloat(item.unit_width_cm) : null,
        unit_height_cm: item.unit_height_cm ? parseFloat(item.unit_height_cm) : null,
        notes: item.notes || null
      }))

      await supabase
        .from('stock_order_items')
        .insert(orderItems)
    }

    // Fetch complete order with items
    const { data: completeOrder, error: fetchError } = await supabase
      .from('stock_orders')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    const { data: items } = await supabase
      .from('stock_order_items')
      .select('*')
      .eq('stock_order_id', id)

    return NextResponse.json({
      success: true,
      data: { ...completeOrder, items: items || [] }
    })
  } catch (error: any) {
    console.error('[API] Error updating stock order:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update stock order' },
      { status: 500 }
    )
  }
}

// DELETE - Delete stock order
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Delete order (items will be cascade deleted)
    const { error } = await supabase
      .from('stock_orders')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Stock order deleted successfully'
    })
  } catch (error: any) {
    console.error('[API] Error deleting stock order:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete stock order' },
      { status: 500 }
    )
  }
}

