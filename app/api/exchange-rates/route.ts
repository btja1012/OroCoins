import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getUSDRates } from '@/lib/exchange-rates'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const rates = await getUSDRates()
  return NextResponse.json(rates, {
    headers: { 'Cache-Control': 'private, max-age=300' },
  })
}
