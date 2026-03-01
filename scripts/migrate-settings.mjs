import { readFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'

const env = readFileSync('.env.local', 'utf8')
  .split('\n')
  .filter(l => l.startsWith('DATABASE_URL='))
  .map(l => l.slice('DATABASE_URL='.length).trim().replace(/^"|"$/g, '').replace(/ /g, ''))
  [0]

if (!env) { console.error('No DATABASE_URL'); process.exit(1) }

const sql = neon(env)

await sql`
  CREATE TABLE IF NOT EXISTS app_settings (
    key        VARCHAR(50) PRIMARY KEY,
    value      TEXT        NOT NULL,
    updated_by TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
`
console.log('✅ app_settings table created')
