import { NextRequest, NextResponse } from 'next/server'
import { createOrder, sql } from '@/lib/db'
import { getCountry, sellers, sellerCountryMap, roundToNearest500, formatCoins, formatPrice } from '@/lib/data'
import { sendPushToRolesAndSeller } from '@/lib/push'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role === 'seller') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }

    const body = await request.json()
    const { packageId, gameUsername, seller, customPrice, customCoins, coinAccount } = body

    if (!seller || !sellers.includes(seller)) {
      return NextResponse.json({ error: 'Vendedor no válido.' }, { status: 400 })
    }
    if (!gameUsername?.trim()) {
      return NextResponse.json({ error: 'La referencia de comprobante es requerida.' }, { status: 400 })
    }
    if (!coinAccount || !['OrosPV1', 'OrosPV2'].includes(coinAccount)) {
      return NextResponse.json({ error: 'Debes seleccionar la cuenta de Oros.' }, { status: 400 })
    }

    // ── Duplicate comprobante check ──
    const db = sql()
    const existing = await db`
      SELECT id FROM orders WHERE game_username = ${gameUsername.trim()} AND seller = ${seller} LIMIT 1
    `
    if (existing.length > 0) {
      return NextResponse.json(
        { error: `El comprobante "${gameUsername.trim()}" ya fue registrado para ${seller}. Esa venta no es aprobada.` },
        { status: 409 }
      )
    }

    const countrySlug = sellerCountryMap[seller as keyof typeof sellerCountryMap]
    const country = getCountry(countrySlug)
    if (!country) {
      return NextResponse.json({ error: 'País no válido.' }, { status: 400 })
    }

    let pkg = country.packages.find((p) => p.id === packageId)
    let isCustom = false

    if (!pkg && customPrice && customCoins) {
      const rate = country.packages[0].coins / country.packages[0].price
      const expectedCoins = roundToNearest500(parseFloat(customPrice) * rate)
      if (Math.abs(expectedCoins - parseInt(customCoins)) > 1) {
        return NextResponse.json({ error: 'Cálculo de monedas inválido.' }, { status: 400 })
      }
      isCustom = true
      pkg = {
        id: `${countrySlug}-custom`,
        price: parseFloat(customPrice),
        coins: parseInt(customCoins),
      }
    }

    if (!pkg) {
      return NextResponse.json({ error: 'Paquete no válido.' }, { status: 400 })
    }

    const order = await createOrder({
      country: country.name,
      countrySlug: country.slug,
      gameUsername: gameUsername.trim(),
      seller,
      clientName: seller,
      registeredBy: session.sellerName ?? session.username,
      packageId: pkg.id,
      packageCoins: pkg.coins,
      packagePrice: pkg.price,
      currencyCode: country.currencyCode,
      currencySymbol: country.currencySymbol,
      isCustom,
      coinAccount,
    })

    // ── Push notification (non-blocking) ──
    sendPushToRolesAndSeller(seller, {
      title: `🪙 Nuevo pedido — ${country.flag} ${seller}`,
      body: `${formatCoins(pkg.coins)} 🪙 · ${formatPrice(pkg.price, country.currencyCode)} · Ref: ${gameUsername.trim()}`,
    })

    return NextResponse.json({ orderNumber: order.order_number }, { status: 201 })
  } catch (err) {
    console.error('Error creating order:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor. Intenta de nuevo.' },
      { status: 500 },
    )
  }
}
