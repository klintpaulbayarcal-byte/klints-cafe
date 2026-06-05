import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['admin', 'staff'].includes(session.role)) {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { report_date, shift, total_sales, total_orders, cash_on_hand, notes } = body

  const { data, error } = await supabaseAdmin.from('sales_reports').insert({
    staff_id:    session.id,
    staff_name:  session.full_name,
    report_date: report_date || new Date().toISOString().split('T')[0],
    shift:       shift || 'Full Day',
    total_sales: parseFloat(total_sales) || 0,
    total_orders: parseInt(total_orders) || 0,
    cash_on_hand: parseFloat(cash_on_hand) || 0,
    notes:       notes || '',
    is_read:     false,
  }).select().single()

  if (error) return Response.json({ success: false, message: error.message }, { status: 500 })
  return Response.json({ success: true, report: data })
}

export async function GET() {
  const session = await getSession()
  if (!session || !['admin', 'staff'].includes(session.role)) {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  const query = supabaseAdmin
    .from('sales_reports')
    .select('*')
    .order('submitted_at', { ascending: false })

  // Staff see only their own reports
  const finalQ = session.role === 'staff'
    ? query.eq('staff_id', session.id)
    : query

  const { data, error } = await finalQ
  if (error) return Response.json({ success: false, message: error.message }, { status: 500 })
  return Response.json({ success: true, reports: data })
}
