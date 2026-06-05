import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ success: false, message: 'Admin only' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const rating    = searchParams.get('rating')
  const productId = searchParams.get('product_id')
  const dateFrom  = searchParams.get('date_from')
  const dateTo    = searchParams.get('date_to')

  let query = supabaseAdmin
    .from('reviews').select('*').order('created_at', { ascending: false })

  if (rating && rating !== 'all') query = query.eq('rating', parseInt(rating))
  if (productId && productId !== 'all') query = query.eq('product_id', parseInt(productId))
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo)   query = query.lte('created_at', dateTo + 'T23:59:59')

  const { data, error } = await query
  if (error) return Response.json({ success: false, message: error.message }, { status: 500 })
  return Response.json({ success: true, reviews: data })
}
