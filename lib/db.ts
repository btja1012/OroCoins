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
  seller: string
  client_name: string | null
  package_id: string
  package_coins: number
  package_price: number
  currency_code: string
  currency_symbol: string
  is_custom: boolean
  coin_account: string
  status: string
  created_at: string
}

export async function createOrder(data: {
  country: string
  countrySlug: string
  gameUsername: string
  seller: string
  clientName?: string | null
  packageId: string
  packageCoins: number
  packagePrice: number
  currencyCode: string
  currencySymbol: string
  isCustom?: boolean
  coinAccount: 'OrosPV1' | 'OrosPV2'
}): Promise<Order> {
  const db = neon(getDatabaseUrl())
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase()
  const orderNumber = `OC-${ts}-${rnd}`

  const [orders] = await db.transaction([
    db`
      INSERT INTO orders (
        order_number, country, country_slug, game_username, customer_contact,
        seller, client_name, package_id, package_coins, package_price, currency_code, currency_symbol, is_custom, coin_account
      ) VALUES (
        ${orderNumber}, ${data.country}, ${data.countrySlug}, ${data.gameUsername},
        ${data.seller}, ${data.seller}, ${data.clientName ?? null}, ${data.packageId}, ${data.packageCoins},
        ${data.packagePrice}, ${data.currencyCode}, ${data.currencySymbol},
        ${data.isCustom ?? false}, ${data.coinAccount}
      )
      RETURNING *
    `,
    db`
      UPDATE coin_accounts
      SET current_balance = current_balance - ${data.packageCoins}, updated_at = NOW()
      WHERE name = ${data.coinAccount}
    `,
  ])

  return orders[0] as Order
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const db = sql()
  const result = await db`
    SELECT * FROM orders WHERE order_number = ${orderNumber} LIMIT 1
  `
  return (result[0] as Order) ?? null
}
