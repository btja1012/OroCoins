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
  seller: string
  package_id: string
  package_coins: number
  package_price: number
  currency_code: string
  currency_symbol: string
  is_custom: boolean
  coin_account: string
  registered_by: string | null
  approved_by: string | null
  approved_at: string | null
  cancel_reason: string | null
  status: string
  created_at: string
}

export async function createOrder(data: {
  country: string
  countrySlug: string
  gameUsername: string
  seller: string
  packageId: string
  packageCoins: number
  packagePrice: number
  currencyCode: string
  currencySymbol: string
  isCustom?: boolean
  coinAccount: 'OrosPV1' | 'OrosPV2'
  registeredBy?: string | null
}): Promise<Order> {
  const db = neon(getDatabaseUrl())
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase()
  const orderNumber = `OC-${ts}-${rnd}`

  const [orders, accountUpdate] = await db.transaction([
    db`
      INSERT INTO orders (
        order_number, country, country_slug, game_username,
        seller, package_id, package_coins, package_price, currency_code, currency_symbol, is_custom, coin_account, registered_by
      ) VALUES (
        ${orderNumber}, ${data.country}, ${data.countrySlug}, ${data.gameUsername},
        ${data.seller}, ${data.packageId}, ${data.packageCoins},
        ${data.packagePrice}, ${data.currencyCode}, ${data.currencySymbol},
        ${data.isCustom ?? false}, ${data.coinAccount}, ${data.registeredBy ?? null}
      )
      RETURNING *
    `,
    db`
      UPDATE coin_accounts
      SET current_balance = current_balance - ${data.packageCoins}, updated_at = NOW()
      WHERE name = ${data.coinAccount} AND current_balance >= ${data.packageCoins}
      RETURNING name
    `,
  ])

  if (!accountUpdate || accountUpdate.length === 0) {
    throw new Error('Saldo insuficiente en la cuenta de Oros seleccionada.')
  }

  return orders[0] as Order
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const db = sql()
  const result = await db`
    SELECT * FROM orders WHERE order_number = ${orderNumber} LIMIT 1
  `
  return (result[0] as Order) ?? null
}
