export interface Package {
  id: string
  price: number
  coins: number
  popular?: boolean
}

export interface PaymentInfo {
  method: string
  number?: string
  name: string
  extra?: string
}

export interface Country {
  name: string
  slug: string
  flag: string
  currency: string
  currencySymbol: string
  currencyCode: string
  packages: Package[]
  payment: PaymentInfo
}

export const countries: Country[] = [
  {
    name: 'Costa Rica',
    slug: 'costa-rica',
    flag: '🇨🇷',
    currency: 'Colones',
    currencySymbol: '₡',
    currencyCode: 'CRC',
    packages: [
      { id: 'cr-1', price: 650, coins: 1500 },
      { id: 'cr-2', price: 1300, coins: 3000 },
      { id: 'cr-3', price: 1950, coins: 4500 },
      { id: 'cr-4', price: 2600, coins: 6000 },
      { id: 'cr-5', price: 3900, coins: 9000 },
      { id: 'cr-6', price: 6500, coins: 15000, popular: true },
      { id: 'cr-7', price: 13000, coins: 30000 },
    ],
    payment: {
      method: 'Sinpe Móvil',
      number: '83132887',
      name: 'Jose Bejarano',
    },
  },
  {
    name: 'México',
    slug: 'mexico',
    flag: '🇲🇽',
    currency: 'Pesos Mexicanos',
    currencySymbol: '$',
    currencyCode: 'MXN',
    packages: [
      { id: 'mx-1', price: 42, coins: 3000 },
      { id: 'mx-2', price: 105, coins: 7500 },
      { id: 'mx-3', price: 210, coins: 15000, popular: true },
      { id: 'mx-4', price: 1050, coins: 80000 },
      { id: 'mx-5', price: 2100, coins: 160000 },
    ],
    payment: {
      method: 'Transferencia Bancaria',
      number: '4152314195702785',
      name: 'Raul Alberto García',
      extra: 'Tarjeta',
    },
  },
  {
    name: 'Colombia',
    slug: 'colombia',
    flag: '🇨🇴',
    currency: 'Pesos Colombianos',
    currencySymbol: '$',
    currencyCode: 'COP',
    packages: [
      { id: 'co-1', price: 4300, coins: 1500 },
      { id: 'co-2', price: 8600, coins: 3000 },
      { id: 'co-3', price: 21500, coins: 7500 },
      { id: 'co-4', price: 43000, coins: 15000, popular: true },
      { id: 'co-5', price: 114700, coins: 40000 },
      { id: 'co-6', price: 215000, coins: 75000 },
      { id: 'co-7', price: 430000, coins: 150000 },
    ],
    payment: {
      method: 'Nequi / Daviplata',
      number: '3012721590',
      name: 'Daniel Romero',
    },
  },
  {
    name: 'Venezuela',
    slug: 'venezuela',
    flag: '🇻🇪',
    currency: 'Bolívares',
    currencySymbol: 'Bs.',
    currencyCode: 'VES',
    packages: [
      { id: 've-1', price: 800, coins: 1500 },
      { id: 've-2', price: 1600, coins: 3000 },
      { id: 've-3', price: 2400, coins: 4500 },
      { id: 've-4', price: 3200, coins: 6000 },
      { id: 've-5', price: 4800, coins: 9000 },
      { id: 've-6', price: 8000, coins: 15000, popular: true },
      { id: 've-7', price: 16000, coins: 30000 },
    ],
    payment: {
      method: 'Banco Mercantil',
      number: '04147246020',
      name: 'Cédula: 17.770.754',
      extra: 'Tlf: 04147246020',
    },
  },
  {
    name: 'Ecuador',
    slug: 'ecuador',
    flag: '🇪🇨',
    currency: 'Dólares',
    currencySymbol: '$',
    currencyCode: 'USD',
    packages: [
      { id: 'ec-1', price: 1.2, coins: 1500 },
      { id: 'ec-2', price: 2.4, coins: 3000 },
      { id: 'ec-3', price: 3.6, coins: 4500 },
      { id: 'ec-4', price: 12, coins: 15000, popular: true },
      { id: 'ec-5', price: 38.4, coins: 48000 },
      { id: 'ec-6', price: 60, coins: 80000 },
      { id: 'ec-7', price: 120, coins: 150000 },
    ],
    payment: {
      method: 'Banco Pichincha',
      number: '2209462152',
      name: 'Marín Nathaly',
      extra: 'Cuenta de Ahorro',
    },
  },
]

export function getCountry(slug: string): Country | undefined {
  return countries.find((c) => c.slug === slug)
}

/** Rate = coins per currency unit (consistent across all packages) */
export function getCoinRate(country: Country): number {
  return country.packages[0].coins / country.packages[0].price
}

/** Round coins to nearest 500 */
export function roundToNearest500(coins: number): number {
  return Math.round(coins / 500) * 500
}

// Sellers and their assigned countries
export const sellers = ['Andres', 'Dulius', 'Natasha', 'Boster', 'Maga'] as const
export type Seller = (typeof sellers)[number]

export const sellerCountryMap: Record<Seller, string> = {
  Andres: 'costa-rica',
  Dulius: 'mexico',
  Natasha: 'ecuador',
  Maga: 'venezuela',
  Boster: 'colombia',
}

function addThousands(n: number): string {
  const parts = n.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return parts.join(',')
}

export function formatPrice(price: number, currencyCode: string): string {
  switch (currencyCode) {
    case 'CRC':
      return `₡${addThousands(price)}`
    case 'MXN':
      return `$${addThousands(price)} MXN`
    case 'COP':
      return `$${addThousands(price)} COP`
    case 'VES':
      return `${addThousands(price)} Bs.`
    case 'USD':
      return `$${price.toFixed(2)} USD`
    default:
      return `${price}`
  }
}

export function formatCoins(coins: number): string {
  return coins.toLocaleString('es')
}
