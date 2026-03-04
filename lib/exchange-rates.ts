// Tasas de cambio automáticas
// CRC, MXN, COP → open.er-api.com (gratuito, sin API key, actualiza cada hora)
// VES           → ve.dolarapi.com (tasa BCV en tiempo real) con fallback a open.er-api.com

export async function getUSDRates(): Promise<Record<string, number>> {
  const base: Record<string, number> = { USD: 1 }

  // CRC, MXN, COP + VES como fallback desde open.er-api.com
  try {
    const res = await fetch(
      'https://open.er-api.com/v6/latest/USD',
      { next: { revalidate: 3600 } } // cache 1 hora
    )
    if (res.ok) {
      const data = await res.json()
      const rates = data?.rates ?? {}
      for (const currency of ['CRC', 'MXN', 'COP', 'VES']) {
        if (typeof rates[currency] === 'number') {
          base[currency] = rates[currency]
        }
      }
    }
  } catch { /* silent */ }

  // VES más preciso desde ve.dolarapi.com (tasa BCV actualizada)
  try {
    const res = await fetch(
      'https://ve.dolarapi.com/v1/dolares',
      { next: { revalidate: 1800 } } // cache 30 min
    )
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        const bcv = data.find(
          (d: { fuente?: string }) =>
            typeof d.fuente === 'string' && d.fuente.toLowerCase() === 'bcv'
        )
        const rate = (bcv as { promedio?: number; venta?: number } | undefined)?.promedio
          ?? (bcv as { promedio?: number; venta?: number } | undefined)?.venta
        if (typeof rate === 'number' && rate > 0) {
          base['VES'] = rate
        }
      }
    }
  } catch { /* mantiene el VES de open.er-api.com como fallback */ }

  return base
}

// Retorna las tasas efectivas: automáticas con overrides manuales aplicados
export async function getEffectiveUSDRates(
  getManualOverride: (key: string) => Promise<string | null>
): Promise<Record<string, number>> {
  const MANUAL_KEYS: Record<string, string> = {
    crc_rate: 'CRC', mxn_rate: 'MXN', cop_rate: 'COP', ves_rate: 'VES',
  }
  const [rates, ...manualValues] = await Promise.all([
    getUSDRates(),
    ...Object.keys(MANUAL_KEYS).map((k) => getManualOverride(k)),
  ])
  Object.keys(MANUAL_KEYS).forEach((key, i) => {
    const str = manualValues[i]
    if (str) {
      const num = parseFloat(str)
      if (num > 0) rates[MANUAL_KEYS[key]] = num
    }
  })
  return rates
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
