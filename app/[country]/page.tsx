import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCountry, formatPrice } from '@/lib/data'
import { PackageGrid } from '@/components/PackageGrid'

interface Props {
  params: Promise<{ country: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: slug } = await params
  const country = getCountry(slug)
  if (!country) return {}
  return {
    title: `${country.name} — OroCoins`,
    description: `Compra monedas para tu juego en ${country.name}. Precios en ${country.currency}.`,
  }
}

export default async function CountryPage({ params }: Props) {
  const { country: slug } = await params
  const country = getCountry(slug)
  if (!country) notFound()

  const minPrice = country.packages[0]
  const maxPackage = country.packages[country.packages.length - 1]

  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-900">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
          >
            ← Inicio
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-300 font-medium">
            {country.flag} {country.name}
          </span>
        </div>
      </div>

      {/* Country Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 py-10 relative">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-6xl">{country.flag}</span>
            <div>
              <h1 className="text-3xl font-black text-white">{country.name}</h1>
              <p className="text-zinc-400">
                Desde{' '}
                <span className="text-amber-400 font-bold">
                  {formatPrice(minPrice.price, country.currencyCode)}
                </span>{' '}
                hasta{' '}
                <span className="text-amber-400 font-bold">
                  {formatPrice(maxPackage.price, country.currencyCode)}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-zinc-400 text-xs font-semibold uppercase tracking-[0.2em] mb-6">
          Elige tu paquete
        </h2>

        <PackageGrid country={country} />
      </section>

      {/* Payment preview */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-2xl mx-auto bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-3">
            Método de pago
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-zinc-500">Método: </span>
              <span className="text-white font-medium">{country.payment.method}</span>
            </div>
            {country.payment.extra && (
              <div>
                <span className="text-zinc-500">Tipo: </span>
                <span className="text-white font-medium">{country.payment.extra}</span>
              </div>
            )}
            <div>
              <span className="text-zinc-500">Nombre: </span>
              <span className="text-white font-medium">{country.payment.name}</span>
            </div>
          </div>
          <p className="text-zinc-600 text-xs mt-3">
            El número completo se mostrará después de confirmar tu pedido.
          </p>
        </div>
      </section>
    </main>
  )
}
