import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminUser } from '@/lib/admin-db'

const INITIAL_USERS = [
  { username: 'superadmin', password: 'SuperAdmin@2024', role: 'super_admin' as const },
  { username: 'andres',     password: 'Andres@2024',    role: 'seller' as const, sellerName: 'Andres' },
  { username: 'dulius',     password: 'Dulius@2024',    role: 'seller' as const, sellerName: 'Dulius' },
  { username: 'natasha',    password: 'Natasha@2024',   role: 'seller' as const, sellerName: 'Natasha' },
  { username: 'maga',       password: 'Maga@2024',      role: 'seller' as const, sellerName: 'Maga' },
  { username: 'boster',     password: 'Boster@2024',    role: 'seller' as const, sellerName: 'Boster' },
]

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')

  if (!process.env.ADMIN_SETUP_KEY || key !== process.env.ADMIN_SETUP_KEY) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const created: string[] = []

  try {
    for (const user of INITIAL_USERS) {
      const passwordHash = await bcrypt.hash(user.password, 12)
      await createAdminUser({
        username: user.username,
        passwordHash,
        role: user.role,
        sellerName: user.sellerName,
      })
      created.push(user.username)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Seed failed', detail: message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    created,
    note: 'Cambia las contraseñas después del primer login.',
  })
}
