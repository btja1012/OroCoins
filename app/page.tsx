import Link from 'next/link'
import { countries, formatPrice } from '@/lib/data'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <section className="relative overflow-hidden pb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/30 via-zinc-950/50 to-zinc-950 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative container mx-auto px-4 pt-16 pb-8 text-center">
          <div className="text-7xl mb-5 animate-float inline-block">🪙</div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-3">
            <span className="text-white">Oro</span>
            <span className="text-shimmer">Coins</span>
          </h1>
          <p className="text-zinc-400 text-lg mb-1">Tu tienda de monedas confiable</p>
          <div className="flex items-center justify-center gap-4 text-zinc-600 text-sm mt-3">
            <span>⚡ Rápido</span>
            <span>•</span>
            <span>🔒 Seguro</span>
            <span>•</span>
            <span>✅ Confiable</span>
          </div>
        </div>
      </section>

      {/* Country selection */}
      <section className="container mx-auto px-4 pb-20">
        <p className="text-center text-zinc-500 text-xs font-semibold uppercase tracking-[0.2em] mb-8">
          Selecciona tu país
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {countries.map((country) => (
            <Link
              key={country.slug}
              href={`/${country.slug}`}
              className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6
                         hover:border-amber-500/50 hover:bg-zinc-800/80
                         transition-all duration-200 overflow-hidden"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent
                              opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

              <div className="relative">
                <div className="text-5xl mb-3">{country.flag}</div>
                <h3 className="text-white font-bold text-xl mb-1">{country.name}</h3>
                <p className="text-zinc-500 text-sm">
                  Desde{' '}
                  <span className="text-amber-400 font-semibold">
                    {formatPrice(country.packages[0].price, country.currencyCode)}
                  </span>
                </p>
                <div className="mt-4 flex items-center gap-1 text-amber-500 text-sm font-semibold
                                group-hover:text-amber-400 transition-colors">
                  Ver paquetes
                  <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 text-center text-zinc-600 text-sm">
        <p>
          <span className="text-amber-500/70">🪙</span> OroCoins · Venezuela · Costa Rica · Ecuador
          · Colombia · México
        </p>
      </footer>
    </main>
  )
}
