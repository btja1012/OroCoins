import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { sendPushToSeller } from '@/lib/push'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || !['admin', 'super_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const { sellerName } = await request.json()
  if (!sellerName) {
    return NextResponse.json({ error: 'sellerName requerido.' }, { status: 400 })
  }

  await sendPushToSeller(sellerName, {
    title: '🪙 Notificación de prueba',
    body: `Hola ${sellerName}, las notificaciones funcionan correctamente.`,
  })

  return NextResponse.json({ ok: true })
}
