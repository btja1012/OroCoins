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
} from '@/lib/admin-db'
import { countries, formatPrice, formatCoins } from '@/lib/data'
import { CoinBalanceForm } from '@/components/admin/CoinBalanceForm'
import { LogoutButton } from '@/components/admin/LogoutButton'
import { PushSetup } from '@/components/admin/PushSetup'
import { OrderActions } from '@/components/admin/OrderActions'
import { DashboardCharts } from '@/components/admin/DashboardCharts'
import type { Order } from '@/lib/db'

export const metadata = { title: 'Dashboard — Oros Pura Vida' }

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  seller: 'Vendedor',
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
  const isSeller = session.role === 'seller'

  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-900">
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
          label="Total recaudado"
          value={stats ? formatPrice(Number(stats.total_amount), stats.currency_code) : '—'}
          sub="lo que debes a OrosPV"
          accent
        />
        <StatCard
          label="Monedas vendidas"
          value={stats ? `${formatCoins(stats.total_coins)} 🪙` : '—'}
        />
        <StatCard
          label="Pedidos registrados"
          value={String(stats?.order_count ?? 0)}
        />
      </div>

      {/* Orders table */}
      <div>
        <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">
          Comprobantes registrados
        </h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {orders.length === 0 ? (
            <p className="text-zinc-600 text-center py-12">No hay pedidos registrados aún.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
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
                    <tr key={order.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
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
  const [globalStats, sellerStats, recentOrders, coinAccounts] = await Promise.all([
    getGlobalStats(),
    getAllSellerStats(),
    getRecentOrders(100),
    getCoinAccounts(),
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
        <StatCard label="Vendedores activos" value={String(sellerStats.length)} />
      </div>

      {/* Charts — super admin only */}
      {isSuperAdmin && (
        <DashboardCharts
          sellerStats={sellerStats}
          totalCoinsSold={totalCoinsSold}
          totalAvailable={totalAvailable}
        />
      )}

      {/* Coin accounts */}
      <div>
        <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">
          Cuentas de Oros {isSuperAdmin && <span className="text-amber-500/70 normal-case text-xs ml-1">(editable)</span>}
        </h3>
        {isSuperAdmin ? (
          <CoinBalanceForm accounts={coinAccounts} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {coinAccounts.map((account) => (
              <div key={account.name} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">{account.name}</p>
                <p className="text-3xl font-black text-amber-400">
                  {formatCoins(Number(account.current_balance))}<span className="text-lg ml-1">🪙</span>
                </p>
                <p className="text-zinc-600 text-xs mt-1">disponibles</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per-seller breakdown */}
      <div>
        <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">
          Resumen por vendedor
        </h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {sellerStats.length === 0 ? (
            <p className="text-zinc-600 text-center py-12">No hay registros aún.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Vendedor</th>
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
                      <tr key={s.seller} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
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
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {recentOrders.length === 0 ? (
            <p className="text-zinc-600 text-center py-12">No hay pedidos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3"># Orden</th>
                    <th className="text-left px-4 py-3">Vendedor</th>
                    <th className="text-left px-4 py-3">País</th>
                    <th className="text-right px-4 py-3">Monedas</th>
                    <th className="text-right px-4 py-3">Monto</th>
                    <th className="text-left px-4 py-3">Comprobante</th>
                    <th className="text-left px-4 py-3">Cliente</th>
                    <th className="text-right px-4 py-3">Fecha</th>
                    <th className="text-center px-4 py-3">Estado</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {(recentOrders as Order[]).map((order) => {
                    const country = countries.find((c) => c.slug === order.country_slug)
                    return (
                      <tr key={order.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                        <td className="px-4 py-3 font-mono text-amber-400 text-xs">{order.order_number}</td>
                        <td className="px-4 py-3 text-zinc-300 font-medium">{order.seller ?? '—'}</td>
                        <td className="px-4 py-3 text-zinc-400">{country?.flag} {order.country}</td>
                        <td className="px-4 py-3 text-right text-amber-400 font-bold">
                          {formatCoins(Number(order.package_coins))} 🪙
                        </td>
                        <td className="px-4 py-3 text-right text-white font-semibold">
                          {formatPrice(Number(order.package_price), order.currency_code)}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{order.game_username}</td>
                        <td className="px-4 py-3 text-zinc-300 text-xs font-medium">{order.client_name ?? '—'}</td>
                        <td className="px-4 py-3 text-right text-zinc-500 text-xs">
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
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-2xl font-black ${accent ? 'text-amber-400' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-zinc-600 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
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
