import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getUserByUsername } from '@/lib/admin-db'
import { signToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/session'
import { sql } from '@/lib/db'

const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 15
const IP_MAX_ATTEMPTS = 20
const IP_LOCK_MINUTES = 15

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Credenciales requeridas.' }, { status: 400 })
    }

    const db = sql()
    const ip = getClientIp(request)

    // --- IP rate limiting ---
    const [ipRecord] = await db`
      SELECT attempts, blocked_until, last_attempt FROM login_rate_limits WHERE ip = ${ip} LIMIT 1
    `.catch(() => [null])

    if (ipRecord) {
      const windowExpired =
        new Date(ipRecord.last_attempt).getTime() < Date.now() - IP_LOCK_MINUTES * 60 * 1000

      if (!windowExpired && ipRecord.blocked_until && new Date(ipRecord.blocked_until) > new Date()) {
        const minutes = Math.ceil((new Date(ipRecord.blocked_until).getTime() - Date.now()) / 60000)
        return NextResponse.json(
          { error: `Demasiados intentos. Intenta de nuevo en ${minutes} min.` },
          { status: 429 }
        )
      }

      if (windowExpired) {
        await db`
          UPDATE login_rate_limits SET attempts = 0, blocked_until = NULL, last_attempt = NOW()
          WHERE ip = ${ip}
        `.catch(() => null)
      }
    }
    // --- end IP rate limiting ---

    const user = await getUserByUsername(username.toLowerCase().trim())

    if (!user) {
      await incrementIpAttempts(ip, db, IP_MAX_ATTEMPTS, IP_LOCK_MINUTES)
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

    if (!valid) {
      const attempts = (user.failed_attempts ?? 0) + 1
      if (attempts >= MAX_ATTEMPTS) {
        await db`
          UPDATE admin_users
          SET failed_attempts = ${attempts},
              locked_until = NOW() + INTERVAL '15 minutes'
          WHERE id = ${user.id}
        `
        await incrementIpAttempts(ip, db, IP_MAX_ATTEMPTS, IP_LOCK_MINUTES)
        return NextResponse.json(
          { error: `Demasiados intentos. Cuenta bloqueada por ${LOCK_MINUTES} minutos.` },
          { status: 429 }
        )
      }
      await db`UPDATE admin_users SET failed_attempts = ${attempts} WHERE id = ${user.id}`
      await incrementIpAttempts(ip, db, IP_MAX_ATTEMPTS, IP_LOCK_MINUTES)
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401 })
    }

    // Successful login — reset lockouts
    await db`UPDATE admin_users SET failed_attempts = 0, locked_until = NULL WHERE id = ${user.id}`
    await db`DELETE FROM login_rate_limits WHERE ip = ${ip}`.catch(() => null)

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

async function incrementIpAttempts(
  ip: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  maxAttempts: number,
  lockMinutes: number
): Promise<void> {
  try {
    const [existing] = await db`SELECT attempts FROM login_rate_limits WHERE ip = ${ip} LIMIT 1`
    const newAttempts = (existing?.attempts ?? 0) + 1
    const blocked = newAttempts >= maxAttempts

    if (existing) {
      await db`
        UPDATE login_rate_limits
        SET attempts = ${newAttempts},
            last_attempt = NOW(),
            blocked_until = ${blocked ? db`NOW() + INTERVAL '${lockMinutes} minutes'` : null}
        WHERE ip = ${ip}
      `
    } else {
      await db`
        INSERT INTO login_rate_limits (ip, attempts, last_attempt)
        VALUES (${ip}, ${newAttempts}, NOW())
        ON CONFLICT (ip) DO UPDATE
        SET attempts = login_rate_limits.attempts + 1,
            last_attempt = NOW()
      `
    }
  } catch {
    // Don't fail the request if rate limit tracking fails
  }
}
