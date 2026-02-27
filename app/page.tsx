import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/session'
import { OrderForm } from '@/components/OrderForm'
import { LogoutButton } from '@/components/admin/LogoutButton'

export default async function HomePage() {
  const session = await getSession()

  if (!session) redirect('/admin/login')
  if (session.role === 'seller') redirect('/admin/dashboard')

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
            <p className="text-zinc-500 text-sm ml-0.5">
              Hola, <span className="text-zinc-300 font-semibold">{session.username}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/dashboard"
              className="text-xs font-semibold text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 px-3 py-2 rounded-lg transition-all"
            >
              Dashboard
            </Link>
            <LogoutButton />
          </div>
        </div>

        <OrderForm />

      </div>
    </main>
  )
}
