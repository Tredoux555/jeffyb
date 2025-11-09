import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, admin_notes, admin_response } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) {
      updateData.status = status
      if (status !== 'pending') {
        updateData.reviewed_at = new Date().toISOString()
      }
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes
    }

    if (admin_response !== undefined) {
      updateData.admin_response = admin_response
    }

    const { data, error } = await supabase
      .from('product_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating product request:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update product request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('Error in product request PUT API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('product_requests')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting product request:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete product request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error in product request DELETE API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

