import { NextRequest, NextResponse } from 'next/server'
import { getOrderByNumber } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  try {
    const { orderNumber } = await params
    const order = await getOrderByNumber(orderNumber)

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada.' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (err) {
    console.error('Error fetching order:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
