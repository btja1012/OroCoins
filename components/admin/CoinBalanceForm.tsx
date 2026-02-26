'use client'

import { useState } from 'react'
import { Loader2, Pencil, Check, X } from 'lucide-react'
import { formatCoins } from '@/lib/data'
import type { CoinAccount } from '@/lib/admin-db'

export function CoinBalanceForm({ accounts: initial }: { accounts: CoinAccount[] }) {
  const [accounts, setAccounts] = useState(initial)
  const [editing, setEditing] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)

  const startEdit = (account: CoinAccount) => {
    setEditing(account.name)
    setInputValue(String(account.current_balance))
  }

  const cancelEdit = () => {
    setEditing(null)
    setInputValue('')
  }

  const saveEdit = async (name: string) => {
    const balance = parseInt(inputValue.replace(/\D/g, ''), 10)
    if (isNaN(balance) || balance < 0) return
    setLoading(true)

    try {
      const res = await fetch('/api/admin/coin-accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, balance }),
      })

      if (res.ok) {
        setAccounts((prev) =>
          prev.map((a) => (a.name === name ? { ...a, current_balance: balance } : a)),
        )
        setEditing(null)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {accounts.map((account) => (
        <div
          key={account.name}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-400 text-xs font-semibold uppercase tracking-widest">
              {account.name}
            </span>
            {editing !== account.name && (
              <button
                onClick={() => startEdit(account)}
                className="text-zinc-600 hover:text-amber-400 transition-colors p-1"
                title="Editar saldo"
              >
                <Pencil size={14} />
              </button>
            )}
          </div>

          {editing === account.name ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 bg-zinc-800 border border-amber-500/50 rounded-lg px-3 py-2 text-white text-sm"
                autoFocus
              />
              <button
                onClick={() => saveEdit(account.name)}
                disabled={loading}
                className="text-emerald-400 hover:text-emerald-300 p-1"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              </button>
              <button onClick={cancelEdit} className="text-red-400 hover:text-red-300 p-1">
                <X size={16} />
              </button>
            </div>
          ) : (
            <p className="text-3xl font-black text-amber-400">
              {formatCoins(account.current_balance)}
              <span className="text-lg ml-1">🪙</span>
            </p>
          )}
          <p className="text-zinc-600 text-xs mt-1">disponibles</p>
        </div>
      ))}
    </div>
  )
}
