'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al iniciar sesión.')
        return
      }

      if (data.role === 'seller') {
        router.push('/admin/dashboard')
      } else {
        router.push('/')
      }
      router.refresh()
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-2">
          Usuario
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="tu usuario"
          autoComplete="username"
          required
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white
                     placeholder:text-zinc-600 hover:border-zinc-600 text-sm"
        />
      </div>

      <div>
        <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-2">
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white
                     placeholder:text-zinc-600 hover:border-zinc-600 text-sm"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500
                   text-black font-black py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 size={16} className="animate-spin" /> Ingresando...</> : 'Ingresar'}
      </button>
    </form>
  )
}
