import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="text-7xl mb-6 animate-float">🪙</div>
      <h1 className="text-4xl font-bold text-white mb-2">Página no encontrada</h1>
      <p className="text-zinc-400 mb-8">La página que buscas no existe o fue movida.</p>
      <Link
        href="/"
        className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-xl transition-colors"
      >
        Volver al inicio
      </Link>
    </main>
  )
}
