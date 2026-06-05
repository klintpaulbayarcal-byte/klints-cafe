import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const session = await getSession()
  if (!session || !['admin', 'staff'].includes(session.role)) {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  const yearStart  = `${today.getFullYear()}-01-01`

  const [pending, todayOrders, totalOrders, todayRev, monthRev, yearRev, inProgress, pickup, delivery, lowStock] =
    await Promise.all([
      supabaseAdmin.from('orders').select('id', { count: 'exact' }).in('status', ['Received', 'Processing']),
      supabaseAdmin.from('orders').select('id', { count: 'exact' }).gte('created_at', todayStr),
      supabaseAdmin.from('orders').select('id', { count: 'exact' }),
      supabaseAdmin.from('orders').select('total').gte('created_at', todayStr),
      supabaseAdmin.from('orders').select('total').gte('created_at', monthStart),
      supabaseAdmin.from('orders').select('total').gte('created_at', yearStart),
      supabaseAdmin.from('orders').select('id', { count: 'exact' }).eq('status', 'Processing'),
      supabaseAdmin.from('orders').select('id', { count: 'exact' }).eq('order_type', 'pickup'),
      supabaseAdmin.from('orders').select('id', { count: 'exact' }).eq('order_type', 'delivery'),
      supabaseAdmin.from('products').select('id, name, stock_quantity').lte('stock_quantity', 5).eq('is_available', true),
    ])

  const sum = (rows: { total: number }[] | null) => (rows ?? []).reduce((a, r) => a + Number(r.total), 0)

  return Response.json({
    success: true,
    stats: {
      pending:      pending.count ?? 0,
      todayOrders:  todayOrders.count ?? 0,
      totalOrders:  totalOrders.count ?? 0,
      todayRevenue: sum(todayRev.data as { total: number }[]),
      monthRevenue: sum(monthRev.data as { total: number }[]),
      yearRevenue:  sum(yearRev.data as { total: number }[]),
      inProgress:   inProgress.count ?? 0,
      pickup:       pickup.count ?? 0,
      delivery:     delivery.count ?? 0,
      liveActive:   (pending.count ?? 0) + (inProgress.count ?? 0),
      lowStock:     lowStock.data ?? [],
    },
  })
}
