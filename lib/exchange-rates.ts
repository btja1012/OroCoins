// Tasas de cambio en tiempo real usando open.er-api.com
// Gratuito, sin API key requerida, soporta ~160 monedas incluyendo VES
// Monedas usadas en OroCoins:
//   USD (Ecuador)    = 1.0 sin conversión
//   MXN (México)     → tasa desde API
//   COP (Colombia)   → tasa desde API
//   VES (Venezuela)  → tasa desde API

export async function getUSDRates(): Promise<Record<string, number>> {
  const base: Record<string, number> = { USD: 1 }

  try {
    const res = await fetch(
      'https://open.er-api.com/v6/latest/USD',
      { next: { revalidate: 3600 } } // cache 1 hora
    )

    if (!res.ok) return base

    const data = await res.json()
    const rates = data?.rates ?? {}

    for (const currency of ['MXN', 'COP', 'VES', 'CRC']) {
      if (typeof rates[currency] === 'number') {
        base[currency] = rates[currency]
      }
    }
  } catch {
    // Si falla la API, retornar solo USD=1
  }

  return base
}

// Convierte un monto en moneda local a USD
// Retorna null si la moneda no tiene tasa disponible
export function localToUSD(
  amount: number,
  currencyCode: string,
  rates: Record<string, number>
): number | null {
  if (currencyCode === 'USD') return amount
  const rate = rates[currencyCode]
  if (!rate) return null
  return amount / rate
}
