'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, Zap } from 'lucide-react'
import { countries, type Country, type Package, formatPrice, formatCoins, getCoinRate } from '@/lib/data'

export function OrderForm() {
  const router = useRouter()

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [customCoins, setCustomCoins] = useState(0)
  const [isCustomSelected, setIsCustomSelected] = useState(false)
  const [gameUsername, setGameUsername] = useState('')
  const [customerContact, setCustomerContact] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
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
      setCustomCoins(!isNaN(num) && num > 0 ? Math.floor(num * rate) : 0)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedCountry) { setError('Selecciona un país.'); return }
    if (!hasSelection) { setError('Selecciona un paquete o ingresa un monto.'); return }
    if (gameUsername.trim().length < 2) { setError('El usuario debe tener al menos 2 caracteres.'); return }
    if (customerContact.trim().length < 6) { setError('Ingresa un contacto válido.'); return }

    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        countrySlug: selectedCountry.slug,
        gameUsername: gameUsername.trim(),
        customerContact: customerContact.trim(),
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
      if (!res.ok) { setError(data.error ?? 'Error al procesar el pedido.'); return }

      router.push(`/pedido/${data.orderNumber}`)
    } catch {
      setError('Error de conexión. Revisa tu internet e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* ── STEP 1: Country ── */}
      <div>
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-[0.15em] mb-3">
          País
        </p>
        <div className="flex flex-wrap gap-2">
          {countries.map((country) => {
            const active = selectedCountry?.slug === country.slug
            return (
              <button
                key={country.slug}
                type="button"
                onClick={() => handleCountrySelect(country)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all
                  ${active
                    ? 'bg-amber-500 border-amber-500 text-black'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white'
                  }`}
              >
                <span className="text-base">{country.flag}</span>
                {country.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── STEP 2: Package ── */}
      {selectedCountry && (
        <div>
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-[0.15em] mb-3">
            Paquete — {selectedCountry.currency}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 mb-4">
            {selectedCountry.packages.map((pkg) => {
              const active = selectedPackage?.id === pkg.id
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handlePackageSelect(pkg)}
                  className={`relative text-left p-3.5 rounded-xl border transition-all
                    ${active
                      ? 'bg-amber-950/50 border-amber-500'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                    }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2 left-3 bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
                      ★ Popular
                    </span>
                  )}
                  <p className={`font-bold text-sm ${active ? 'text-white' : 'text-zinc-200'}`}>
                    {formatCoins(pkg.coins)} 🪙
                  </p>
                  <p className={`text-sm font-semibold mt-0.5 ${active ? 'text-amber-400' : 'text-zinc-500'}`}>
                    {formatPrice(pkg.price, selectedCountry.currencyCode)}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Custom calculator */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Zap size={13} className="text-amber-400" />
              <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                Monto personalizado
              </span>
            </div>
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
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-3 py-2 text-white text-sm placeholder:text-zinc-600"
                />
              </div>

              <span className="text-zinc-600 text-sm">→</span>

              <span className={`flex-1 text-sm font-bold ${customCoins > 0 ? 'text-amber-400' : 'text-zinc-600'}`}>
                {customCoins > 0 ? `${formatCoins(customCoins)} 🪙` : '— 🪙'}
              </span>

              {customCoins > 0 && (
                <button
                  type="button"
                  onClick={handleUseCustom}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                    isCustomSelected
                      ? 'bg-amber-500 text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {isCustomSelected ? '✓ Listo' : 'Usar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Form fields ── */}
      {selectedCountry && hasSelection && (
        <div className="space-y-4">
          {/* Selection summary */}
          <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
            <span className="text-zinc-500 text-sm">
              {selectedCountry.flag} {selectedCountry.name}
              {isCustomSelected && <span className="text-zinc-600 text-xs ml-1">(personalizado)</span>}
            </span>
            <span className="text-amber-400 font-bold text-sm">
              {formatCoins(displayCoins)} 🪙 ·{' '}
              {formatPrice(displayPrice, selectedCountry.currencyCode)}
            </span>
          </div>

          <div>
            <label className="block text-zinc-500 text-xs font-semibold uppercase tracking-[0.15em] mb-2">
              Usuario del juego
            </label>
            <input
              type="text"
              value={gameUsername}
              onChange={(e) => setGameUsername(e.target.value)}
              placeholder="Nombre en el juego"
              maxLength={50}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 hover:border-zinc-700"
            />
          </div>

          <div>
            <label className="block text-zinc-500 text-xs font-semibold uppercase tracking-[0.15em] mb-2">
              Contacto
            </label>
            <input
              type="text"
              value={customerContact}
              onChange={(e) => setCustomerContact(e.target.value)}
              placeholder="WhatsApp o teléfono"
              maxLength={30}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 hover:border-zinc-700"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500
                       text-black font-black py-3.5 rounded-xl transition-colors
                       flex items-center justify-center gap-2 text-base"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Registrando...</>
            ) : (
              'Registrar Pedido'
            )}
          </button>
        </div>
      )}

    </form>
  )
}
