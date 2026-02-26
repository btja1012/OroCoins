import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getUserByUsername } from '@/lib/admin-db'
import { signToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/session'

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

    const valid = await bcrypt.compare(password, user.password_hash)

    if (!valid) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401 })
    }

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
