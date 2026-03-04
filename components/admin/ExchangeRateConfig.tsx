'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, CheckCircle2, Pencil, X, Check, RefreshCw, RotateCcw } from 'lucide-react'

interface CurrencyConfig {
  key: string
  label: string
  flag: string
  code: string
  symbol: string
  source: string   // descripción de la fuente automática
}

const CURRENCIES: CurrencyConfig[] = [
  { key: 'crc_rate', label: 'Costa Rica', flag: '🇨🇷', code: 'CRC', symbol: '₡',   source: 'BCCR vía Open ER API' },
  { key: 'mxn_rate', label: 'México',     flag: '🇲🇽', code: 'MXN', symbol: '$',   source: 'Banxico vía Open ER API' },
  { key: 'cop_rate', label: 'Colombia',   flag: '🇨🇴', code: 'COP', symbol: '$',   source: 'BanRep vía Open ER API' },
  { key: 'ves_rate', label: 'Venezuela',  flag: '🇻🇪', code: 'VES', symbol: 'Bs.', source: 'BCV vía DolarAPI' },
]

export function ExchangeRateConfig() {
  const [autoRates, setAutoRates]       = useState<Record<string, number>>({})
  const [manualRates, setManualRates]   = useState<Record<string, string>>({})
  const [editing, setEditing]           = useState<string | null>(null)
  const [input, setInput]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [refreshing, setRefreshing]     = useState(false)
  const [saved, setSaved]               = useState<string | null>(null)
  const [error, setError]               = useState('')

  const loadData = useCallback(async (bustCache = false) => {
    const [ratesRes, settingsRes] = await Promise.all([
      fetch(`/api/exchange-rates${bustCache ? '?r=' + Date.now() : ''}`, { cache: bustCache ? 'no-store' : 'default' }),
      fetch('/api/admin/settings'),
    ])
    if (ratesRes.ok)    setAutoRates(await ratesRes.json())
    if (settingsRes.ok) setManualRates(await settingsRes.json())
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData(true)
    setRefreshing(false)
  }

  const startEdit = (key: string) => {
    setEditing(key)
    setInput(manualRates[key] ?? '')
    setError('')
  }

  const cancel = () => { setEditing(null); setInput(''); setError('') }

  const save = async (key: string) => {
    setError('')
    const num = parseFloat(input)
    if (!num || num <= 0) { setError('Ingresa un valor válido.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: String(num) }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al guardar.'); return }
      setManualRates((prev) => ({ ...prev, [key]: String(num) }))
      setEditing(null)
      setInput('')
      setSaved(key)
      setTimeout(() => setSaved(null), 2500)
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  const revertToAuto = async (key: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      if (res.ok) {
        setManualRates((prev) => { const next = { ...prev }; delete next[key]; return next })
        setSaved(key)
        setTimeout(() => setSaved(null), 2500)
      }
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-zinc-950 border border-amber-500/10 rounded-2xl overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-zinc-900 flex items-center justify-between">
        <div>
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest">
            Tipos de cambio
          </p>
          <p className="text-zinc-600 text-xs mt-0.5">
            Actualizados automáticamente · anular manualmente si es necesario
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-xs transition-colors p-1.5 rounded-lg hover:bg-zinc-900 disabled:opacity-50"
          title="Actualizar tasas"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      <div className="divide-y divide-zinc-900">
        {CURRENCIES.map((c) => {
          const isEditing   = editing === c.key
          const isManual    = !!manualRates[c.key]
          const isSaved     = saved === c.key
          const effectiveRate = isManual
            ? parseFloat(manualRates[c.key])
            : autoRates[c.code]

          return (
            <div key={c.key} className="px-5 py-3.5">
              {isEditing ? (
                <div className="space-y-2">
                  <p className="text-zinc-300 text-sm font-semibold">{c.flag} {c.label} — anular manualmente</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-zinc-500 text-sm shrink-0">1 USD =</span>
                    <input
                      type="number"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="0"
                      min="0.01"
                      step="0.01"
                      autoFocus
                      className="w-32 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
                    />
                    <span className="text-zinc-500 text-sm">{c.code}</span>
                    <button
                      onClick={() => save(c.key)}
                      disabled={loading}
                      className="flex items-center gap-1 px-3 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 text-black font-bold text-xs rounded-lg transition-colors"
                    >
                      {loading ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                      Guardar
                    </button>
                    <button onClick={cancel} className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  {error && <p className="text-red-400 text-xs">{error}</p>}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  {/* Left: flag + name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg shrink-0">{c.flag}</span>
                    <div className="min-w-0">
                      <p className="text-zinc-300 text-sm font-medium">{c.label}</p>
                      <p className="text-zinc-600 text-xs truncate">{c.source}</p>
                    </div>
                  </div>

                  {/* Right: rate + badge + actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isSaved && (
                      <span className="hidden sm:flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 size={12} /> OK
                      </span>
                    )}

                    {/* Rate value */}
                    <span className="text-amber-400 font-black text-sm">
                      {effectiveRate
                        ? `${c.symbol} ${Number(effectiveRate).toLocaleString('es', { maximumFractionDigits: 2 })}`
                        : <span className="text-zinc-600 font-normal text-xs">cargando…</span>
                      }
                    </span>

                    {/* Source badge */}
                    {isManual ? (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-medium">
                        Manual
                      </span>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-medium">
                        Auto
                      </span>
                    )}

                    {/* Actions */}
                    {isManual ? (
                      <button
                        onClick={() => revertToAuto(c.key)}
                        disabled={loading}
                        title="Revertir a automático"
                        className="p-1.5 text-zinc-600 hover:text-emerald-400 transition-colors"
                      >
                        <RotateCcw size={13} />
                      </button>
                    ) : (
                      <button
                        onClick={() => startEdit(c.key)}
                        title="Anular manualmente"
                        className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="px-5 py-3 border-t border-zinc-900">
        <p className="text-zinc-700 text-xs">
          CRC · MXN · COP actualizan cada hora · VES (BCV) cada 30 min
        </p>
      </div>
    </div>
  )
}
