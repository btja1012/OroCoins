import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getOrderByNumber } from '@/lib/db'
import { getCountry, formatPrice, formatCoins } from '@/lib/data'
import { CopyButton } from '@/components/CopyButton'

interface Props {
  params: Promise<{ orderNumber: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderNumber } = await params
  return {
    title: `Pedido ${orderNumber} — OroCoins`,
  }
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { orderNumber } = await params
  const order = await getOrderByNumber(orderNumber)
  if (!order) notFound()

  const country = getCountry(order.country_slug)
  if (!country) notFound()

  const { payment } = country

  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-900">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-zinc-500 hover:text-white transition-colors text-sm">
            ← OroCoins
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-lg">
        {/* Success indicator */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-full mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-1">¡Pedido Registrado!</h1>
          <p className="text-zinc-400 text-sm">
            Realiza el pago y envía el comprobante para recibir tus monedas.
          </p>
        </div>

        {/* Order number */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-zinc-500 text-xs mb-0.5">Número de orden</p>
            <p className="text-amber-400 font-black tracking-wider">{order.order_number}</p>
          </div>
          <CopyButton text={order.order_number} />
        </div>

        {/* Order summary */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-4">
            Resumen del pedido
          </p>
          <div className="space-y-3 text-sm">
            <Row label="Vendedor" value={order.seller ?? order.customer_contact} />
            <Row label="País" value={`${country.flag} ${order.country}`} />
            <Row
              label="Paquete"
              value={
                <span className="text-amber-400 font-bold text-base">
                  {formatCoins(order.package_coins)} 🪙
                  {order.is_custom && (
                    <span className="text-zinc-500 text-xs ml-1 font-normal">(personalizado)</span>
                  )}
                </span>
              }
            />
            <Row
              label="Total a pagar"
              value={
                <span className="text-white font-bold">
                  {formatPrice(Number(order.package_price), order.currency_code)}
                </span>
              }
            />
            <Row label="Ref. comprobante" value={order.game_username} />
            <Row
              label="Estado"
              value={
                <span className="inline-flex items-center gap-1.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                  Pendiente de pago
                </span>
              }
            />
          </div>
        </div>

        {/* Payment instructions */}
        <div className="bg-zinc-900 border border-amber-500/20 rounded-2xl p-5 mb-4">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-4">
            Instrucciones de pago
          </p>

          <div className="space-y-3">
            <PaymentRow label="Método" value={payment.method} />
            {payment.extra && <PaymentRow label="Tipo" value={payment.extra} />}
            {payment.number && (
              <div className="flex items-center justify-between py-2 border-b border-zinc-800/50">
                <span className="text-zinc-500 text-sm">Número / Cuenta</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">{payment.number}</span>
                  <CopyButton text={payment.number} />
                </div>
              </div>
            )}
            <PaymentRow label="Nombre" value={payment.name} />
          </div>

          <div className="mt-4 bg-amber-500/8 border border-amber-500/20 rounded-xl p-3 text-amber-300/80 text-xs leading-relaxed">
            💡 <strong>Importante:</strong> Realiza la transferencia por{' '}
            <strong>{formatPrice(Number(order.package_price), order.currency_code)}</strong> y
            envía el comprobante junto con tu usuario <strong>{order.game_username}</strong> al
            vendedor.
          </div>
        </div>

        {/* Steps */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-8">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-4">
            Próximos pasos
          </p>
          <ol className="space-y-3">
            {[
              `Transfiere ${formatPrice(Number(order.package_price), order.currency_code)} al número indicado.`,
              'Toma una captura del comprobante de pago.',
              `Envía el comprobante (ref. ${order.game_username}) al vendedor ${order.seller ?? ''}.`,
              'Recibirás tus monedas en breve.',
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-zinc-400">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="text-center">
          <Link
            href={`/${country.slug}`}
            className="text-zinc-500 hover:text-amber-400 text-sm transition-colors"
          >
            ← Volver a paquetes de {country.name}
          </Link>
        </div>
      </div>
    </main>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-zinc-800/50 last:border-0">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-200 text-right">{value}</span>
    </div>
  )
}

function PaymentRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
      <span className="text-zinc-500 text-sm">{label}</span>
      <span className="text-white font-medium text-sm">{value}</span>
    </div>
  )
}
