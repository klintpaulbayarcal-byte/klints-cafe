import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

const TAX_RATE     = 0.10
const DELIVERY_FEE = 50
const SERVICE_FEE  = 10

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customer_name, customer_phone, order_type, payment_method, notes, delivery_address, lat, lng, items } = body

    if (!customer_name?.trim()) {
      return Response.json({ success: false, message: 'Customer name is required' }, { status: 400 })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ success: false, message: 'No items in cart' }, { status: 400 })
    }

    const ids = items.map((i: { product_id: number }) => i.product_id)
    const { data: products, error: prodErr } = await supabaseAdmin
      .from('products').select('*').in('id', ids)

    if (prodErr) return Response.json({ success: false, message: 'Failed to verify products' }, { status: 500 })

    const productMap = Object.fromEntries((products ?? []).map((p) => [p.id, p]))

    let subtotal = 0
    const orderItems: { name: string; quantity: number; price: number; product_id: number }[] = []

    for (const item of items) {
      const product = productMap[item.product_id]
      if (!product) return Response.json({ success: false, message: `Product #${item.product_id} not found` }, { status: 400 })
      if (product.stock_quantity < item.quantity) {
        return Response.json({ success: false, message: `Insufficient stock for ${product.name}` }, { status: 400 })
      }
      subtotal += product.price * item.quantity
      orderItems.push({ product_id: product.id, name: product.name, quantity: item.quantity, price: product.price })
    }

    const isDelivery = order_type === 'delivery'
    const tax    = parseFloat((subtotal * TAX_RATE).toFixed(2))
    const delFee = isDelivery ? DELIVERY_FEE : 0
    const svcFee = SERVICE_FEE
    const total  = parseFloat((subtotal + tax + delFee + svcFee).toFixed(2))

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_name: customer_name.trim(),
        customer_phone: customer_phone?.trim() || '',
        order_type: isDelivery ? 'delivery' : 'pickup',
        payment_method: payment_method || 'cod',
        status: 'Received',
        subtotal, tax, delivery_fee: delFee, service_fee: svcFee, total,
        notes: notes || '',
        delivery_address: delivery_address || '',
        lat: lat ?? null, lng: lng ?? null,
      })
      .select().single()

    if (orderErr) return Response.json({ success: false, message: orderErr.message }, { status: 500 })

    const { error: itemsErr } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems.map((oi) => ({ ...oi, order_id: order.id })))

    if (itemsErr) return Response.json({ success: false, message: itemsErr.message }, { status: 500 })

    // Decrement stock
    for (const item of orderItems) {
      await supabaseAdmin.from('products')
        .update({ stock_quantity: productMap[item.product_id].stock_quantity - item.quantity })
        .eq('id', item.product_id)
    }

    return Response.json({ success: true, order_id: order.id, order_code: `#${order.id}`, total })
  } catch (err) {
    console.error('Place order error:', err)
    return Response.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['admin', 'staff'].includes(session.role)) {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status   = searchParams.get('status')
  const type     = searchParams.get('type')
  const dateFrom = searchParams.get('date_from')
  const dateTo   = searchParams.get('date_to')
  const search   = searchParams.get('search')

  let query = supabaseAdmin
    .from('orders')
    .select(`*, order_items(id, name, quantity, price, product_id)`)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)
  if (type   && type   !== 'all') query = query.eq('order_type', type)
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo)   query = query.lte('created_at', dateTo + 'T23:59:59')
  if (search)   query = query.or(
    `customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`
  )

  const { data, error } = await query
  if (error) return Response.json({ success: false, message: error.message }, { status: 500 })
  return Response.json({ success: true, orders: data })
}
