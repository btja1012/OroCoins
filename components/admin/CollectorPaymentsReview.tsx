'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import type { CollectorPayment } from '@/lib/admin-db'

export function CollectorPaymentsReview() {
  const [payments, setPayments] = useState<CollectorPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/collector-payments')
      if (res.ok) setPayments(await res.json())
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const review = async (id: number, status: 'confirmed' | 'rejected', reason?: string) => {
    setActionId(id)
    try {
      await fetch(`/api/admin/collector-payments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reject_reason: reason ?? '' }),
      })
      await load()
      setRejectingId(null)
      setRejectReason('')
    } catch { /* silent */ } finally {
      setActionId(null)
    }
  }

  const pending = payments.filter((p) => p.status === 'pending')
  const reviewed = payments.filter((p) => p.status !== 'pending').slice(0, 10)

  if (loading) return null
  if (payments.length === 0) return null

  return (
    <div className="bg-zinc-950 border border-amber-500/10 rounded-2xl overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-zinc-900">
        <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest">
          Pagos de colectores
        </p>
        {pending.length > 0 && (
          <p className="text-amber-400 text-xs mt-0.5">{pending.length} pendiente{pending.length > 1 ? 's' : ''} de revisión</p>
        )}
      </div>

      <div className="divide-y divide-zinc-900">
        {pending.map((p) => (
          <div key={p.id} className="px-5 py-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-white font-bold text-sm">{p.seller_name}</p>
                <p className="text-emerald-400 font-black text-lg">${Number(p.amount_usd).toFixed(2)} USD</p>
                {p.notes && <p className="text-zinc-500 text-xs mt-0.5">{p.notes}</p>}
                <p className="text-zinc-600 text-xs mt-1">
                  {new Date(p.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold shrink-0 mt-1">
                <Clock size={11} /> Pendiente
              </span>
            </div>

            {rejectingId === p.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Razón del rechazo (opcional)"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-red-500/40"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => review(p.id, 'rejected', rejectReason)}
                    disabled={actionId === p.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionId === p.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                    Confirmar rechazo
                  </button>
                  <button
                    onClick={() => { setRejectingId(null); setRejectReason('') }}
                    className="px-4 py-2 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => review(p.id, 'confirmed')}
                  disabled={actionId !== null}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 font-bold text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionId === p.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  Confirmar pago
                </button>
                <button
                  onClick={() => setRejectingId(p.id)}
                  disabled={actionId !== null}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  <XCircle size={13} />
                  Rechazar
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Últimos revisados */}
        {reviewed.length > 0 && (
          <div className="px-5 py-3 space-y-2">
            <p className="text-zinc-600 text-xs font-semibold uppercase tracking-widest mb-2">Historial reciente</p>
            {reviewed.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <span className="text-zinc-400 font-semibold">{p.seller_name}</span>
                  <span className="text-zinc-600 text-xs ml-2">
                    {new Date(p.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-zinc-300 font-bold">${Number(p.amount_usd).toFixed(2)}</span>
                  {p.status === 'confirmed'
                    ? <span className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle2 size={11} /> Confirmado</span>
                    : <span className="flex items-center gap-1 text-red-400 text-xs"><XCircle size={11} /> Rechazado</span>
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
