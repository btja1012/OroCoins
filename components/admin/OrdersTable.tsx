'use client'

import { useState, useMemo } from 'react'
import { Download, Search } from 'lucide-react'
import { OrderActions } from './OrderActions'
import { formatPrice, formatCoins, countries } from '@/lib/data'
import type { Order } from '@/lib/db'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  completed: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

function exportCSV(orders: Order[]) {
  const headers = [
    '# Orden', 'Colector', 'País', 'Monedas', 'Monto', 'Moneda',
    'Comprobante', 'Registrado por', 'Estado', 'Aprobado por', 'Fecha aprobación', 'Fecha creación',
  ]
  const rows = orders.map((o) => [
    o.order_number,
    o.seller ?? '',
    o.country,
    o.package_coins,
    o.package_price,
    o.currency_code,
    o.game_username,
    o.registered_by ?? '',
    STATUS_LABELS[o.status] ?? o.status,
    o.approved_by ?? '',
    o.approved_at ? new Date(o.approved_at).toLocaleString('es') : '',
    new Date(o.created_at).toLocaleString('es'),
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function OrdersTable({ orders, sellers }: { orders: Order[]; sellers: string[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sellerFilter, setSellerFilter] = useState('all')

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      if (sellerFilter !== 'all' && o.seller !== sellerFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !o.order_number.toLowerCase().includes(q) &&
          !o.game_username.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [orders, statusFilter, sellerFilter, search])

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar orden o comprobante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
          />
        </div>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500/40"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>

        {/* Seller */}
        <select
          value={sellerFilter}
          onChange={(e) => setSellerFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500/40"
        >
          <option value="all">Todos los colectores</option>
          {sellers.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* CSV export */}
        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-zinc-400 hover:text-amber-400 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
        >
          <Download size={12} />
          CSV ({filtered.length})
        </button>
      </div>

      {/* Table */}
      <div className="bg-zinc-950 border border-amber-500/10 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-zinc-600 text-center py-12">No hay pedidos que coincidan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3"># Orden</th>
                  <th className="text-left px-4 py-3">Colector</th>
                  <th className="text-left px-4 py-3">País</th>
                  <th className="text-right px-4 py-3">Monedas</th>
                  <th className="text-right px-4 py-3">Monto</th>
                  <th className="text-left px-4 py-3">Comprobante</th>
                  <th className="text-left px-4 py-3">Vendedor</th>
                  <th className="text-left px-4 py-3">Aprobado por</th>
                  <th className="text-right px-4 py-3">Fecha</th>
                  <th className="text-center px-4 py-3">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const country = countries.find((c) => c.slug === order.country_slug)
                  return (
                    <tr key={order.id} className="border-b border-zinc-900 hover:bg-amber-500/5">
                      <td className="px-4 py-3 font-mono text-amber-400 text-xs">{order.order_number}</td>
                      <td className="px-4 py-3 text-zinc-300 font-medium">{order.seller ?? '—'}</td>
                      <td className="px-4 py-3 text-zinc-400">{country?.flag} {order.country}</td>
                      <td className="px-4 py-3 text-right text-amber-400 font-bold">
                        {formatCoins(order.package_coins)} 🪙
                        {order.is_custom && <span className="text-zinc-600 text-xs ml-1">(custom)</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-white font-semibold">
                        {formatPrice(Number(order.package_price), order.currency_code)}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{order.game_username}</td>
                      <td className="px-4 py-3 text-zinc-300 text-xs font-medium">{order.registered_by ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {order.approved_by ? (
                          <span title={order.approved_at ? new Date(order.approved_at).toLocaleString('es') : ''}>
                            {order.approved_by}
                          </span>
                        ) : '—'}
                      </td>
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
  )
}
