import { NextRequest, NextResponse } from 'next/server'
import { getAllSellerStats } from '@/lib/admin-db'
import { getUSDRates, localToUSD } from '@/lib/exchange-rates'
import { sendPushToSeller } from '@/lib/push'

// Sellers to notify and their timezone group
// group A: Venezuela UTC-4  → cron 0 12 * * 1
// group B: Ecuador/Colombia UTC-5 → cron 0 13 * * 1
// group C: Mexico UTC-6    → cron 0 14 * * 1
const SELLER_GROUPS: Record<string, string[]> = {
  A: ['Maga'],
  B: ['Natasha', 'Boster'],
  C: ['Dulius'],
}

const COMMISSION_RATE = 0.03 // 3% sellers keep

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Determine which group to notify based on query param injected by vercel cron path
  // We use a single route with a `group` query param so each cron hits a different URL
  const group = request.nextUrl.searchParams.get('group')
  if (!group || !SELLER_GROUPS[group]) {
    return NextResponse.json({ error: 'Invalid group' }, { status: 400 })
  }

  const sellers = SELLER_GROUPS[group]

  // Fetch stats and exchange rates in parallel
  const [allStats, rates] = await Promise.all([getAllSellerStats(), getUSDRates()])

  const results: { seller: string; sent: boolean; debtUSD: number }[] = []

  for (const sellerName of sellers) {
    // Aggregate all countries/currencies for this seller
    const sellerRows = allStats.filter(
      (s) => s.seller?.toLowerCase() === sellerName.toLowerCase()
    )

    let totalDebtUSD = 0
    for (const row of sellerRows) {
      const usd = localToUSD(Number(row.total_amount), row.currency_code, rates)
      if (usd !== null) {
        totalDebtUSD += usd * (1 - COMMISSION_RATE)
      }
    }

    if (totalDebtUSD <= 0) {
      results.push({ seller: sellerName, sent: false, debtUSD: 0 })
      continue
    }

    const debtFormatted = totalDebtUSD.toLocaleString('es', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    await sendPushToSeller(sellerName, {
      title: '💰 Recordatorio de pago — OrosPV',
      body: `Hola ${sellerName}, debes $${debtFormatted} USD a OrosPV. Por favor realiza el pago vía Binance esta semana.`,
      url: '/',
    })

    results.push({ seller: sellerName, sent: true, debtUSD: totalDebtUSD })
  }

  return NextResponse.json({ ok: true, group, results })
}
