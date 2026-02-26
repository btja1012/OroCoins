import Link from 'next/link'
import { OrderForm } from '@/components/OrderForm'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="container mx-auto px-4 py-8 max-w-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-3xl">🪙</span>
              <h1 className="text-2xl font-black text-white tracking-tight">Oros Pura Vida</h1>
            </div>
            <p className="text-zinc-500 text-sm ml-0.5">Registro de pedidos</p>
          </div>
          <Link
            href="/admin/login"
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 px-3 py-2 rounded-lg transition-all"
          >
            Panel Admin
          </Link>
        </div>

        <OrderForm />

      </div>
    </main>
  )
}
