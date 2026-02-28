'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function AutoRefresh({ intervalMs = 30000 }: { intervalMs?: number }) {
  const router = useRouter()
  const lastDataRef = useRef<{ pendingCount: number; lastOrderId: number } | null>(null)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    const poll = async () => {
      // Pause polling when tab is in background
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
      } catch {
        // Silently ignore — don't break the UI on network errors
      } finally {
        timeoutId = setTimeout(poll, intervalMs)
      }
    }

    timeoutId = setTimeout(poll, intervalMs)
    return () => clearTimeout(timeoutId)
  }, [router, intervalMs])

  return null
}
