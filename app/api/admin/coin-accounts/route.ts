import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { updateCoinAccountBalance, addCoinAccountBalance, getCoinAccounts } from '@/lib/admin-db'

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

  const VALID_ACCOUNTS = ['OrosPV1', 'OrosPV2']
  const MAX_BALANCE = 50_000_000

  if (!VALID_ACCOUNTS.includes(name)) {
    return NextResponse.json({ error: 'Cuenta inválida.' }, { status: 400 })
  }
  if (typeof balance !== 'number' || !isFinite(balance) || balance < 0 || balance > MAX_BALANCE) {
    return NextResponse.json({ error: `El saldo debe estar entre 0 y ${MAX_BALANCE.toLocaleString()}.` }, { status: 400 })
  }

  await updateCoinAccountBalance(name, balance, session.username)
  return NextResponse.json({ ok: true })
}

// Admin (non-super) can add coins — incremental recharge only
export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role === 'seller') {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const { name, addCoins } = await request.json()

  const VALID_ACCOUNTS = ['OrosPV1', 'OrosPV2']
  const MAX_ADD = 10_000_000

  if (!VALID_ACCOUNTS.includes(name)) {
    return NextResponse.json({ error: 'Cuenta inválida.' }, { status: 400 })
  }
  if (typeof addCoins !== 'number' || !isFinite(addCoins) || addCoins <= 0 || addCoins > MAX_ADD) {
    return NextResponse.json({ error: `Las monedas a agregar deben estar entre 1 y ${MAX_ADD.toLocaleString()}.` }, { status: 400 })
  }

  await addCoinAccountBalance(name, addCoins, session.username)
  return NextResponse.json({ ok: true })
}
