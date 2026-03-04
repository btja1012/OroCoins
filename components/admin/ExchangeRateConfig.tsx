'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, Pencil, X, Check } from 'lucide-react'

interface CurrencyConfig {
  key: string
  label: string
  flag: string
  code: string
  symbol: string
  placeholder: string
}

const CURRENCIES: CurrencyConfig[] = [
  { key: 'crc_rate', label: 'Costa Rica',  flag: '🇨🇷', code: 'CRC', symbol: '₡',    placeholder: 'ej. 540' },
  { key: 'mxn_rate', label: 'México',      flag: '🇲🇽', code: 'MXN', symbol: '$',    placeholder: 'ej. 17.5' },
  { key: 'cop_rate', label: 'Colombia',    flag: '🇨🇴', code: 'COP', symbol: '$',    placeholder: 'ej. 3900' },
  { key: 'ves_rate', label: 'Venezuela',   flag: '🇻🇪', code: 'VES', symbol: 'Bs.', placeholder: 'ej. 38.5' },
]

export function ExchangeRateConfig() {
  const [rates, setRates] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => setRates(data))
      .catch(() => null)
  }, [])

  const startEdit = (key: string) => {
    setEditing(key)
    setInput(rates[key] ?? '')
    setError('')
  }

  const cancel = () => {
    setEditing(null)
    setInput('')
    setError('')
  }

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
      setRates((prev) => ({ ...prev, [key]: String(num) }))
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
      <div className="px-5 pt-4 pb-3 border-b border-zinc-900">
        <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest">
          Tipos de cambio manual
        </p>
        <p className="text-zinc-600 text-xs mt-0.5">1 USD = … (actualizar según mercado)</p>
      </div>

      <div className="divide-y divide-zinc-900">
        {CURRENCIES.map((c) => {
          const isEditing = editing === c.key
          const currentRate = rates[c.key]
          const isSaved = saved === c.key

          return (
            <div key={c.key} className="px-5 py-3">
              {isEditing ? (
                <div className="space-y-2">
                  <p className="text-zinc-300 text-sm font-semibold">{c.flag} {c.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-sm shrink-0">1 USD =</span>
                    <input
                      type="number"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={c.placeholder}
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{c.flag}</span>
                    <div>
                      <p className="text-zinc-300 text-sm font-medium">{c.label}</p>
                      <p className="text-zinc-500 text-xs">{c.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isSaved && (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 size={12} /> Guardado
                      </span>
                    )}
                    <span className="text-amber-400 font-black text-sm">
                      {currentRate
                        ? `${c.symbol} ${Number(currentRate).toLocaleString('es')}`
                        : <span className="text-zinc-600 font-normal text-xs">sin configurar</span>
                      }
                    </span>
                    <button
                      onClick={() => startEdit(c.key)}
                      className="flex items-center gap-1 text-zinc-600 hover:text-zinc-300 text-xs transition-colors p-1"
                    >
                      <Pencil size={12} />
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
