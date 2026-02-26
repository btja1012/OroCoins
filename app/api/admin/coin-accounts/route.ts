import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { updateCoinAccountBalance, getCoinAccounts } from '@/lib/admin-db'

export async function GET() {
  const session = await getSession()
  if (!session || session.role === 'seller') {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }
  const accounts = await getCoinAccounts()
  return NextResponse.json(accounts)
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Solo el super admin puede editar las cuentas.' }, { status: 403 })
  }

  const { name, balance } = await request.json()

  if (!name || typeof balance !== 'number' || balance < 0) {
    return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 })
  }

  await updateCoinAccountBalance(name, balance)
  return NextResponse.json({ ok: true })
}
