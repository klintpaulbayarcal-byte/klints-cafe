import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'klints-cafe-secret-key-change-this-in-production-!!!'
)
const COOKIE = 'kc_session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface SessionUser {
  id: number
  username: string
  full_name: string
  email: string
  role: 'admin' | 'staff' | 'user'
}

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

export function setSessionCookie(token: string) {
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })
}

export function clearSessionCookie() {
  cookies().set(COOKIE, '', { maxAge: 0, path: '/' })
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export function unauthorized() {
  return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
}

export function forbidden() {
  return Response.json({ success: false, message: 'Forbidden' }, { status: 403 })
}
