'use client'

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import type { SellerStat } from '@/lib/admin-db'
import { formatCoins } from '@/lib/data'

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f97316']

const COIN_RATES: Record<string, number> = {
  CRC: 1 / 530,   // colones → USD
  MXN: 1 / 17,
  COP: 1 / 4200,
  VES: 1 / 36,
  USD: 1,
}

interface Props {
  sellerStats: SellerStat[]
  totalCoinsSold: number
  totalAvailable: number
}

export function DashboardCharts({ sellerStats, totalCoinsSold, totalAvailable }: Props) {
  // Data for donut chart — coins sold per seller
  const coinData = sellerStats.map((s) => ({
    name: s.seller,
    value: Number(s.total_coins),
  }))

  // Data for bar chart — revenue per seller in USD approx
  const revenueData = sellerStats.map((s) => ({
    name: s.seller,
    usd: Math.round(Number(s.total_amount) * (COIN_RATES[s.currency_code] ?? 1)),
    pedidos: Number(s.order_count),
  }))

  const totalCoins = totalCoinsSold + totalAvailable
  const soldPct = totalCoins > 0 ? Math.round((totalCoinsSold / totalCoins) * 100) : 0

  return (
    <div className="space-y-6">

      {/* ── Inventory bar ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-4">
          Inventario de monedas
        </p>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-zinc-400">Vendidas</span>
          <span className="text-amber-400 font-bold">{formatCoins(totalCoinsSold)} 🪙 ({soldPct}%)</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-3 mb-2">
          <div
            className="bg-amber-500 h-3 rounded-full transition-all"
            style={{ width: `${soldPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-600">
          <span>{formatCoins(totalAvailable)} disponibles</span>
          <span>{formatCoins(totalCoins)} total histórico</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Donut: coins per seller ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-4">
            Monedas vendidas por vendedor
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={coinData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {coinData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, fontSize: 12 }}
                formatter={(v: number | undefined) => [formatCoins(v ?? 0) + ' 🪙', 'Monedas']}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
            {coinData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>

        {/* ── Bar: revenue in USD ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-4">
            Recaudado por vendedor (aprox. USD)
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, fontSize: 12 }}
                formatter={(v: number | undefined) => [`$${v ?? 0} USD`, 'Recaudado']}
              />
              <Bar dataKey="usd" radius={[6, 6, 0, 0]}>
                {revenueData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Bar: orders per seller ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 lg:col-span-2">
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-4">
            Pedidos registrados por vendedor
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={revenueData} barSize={36} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#a1a1aa', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, fontSize: 12 }}
                formatter={(v: number | undefined) => [v ?? 0, 'Pedidos']}
              />
              <Bar dataKey="pedidos" radius={[0, 6, 6, 0]}>
                {revenueData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  )
}
