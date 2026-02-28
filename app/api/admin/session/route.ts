import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE } from '@/lib/session'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return NextResponse.json({ error: 'No session' }, { status: 401 })

  try {
    // Decode payload without verifying (already verified by middleware)
    const [, payloadB64] = token.split('.')
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())
    return NextResponse.json({ expiresAt: (payload.exp as number) * 1000 })
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
