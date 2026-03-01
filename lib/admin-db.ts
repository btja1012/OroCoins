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

export interface DailyStats {
  orders_today: number
  pending_today: number
  completed_today: number
  coins_today: number
}

export async function getDailyStats(): Promise<DailyStats> {
  const db = sql()
  const result = await db`
    SELECT
      COUNT(*)::int                                                            AS orders_today,
      COUNT(*) FILTER (WHERE status = 'pending')::int                         AS pending_today,
      COUNT(*) FILTER (WHERE status = 'completed')::int                       AS completed_today,
      COALESCE(SUM(package_coins) FILTER (WHERE status = 'completed'), 0)::bigint AS coins_today
    FROM orders
    WHERE created_at >= CURRENT_DATE
  `
  return result[0] as DailyStats
}

export async function getPendingOrderCount(): Promise<number> {
  const db = sql()
  const result = await db`SELECT COUNT(*)::int AS count FROM orders WHERE status = 'pending'`
  return (result[0] as { count: number })?.count ?? 0
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

export interface CoinAccountHistoryEntry {
  id: number
  account_name: string
  prev_balance: number
  new_balance: number
  changed_by: string
  changed_at: string
}

export async function addCoinAccountBalance(name: string, addCoins: number, changedBy: string): Promise<void> {
  const db = sql()
  const current = await db`SELECT current_balance FROM coin_accounts WHERE name = ${name} LIMIT 1`
  const prev = Number(current[0]?.current_balance ?? 0)
  const newBalance = prev + addCoins
  await db`
    UPDATE coin_accounts
    SET current_balance = ${newBalance}, updated_at = NOW()
    WHERE name = ${name}
  `
  await db`
    INSERT INTO coin_account_history (account_name, prev_balance, new_balance, changed_by)
    VALUES (${name}, ${prev}, ${newBalance}, ${changedBy})
  `
}

export async function updateCoinAccountBalance(name: string, balance: number, changedBy: string): Promise<void> {
  const db = sql()
  const current = await db`SELECT current_balance FROM coin_accounts WHERE name = ${name} LIMIT 1`
  const prev = current[0]?.current_balance ?? 0
  await db`
    UPDATE coin_accounts
    SET current_balance = ${balance}, updated_at = NOW()
    WHERE name = ${name}
  `
  await db`
    INSERT INTO coin_account_history (account_name, prev_balance, new_balance, changed_by)
    VALUES (${name}, ${prev}, ${balance}, ${changedBy})
  `
}

export async function getCoinAccountHistory(limit = 20): Promise<CoinAccountHistoryEntry[]> {
  const db = sql()
  const result = await db`
    SELECT * FROM coin_account_history
    ORDER BY changed_at DESC LIMIT ${limit}
  `
  return result as CoinAccountHistoryEntry[]
}

export interface CollectorPayment {
  id: number
  seller_name: string
  amount_usd: number
  reference: string
  notes?: string
  status: 'pending' | 'confirmed' | 'rejected'
  reject_reason?: string
  submitted_by: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
}

export async function getCollectorPayments(sellerName?: string): Promise<CollectorPayment[]> {
  const db = sql()
  const result = sellerName
    ? await db`
        SELECT * FROM collector_payments
        WHERE seller_name = ${sellerName}
        ORDER BY created_at DESC
      `
    : await db`
        SELECT * FROM collector_payments
        ORDER BY created_at DESC
      `
  return result as CollectorPayment[]
}

export async function getConfirmedPaymentsTotalUSD(sellerName: string): Promise<number> {
  const db = sql()
  const result = await db`
    SELECT COALESCE(SUM(amount_usd), 0)::numeric AS total
    FROM collector_payments
    WHERE seller_name = ${sellerName} AND status = 'confirmed'
  `
  return Number(result[0]?.total ?? 0)
}

export async function getCollectorPaymentById(id: number): Promise<CollectorPayment | null> {
  const db = sql()
  const result = await db`SELECT * FROM collector_payments WHERE id = ${id} LIMIT 1`
  return (result[0] as CollectorPayment) ?? null
}

export async function createCollectorPayment(data: {
  sellerName: string
  amountUsd: number
  notes?: string
  submittedBy: string
}): Promise<CollectorPayment> {
  const db = sql()
  const result = await db`
    INSERT INTO collector_payments (seller_name, amount_usd, reference, notes, submitted_by)
    VALUES (${data.sellerName}, ${data.amountUsd}, '', ${data.notes ?? null}, ${data.submittedBy})
    RETURNING *
  `
  return result[0] as CollectorPayment
}

export async function reviewCollectorPayment(
  id: number,
  status: 'confirmed' | 'rejected',
  reviewedBy: string,
  rejectReason?: string
): Promise<void> {
  const db = sql()
  await db`
    UPDATE collector_payments
    SET status = ${status},
        reviewed_by = ${reviewedBy},
        reviewed_at = NOW(),
        reject_reason = ${rejectReason ?? null}
    WHERE id = ${id}
  `
}

export async function getAppSetting(key: string): Promise<string | null> {
  const db = sql()
  const result = await db`SELECT value FROM app_settings WHERE key = ${key} LIMIT 1`
  return (result[0]?.value as string) ?? null
}

export async function setAppSetting(key: string, value: string, updatedBy: string): Promise<void> {
  const db = sql()
  await db`
    INSERT INTO app_settings (key, value, updated_by, updated_at)
    VALUES (${key}, ${value}, ${updatedBy}, NOW())
    ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()
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
