import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, SESSION_COOKIE } from './lib/session'
import { neon } from '@neondatabase/serverless'

function getTokenIat(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.iat ?? null
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/admin')) return NextResponse.next()
  if (pathname === '/admin/login') return NextResponse.next()

  const token = request.cookies.get(SESSION_COOKIE)?.value

  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  const session = await verifyToken(token)

  if (!session) {
    const response = NextResponse.redirect(new URL('/admin/login', request.url))
    response.cookies.delete(SESSION_COOKIE)
    return response
  }

  // Check if token was issued before the user's last logout
  try {
    const db = neon(process.env.DATABASE_URL!)
    const [user] = await db`SELECT last_logout_at FROM admin_users WHERE id = ${session.id} LIMIT 1`
    if (user?.last_logout_at) {
      const iat = getTokenIat(token)
      if (iat !== null && iat <= Math.floor(new Date(user.last_logout_at).getTime() / 1000)) {
        const response = NextResponse.redirect(new URL('/admin/login', request.url))
        response.cookies.delete(SESSION_COOKIE)
        return response
      }
    }
  } catch {
    // If DB check fails, allow through (fail open — don't lock out users on DB issues)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
