import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || !['admin', 'staff'].includes(session.role)) {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`*, order_items(*)`)
    .eq('id', params.id)
    .single()

  if (error) return Response.json({ success: false, message: 'Order not found' }, { status: 404 })
  return Response.json({ success: true, order: data })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || !['admin', 'staff'].includes(session.role)) {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { status } = body
  const validStatuses = ['Received', 'Processing', 'Out for Delivery', 'Ready', 'Completed', 'Cancelled']
  if (!validStatuses.includes(status)) {
    return Response.json({ success: false, message: 'Invalid status' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select().single()

  if (error) return Response.json({ success: false, message: error.message }, { status: 500 })
  return Response.json({ success: true, order: data })
}
