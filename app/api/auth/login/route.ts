import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { signToken, setSessionCookie, SessionUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username?.trim() || !password?.trim()) {
      return Response.json({ success: false, message: 'Username and password are required' }, { status: 400 })
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', username.trim())
      .single()

    if (error || !user) {
      return Response.json({ success: false, message: 'Invalid username or password' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return Response.json({ success: false, message: 'Invalid username or password' }, { status: 401 })
    }

    const session: SessionUser = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    }

    const token = await signToken(session)
    setSessionCookie(token)

    return Response.json({
      success: true,
      message: 'Login successful',
      user: session,
    })
  } catch (err) {
    console.error('Login error:', err)
    return Response.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
