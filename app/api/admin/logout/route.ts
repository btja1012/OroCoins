import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifyToken } from '@/lib/session'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value

  if (token) {
    const session = await verifyToken(token)
    if (session) {
      try {
        const db = sql()
        await db`UPDATE admin_users SET last_logout_at = NOW() WHERE id = ${session.id}`
      } catch {
        // Don't block logout if DB update fails
      }
    }
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.delete(SESSION_COOKIE)
  return response
}
