import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getAppSetting, setAppSetting, deleteAppSetting } from '@/lib/admin-db'

const RATE_KEYS = ['crc_rate', 'mxn_rate', 'cop_rate', 'ves_rate'] as const
type RateKey = typeof RATE_KEYS[number]

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const values = await Promise.all(RATE_KEYS.map((k) => getAppSetting(k)))
  const result: Record<string, string> = {}
  RATE_KEYS.forEach((k, i) => { if (values[i]) result[k] = values[i]! })

  return NextResponse.json(result)
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const { key, value } = await request.json()

  if (!(RATE_KEYS as readonly string[]).includes(key)) {
    return NextResponse.json({ error: 'Clave inválida.' }, { status: 400 })
  }

  const num = parseFloat(value)
  if (!isFinite(num) || num <= 0 || num > 100_000_000) {
    return NextResponse.json({ error: 'Tasa inválida. Debe ser un número positivo.' }, { status: 400 })
  }

  await setAppSetting(key as RateKey, String(num), session.username)
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const { key } = await request.json()

  if (!(RATE_KEYS as readonly string[]).includes(key)) {
    return NextResponse.json({ error: 'Clave inválida.' }, { status: 400 })
  }

  await deleteAppSetting(key)
  return NextResponse.json({ ok: true })
}
