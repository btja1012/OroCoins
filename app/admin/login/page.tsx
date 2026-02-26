import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { LoginForm } from '@/components/admin/LoginForm'

export const metadata = { title: 'Admin — Oros Pura Vida' }

export default async function LoginPage() {
  const session = await getSession()
  if (session) redirect('/admin/dashboard')

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🪙</span>
          <h1 className="text-xl font-black text-white mt-2">Oros Pura Vida</h1>
          <p className="text-zinc-500 text-sm mt-1">Panel de Administración</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
