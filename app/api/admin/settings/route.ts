import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getAppSetting, setAppSetting } from '@/lib/admin-db'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const vesRate = await getAppSetting('ves_rate')
  return NextResponse.json({ ves_rate: vesRate })
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const { key, value } = await request.json()

  if (key !== 'ves_rate') {
    return NextResponse.json({ error: 'Clave inválida.' }, { status: 400 })
  }

  const num = parseFloat(value)
  if (!isFinite(num) || num <= 0 || num > 10_000_000) {
    return NextResponse.json({ error: 'Tasa inválida. Debe ser un número positivo.' }, { status: 400 })
  }

  await setAppSetting(key, String(num), session.username)
  return NextResponse.json({ ok: true })
}
