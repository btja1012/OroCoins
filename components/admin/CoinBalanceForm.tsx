'use client'

import { useState } from 'react'
import { Loader2, Pencil, Check, X, Plus } from 'lucide-react'
import { formatCoins } from '@/lib/data'
import type { CoinAccount } from '@/lib/admin-db'

export function CoinBalanceForm({
  accounts: initial,
  isSuperAdmin = false,
}: {
  accounts: CoinAccount[]
  isSuperAdmin?: boolean
}) {
  const [accounts, setAccounts] = useState(initial)
  const [editing, setEditing] = useState<string | null>(null)
  const [mode, setMode] = useState<'set' | 'add'>('set')
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [successName, setSuccessName] = useState<string | null>(null)

  const startEdit = (account: CoinAccount, editMode: 'set' | 'add') => {
    setEditing(account.name)
    setMode(editMode)
    setInputValue('')
  }

  const cancelEdit = () => {
    setEditing(null)
    setInputValue('')
  }

  const save = async (name: string) => {
    const amount = parseInt(inputValue.replace(/\D/g, ''), 10)
    if (isNaN(amount) || amount < 0) return
    setLoading(true)

    try {
      if (mode === 'set') {
        const res = await fetch('/api/admin/coin-accounts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, balance: amount }),
        })
        if (res.ok) {
          setAccounts((prev) =>
            prev.map((a) => (a.name === name ? { ...a, current_balance: amount } : a)),
          )
        }
      } else {
        const res = await fetch('/api/admin/coin-accounts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, addCoins: amount }),
        })
        if (res.ok) {
          setAccounts((prev) =>
            prev.map((a) =>
              a.name === name ? { ...a, current_balance: a.current_balance + amount } : a,
            ),
          )
        }
      }
      setEditing(null)
      setSuccessName(name)
      setTimeout(() => setSuccessName(null), 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {accounts.map((account) => (
        <div
          key={account.name}
          className={`bg-zinc-900 border rounded-2xl p-5 transition-colors ${
            successName === account.name ? 'border-emerald-500/40' : 'border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-400 text-xs font-semibold uppercase tracking-widest">
              {account.name}
            </span>
            {editing !== account.name && (
              <div className="flex items-center gap-1">
                {/* Recharge (+ add) — available to all admins */}
                <button
                  onClick={() => startEdit(account, 'add')}
                  title="Recargar saldo"
                  className="text-zinc-600 hover:text-emerald-400 transition-colors p-1"
                >
                  <Plus size={14} />
                </button>
                {/* Set absolute — super_admin only */}
                {isSuperAdmin && (
                  <button
                    onClick={() => startEdit(account, 'set')}
                    title="Establecer saldo"
                    className="text-zinc-600 hover:text-amber-400 transition-colors p-1"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          {editing === account.name ? (
            <div>
              <p className="text-zinc-600 text-xs mb-2">
                {mode === 'add' ? `Agregar monedas a ${account.name}` : `Nuevo saldo para ${account.name}`}
              </p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  {mode === 'add' && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 text-sm font-bold">+</span>
                  )}
                  <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={mode === 'add' ? 'Ej: 50000' : String(account.current_balance)}
                    className={`w-full bg-zinc-800 border rounded-lg px-3 py-2 text-white text-sm ${
                      mode === 'add' ? 'pl-7 border-emerald-500/50' : 'border-amber-500/50'
                    }`}
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => save(account.name)}
                  disabled={loading}
                  className="text-emerald-400 hover:text-emerald-300 p-1"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                </button>
                <button onClick={cancelEdit} className="text-red-400 hover:text-red-300 p-1">
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className={`text-3xl font-black ${successName === account.name ? 'text-emerald-400' : 'text-amber-400'}`}>
                {formatCoins(account.current_balance)}
                <span className="text-lg ml-1">🪙</span>
              </p>
              <p className="text-zinc-600 text-xs mt-1">
                {successName === account.name ? '✓ Actualizado' : 'disponibles'}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
