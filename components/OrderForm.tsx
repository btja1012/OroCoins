'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, ChevronRight } from 'lucide-react'
import {
  countries,
  sellers,
  getSellerCountries,
  type Country,
  type Package,
  type Seller,
  formatPrice,
  formatCoins,
  getCoinRate,
  roundToNearest500,
} from '@/lib/data'

export function OrderForm() {
  const router = useRouter()

  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)
  const [selectedCountrySlug, setSelectedCountrySlug] = useState<string | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [customCoins, setCustomCoins] = useState(0)
  const [isCustomSelected, setIsCustomSelected] = useState(false)
  const [gameUsername, setGameUsername] = useState('')
  const [coinAccount, setCoinAccount] = useState<'OrosPV1' | 'OrosPV2' | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [balances, setBalances] = useState<Record<string, number>>({})

  useEffect(() => {
    fetch('/api/admin/coin-accounts')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const map: Record<string, number> = {}
          data.forEach((a: { name: string; current_balance: number }) => {
            map[a.name] = Number(a.current_balance)
          })
          setBalances(map)
        }
      })
      .catch(() => null)
  }, [])

  const sellerCountries = selectedSeller ? getSellerCountries(selectedSeller) : []
  const hasMultipleCountries = sellerCountries.length > 1
  // Auto-select country when seller has only one option
  const effectiveCountrySlug = selectedCountrySlug ?? (sellerCountries.length === 1 ? sellerCountries[0] : null)
  const selectedCountry: Country | null = effectiveCountrySlug
    ? (countries.find((c) => c.slug === effectiveCountrySlug) ?? null)
    : null

  const handleSellerSelect = (seller: Seller) => {
    setSelectedSeller(seller)
    setSelectedCountrySlug(null)
    setSelectedPackage(null)
    setIsCustomSelected(false)
    setCustomAmount('')
    setCustomCoins(0)
    setError('')
  }

  const handleCountrySelect = (slug: string) => {
    setSelectedCountrySlug(slug)
    setSelectedPackage(null)
    setIsCustomSelected(false)
    setCustomAmount('')
    setCustomCoins(0)
    setError('')
  }

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackage(pkg)
    setIsCustomSelected(false)
    setCustomAmount('')
    setCustomCoins(0)
    setError('')
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setIsCustomSelected(false)
    setSelectedPackage(null)
    if (selectedCountry) {
      const rate = getCoinRate(selectedCountry)
      const num = parseFloat(value.replace(',', '.'))
      setCustomCoins(!isNaN(num) && num > 0 ? roundToNearest500(num * rate) : 0)
    }
  }

  const handleUseCustom = () => {
    if (customCoins > 0) {
      setIsCustomSelected(true)
      setSelectedPackage(null)
    }
  }

  const hasSelection = selectedPackage !== null || (isCustomSelected && customCoins > 0)
  const displayCoins = selectedPackage ? selectedPackage.coins : customCoins
  const displayPrice = selectedPackage
    ? selectedPackage.price
    : parseFloat(customAmount.replace(',', '.'))

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!selectedSeller) { setError('Selecciona un vendedor.'); return }
    if (!hasSelection) { setError('Selecciona un paquete o ingresa un monto.'); return }
    if (!coinAccount) { setError('Selecciona la cuenta de Oros (OrosPV1 o OrosPV2).'); return }
    if (gameUsername.trim().length < 2) {
      setError('La referencia de comprobante debe tener al menos 2 caracteres.')
      return
    }
    setConfirming(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        seller: selectedSeller,
        gameUsername: gameUsername.trim(),
        coinAccount,
        ...(hasMultipleCountries && effectiveCountrySlug ? { countrySlug: effectiveCountrySlug } : {}),
      }

      if (selectedPackage) {
        body.packageId = selectedPackage.id
      } else {
        body.customPrice = displayPrice
        body.customCoins = displayCoins
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (res.status === 401) { setError('Tu sesión expiró. Vuelve a iniciar sesión.'); return }
      if (!res.ok) { setError(data.error ?? 'Error al procesar el pedido.'); return }

      router.push(`/pedido/${data.orderNumber}`)
    } catch {
      setError('Error de conexión. Revisa tu internet e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={confirming ? handleSubmit : handleConfirm} className="space-y-6">

      {/* ── PASO 1: Colector ── */}
      <Section step={1} title="Colector">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {sellers.map((seller) => {
            const active = selectedSeller === seller
            const country = countries.find((c) => c.slug === getSellerCountries(seller)[0])
            return (
              <button
                key={seller}
                type="button"
                onClick={() => handleSellerSelect(seller)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all text-left
                  ${active
                    ? 'bg-amber-500 border-amber-500 text-black'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white'
                  }`}
              >
                <span className="text-xl leading-none">{country?.flag}</span>
                <div>
                  <p className={`font-bold text-sm ${active ? 'text-black' : 'text-white'}`}>{seller}</p>
                  <p className={`text-xs ${active ? 'text-black/60' : 'text-zinc-500'}`}>{country?.name}</p>
                </div>
              </button>
            )
          })}
        </div>
      </Section>

      {/* ── PASO 1.5: Método (solo si el colector tiene múltiples países) ── */}
      {selectedSeller && hasMultipleCountries && (
        <Section step={2} title="Método de pago">
          <div className="grid grid-cols-2 gap-2">
            {sellerCountries.map((slug) => {
              const c = countries.find((x) => x.slug === slug)
              if (!c) return null
              const active = effectiveCountrySlug === slug
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => handleCountrySelect(slug)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all text-left
                    ${active
                      ? 'bg-amber-500 border-amber-500 text-black'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white'
                    }`}
                >
                  <span className="text-xl leading-none">{c.flag}</span>
                  <div>
                    <p className={`font-bold text-sm ${active ? 'text-black' : 'text-white'}`}>{c.name}</p>
                    <p className={`text-xs ${active ? 'text-black/60' : 'text-zinc-500'}`}>{c.payment.method}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </Section>
      )}

      {/* ── PASO 2 (o 3): Paquete ── */}
      {selectedCountry && (
        <Section step={hasMultipleCountries ? 3 : 2} title={`Paquete — ${selectedCountry.currency}`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            {selectedCountry.packages.map((pkg) => {
              const active = selectedPackage?.id === pkg.id
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handlePackageSelect(pkg)}
                  className={`relative text-left p-4 rounded-xl border transition-all
                    ${active
                      ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/30'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                    }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2.5 left-3 bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
                      ★ Popular
                    </span>
                  )}
                  <p className={`font-black text-base ${active ? 'text-amber-400' : 'text-white'}`}>
                    {formatCoins(pkg.coins)}
                    <span className="text-sm ml-1">🪙</span>
                  </p>
                  <p className={`text-sm font-semibold mt-1 ${active ? 'text-amber-300/80' : 'text-zinc-500'}`}>
                    {formatPrice(pkg.price, selectedCountry.currencyCode)}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Calculadora personalizada */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-3">
              Monto personalizado
            </p>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">
                  {selectedCountry.currencySymbol}
                </span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="any"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-3 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>
              <ChevronRight size={16} className="text-zinc-600 shrink-0" />
              <div className="flex-1 flex items-center justify-between">
                <span className={`text-sm font-bold ${customCoins > 0 ? 'text-amber-400' : 'text-zinc-600'}`}>
                  {customCoins > 0 ? `${formatCoins(customCoins)} 🪙` : '— 🪙'}
                </span>
                {customCoins > 0 && (
                  <button
                    type="button"
                    onClick={handleUseCustom}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isCustomSelected
                        ? 'bg-amber-500 text-black'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white'
                    }`}
                  >
                    {isCustomSelected ? '✓ Seleccionado' : 'Usar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* ── PASO 3 (o 4): Detalles ── */}
      {selectedCountry && hasSelection && (
        <Section step={hasMultipleCountries ? 4 : 3} title="Detalles del pedido">
          {/* Resumen selección */}
          <div className="flex items-center justify-between bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span>{selectedCountry.flag}</span>
              <span>{selectedCountry.name}</span>
              {isCustomSelected && <span className="text-zinc-600 text-xs">(personalizado)</span>}
            </div>
            <div className="text-right">
              <p className="text-amber-400 font-black text-sm">{formatCoins(displayCoins)} 🪙</p>
              <p className="text-zinc-500 text-xs">{formatPrice(displayPrice, selectedCountry.currencyCode)}</p>
            </div>
          </div>

          {/* Cuenta de Oros */}
          <div className="mb-4">
            <label className="block text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-2">
              Cuenta de Oros
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['OrosPV1', 'OrosPV2'] as const).map((acc) => {
                const bal = balances[acc]
                const insufficient = bal !== undefined && bal < displayCoins
                return (
                  <button
                    key={acc}
                    type="button"
                    onClick={() => !insufficient && setCoinAccount(acc)}
                    disabled={insufficient}
                    className={`py-3 px-3 rounded-xl border text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed
                      ${coinAccount === acc
                        ? 'bg-amber-500 border-amber-500 text-black'
                        : insufficient
                          ? 'bg-zinc-900 border-red-500/30 text-red-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white'
                      }`}
                  >
                    <p>{acc}</p>
                    {bal !== undefined && (
                      <p className={`text-xs font-normal mt-0.5 ${coinAccount === acc ? 'text-black/60' : insufficient ? 'text-red-400/70' : 'text-zinc-500'}`}>
                        {formatCoins(bal)} 🪙
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Referencia comprobante */}
          <div className="mb-4">
            <label className="block text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-2">
              Referencia de comprobante
            </label>
            <input
              type="text"
              value={gameUsername}
              onChange={(e) => setGameUsername(e.target.value)}
              placeholder="Número o referencia del comprobante"
              maxLength={100}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 hover:border-zinc-700 focus:outline-none focus:border-zinc-600"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm mb-4">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* ── Confirmation panel ── */}
          {confirming ? (
            <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-4 space-y-3">
              <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest">
                Confirmar pedido
              </p>
              <div className="space-y-1.5 text-sm">
                <ConfirmRow label="Colector" value={`${selectedCountry?.flag} ${selectedSeller}`} />
                <ConfirmRow label="Monedas" value={`${formatCoins(displayCoins)} 🪙`} highlight />
                <ConfirmRow label="Monto" value={formatPrice(displayPrice, selectedCountry!.currencyCode)} highlight />
                <ConfirmRow label="Cuenta" value={coinAccount!} />
                <ConfirmRow label="Comprobante" value={gameUsername.trim()} mono />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white text-sm font-semibold transition-colors"
                >
                  ← Editar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500
                             text-black font-black py-3 rounded-xl transition-colors
                             flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Registrando...</>
                  ) : (
                    '✓ Confirmar y Registrar'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-3.5 rounded-xl transition-colors text-base"
            >
              Registrar Pedido →
            </button>
          )}
        </Section>
      )}

    </form>
  )
}

/* ── Fila de confirmación ── */
function ConfirmRow({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-zinc-800/50 last:border-0">
      <span className="text-zinc-500">{label}</span>
      <span className={`text-right ${highlight ? 'text-amber-400 font-bold' : mono ? 'text-zinc-300 font-mono text-xs' : 'text-zinc-200'}`}>
        {value}
      </span>
    </div>
  )
}

/* ── Componente de sección con paso numerado ── */
function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-950 border border-amber-500/10 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-6 h-6 rounded-full bg-amber-500 text-black text-xs font-black flex items-center justify-center shrink-0">
          {step}
        </span>
        <h2 className="text-zinc-300 text-sm font-bold uppercase tracking-widest">{title}</h2>
      </div>
      {children}
    </div>
  )
}
