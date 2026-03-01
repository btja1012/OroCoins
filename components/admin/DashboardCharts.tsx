'use client'

import {
  Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import type { RegistrarStat } from '@/lib/admin-db'
import { formatCoins } from '@/lib/data'


interface Props {
  registrarStats: RegistrarStat[]
  totalCoinsSold: number
  totalAvailable: number
}

export function DashboardCharts({ registrarStats, totalCoinsSold, totalAvailable }: Props) {
  const vendedoraData = registrarStats.map((r) => ({
    name: r.registered_by,
    coins: Number(r.total_coins),
    pedidos: Number(r.order_count),
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

      {/* ── Vendedoras: Maga / Neme ── */}
      {vendedoraData.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-4">
            Ventas por vendedor (Maga / Neme)
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={vendedoraData} barSize={48}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 13, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, fontSize: 12 }}
                formatter={(v: number | undefined) => [formatCoins(v ?? 0) + ' 🪙', 'Monedas']}
              />
              <Bar dataKey="coins" name="coins" radius={[6, 6, 0, 0]} fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {vendedoraData.map((d, i) => (
              <div key={d.name} className="bg-zinc-800/50 rounded-xl p-3">
                <p className="text-zinc-400 text-xs font-semibold mb-1">{d.name}</p>
                <p className="text-amber-400 font-black text-lg">{formatCoins(d.coins)} <span className="text-sm">🪙</span></p>
                <p className="text-zinc-500 text-xs mt-0.5">{d.pedidos} pedidos</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
