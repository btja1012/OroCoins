'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Polls router.refresh() every 10s while order is pending. Stops once status changes. */
export function OrderPoller({ status }: { status: string }) {
  const router = useRouter()

  useEffect(() => {
    if (status !== 'pending') return
    const id = setInterval(() => router.refresh(), 10_000)
    return () => clearInterval(id)
  }, [status, router])

  return null
}
