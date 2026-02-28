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
            <Row label="Vendedor" value={order.seller} />
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
                order.status === 'completed' ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    Completado
                  </span>
                ) : order.status === 'cancelled' ? (
                  <span className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                    Cancelado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                    Pendiente de pago
                  </span>
                )
              }
            />
            {order.status === 'cancelled' && order.cancel_reason && (
              <Row label="Razón" value={<span className="text-red-400">{order.cancel_reason}</span>} />
            )}
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

        {/* WhatsApp button */}
        {order.status === 'pending' && (() => {
          const msg = [
            `Hola! Aquí están los detalles de tu pedido de OroCoins 🪙`,
            ``,
            `📋 Orden: ${order.order_number}`,
            `🪙 Paquete: ${formatCoins(order.package_coins)} monedas`,
            `💰 Total a pagar: ${formatPrice(Number(order.package_price), order.currency_code)}`,
            ``,
            `📱 Datos de pago:`,
            `Método: ${payment.method}`,
            payment.extra ? `Tipo: ${payment.extra}` : null,
            payment.number ? `Número/Cuenta: ${payment.number}` : null,
            `Nombre: ${payment.name}`,
            ``,
            `📝 Ref. comprobante: ${order.game_username}`,
            ``,
            `¡Gracias por tu compra! 🎮`,
          ].filter(Boolean).join('\n')
          return (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(msg)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors mb-4 text-sm"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Compartir por WhatsApp
            </a>
          )
        })()}

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
