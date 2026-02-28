'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { COLLECTOR_COMMISSION_RATE, commissionExemptSellers, formatPrice, type Seller } from '@/lib/data'
import { localToUSD } from '@/lib/exchange-rates'
import type { SellerStat, CollectorPayment } from '@/lib/admin-db'

interface DebtCardProps {
  stats: SellerStat | null
  sellerName: string
}

export function DebtCard({ stats, sellerName }: DebtCardProps) {
  const [payments, setPayments] = useState<CollectorPayment[]>([])
  const [confirmedTotalUsd, setConfirmedTotalUsd] = useState(0)
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 })
  const [showForm, setShowForm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [amountUsd, setAmountUsd] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/collector-payments')
      .then((r) => r.json())
      .then((data) => {
        if (data.payments) setPayments(data.payments)
        if (typeof data.confirmedTotalUsd === 'number') setConfirmedTotalUsd(data.confirmedTotalUsd)
      })
      .catch(() => null)

    fetch('/api/exchange-rates')
      .then((r) => r.json())
      .then((data) => { if (data) setRates(data) })
      .catch(() => null)
  }, [success])

  const isExempt = commissionExemptSellers.includes(sellerName as Seller)
  const totalAmount = Number(stats?.total_amount ?? 0)
  const commission = isExempt ? 0 : totalAmount * COLLECTOR_COMMISSION_RATE
  const debtLocal = totalAmount - commission
  const currencyCode = stats?.currency_code ?? 'USD'
  const debtUsd = localToUSD(debtLocal, currencyCode, rates)
  const balanceUsd = debtUsd !== null ? debtUsd - confirmedTotalUsd : null

  const pendingPayments = payments.filter((p) => p.status === 'pending')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const amount = parseFloat(amountUsd)
    if (!amount || amount <= 0) { setError('El monto debe ser mayor a 0.'); return }
    if (!reference.trim()) { setError('La referencia de Binance es requerida.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/collector-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_usd: amount, reference: reference.trim(), notes: notes.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al reportar el pago.'); return }
      setSuccess(true)
      setAmountUsd('')
      setReference('')
      setNotes('')
      setShowForm(false)
      setTimeout(() => setSuccess(false), 4000)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (!stats || debtLocal === 0) return null

  return (
    <div className="bg-zinc-950 border border-amber-500/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-4">
          Tu deuda con OrosPV
        </h3>

        {/* Deuda en moneda local */}
        <div className="space-y-2 text-sm mb-4">
          <DebtRow
            label="Total recolectado"
            value={formatPrice(totalAmount, currencyCode)}
          />
          {!isExempt && (
            <DebtRow
              label={`Tu comisión (${(COLLECTOR_COMMISSION_RATE * 100).toFixed(0)}%)`}
              value={`− ${formatPrice(commission, currencyCode)}`}
              dim
            />
          )}
          <DebtRow
            label="Debes (moneda local)"
            value={formatPrice(debtLocal, currencyCode)}
            highlight
          />
          <DebtRow
            label="Equivalente USD"
            value={debtUsd !== null ? `≈ $${debtUsd.toFixed(2)} USD` : 'N/A'}
            highlight={debtUsd !== null}
            dim={debtUsd === null}
          />
        </div>

        {/* Pagos confirmados y saldo */}
        {confirmedTotalUsd > 0 && (
          <div className="border-t border-zinc-800 pt-3 mt-3 space-y-2 text-sm">
            <DebtRow
              label="Pagos confirmados"
              value={`− $${confirmedTotalUsd.toFixed(2)} USD`}
              green
            />
            <DebtRow
              label="Saldo pendiente"
              value={balanceUsd !== null ? `≈ $${Math.max(0, balanceUsd).toFixed(2)} USD` : 'N/A'}
              highlight={balanceUsd !== null && balanceUsd > 0}
              green={balanceUsd !== null && balanceUsd <= 0}
            />
          </div>
        )}

        {/* Pagos pendientes de revisión */}
        {pendingPayments.length > 0 && (
          <div className="mt-3 flex items-center gap-2 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2">
            <Clock size={13} className="text-amber-400 shrink-0" />
            <p className="text-amber-400 text-xs">
              {pendingPayments.length === 1
                ? '1 pago pendiente de confirmación'
                : `${pendingPayments.length} pagos pendientes de confirmación`}
            </p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mt-3 flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2">
            <CheckCircle2 size={13} className="text-green-400 shrink-0" />
            <p className="text-green-400 text-xs">Pago reportado. Esperando confirmación del admin.</p>
          </div>
        )}
      </div>

      {/* Botón reportar pago */}
      <div className="px-5 pb-5">
        <button
          type="button"
          onClick={() => { setShowForm(!showForm); setError('') }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 text-sm font-semibold transition-colors"
        >
          {showForm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showForm ? 'Cancelar' : '💳 Reportar Pago a OrosPV'}
        </button>

        {/* Formulario de pago */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <div>
              <label className="block text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-1.5">
                Monto enviado (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">$</span>
                <input
                  type="number"
                  value={amountUsd}
                  onChange={(e) => setAmountUsd(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-7 pr-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-1.5">
                Referencia Binance (TX ID)
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="ID de transacción o referencia"
                maxLength={200}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-1.5">
                Notas (opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Información adicional"
                maxLength={300}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 text-red-400 text-xs">
                <AlertCircle size={13} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-black py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Enviando...</> : '✓ Confirmar y Enviar'}
            </button>
          </form>
        )}
      </div>

      {/* Historial de pagos */}
      {payments.length > 0 && (
        <div className="border-t border-zinc-800">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-5 py-3 text-zinc-500 hover:text-zinc-300 text-xs font-semibold uppercase tracking-widest transition-colors"
          >
            <span>Historial de pagos ({payments.length})</span>
            {showHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showHistory && (
            <div className="px-5 pb-5 space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex items-start justify-between gap-3 py-2 border-b border-zinc-800/50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold">${Number(p.amount_usd).toFixed(2)} USD</p>
                    <p className="text-zinc-500 text-xs truncate">{p.reference}</p>
                    {p.reject_reason && (
                      <p className="text-red-400 text-xs mt-0.5">Razón: {p.reject_reason}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <PaymentStatusBadge status={p.status} />
                    <p className="text-zinc-600 text-xs mt-1">
                      {new Date(p.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DebtRow({
  label, value, highlight, dim, green,
}: {
  label: string
  value: string
  highlight?: boolean
  dim?: boolean
  green?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className={
        green ? 'text-green-400 font-bold' :
        highlight ? 'text-amber-400 font-bold' :
        dim ? 'text-zinc-600' :
        'text-zinc-300'
      }>
        {value}
      </span>
    </div>
  )
}

function PaymentStatusBadge({ status }: { status: string }) {
  if (status === 'confirmed') return (
    <span className="inline-flex items-center gap-1 text-green-400 text-xs font-semibold">
      <CheckCircle2 size={11} /> Confirmado
    </span>
  )
  if (status === 'rejected') return (
    <span className="inline-flex items-center gap-1 text-red-400 text-xs font-semibold">
      <XCircle size={11} /> Rechazado
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-semibold">
      <Clock size={11} /> Pendiente
    </span>
  )
}
