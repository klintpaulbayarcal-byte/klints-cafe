import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('is_available', true)
    .order('category')
    .order('name')

  if (error) return Response.json({ success: false, message: error.message }, { status: 500 })
  return Response.json({ success: true, products: data })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['admin', 'staff'].includes(session.role)) {
    return Response.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { name, category, description, price, stock_quantity, image_url, is_available, is_featured } = body

  if (!name?.trim() || !price) {
    return Response.json({ success: false, message: 'Name and price are required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.from('products').insert({
    name: name.trim(),
    category: category || 'coffee',
    description: description || '',
    price: parseFloat(price),
    stock_quantity: parseInt(stock_quantity) || 0,
    image_url: image_url || '',
    is_available: is_available !== false,
    is_featured: is_featured === true,
  }).select().single()

  if (error) return Response.json({ success: false, message: error.message }, { status: 500 })
  return Response.json({ success: true, product: data })
}
