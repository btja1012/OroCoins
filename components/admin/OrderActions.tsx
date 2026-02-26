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
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => update('completed')}
        disabled={loading !== null}
        title="Aprobar"
        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors disabled:opacity-50"
      >
        {loading === 'completed' ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
      </button>
      <button
        onClick={() => update('cancelled')}
        disabled={loading !== null}
        title="Rechazar"
        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors disabled:opacity-50"
      >
        {loading === 'cancelled' ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
      </button>
    </div>
  )
}
