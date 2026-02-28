import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  try {
    const sub = await request.json()

    const endpoint = sub?.endpoint
    const p256dh = sub?.keys?.p256dh
    const auth = sub?.keys?.auth

    if (
      typeof endpoint !== 'string' || !endpoint.startsWith('https://') || endpoint.length > 500 ||
      typeof p256dh !== 'string' || p256dh.length < 10 || p256dh.length > 200 ||
      typeof auth !== 'string' || auth.length < 10 || auth.length > 100
    ) {
      return NextResponse.json({ error: 'Suscripción inválida.' }, { status: 400 })
    }

    const db = sql()
    await db`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES (${session.id}, ${endpoint}, ${p256dh}, ${auth})
      ON CONFLICT (user_id, endpoint) DO UPDATE
        SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Push subscribe error:', err)
    return NextResponse.json({ error: 'Error al suscribir.' }, { status: 500 })
  }
}
