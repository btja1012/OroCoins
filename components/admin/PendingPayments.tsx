'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import type { CollectorPayment } from '@/lib/admin-db'

export function PendingPayments() {
  const router = useRouter()
  const [payments, setPayments] = useState<CollectorPayment[]>([])

  const load = () => {
    fetch('/api/admin/collector-payments')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPayments(data.filter((p) => p.status === 'pending'))
      })
      .catch(() => null)
  }

  useEffect(() => { load() }, [])

  if (payments.length === 0) return null

  const handleReviewed = () => {
    load()
    router.refresh()
  }

  return (
    <div className="bg-zinc-950 border border-amber-500/20 rounded-2xl overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-black flex items-center justify-center shrink-0">
          {payments.length}
        </span>
        <h3 className="text-zinc-300 text-sm font-bold uppercase tracking-widest">
          Pagos pendientes de revisión
        </h3>
      </div>
      <div className="divide-y divide-zinc-800">
        {payments.map((p) => (
          <PaymentRow key={p.id} payment={p} onReviewed={handleReviewed} />
        ))}
      </div>
    </div>
  )
}

function PaymentRow({ payment, onReviewed }: { payment: CollectorPayment; onReviewed: () => void }) {
  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [loading, setLoading] = useState<'confirm' | 'reject' | null>(null)
  const [error, setError] = useState('')

  const review = async (status: 'confirmed' | 'rejected') => {
    setError('')
    setLoading(status === 'confirmed' ? 'confirm' : 'reject')
    try {
      const res = await fetch(`/api/admin/collector-payments/${payment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reject_reason: rejectReason.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al revisar el pago.'); return }
      onReviewed()
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(null)
    }
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const h = Math.floor(diff / 3_600_000)
    const m = Math.floor((diff % 3_600_000) / 60_000)
    if (h > 0) return `hace ${h}h`
    if (m > 0) return `hace ${m}m`
    return 'ahora'
  }

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-bold text-sm">{payment.seller_name}</span>
            <span className="text-amber-400 font-black text-sm">${Number(payment.amount_usd).toFixed(2)} USD</span>
          </div>
          {payment.notes && (
            <p className="text-zinc-600 text-xs mt-0.5">{payment.notes}</p>
          )}
          <p className="text-zinc-600 text-xs mt-1">{timeAgo(payment.created_at)} · por {payment.submitted_by}</p>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => review('confirmed')}
            disabled={loading !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
          >
            {loading === 'confirm' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            Confirmar
          </button>
          <button
            type="button"
            onClick={() => setShowReject(!showReject)}
            disabled={loading !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
          >
            {showReject ? <ChevronUp size={12} /> : <XCircle size={12} />}
            Rechazar
          </button>
        </div>
      </div>

      {/* Panel de rechazo */}
      {showReject && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Razón del rechazo (opcional)"
            maxLength={200}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
          />
          <button
            type="button"
            onClick={() => review('rejected')}
            disabled={loading !== null}
            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {loading === 'reject' ? <Loader2 size={12} className="animate-spin" /> : null}
            Confirmar rechazo
          </button>
        </div>
      )}

      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  )
}
