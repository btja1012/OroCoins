import { NextRequest, NextResponse } from 'next/server'
import { getOrderByNumber, sql } from '@/lib/db'
import { getSession } from '@/lib/session'

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
    const { status } = await request.json()

    if (!['completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 })
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

    await db`
      UPDATE orders SET status = ${status}, updated_at = NOW()
      WHERE order_number = ${orderNumber}
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error updating order:', err)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}
