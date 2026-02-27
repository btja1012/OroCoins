import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { LoginForm } from '@/components/admin/LoginForm'

export const metadata = { title: 'Admin — Oros Pura Vida' }

export default async function LoginPage() {
  const session = await getSession()
  if (session) {
    if (session.role === 'seller') redirect('/admin/dashboard')
    else redirect('/')
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Background gold glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-4">
            <span className="text-3xl">🪙</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-2 tracking-tight">Oros Pura Vida</h1>
          <p className="text-zinc-500 text-sm mt-1">Panel de Administración</p>
        </div>

        <div className="bg-zinc-950 border border-amber-500/20 rounded-2xl p-6 shadow-2xl gold-card">
          <LoginForm />
        </div>

        <p className="text-center text-zinc-700 text-xs mt-6">
          Acceso restringido · Solo personal autorizado
        </p>
      </div>
    </main>
  )
}
