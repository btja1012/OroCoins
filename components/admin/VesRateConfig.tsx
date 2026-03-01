'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, Pencil } from 'lucide-react'

export function VesRateConfig() {
  const [currentRate, setCurrentRate] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.ves_rate) setCurrentRate(data.ves_rate)
      })
      .catch(() => null)
  }, [])

  const handleSave = async () => {
    setError('')
    const num = parseFloat(input)
    if (!num || num <= 0) { setError('Ingresa un valor válido.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'ves_rate', value: input }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al guardar.'); return }
      setCurrentRate(input)
      setEditing(false)
      setInput('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-zinc-950 border border-amber-500/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest">
            Tasa de cambio VES (Venezuela)
          </p>
          <p className="text-zinc-600 text-xs mt-0.5">
            Binance P2P — actualizar manualmente según el mercado
          </p>
        </div>
        {success && (
          <span className="flex items-center gap-1 text-green-400 text-xs font-semibold">
            <CheckCircle2 size={13} /> Guardado
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="text-sm text-zinc-300">
          1 USD =
          <span className="text-amber-400 font-black ml-1.5">
            {currentRate ? `${Number(currentRate).toLocaleString('es')} VES` : <span className="text-zinc-600">sin configurar</span>}
          </span>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => { setEditing(true); setInput(currentRate ?? '') }}
            className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
          >
            <Pencil size={11} /> Editar
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-zinc-500 text-sm shrink-0">1 USD =</span>
          <input
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ej. 420"
            min="1"
            step="0.01"
            className="w-36 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
            autoFocus
          />
          <span className="text-zinc-500 text-sm">VES</span>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 text-black font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
          >
            {loading ? <Loader2 size={11} className="animate-spin" /> : null}
            Guardar
          </button>
          <button
            type="button"
            onClick={() => { setEditing(false); setError('') }}
            className="px-3 py-1.5 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}

      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  )
}
