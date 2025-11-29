import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// GET - Fetch procurement batches
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const batchType = searchParams.get('batch_type')

    const supabase = createAdminClient()

    let query = supabase
      .from('procurement_batches')
      .select(`
        *,
        items:procurement_batch_items(
          *,
          queue_item:procurement_queue(
            *,
            product:products(*),
            variant:product_variants(*)
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (batchType) {
      query = query.eq('batch_type', batchType)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Procurement Batches API] Error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error: any) {
    console.error('[Procurement Batches API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch procurement batches' },
      { status: 500 }
    )
  }
}

// POST - Create new procurement batch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { batch_type, queue_item_ids } = body

    if (!batch_type || !queue_item_ids || !Array.isArray(queue_item_ids) || queue_item_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Batch type and queue item IDs are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Generate batch number
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const week = Math.ceil(new Date().getDate() / 7)
    const batchNumber = batch_type === 'weekly' 
      ? `PROC-${year}-W${String(week).padStart(2, '0')}`
      : `PROC-${year}-M${month}`

    // Create batch
    const { data: batch, error: batchError } = await supabase
      .from('procurement_batches')
      .insert({
        batch_number: batchNumber,
        batch_type,
        status: 'draft',
        total_items: queue_item_ids.length
      })
      .select()
      .single()

    if (batchError) {
      console.error('[Procurement Batches API] Error creating batch:', batchError)
      return NextResponse.json(
        { success: false, error: batchError.message },
        { status: 500 }
      )
    }

    // Get queue items to calculate total quantity
    const { data: queueItems } = await supabase
      .from('procurement_queue')
      .select('id, quantity_needed')
      .in('id', queue_item_ids)
      .eq('status', 'pending')

    const totalQuantity = queueItems?.reduce((sum, item) => sum + item.quantity_needed, 0) || 0

    // Create batch items
    const batchItems = queue_item_ids.map((queueItemId: string) => {
      const queueItem = queueItems?.find(qi => qi.id === queueItemId)
      return {
        batch_id: batch.id,
        queue_item_id: queueItemId,
        quantity: queueItem?.quantity_needed || 0
      }
    })

    const { error: itemsError } = await supabase
      .from('procurement_batch_items')
      .insert(batchItems)

    if (itemsError) {
      console.error('[Procurement Batches API] Error creating batch items:', itemsError)
      // Rollback batch creation
      await supabase.from('procurement_batches').delete().eq('id', batch.id)
      return NextResponse.json(
        { success: false, error: itemsError.message },
        { status: 500 }
      )
    }

    // Update batch with total quantity
    await supabase
      .from('procurement_batches')
      .update({ total_quantity: totalQuantity })
      .eq('id', batch.id)

    // Update queue items status to 'sent_to_agent'
    await supabase
      .from('procurement_queue')
      .update({
        status: 'sent_to_agent',
        procurement_batch_id: batch.id,
        sent_to_agent_at: new Date().toISOString()
      })
      .in('id', queue_item_ids)

    // Fetch complete batch with items
    const { data: completeBatch } = await supabase
      .from('procurement_batches')
      .select(`
        *,
        items:procurement_batch_items(
          *,
          queue_item:procurement_queue(
            *,
            product:products(*),
            variant:product_variants(*)
          )
        )
      `)
      .eq('id', batch.id)
      .single()

    return NextResponse.json({
      success: true,
      data: completeBatch
    })
  } catch (error: any) {
    console.error('[Procurement Batches API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create procurement batch' },
      { status: 500 }
    )
  }
}

// PUT - Update procurement batch
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('procurement_batches')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Procurement Batches API] Error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('[Procurement Batches API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update procurement batch' },
      { status: 500 }
    )
  }
}

