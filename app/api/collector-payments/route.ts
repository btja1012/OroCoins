import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import {
  createCollectorPayment,
  getCollectorPayments,
  getConfirmedPaymentsTotalUSD,
} from '@/lib/admin-db'
import { sendPushToSuperAdmins } from '@/lib/push'

// GET — colector obtiene sus propios pagos + total confirmado
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'seller') {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const sellerName = session.sellerName
  if (!sellerName) {
    return NextResponse.json({ error: 'Colector sin nombre asignado.' }, { status: 400 })
  }

  const [payments, confirmedTotalUsd] = await Promise.all([
    getCollectorPayments(sellerName),
    getConfirmedPaymentsTotalUSD(sellerName),
  ])

  return NextResponse.json({ payments, confirmedTotalUsd })
}

// POST — colector reporta un nuevo pago
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'seller') {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const sellerName = session.sellerName
  if (!sellerName) {
    return NextResponse.json({ error: 'Colector sin nombre asignado.' }, { status: 400 })
  }

  const body = await request.json()
  const { amount_usd, reference, notes } = body

  const amount = parseFloat(amount_usd)
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'El monto debe ser mayor a 0.' }, { status: 400 })
  }
  if (!reference?.trim()) {
    return NextResponse.json({ error: 'La referencia de Binance es requerida.' }, { status: 400 })
  }

  const payment = await createCollectorPayment({
    sellerName,
    amountUsd: amount,
    reference: reference.trim(),
    notes: notes?.trim() || undefined,
    submittedBy: session.username,
  })

  sendPushToSuperAdmins(session.username, {
    title: `💳 Pago reportado — ${sellerName}`,
    body: `$${amount.toFixed(2)} USD · Ref: ${reference.trim()}`,
    url: '/admin/dashboard',
  })

  return NextResponse.json(payment, { status: 201 })
}
