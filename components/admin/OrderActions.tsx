'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2 } from 'lucide-react'

export function OrderActions({ orderNumber, status }: { orderNumber: string; status: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'completed' | 'cancelled' | null>(null)

  if (status !== 'pending') return null

  const update = async (newStatus: 'completed' | 'cancelled') => {
    setLoading(newStatus)
    try {
      await fetch(`/api/orders/${orderNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => update('completed')}
        disabled={loading !== null}
        title="Aprobar"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 transition-colors disabled:opacity-50 text-xs font-semibold"
      >
        {loading === 'completed' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        <span className="hidden sm:inline">Aprobar</span>
      </button>
      <button
        onClick={() => update('cancelled')}
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
