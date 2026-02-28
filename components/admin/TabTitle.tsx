'use client'

import { useEffect } from 'react'

export function TabTitle({ pendingCount }: { pendingCount: number }) {
  useEffect(() => {
    const base = 'Dashboard — Oros Pura Vida'
    document.title = pendingCount > 0 ? `(${pendingCount}) ${base}` : base
  }, [pendingCount])
  return null
}
