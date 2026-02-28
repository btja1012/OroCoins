'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2, AlertCircle } from 'lucide-react'
import { formatCoins } from '@/lib/data'

export function OrderActions({
  orderNumber,
  status,
  packageCoins,
  gameUsername,
}: {
  orderNumber: string
  status: string
  packageCoins?: number
  gameUsername?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<'completed' | 'cancelled' | null>(null)
  const [confirm, setConfirm] = useState<'completed' | 'cancelled' | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [error, setError] = useState('')

  if (status !== 'pending') return null

  const update = async (newStatus: 'completed' | 'cancelled') => {
    setLoading(newStatus)
    setError('')
    setConfirm(null)
    try {
      const res = await fetch(`/api/orders/${orderNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          cancelReason: cancelReason.trim() || undefined,
        }),
      })
      if (res.status === 401) {
        setError('Sesión expirada. Recarga la página.')
        return
      }
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al actualizar.')
        return
      }
      router.refresh()
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(null)
    }
  }

  if (error) {
    return (
      <div className="flex items-center gap-1.5 text-red-400 text-xs">
        <AlertCircle size={12} />
        <span>{error}</span>
        <button onClick={() => setError('')} className="text-zinc-600 hover:text-white ml-1">✕</button>
      </div>
    )
  }

  if (confirm) {
    return (
      <div className="space-y-1.5">
        {confirm === 'completed' && packageCoins != null && (
          <p className="text-xs text-amber-400 font-semibold">
            Enviar <span className="font-black">{formatCoins(packageCoins)} 🪙</span>
            {gameUsername && <> a <span className="font-mono text-white">{gameUsername}</span></>}
          </p>
        )}
        {confirm === 'cancelled' && (
          <input
            type="text"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Razón del rechazo (opcional)"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
          />
        )}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400 text-xs hidden sm:block">¿Confirmar?</span>
          <button
            onClick={() => update(confirm)}
            disabled={loading !== null}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
              confirm === 'completed'
                ? 'bg-blue-500 hover:bg-blue-400 text-white'
                : 'bg-red-500 hover:bg-red-400 text-white'
            }`}
          >
            {loading !== null ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            Sí
          </button>
          <button
            onClick={() => { setConfirm(null); setCancelReason('') }}
            disabled={loading !== null}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            <X size={12} />
            No
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setConfirm('completed')}
        disabled={loading !== null}
        title="Aprobar"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 transition-colors disabled:opacity-50 text-xs font-semibold"
      >
        {loading === 'completed' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        <span className="hidden sm:inline">Aprobar</span>
      </button>
      <button
        onClick={() => setConfirm('cancelled')}
        disabled={loading !== null}
        title="Rechazar"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/30 transition-colors disabled:opacity-50 text-xs font-semibold"
      >
        {loading === 'cancelled' ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
        <span className="hidden sm:inline">Rechazar</span>
      </button>
    </div>
  )
}
