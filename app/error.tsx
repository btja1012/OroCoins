'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1 className="text-white font-black text-2xl mb-2">Algo salió mal</h1>
        <p className="text-zinc-500 text-sm mb-6">
          Ocurrió un error inesperado. Puedes intentar de nuevo o volver al inicio.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition-colors"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium rounded-xl text-sm transition-colors border border-zinc-800"
          >
            Volver al inicio
          </Link>
        </div>
        {error.digest && (
          <p className="text-zinc-700 text-xs mt-4">Error ID: {error.digest}</p>
        )}
      </div>
    </main>
  )
}
