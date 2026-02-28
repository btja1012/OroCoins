import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { sql } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const db = sql()
  const [row] = await db`
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_count,
      COALESCE(MAX(id), 0)::int AS last_order_id
    FROM orders
  `

  return NextResponse.json({
    pendingCount: row?.pending_count ?? 0,
    lastOrderId: row?.last_order_id ?? 0,
  })
}
