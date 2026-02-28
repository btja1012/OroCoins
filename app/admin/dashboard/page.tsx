import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/session'
import {
  getAllSellerStats,
  getSellerStats,
  getGlobalStats,
  getRecentOrders,
  getSellerOrders,
  getCoinAccounts,
  getRegistrarStats,
  getCoinAccountHistory,
  getPendingOrderCount,
  getDailyStats,
} from '@/lib/admin-db'
import {
  countries, formatPrice, formatCoins, sellers,
  commissionExemptSellers, COLLECTOR_COMMISSION_RATE,
  REGISTRAR_MILESTONE_COINS, REGISTRAR_BONUS_USD,
  type Seller,
} from '@/lib/data'
import { CoinBalanceForm } from '@/components/admin/CoinBalanceForm'
import { LogoutButton } from '@/components/admin/LogoutButton'
import { PushSetup } from '@/components/admin/PushSetup'
import { DashboardCharts } from '@/components/admin/DashboardCharts'
import { AutoRefresh } from '@/components/admin/AutoRefresh'
import { OrderActions } from '@/components/admin/OrderActions'
import { OrdersTable } from '@/components/admin/OrdersTable'
import { TabTitle } from '@/components/admin/TabTitle'
import { SessionWarning } from '@/components/admin/SessionWarning'
import type { Order } from '@/lib/db'

