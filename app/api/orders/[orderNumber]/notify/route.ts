import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getOrderByNumber } from '@/lib/db'
import { sendPushToSeller } from '@/lib/push'
import { formatCoins, formatPrice } from '@/lib/data'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const session = await getSession()
  if (!session || !['admin', 'super_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const { orderNumber } = await params
  const order = await getOrderByNumber(orderNumber)

  if (!order) return NextResponse.json({ error: 'Orden no encontrada.' }, { status: 404 })
  if (order.status !== 'pending') {
    return NextResponse.json({ error: 'Solo se pueden re-notificar pedidos pendientes.' }, { status: 400 })
  }

  sendPushToSeller(order.seller, {
    title: `🔔 Pedido pendiente — ${order.seller}`,
    body: `${formatCoins(order.package_coins)} 🪙 · ${formatPrice(Number(order.package_price), order.currency_code)} · Ref: ${order.game_username}`,
    url: '/admin/dashboard',
  })

  return NextResponse.json({ ok: true })
}
