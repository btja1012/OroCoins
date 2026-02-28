import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getCollectorPayments } from '@/lib/admin-db'

// GET — super admin obtiene todos los pagos (opcionalmente filtrados por status)
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Solo el super admin puede ver los pagos.' }, { status: 403 })
  }

  const payments = await getCollectorPayments()
  return NextResponse.json(payments)
}
