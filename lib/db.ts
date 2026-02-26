import { neon } from '@neondatabase/serverless'

const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL environment variable is not set')
  return url
}

export const sql = () => neon(getDatabaseUrl())

export interface Order {
  id: number
  order_number: string
  country: string
  country_slug: string
  game_username: string
  customer_contact: string
  package_id: string
  package_coins: number
  package_price: number
  currency_code: string
  currency_symbol: string
  is_custom: boolean
  status: string
  created_at: string
}

export async function createOrder(data: {
  country: string
  countrySlug: string
  gameUsername: string
  customerContact: string
  packageId: string
  packageCoins: number
  packagePrice: number
  currencyCode: string
  currencySymbol: string
  isCustom?: boolean
}): Promise<Order> {
  const db = sql()
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase()
  const orderNumber = `OC-${ts}-${rnd}`

  const result = await db`
    INSERT INTO orders (
      order_number, country, country_slug, game_username, customer_contact,
      package_id, package_coins, package_price, currency_code, currency_symbol, is_custom
    ) VALUES (
      ${orderNumber}, ${data.country}, ${data.countrySlug}, ${data.gameUsername},
      ${data.customerContact}, ${data.packageId}, ${data.packageCoins},
      ${data.packagePrice}, ${data.currencyCode}, ${data.currencySymbol},
      ${data.isCustom ?? false}
    )
    RETURNING *
  `
  return result[0] as Order
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const db = sql()
  const result = await db`
    SELECT * FROM orders WHERE order_number = ${orderNumber} LIMIT 1
  `
  return (result[0] as Order) ?? null
}
