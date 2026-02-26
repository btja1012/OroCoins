'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import { Country, Package, formatPrice, formatCoins, getCoinRate } from '@/lib/data'
import { OrderModal } from './OrderModal'

interface PackageGridProps {
  country: Country
}

export function PackageGrid({ country }: PackageGridProps) {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [customCoins, setCustomCoins] = useState<number>(0)
  const [isCustomModal, setIsCustomModal] = useState(false)

  const rate = getCoinRate(country) // coins per currency unit

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackage(pkg)
    setIsCustomModal(false)
    setIsModalOpen(true)
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    const num = parseFloat(value.replace(',', '.'))
    if (!isNaN(num) && num > 0) {
      setCustomCoins(Math.floor(num * rate))
    } else {
      setCustomCoins(0)
    }
  }

  const handleCustomOrder = () => {
    const num = parseFloat(customAmount.replace(',', '.'))
    if (isNaN(num) || num <= 0) return
    setSelectedPackage(null)
    setIsCustomModal(true)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedPackage(null)
    setIsCustomModal(false)
  }

  return (
    <>
      {/* Package grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {country.packages.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => handlePackageSelect(pkg)}
            className={`relative group text-left rounded-2xl p-4 border transition-all duration-200
              ${pkg.popular
                ? 'bg-amber-950/30 border-amber-500/50 popular-glow hover:border-amber-400'
                : 'bg-zinc-900 border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-800/80'
              }`}
          >
            {/* Popular badge */}
            {pkg.popular && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <span className="bg-amber-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                  ★ Popular
                </span>
              </div>
            )}

            {/* Coins */}
            <div className="mt-1 mb-3">
              <p className={`text-2xl font-black ${pkg.popular ? 'text-amber-300' : 'text-white'}`}>
                {formatCoins(pkg.coins)}
              </p>
              <p className="text-zinc-500 text-sm">🪙 monedas</p>
            </div>

            {/* Price */}
            <div className={`font-bold text-base ${pkg.popular ? 'text-amber-400' : 'text-amber-500'}`}>
              {formatPrice(pkg.price, country.currencyCode)}
            </div>

            {/* CTA */}
            <div
              className={`mt-3 w-full text-center text-xs font-bold py-2 rounded-lg transition-colors
                ${pkg.popular
                  ? 'bg-amber-500 text-black group-hover:bg-amber-400'
                  : 'bg-zinc-800 text-zinc-300 group-hover:bg-amber-500 group-hover:text-black'
                }`}
            >
              Comprar
            </div>
          </button>
        ))}
      </div>

      {/* Custom calculator */}
      <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={18} className="text-amber-400" />
          <h3 className="text-white font-bold">Calculadora personalizada</h3>
        </div>
        <p className="text-zinc-500 text-sm mb-4">
          ¿Tienes un monto específico? Ingresa la cantidad y calcula cuántas monedas recibes.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Amount input */}
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-medium pointer-events-none">
              {country.currencySymbol}
            </span>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              placeholder="0"
              min="0"
              step="any"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-3
                         text-white placeholder:text-zinc-600 transition-colors hover:border-zinc-600"
            />
          </div>

          {/* Coin result display */}
          <div className="flex-1 bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-zinc-400 text-sm">Recibirías:</span>
            <span className={`font-black text-lg ${customCoins > 0 ? 'text-amber-400' : 'text-zinc-600'}`}>
              {customCoins > 0 ? `${formatCoins(customCoins)} 🪙` : '— 🪙'}
            </span>
          </div>
        </div>

        {customCoins > 0 && (
          <button
            onClick={handleCustomOrder}
            className="mt-4 w-full bg-zinc-800 hover:bg-amber-500 border border-zinc-700 hover:border-amber-500
                       text-zinc-300 hover:text-black font-bold py-3 rounded-xl transition-all"
          >
            Ordenar {formatCoins(customCoins)} 🪙 por{' '}
            {formatPrice(parseFloat(customAmount.replace(',', '.')), country.currencyCode)}
          </button>
        )}
      </div>

      {/* Order Modal */}
      <OrderModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        country={country}
        selectedPackage={isCustomModal ? null : selectedPackage}
        customPrice={isCustomModal ? parseFloat(customAmount.replace(',', '.')) : undefined}
        customCoins={isCustomModal ? customCoins : undefined}
      />
    </>
  )
}
