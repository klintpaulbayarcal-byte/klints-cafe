import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ success: false, message: 'Admin only' }, { status: 403 })
  }

  const today = new Date()
  const todayStr   = today.toISOString().split('T')[0]
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  const yearStart  = `${today.getFullYear()}-01-01`
  const weekStart  = new Date(today); weekStart.setDate(today.getDate() - 6)

  const [todayOrders, monthOrders, yearOrders, weeklyData, topProducts, paymentData, reportsData] =
    await Promise.all([
      supabaseAdmin.from('orders').select('total').gte('created_at', todayStr).neq('status', 'Cancelled'),
      supabaseAdmin.from('orders').select('total').gte('created_at', monthStart).neq('status', 'Cancelled'),
      supabaseAdmin.from('orders').select('total').gte('created_at', yearStart).neq('status', 'Cancelled'),
      supabaseAdmin.from('orders').select('total, created_at').gte('created_at', weekStart.toISOString()).neq('status', 'Cancelled'),
      supabaseAdmin.from('order_items').select('name, product_id, quantity, price').limit(200),
      supabaseAdmin.from('orders').select('payment_method, total').neq('status', 'Cancelled'),
      supabaseAdmin.from('sales_reports').select('*').eq('is_read', false),
    ])

  const sum = (rows: { total: number }[] | null) => (rows ?? []).reduce((a, r) => a + Number(r.total), 0)

  // Weekly revenue
  const weeklyMap: Record<string, number> = {}
  ;(weeklyData.data ?? []).forEach((o) => {
    const day = o.created_at.split('T')[0]
    weeklyMap[day] = (weeklyMap[day] ?? 0) + Number(o.total)
  })
  const weeklyChart = Object.entries(weeklyMap).map(([date, total]) => ({ date, total })).sort((a, b) => a.date.localeCompare(b.date))

  // Top products by revenue
  const productTotals: Record<string, { name: string; units: number; sales: number }> = {}
  ;(topProducts.data ?? []).forEach((item) => {
    const key = item.name
    if (!productTotals[key]) productTotals[key] = { name: key, units: 0, sales: 0 }
    productTotals[key].units += item.quantity
    productTotals[key].sales += item.quantity * item.price
  })
  const topList = Object.values(productTotals).sort((a, b) => b.sales - a.sales).slice(0, 5)

  // Payment breakdown
  const payMap: Record<string, { method: string; orders: number; total: number }> = {}
  ;(paymentData.data ?? []).forEach((o) => {
    const m = o.payment_method || 'cod'
    if (!payMap[m]) payMap[m] = { method: m, orders: 0, total: 0 }
    payMap[m].orders += 1
    payMap[m].total  += Number(o.total)
  })

  return Response.json({
    success: true,
    todayOrders:  todayOrders.data?.length ?? 0,
    todayRevenue: sum(todayOrders.data as { total: number }[]),
    monthRevenue: sum(monthOrders.data as { total: number }[]),
    yearRevenue:  sum(yearOrders.data as { total: number }[]),
    pendingTasks: 0,
    weeklyChart,
    topProducts:  topList,
    paymentBreakdown: Object.values(payMap),
    unreadReports: reportsData.data?.length ?? 0,
  })
}
