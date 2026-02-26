import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  try {
    const sub = await request.json()
    const db = sql()
    await db`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES (${session.id}, ${sub.endpoint}, ${sub.keys.p256dh}, ${sub.keys.auth})
      ON CONFLICT (user_id, endpoint) DO NOTHING
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Push subscribe error:', err)
    return NextResponse.json({ error: 'Error al suscribir.' }, { status: 500 })
  }
}
