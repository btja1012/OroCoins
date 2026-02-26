import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, SESSION_COOKIE } from './lib/session'

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

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
