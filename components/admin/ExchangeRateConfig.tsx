'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, CheckCircle2, Pencil, X, Check, RefreshCw } from 'lucide-react'

interface CurrencyConfig {
  key: string
  label: string
  flag: string
  code: string
  symbol: string
}

const CURRENCIES: CurrencyConfig[] = [
  { key: 'crc_rate', label: 'Costa Rica', flag: '🇨🇷', code: 'CRC', symbol: '₡'   },
  { key: 'mxn_rate', label: 'México',     flag: '🇲🇽', code: 'MXN', symbol: '$'   },
  { key: 'cop_rate', label: 'Colombia',   flag: '🇨🇴', code: 'COP', symbol: '$'   },
  { key: 'ves_rate', label: 'Venezuela',  flag: '🇻🇪', code: 'VES', symbol: 'Bs.' },
]

export function ExchangeRateConfig() {
  const [rates, setRates]       = useState<Record<string, number>>({})
  const [editing, setEditing]   = useState<string | null>(null)
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [saved, setSaved]       = useState<string | null>(null)
  const [error, setError]       = useState('')

  const loadRates = useCallback(async (bust = false) => {
    try {
      const res = await fetch('/api/exchange-rates', {
        cache: bust ? 'no-store' : 'default',
      })
      if (res.ok) setRates(await res.json())
    } catch { /* silent */ }
  }, [])

  useEffect(() => { loadRates() }, [loadRates])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadRates(true)
    setRefreshing(false)
  }

  const startEdit = (key: string, code: string) => {
    setEditing(key)
    setInput(rates[code] ? String(rates[code]) : '')
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
      // Update local display with new value
      const code = CURRENCIES.find((c) => c.key === key)?.code ?? ''
      setRates((prev) => ({ ...prev, [code]: num }))
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

  return (
    <div className="bg-zinc-950 border border-amber-500/10 rounded-2xl overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-zinc-900 flex items-center justify-between">
        <div>
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest">
            Tipos de cambio — 1 USD =
          </p>
          <p className="text-zinc-600 text-xs mt-0.5">Automático desde APIs de bancos centrales</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title="Actualizar tasas ahora"
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-xs transition-colors px-2.5 py-2 rounded-lg hover:bg-zinc-900 disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      <div className="divide-y divide-zinc-900">
        {CURRENCIES.map((c) => {
          const isEditing = editing === c.key
          const rate = rates[c.code]

          return (
            <div key={c.key} className="px-5 py-3.5">
              {isEditing ? (
                <div className="space-y-2">
                  <p className="text-zinc-400 text-xs">{c.flag} {c.label} — corrección manual</p>
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
                    <button onClick={cancel} className="p-2 text-zinc-500 hover:text-zinc-300">
                      <X size={14} />
                    </button>
                  </div>
                  {error && <p className="text-red-400 text-xs">{error}</p>}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{c.flag}</span>
                    <p className="text-zinc-300 text-sm font-medium">{c.label}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {saved === c.key && (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs">
                        <CheckCircle2 size={12} /> Guardado
                      </span>
                    )}
                    <span className="text-amber-400 font-black text-sm">
                      {rate
                        ? `${c.symbol} ${rate.toLocaleString('es', { maximumFractionDigits: 2 })}`
                        : <span className="text-zinc-600 font-normal text-xs">cargando…</span>
                      }
                    </span>
                    <button
                      onClick={() => startEdit(c.key, c.code)}
                      title="Corregir tasa"
                      className="p-1.5 text-zinc-700 hover:text-zinc-400 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
