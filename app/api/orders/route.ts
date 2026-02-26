import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@/lib/db'
import { getCountry } from '@/lib/data'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { countrySlug, packageId, gameUsername, customerContact, customPrice, customCoins } = body

    // Validate required fields
    if (!countrySlug || !gameUsername?.trim() || !customerContact?.trim()) {
      return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 })
    }

    const country = getCountry(countrySlug)
    if (!country) {
      return NextResponse.json({ error: 'País no válido.' }, { status: 400 })
    }

    let pkg = country.packages.find((p) => p.id === packageId)
    let isCustom = false

    // Custom amount order
    if (!pkg && customPrice && customCoins) {
      const rate = country.packages[0].coins / country.packages[0].price
      const expectedCoins = Math.round(parseFloat(customPrice) * rate)
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
      customerContact: customerContact.trim(),
      packageId: pkg.id,
      packageCoins: pkg.coins,
      packagePrice: pkg.price,
      currencyCode: country.currencyCode,
      currencySymbol: country.currencySymbol,
      isCustom,
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
