import { NextResponse } from 'next/server'
import { getUSDRates } from '@/lib/exchange-rates'

export async function GET() {
  const rates = await getUSDRates()
  return NextResponse.json(rates, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=300' },
  })
}
