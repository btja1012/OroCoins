'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Smartphone, X } from 'lucide-react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

type Status = 'unknown' | 'granted' | 'denied' | 'unsupported' | 'ios-browser'

export function PushSetup() {
  const [status, setStatus] = useState<Status>('unknown')
  const [loading, setLoading] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isStandalone = ('standalone' in navigator) && (navigator as any).standalone

    if (isIOS && !isStandalone) {
      setStatus('ios-browser')
      return
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    if (Notification.permission === 'granted') {
      setStatus('granted')
      syncSubscription()
    }
  }, [])

  const syncSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(pub),
        })
      }
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })
    } catch {
      // Silent — don't break the UI
    }
  }

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

  if (status === 'granted') {
    return (
      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
        <Bell size={12} />
        <span>Activas</span>
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

  if (status === 'ios-browser') {
    return (
      <div className="relative">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-400/50 px-3 py-1.5 rounded-lg transition-all"
        >
          <Smartphone size={12} />
          <span>Activar notificaciones</span>
        </button>
        {showGuide && (
          <div className="absolute right-0 top-10 z-50 w-72 bg-zinc-900 border border-amber-500/20 rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white text-sm font-bold">Activar en iPhone / iPad</p>
              <button onClick={() => setShowGuide(false)} className="text-zinc-500 hover:text-white">
                <X size={14} />
              </button>
            </div>
            <ol className="text-zinc-300 text-xs space-y-2 list-none">
              <li className="flex gap-2">
                <span className="text-amber-400 font-bold shrink-0">1.</span>
                Abre esta página en <span className="text-white font-semibold ml-1">Safari</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400 font-bold shrink-0">2.</span>
                Toca el ícono <span className="text-white font-semibold mx-1">Compartir</span> (□↑) en la barra inferior
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400 font-bold shrink-0">3.</span>
                Selecciona <span className="text-white font-semibold ml-1">"Agregar a pantalla de inicio"</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400 font-bold shrink-0">4.</span>
                Abre la app desde tu pantalla de inicio
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400 font-bold shrink-0">5.</span>
                Toca <span className="text-white font-semibold ml-1">"Activar notificaciones"</span>
              </li>
            </ol>
            <p className="text-zinc-600 text-xs mt-3">Requiere iOS 16.4 o superior.</p>
          </div>
        )}
      </div>
    )
  }

  if (status === 'unsupported') {
    return (
      <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
        <BellOff size={12} />
        <span className="hidden sm:block">Usar Chrome o Safari</span>
      </div>
    )
  }

  // status === 'unknown' → show subscribe button
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
