import { NextRequest, NextResponse } from 'next/server'
import { getOrderByNumber, sql } from '@/lib/db'
import { getSession } from '@/lib/session'
import { sendPushToAdmins, sendPushToSeller } from '@/lib/push'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  try {
    const { orderNumber } = await params
    const order = await getOrderByNumber(orderNumber)
    if (!order) return NextResponse.json({ error: 'Orden no encontrada.' }, { status: 404 })
    return NextResponse.json(order)
  } catch (err) {
    console.error('Error fetching order:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  try {
    const { orderNumber } = await params
    const { status, cancelReason } = await request.json()

    if (!['completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 })
    }
    if (cancelReason && (typeof cancelReason !== 'string' || cancelReason.length > 300)) {
      return NextResponse.json({ error: 'La razón de cancelación no puede superar 300 caracteres.' }, { status: 400 })
    }

    const db = sql()
    const isAdmin = session.role === 'admin' || session.role === 'super_admin'

    // Sellers can only update their own orders
    if (!isAdmin) {
      const order = await db`SELECT seller FROM orders WHERE order_number = ${orderNumber} LIMIT 1`
      if (!order[0] || order[0].seller !== session.sellerName) {
        return NextResponse.json({ error: 'Sin permisos.' }, { status: 403 })
      }
    }

    const updated = await db`
      UPDATE orders
      SET status = ${status}, updated_at = NOW(),
          approved_by = ${session.sellerName ?? session.username},
          approved_at = NOW(),
          cancel_reason = ${status === 'cancelled' && cancelReason ? cancelReason.trim() : null}
      WHERE order_number = ${orderNumber} AND status = 'pending'
      RETURNING seller, package_coins, currency_code
    `

    if (!updated[0]) {
      return NextResponse.json({ error: 'El pedido ya fue procesado o no existe.' }, { status: 409 })
    }

    // Push notification on approval/rejection (non-blocking)
    if (updated[0]) {
      const { seller, package_coins, currency_code } = updated[0]
      const action = status === 'completed' ? 'aprobado' : 'rechazado'
      const approver = session.sellerName ?? session.username
      const payload = {
        title: `${status === 'completed' ? '✅' : '❌'} Pedido ${action}`,
        body: `${approver} ${action} ${package_coins} 🪙 (${orderNumber})`,
        url: '/admin/dashboard',
      }
      if (isAdmin) {
        // Admin approved → notify the colector
        sendPushToSeller(seller, payload)
      } else {
        // Colector approved → notify all admins
        sendPushToAdmins(session.username, payload)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error updating order:', err)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}
