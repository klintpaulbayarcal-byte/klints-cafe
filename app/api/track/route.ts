import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orderId  = searchParams.get('order_id')
  const identity = searchParams.get('identity')

  if (!orderId || !identity) {
    return Response.json({ success: false, message: 'Order ID and name/phone are required' }, { status: 400 })
  }

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select(`*, order_items(name, quantity, price)`)
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return Response.json({ success: false, message: 'Order not found' }, { status: 404 })
  }

  const id = identity.trim().toLowerCase()
  const nameMatch  = order.customer_name?.toLowerCase().includes(id)
  const phoneMatch = order.customer_phone?.includes(identity.trim())

  if (!nameMatch && !phoneMatch) {
    return Response.json({ success: false, message: 'Order details do not match' }, { status: 403 })
  }

  const statusSteps = ['Received', 'Processing', 'Out for Delivery', 'Ready', 'Completed']
  const currentIdx  = statusSteps.indexOf(order.status)

  const timeline = statusSteps.map((step, idx) => ({
    status: step,
    completed: idx <= currentIdx,
    active: idx === currentIdx,
  }))

  return Response.json({ success: true, order, timeline })
}
