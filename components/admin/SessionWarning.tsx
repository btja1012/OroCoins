'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, X } from 'lucide-react'

const WARN_MS = 30 * 60 * 1000 // warn when < 30 min remain

export function SessionWarning() {
  const [minsLeft, setMinsLeft] = useState<number | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/admin/session')
      .then((r) => r.json())
      .then((d) => { if (d.expiresAt) setExpiresAt(d.expiresAt) })
      .catch(() => null)
  }, [])

  useEffect(() => {
    if (!expiresAt) return
    const update = () => {
      const remaining = expiresAt - Date.now()
      if (remaining <= 0) {
        setMinsLeft(0)
      } else if (remaining < WARN_MS) {
        setMinsLeft(Math.ceil(remaining / 60000))
        setDismissed(false)
      } else {
        setMinsLeft(null)
      }
    }
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [expiresAt])

  if (minsLeft === null || dismissed) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-amber-500 text-black text-sm font-semibold px-4 py-3 rounded-xl shadow-lg shadow-amber-500/20 max-w-sm w-full mx-4">
      <AlertCircle size={16} className="shrink-0" />
      <span className="flex-1">
        {minsLeft === 0
          ? 'Tu sesión expiró. Recarga e inicia sesión de nuevo.'
          : `Tu sesión expira en ${minsLeft} min. Guarda tu trabajo.`}
      </span>
      <button onClick={() => setDismissed(true)} className="shrink-0 hover:opacity-70">
        <X size={14} />
      </button>
    </div>
  )
}
