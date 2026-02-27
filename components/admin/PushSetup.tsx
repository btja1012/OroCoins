'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function PushSetup() {
  const [status, setStatus] = useState<'unknown' | 'granted' | 'denied' | 'unsupported'>('unknown')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'granted') setStatus('granted')
    else if (Notification.permission === 'denied') setStatus('denied')
  }, [])

  const subscribe = async () => {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pub),
      })
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })
      setStatus('granted')
    } catch (err) {
      console.error('Push error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'unsupported') return null

  const testPush = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/push/test', { method: 'POST' })
      const data = await res.json()
      if (!data.ok) alert('Error: ' + (data.error ?? 'Fallo al enviar'))
    } catch {
      alert('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'granted') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
          <Bell size={12} />
          <span>Activas</span>
        </div>
        <button
          onClick={testPush}
          disabled={loading}
          className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 px-2 py-1 rounded-lg transition-all disabled:opacity-50"
        >
          {loading ? '...' : 'Probar'}
        </button>
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className="flex items-center gap-1.5 text-zinc-600 text-xs">
        <BellOff size={12} />
        <span>Notificaciones bloqueadas</span>
      </div>
    )
  }

  return (
    <button
      onClick={subscribe}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
    >
      <Bell size={12} />
      {loading ? 'Activando...' : 'Activar notificaciones'}
    </button>
  )
}
