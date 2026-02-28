import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { reviewCollectorPayment, getCollectorPaymentById } from '@/lib/admin-db'
import { sendPushToSeller } from '@/lib/push'

const MAX_REASON_LENGTH = 300

// PATCH — super admin confirma o rechaza un pago
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Solo el super admin puede revisar pagos.' }, { status: 403 })
  }

  const { id } = await params
  const paymentId = parseInt(id)
  if (isNaN(paymentId)) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 })
  }

  const body = await request.json()
  const { status, reject_reason } = body

  if (status !== 'confirmed' && status !== 'rejected') {
    return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 })
  }

  const rawReason = typeof reject_reason === 'string' ? reject_reason.trim() : ''
  if (rawReason.length > MAX_REASON_LENGTH) {
    return NextResponse.json({ error: `La razón no puede superar ${MAX_REASON_LENGTH} caracteres.` }, { status: 400 })
  }

  const payment = await getCollectorPaymentById(paymentId)
  if (!payment) {
    return NextResponse.json({ error: 'Pago no encontrado.' }, { status: 404 })
  }
  if (payment.status !== 'pending') {
    return NextResponse.json({ error: 'Este pago ya fue revisado.' }, { status: 409 })
  }

  await reviewCollectorPayment(paymentId, status, session.username, rawReason || undefined)

  if (status === 'confirmed') {
    sendPushToSeller(payment.seller_name, {
      title: `✅ Pago confirmado — $${Number(payment.amount_usd).toFixed(2)} USD`,
      body: `Tu pago fue confirmado por ${session.username}.`,
      url: '/admin/dashboard',
    })
  } else {
    sendPushToSeller(payment.seller_name, {
      title: `❌ Pago rechazado`,
      body: rawReason
        ? `Razón: ${rawReason}`
        : `Tu pago de $${Number(payment.amount_usd).toFixed(2)} USD fue rechazado. Contacta al admin.`,
      url: '/admin/dashboard',
    })
  }

  return NextResponse.json({ ok: true })
}
