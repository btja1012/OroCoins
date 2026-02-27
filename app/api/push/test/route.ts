import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { sendPushToUser } from '@/lib/push'
import { sql } from '@/lib/db'

export async function POST() {
  const session = await getSession()
  if (!session || !['admin', 'super_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const db = sql()
  const user = await db`SELECT id FROM admin_users WHERE username = ${session.username} LIMIT 1`
  if (!user[0]) return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 })

  const result = await sendPushToUser(user[0].id, {
    title: '🪙 Prueba de notificación',
    body: 'Si ves esto, las notificaciones funcionan correctamente.',
  })

  return NextResponse.json(result)
}
