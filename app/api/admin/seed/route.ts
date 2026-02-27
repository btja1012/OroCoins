import { NextResponse } from 'next/server'

// Seed endpoint disabled — users already created.
export async function GET() {
  return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
}
