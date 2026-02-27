import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export interface SessionUser {
  id: number
  username: string
  role: 'super_admin' | 'admin' | 'seller' | 'demo'
  sellerName?: string
}

export const SESSION_COOKIE = 'opv_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function getSecret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET is not set')
  return new TextEncoder().encode(s)
}

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT(user as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}
