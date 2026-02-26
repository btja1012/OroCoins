import { OrderForm } from '@/components/OrderForm'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="container mx-auto px-4 py-10 max-w-2xl">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-3xl">🪙</span>
            <h1 className="text-2xl font-black text-white tracking-tight">Oros Pura Vida</h1>
          </div>
          <p className="text-zinc-500 text-sm ml-0.5">Registro de pedidos</p>
        </div>

        <OrderForm />

      </div>
    </main>
  )
}
