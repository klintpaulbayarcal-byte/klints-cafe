import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// Mark sales reports as read
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ success: false, message: 'Admin only' }, { status: 403 })
  }

  const { ids } = await req.json()
  if (ids) {
    await supabaseAdmin.from('sales_reports').update({ is_read: true }).in('id', ids)
  } else {
    await supabaseAdmin.from('sales_reports').update({ is_read: true }).eq('is_read', false)
  }
  return Response.json({ success: true })
}
