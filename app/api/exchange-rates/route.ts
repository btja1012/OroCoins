import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getUSDRates } from '@/lib/exchange-rates'
import { getAppSetting } from '@/lib/admin-db'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const [rates, vesRateStr] = await Promise.all([
    getUSDRates(),
    getAppSetting('ves_rate'),
  ])

  if (vesRateStr) {
    const vesRate = parseFloat(vesRateStr)
    if (vesRate > 0) rates.VES = vesRate
  }

  return NextResponse.json(rates, {
    headers: { 'Cache-Control': 'private, max-age=300' },
  })
}
