'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export function AutoRefresh({ intervalMs = 30000 }: { intervalMs?: number }) {
  const router = useRouter()
  const lastDataRef = useRef<{ pendingCount: number; lastOrderId: number } | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now())
  const [elapsed, setElapsed] = useState(0)

  // Update elapsed every 15 seconds
  useEffect(() => {
    const tick = setInterval(() => {
      setElapsed(Math.round((Date.now() - lastUpdated) / 1000))
    }, 15000)
    return () => clearInterval(tick)
  }, [lastUpdated])

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    const poll = async () => {
      if (document.hidden) {
        timeoutId = setTimeout(poll, intervalMs)
        return
      }
      try {
        const res = await fetch('/api/admin/poll', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const last = lastDataRef.current
        if (last === null) {
          lastDataRef.current = data
        } else if (
          data.pendingCount !== last.pendingCount ||
          data.lastOrderId !== last.lastOrderId
        ) {
          lastDataRef.current = data
          router.refresh()
        }
        setLastUpdated(Date.now())
        setElapsed(0)
      } catch {
        // Silently ignore — don't break the UI on network errors
      } finally {
        timeoutId = setTimeout(poll, intervalMs)
      }
    }

    timeoutId = setTimeout(poll, intervalMs)
    return () => clearTimeout(timeoutId)
  }, [router, intervalMs])

  const label = elapsed < 60
    ? `hace ${elapsed} seg`
    : `hace ${Math.floor(elapsed / 60)} min`

  const timeStr = new Date(lastUpdated).toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <p className="text-zinc-700 text-xs text-right mb-2">
      Actualizado {label} · {timeStr}
    </p>
  )
}
