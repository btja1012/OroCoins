'use client'

import { useState } from 'react'
import { BellRing, Loader2 } from 'lucide-react'

export function RenotifyButton({ orderNumber }: { orderNumber: string }) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const notify = async () => {
    setLoading(true)
    try {
      await fetch(`/api/orders/${orderNumber}/notify`, { method: 'POST' })
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    } catch {
      // Silent
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={notify}
      disabled={loading || sent}
      title="Re-notificar al colector"
      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
        sent
          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
          : 'text-zinc-400 hover:text-amber-400 bg-zinc-900 hover:bg-amber-500/10 border border-zinc-800 hover:border-amber-500/30'
      }`}
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <BellRing size={12} />
      )}
      {sent ? 'Enviado' : ''}
    </button>
  )
}
