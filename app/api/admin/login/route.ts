import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getUserByUsername } from '@/lib/admin-db'
import { signToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/session'
import { sql } from '@/lib/db'

const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 15

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Credenciales requeridas.' }, { status: 400 })
    }

    const user = await getUserByUsername(username.toLowerCase().trim())

    if (!user) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401 })
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutes = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Cuenta bloqueada. Intenta de nuevo en ${minutes} min.` },
        { status: 429 }
      )
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    const db = sql()

    if (!valid) {
      const attempts = (user.failed_attempts ?? 0) + 1
      if (attempts >= MAX_ATTEMPTS) {
        await db`
          UPDATE admin_users
          SET failed_attempts = ${attempts},
              locked_until = NOW() + INTERVAL '15 minutes'
          WHERE id = ${user.id}
        `
        return NextResponse.json(
          { error: `Demasiados intentos. Cuenta bloqueada por ${LOCK_MINUTES} minutos.` },
          { status: 429 }
        )
      }
      await db`UPDATE admin_users SET failed_attempts = ${attempts} WHERE id = ${user.id}`
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401 })
    }

    // Successful login — reset lockout
    await db`UPDATE admin_users SET failed_attempts = 0, locked_until = NULL WHERE id = ${user.id}`

    const token = await signToken({
      id: user.id,
      username: user.username,
      role: user.role,
      sellerName: user.seller_name ?? undefined,
    })

    const response = NextResponse.json({ ok: true, role: user.role })
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}
