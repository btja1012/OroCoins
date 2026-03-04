import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getUSDRates } from '@/lib/exchange-rates'
import { getAppSetting } from '@/lib/admin-db'

const MANUAL_RATE_KEYS: Record<string, string> = {
  crc_rate: 'CRC',
  mxn_rate: 'MXN',
  cop_rate: 'COP',
  ves_rate: 'VES',
}

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const [rates, ...manualValues] = await Promise.all([
    getUSDRates(),
    ...Object.keys(MANUAL_RATE_KEYS).map((k) => getAppSetting(k)),
  ])

  Object.keys(MANUAL_RATE_KEYS).forEach((key, i) => {
    const str = manualValues[i]
    if (str) {
      const num = parseFloat(str)
      if (num > 0) rates[MANUAL_RATE_KEYS[key]] = num
    }
  })

  return NextResponse.json(rates, {
    headers: { 'Cache-Control': 'private, max-age=300' },
  })
}
