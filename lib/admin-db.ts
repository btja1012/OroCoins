import { sql } from './db'

export interface AdminUser {
  id: number
  username: string
  password_hash: string
  role: 'super_admin' | 'admin' | 'seller'
  seller_name?: string
  is_active: boolean
  failed_attempts: number
  locked_until?: string | null
}

export interface SellerStat {
  seller: string
  country: string
  country_slug: string
  currency_code: string
  currency_symbol: string
  order_count: number
  total_coins: number
  total_amount: number
}

export interface CoinAccount {
  id: number
  name: string
  current_balance: number
  updated_at: string
}

export interface GlobalStats {
  total_orders: number
  total_coins_sold: number
}

export async function getUserByUsername(username: string): Promise<AdminUser | null> {
  const db = sql()
  const result = await db`
    SELECT * FROM admin_users WHERE username = ${username} AND is_active = true LIMIT 1
  `
  return (result[0] as AdminUser) ?? null
}

export interface RegistrarStat {
  registered_by: string
  order_count: number
  total_coins: number
}

export async function getRegistrarStats(): Promise<RegistrarStat[]> {
  const db = sql()
  const result = await db`
    SELECT
      registered_by,
      COUNT(*)::int AS order_count,
      COALESCE(SUM(package_coins), 0)::bigint AS total_coins
    FROM orders
    WHERE registered_by IS NOT NULL
    GROUP BY registered_by
    ORDER BY order_count DESC
  `
  return result as RegistrarStat[]
}

export async function getAllSellerStats(): Promise<SellerStat[]> {
  const db = sql()
  const result = await db`
    SELECT
      seller,
      country,
      country_slug,
      currency_code,
      currency_symbol,
      COUNT(*)::int              AS order_count,
      COALESCE(SUM(package_coins), 0)::bigint  AS total_coins,
      COALESCE(SUM(package_price), 0)::numeric AS total_amount
    FROM orders
    WHERE seller IS NOT NULL
    GROUP BY seller, country, country_slug, currency_code, currency_symbol
    ORDER BY seller
  `
  return result as SellerStat[]
}

export async function getSellerStats(sellerName: string): Promise<SellerStat | null> {
  const db = sql()
  const result = await db`
    SELECT
      seller,
      country,
      country_slug,
      currency_code,
      currency_symbol,
      COUNT(*)::int              AS order_count,
      COALESCE(SUM(package_coins), 0)::bigint  AS total_coins,
      COALESCE(SUM(package_price), 0)::numeric AS total_amount
    FROM orders
    WHERE seller = ${sellerName}
    GROUP BY seller, country, country_slug, currency_code, currency_symbol
    LIMIT 1
  `
  return (result[0] as SellerStat) ?? null
}

export async function getGlobalStats(): Promise<GlobalStats> {
  const db = sql()
  const result = await db`
    SELECT
      COUNT(*)::int             AS total_orders,
      COALESCE(SUM(package_coins), 0)::bigint AS total_coins_sold
    FROM orders
  `
  return result[0] as GlobalStats
}

export async function getRecentOrders(limit = 100) {
  const db = sql()
  const result = await db`
    SELECT * FROM orders ORDER BY created_at DESC LIMIT ${limit}
  `
  return result
}

export async function getSellerOrders(sellerName: string) {
  const db = sql()
  const result = await db`
    SELECT * FROM orders WHERE seller = ${sellerName} ORDER BY created_at DESC
  `
  return result
}

export async function getCoinAccounts(): Promise<CoinAccount[]> {
  const db = sql()
  const result = await db`SELECT * FROM coin_accounts ORDER BY name`
  return result as CoinAccount[]
}

export async function updateCoinAccountBalance(name: string, balance: number): Promise<void> {
  const db = sql()
  await db`
    UPDATE coin_accounts
    SET current_balance = ${balance}, updated_at = NOW()
    WHERE name = ${name}
  `
}

export async function createAdminUser(data: {
  username: string
  passwordHash: string
  role: 'super_admin' | 'admin' | 'seller'
  sellerName?: string
}): Promise<void> {
  const db = sql()
  await db`
    INSERT INTO admin_users (username, password_hash, role, seller_name)
    VALUES (${data.username}, ${data.passwordHash}, ${data.role}, ${data.sellerName ?? null})
    ON CONFLICT (username) DO NOTHING
  `
}
