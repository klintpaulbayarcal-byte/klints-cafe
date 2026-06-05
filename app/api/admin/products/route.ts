import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// GET all products (admin – includes unavailable)
export async function GET() {
  const session = await getSession()
  if (!session || !['admin', 'staff'].includes(session.role)) {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('category').order('name')

  if (error) return Response.json({ success: false, message: error.message }, { status: 500 })
  return Response.json({ success: true, products: data })
}

// PUT update product
export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session || !['admin', 'staff'].includes(session.role)) {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { id, ...fields } = body
  if (!id) return Response.json({ success: false, message: 'ID required' }, { status: 400 })

  const update: Record<string, unknown> = {}
  if (fields.name        !== undefined) update.name           = fields.name
  if (fields.category    !== undefined) update.category       = fields.category
  if (fields.description !== undefined) update.description    = fields.description
  if (fields.price       !== undefined) update.price          = parseFloat(fields.price)
  if (fields.stock_quantity !== undefined) update.stock_quantity = parseInt(fields.stock_quantity)
  if (fields.image_url   !== undefined) update.image_url      = fields.image_url
  if (fields.is_available !== undefined) update.is_available  = fields.is_available
  if (fields.is_featured !== undefined) update.is_featured    = fields.is_featured

  const { data, error } = await supabaseAdmin
    .from('products').update(update).eq('id', id).select().single()

  if (error) return Response.json({ success: false, message: error.message }, { status: 500 })
  return Response.json({ success: true, product: data })
}

// DELETE product
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ success: false, message: 'Admin only' }, { status: 403 })
  }

  const { id } = await req.json()
  if (!id) return Response.json({ success: false, message: 'ID required' }, { status: 400 })

  const { error } = await supabaseAdmin.from('products').delete().eq('id', id)
  if (error) return Response.json({ success: false, message: error.message }, { status: 500 })
  return Response.json({ success: true, message: 'Product deleted' })
}
