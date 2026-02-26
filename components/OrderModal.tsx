'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { Country, Package, formatPrice, formatCoins } from '@/lib/data'

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  country: Country
  selectedPackage: Package | null
  customPrice?: number
  customCoins?: number
}

export function OrderModal({
  isOpen,
  onClose,
  country,
  selectedPackage,
  customPrice,
  customCoins,
}: OrderModalProps) {
  const router = useRouter()
  const [gameUsername, setGameUsername] = useState('')
  const [customerContact, setCustomerContact] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setGameUsername('')
      setCustomerContact('')
      setError('')
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isCustomOrder = !selectedPackage && customPrice !== undefined && customCoins !== undefined
  const displayCoins = selectedPackage ? selectedPackage.coins : customCoins ?? 0
  const displayPrice = selectedPackage ? selectedPackage.price : customPrice ?? 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (gameUsername.trim().length < 2) {
      setError('El nombre de usuario debe tener al menos 2 caracteres.')
      return
    }
    if (customerContact.trim().length < 6) {
      setError('Ingresa un contacto válido (WhatsApp o teléfono).')
      return
    }

    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        countrySlug: country.slug,
        gameUsername,
        customerContact,
      }

      if (selectedPackage) {
        body.packageId = selectedPackage.id
      } else {
        body.customPrice = customPrice
        body.customCoins = customCoins
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al procesar el pedido.')
        return
      }

      router.push(`/pedido/${data.orderNumber}`)
    } catch {
      setError('Error de conexión. Revisa tu internet e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 modal-backdrop flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-white font-bold text-lg">Completar Pedido</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Package summary */}
        <div className="mx-5 mt-5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-xs mb-0.5">Paquete seleccionado</p>
            <p className="text-white font-bold text-lg">
              {formatCoins(displayCoins)} 🪙
              {isCustomOrder && (
                <span className="text-amber-400 text-xs ml-2 font-normal">(personalizado)</span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-amber-400 font-black text-2xl">
              {formatPrice(displayPrice, country.currencyCode)}
            </p>
            <p className="text-zinc-500 text-xs">{country.name}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-zinc-300 text-sm font-medium mb-1.5">
              Usuario del juego <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              value={gameUsername}
              onChange={(e) => setGameUsername(e.target.value)}
              placeholder="Tu nombre en el juego"
              maxLength={50}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white
                         placeholder:text-zinc-600 transition-colors hover:border-zinc-600"
            />
          </div>

          <div>
            <label className="block text-zinc-300 text-sm font-medium mb-1.5">
              WhatsApp / Teléfono <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              value={customerContact}
              onChange={(e) => setCustomerContact(e.target.value)}
              placeholder="Tu número de contacto"
              maxLength={30}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white
                         placeholder:text-zinc-600 transition-colors hover:border-zinc-600"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500
                       text-black font-black py-3.5 rounded-xl transition-colors text-base
                       flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Procesando...
              </>
            ) : (
              'Confirmar Pedido →'
            )}
          </button>

          <p className="text-zinc-600 text-xs text-center">
            Recibirás tus monedas tras confirmar el pago con el vendedor.
          </p>
        </form>
      </div>
    </div>
  )
}
