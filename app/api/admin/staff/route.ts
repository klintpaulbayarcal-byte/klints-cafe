import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ success: false, message: 'Admin only' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, full_name, username, email, role, created_at')
    .order('created_at')

  if (error) return Response.json({ success: false, message: error.message }, { status: 500 })
  return Response.json({ success: true, staff: data })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ success: false, message: 'Admin only' }, { status: 403 })
  }

  const { full_name, email, username, password, role } = await req.json()

  if (!full_name?.trim() || !email?.trim() || !username?.trim() || !password?.trim()) {
    return Response.json({ success: false, message: 'All fields are required' }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 10)

  const { data, error } = await supabaseAdmin.from('users').insert({
    full_name: full_name.trim(),
    email: email.trim(),
    username: username.trim(),
    password: hash,
    role: role || 'staff',
  }).select('id, full_name, username, email, role').single()

  if (error) {
    const msg = error.message.includes('unique') ? 'Username or email already exists' : error.message
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
  return Response.json({ success: true, user: data })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ success: false, message: 'Admin only' }, { status: 403 })
  }

  const { id, role, password } = await req.json()
  if (!id) return Response.json({ success: false, message: 'ID required' }, { status: 400 })

  const update: Record<string, string> = {}
  if (role)     update.role     = role
  if (password) update.password = await bcrypt.hash(password, 10)

  const { data, error } = await supabaseAdmin
    .from('users').update(update).eq('id', id)
    .select('id, full_name, username, email, role').single()

  if (error) return Response.json({ success: false, message: error.message }, { status: 500 })
  return Response.json({ success: true, user: data })
}