export const metadata = { title: 'Dashboard — Oros Pura Vida' }

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  seller: 'Colector',
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  admin: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  seller: 'bg-zinc-700/50 text-zinc-300 border-zinc-600/30',
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const isSuperAdmin = session.role === 'super_admin'
  const isAdmin = session.role === 'admin' || isSuperAdmin
  const pendingCount = await getPendingOrderCount()

  return (
    <main className="min-h-screen bg-black">
      <AutoRefresh intervalMs={30000} />
      <TabTitle pendingCount={pendingCount} />
      <SessionWarning />
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/95 backdrop-blur border-b border-amber-500/20">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-lg font-black text-white">
              <span className="sm:hidden">🪙 OrosPV</span>
              <span className="hidden sm:inline">🪙 Oros Pura Vida</span>
            </Link>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${ROLE_COLORS[session.role]}`}>
              {ROLE_LABELS[session.role]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <PushSetup />
            <span className="text-zinc-500 text-sm hidden sm:block">{session.username}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* ─── SELLER VIEW ─── */}
        {session.sellerName && (
          <SellerView sellerName={session.sellerName} />
        )}

        {/* ─── ADMIN / SUPER ADMIN VIEW ─── */}
        {isAdmin && (
          <AdminView isSuperAdmin={isSuperAdmin} />
        )}
      </div>
    </main>
  )
}

/* ─────────────────── SELLER VIEW ─────────────────── */
async function SellerView({ sellerName }: { sellerName: string }) {
  const [stats, orders] = await Promise.all([
    getSellerStats(sellerName),
    getSellerOrders(sellerName),
  ])

  const country = countries.find((c) => c.slug === stats?.country_slug)
  const isExempt = commissionExemptSellers.includes(sellerName as Seller)
  const totalAmount = Number(stats?.total_amount ?? 0)
  const commission = isExempt ? 0 : totalAmount * COLLECTOR_COMMISSION_RATE
  const netOwed = totalAmount - commission

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white">
          {country?.flag} {sellerName}
        </h2>
        <p className="text-zinc-500 text-sm mt-0.5">{stats?.country ?? 'Sin registros aún'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="Monedas vendidas"
          value={stats ? `${formatCoins(stats.total_coins)} 🪙` : '—'}
        />
        <StatCard
          label="Pedidos registrados"
          value={String(stats?.order_count ?? 0)}
        />
        <StatCard
          label="Total recaudado"
          value={stats ? formatPrice(totalAmount, stats.currency_code) : '—'}
        />
      </div>

      {/* Commission breakdown — only for non-exempt sellers */}
      {!isExempt && stats && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
          <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-4">
            Tu deuda con Oros Pura Vida
          </p>
          <div className="space-y-3">
            <CommissionRow
              label="Total recolectado"
              value={formatPrice(totalAmount, stats.currency_code)}
            />
            <CommissionRow
              label={`Tu comisión (${COLLECTOR_COMMISSION_RATE * 100}%)`}
              value={`− ${formatPrice(commission, stats.currency_code)}`}
              green
            />
            <div className="border-t border-amber-500/20 pt-3">
              <CommissionRow
                label="Debes a OrosPV"
                value={formatPrice(netOwed, stats.currency_code)}
                bold
              />
            </div>
          </div>
        </div>
      )}

      {/* Pending orders callout */}
      {orders.filter((o) => (o as Order).status === 'pending').length > 0 && (
        <div>
          <h3 className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
            Pedidos pendientes ({orders.filter((o) => (o as Order).status === 'pending').length})
          </h3>
          <div className="space-y-2 mb-6">
            {(orders as Order[])
              .filter((o) => o.status === 'pending')
              .map((order) => (
                <div key={order.id} className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-amber-400 text-xs">{order.order_number}</p>
                    <p className="text-white font-bold text-sm">
                      {formatCoins(order.package_coins)} 🪙 · {formatPrice(Number(order.package_price), order.currency_code)}
                    </p>
                    <p className="text-zinc-500 text-xs mt-0.5">Ref: {order.game_username}</p>
                  </div>
                  <OrderActions orderNumber={order.order_number} status={order.status} />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Orders table */}
      <div>
        <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">
          Comprobantes registrados
        </h3>
        <div className="bg-zinc-950 border border-amber-500/10 rounded-2xl overflow-hidden">
          {orders.length === 0 ? (
            <p className="text-zinc-600 text-center py-12">No hay pedidos registrados aún.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Ref. Comprobante</th>
                    <th className="text-right px-4 py-3">Monedas</th>
                    <th className="text-right px-4 py-3">Monto</th>
                    <th className="text-right px-4 py-3">Fecha</th>
                    <th className="text-center px-4 py-3">Estado</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {(orders as Order[]).map((order) => (
                    <tr key={order.id} className="border-b border-zinc-900 hover:bg-amber-500/5 transition-colors">
                      <td className="px-4 py-3 font-mono text-zinc-300">{order.game_username}</td>
                      <td className="px-4 py-3 text-right text-amber-400 font-bold">
                        {formatCoins(order.package_coins)} 🪙
                        {order.is_custom && <span className="text-zinc-600 text-xs ml-1">(custom)</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-white font-semibold">
                        {formatPrice(Number(order.package_price), order.currency_code)}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-500">
                        {new Date(order.created_at).toLocaleDateString('es', {
                          day: '2-digit', month: 'short', year: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3">
                        <OrderActions orderNumber={order.order_number} status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────── ADMIN VIEW ─────────────────── */
async function AdminView({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [globalStats, dailyStats, sellerStats, recentOrders, coinAccounts, registrarStats, coinHistory] = await Promise.all([
    getGlobalStats(),
    getDailyStats(),
    getAllSellerStats(),
    getRecentOrders(200),
    getCoinAccounts(),
    getRegistrarStats(),
    getCoinAccountHistory(30),
  ])

  const totalCoinsSold = Number(globalStats.total_coins_sold)
  const totalAvailable = coinAccounts.reduce((sum, a) => sum + Number(a.current_balance), 0)

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-black text-white">Dashboard</h2>

      {/* Global stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total pedidos" value={String(globalStats.total_orders)} />
        <StatCard label="Monedas vendidas" value={`${formatCoins(totalCoinsSold)} 🪙`} />
        <StatCard label="Coins disponibles" value={`${formatCoins(totalAvailable)} 🪙`} />
        <StatCard label="Colectores activos" value={String(sellerStats.length)} />
      </div>

      {/* Today's stats */}
      <div>
        <h3 className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-3">Hoy</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Pedidos hoy" value={String(dailyStats.orders_today)} />
          <StatCard label="Pendientes hoy" value={String(dailyStats.pending_today)} accent={dailyStats.pending_today > 0} />
          <StatCard label="Completados hoy" value={String(dailyStats.completed_today)} />
          <StatCard label="Monedas hoy" value={`${formatCoins(Number(dailyStats.coins_today))} 🪙`} />
        </div>
      </div>

      {/* Charts — super admin only */}
      {isSuperAdmin && (
        <DashboardCharts
          sellerStats={sellerStats}
          registrarStats={registrarStats}
          totalCoinsSold={totalCoinsSold}
          totalAvailable={totalAvailable}
        />
      )}

      {/* Coin accounts */}
      <div>
        <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">
          Cuentas de Oros{' '}
          <span className="text-zinc-600 normal-case text-xs ml-1">
            ({isSuperAdmin ? '✏ editar saldo · + recargar' : '+ recargar'})
          </span>
        </h3>
        <CoinBalanceForm accounts={coinAccounts} isSuperAdmin={isSuperAdmin} />
      </div>

      {/* Coin account history — super admin only */}
      {isSuperAdmin && coinHistory.length > 0 && (
        <div>
          <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">
            Historial de cuentas de Oros
          </h3>
          <div className="bg-zinc-950 border border-amber-500/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Cuenta</th>
                    <th className="text-right px-4 py-3">Anterior</th>
                    <th className="text-right px-4 py-3">Nuevo</th>
                    <th className="text-right px-4 py-3">Diferencia</th>
                    <th className="text-left px-4 py-3">Modificado por</th>
                    <th className="text-right px-4 py-3">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {coinHistory.map((h) => {
                    const diff = h.new_balance - h.prev_balance
                    return (
                      <tr key={h.id} className="border-b border-zinc-900 hover:bg-amber-500/5">
                        <td className="px-4 py-3 font-medium text-zinc-300">{h.account_name}</td>
                        <td className="px-4 py-3 text-right text-zinc-500">{formatCoins(Number(h.prev_balance))} 🪙</td>
                        <td className="px-4 py-3 text-right text-white font-semibold">{formatCoins(Number(h.new_balance))} 🪙</td>
                        <td className={`px-4 py-3 text-right font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {diff >= 0 ? '+' : ''}{formatCoins(diff)} 🪙
                        </td>
                        <td className="px-4 py-3 text-zinc-400 text-xs">{h.changed_by}</td>
                        <td className="px-4 py-3 text-right text-zinc-500 text-xs">
                          {new Date(h.changed_at).toLocaleString('es', {
                            day: '2-digit', month: 'short', year: '2-digit',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Commissions & Payments — super_admin only ─── */}
      {isSuperAdmin && (
        <div className="space-y-6">
          <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-widest">
            Comisiones y pagos
          </h3>

          {/* Collector debt table */}
          <div>
            <p className="text-zinc-500 text-xs mb-3">Deuda de colectores a OrosPV (−{COLLECTOR_COMMISSION_RATE * 100}% comisión)</p>
            <div className="bg-zinc-950 border border-amber-500/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-500 text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3">Colector</th>
                      <th className="text-left px-4 py-3">País</th>
                      <th className="text-right px-4 py-3">Total recolectado</th>
                      <th className="text-right px-4 py-3">Comisión 3%</th>
                      <th className="text-right px-4 py-3">Debe a OrosPV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellerStats
                      .filter((s) => !commissionExemptSellers.includes(s.seller as Seller))
                      .map((s) => {
                        const total = Number(s.total_amount)
                        const comm = total * COLLECTOR_COMMISSION_RATE
                        const owed = total - comm
                        const c = countries.find((cc) => cc.slug === s.country_slug)
                        return (
                          <tr key={s.seller} className="border-b border-zinc-900 hover:bg-amber-500/5">
                            <td className="px-4 py-3 font-bold text-white">{s.seller}</td>
                            <td className="px-4 py-3 text-zinc-400">{c?.flag} {s.country}</td>
                            <td className="px-4 py-3 text-right text-zinc-400">
                              {formatPrice(total, s.currency_code)}
                            </td>
                            <td className="px-4 py-3 text-right text-emerald-400 font-medium">
                              − {formatPrice(comm, s.currency_code)}
                            </td>
                            <td className="px-4 py-3 text-right text-amber-400 font-black text-base">
                              {formatPrice(owed, s.currency_code)}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Registrar bonuses (Neme / Maga) */}
          {registrarStats.length > 0 && (
            <div>
              <p className="text-zinc-500 text-xs mb-3">
                Bonos de registradores — ${REGISTRAR_BONUS_USD} USD por cada {formatCoins(REGISTRAR_MILESTONE_COINS)} 🪙 vendidas
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {registrarStats.map((r) => {
                  const coins = Number(r.total_coins)
                  const milestones = Math.floor(coins / REGISTRAR_MILESTONE_COINS)
                  const progressCoins = coins % REGISTRAR_MILESTONE_COINS
                  const progressPct = Math.round((progressCoins / REGISTRAR_MILESTONE_COINS) * 100)
                  const totalEarned = milestones * REGISTRAR_BONUS_USD
                  return (
                    <div key={r.registered_by} className="bg-zinc-950 border border-amber-500/10 rounded-2xl p-5">
                      <div className="flex items-start justify-between mb-3">
                        <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest">{r.registered_by}</p>
                        <span className="text-emerald-400 font-black text-lg">${totalEarned} USD</span>
                      </div>
                      <p className="text-2xl font-black text-amber-400 mb-1">
                        {formatCoins(coins)}<span className="text-base ml-1">🪙</span>
                      </p>
                      <p className="text-zinc-500 text-xs mb-3">
                        {milestones} × ${REGISTRAR_BONUS_USD} completados · {r.order_count} pedidos
                      </p>
                      {/* Progress to next milestone */}
                      <div>
                        <div className="flex items-center justify-between text-xs text-zinc-600 mb-1">
                          <span>Siguiente bono</span>
                          <span>{formatCoins(progressCoins)} / {formatCoins(REGISTRAR_MILESTONE_COINS)} 🪙 ({progressPct}%)</span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sales by registrar (Maga / Neme) */}
      {!isSuperAdmin && registrarStats.length > 0 && (
        <div>
          <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">
            Ventas por vendedor
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {registrarStats.map((r) => (
              <div key={r.registered_by} className="bg-zinc-950 border border-amber-500/10 rounded-2xl p-5">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">{r.registered_by}</p>
                <p className="text-3xl font-black text-amber-400">
                  {formatCoins(Number(r.total_coins))}<span className="text-lg ml-1">🪙</span>
                </p>
                <p className="text-zinc-500 text-sm mt-1">{r.order_count} pedidos registrados</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-collector breakdown */}
      <div>
        <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">
          Resumen por colector
        </h3>
        <div className="bg-zinc-950 border border-amber-500/10 rounded-2xl overflow-hidden">
          {sellerStats.length === 0 ? (
            <p className="text-zinc-600 text-center py-12">No hay registros aún.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Colector</th>
                    <th className="text-left px-4 py-3">País</th>
                    <th className="text-right px-4 py-3">Pedidos</th>
                    <th className="text-right px-4 py-3">Monedas</th>
                    <th className="text-right px-4 py-3">Total recaudado</th>
                  </tr>
                </thead>
                <tbody>
                  {sellerStats.map((s) => {
                    const country = countries.find((c) => c.slug === s.country_slug)
                    return (
                      <tr key={s.seller} className="border-b border-zinc-900 hover:bg-amber-500/5">
                        <td className="px-4 py-3 font-bold text-white">{s.seller}</td>
                        <td className="px-4 py-3 text-zinc-400">
                          {country?.flag} {s.country}
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-300">{s.order_count}</td>
                        <td className="px-4 py-3 text-right text-amber-400 font-bold">
                          {formatCoins(Number(s.total_coins))} 🪙
                        </td>
                        <td className="px-4 py-3 text-right text-white font-bold">
                          {formatPrice(Number(s.total_amount), s.currency_code)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div>
        <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">
          Pedidos recientes
        </h3>
        <OrdersTable orders={recentOrders as Order[]} sellers={[...sellers]} />
      </div>
    </div>
  )
}

/* ─────────────────── SHARED COMPONENTS ─────────────────── */
function StatCard({
  label, value, sub, accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div className="bg-zinc-950 border border-amber-500/15 rounded-2xl p-5 hover:border-amber-500/30 transition-colors">
      <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-2xl font-black ${accent ? 'text-amber-400' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-zinc-600 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function CommissionRow({ label, value, green, bold }: { label: string; value: string; green?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className={`font-${bold ? 'black' : 'semibold'} ${green ? 'text-emerald-400' : bold ? 'text-amber-400 text-lg' : 'text-zinc-300'}`}>
        {value}
      </span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
  }
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    completed: 'Completado',
    cancelled: 'Cancelado',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${styles[status] ?? styles.pending}`}>
      {labels[status] ?? status}
    </span>
  )
}
