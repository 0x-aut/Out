import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { Pool } from 'pg'

const rawUrl = process.env.DATABASE_URL

if (!rawUrl) {
  throw new Error('DATABASE_URL is required. Set it to the PostgreSQL server URL without a database name.')
}

const databaseUrl = new URL(rawUrl)

if (databaseUrl.protocol !== 'postgres:' && databaseUrl.protocol !== 'postgresql:') {
  throw new Error('DATABASE_URL must be a PostgreSQL connection URL')
}

if (databaseUrl.pathname && databaseUrl.pathname !== '/') {
  throw new Error('DATABASE_URL must point to the PostgreSQL server, not a database')
}

databaseUrl.pathname = '/out-data'

const pool = new Pool({
  connectionString: databaseUrl.toString(),
  ssl: {
    ca: process.env.DATABASE_CA_CERTIFICATE,
    rejectUnauthorized: false
  },
  max: 1,
  connectionTimeoutMillis: 10_000
})

const client = await pool.connect()
const migrationsDirectory = fileURLToPath(new URL('../server/database/migrations/', import.meta.url))

try {
  await client.query('SELECT pg_advisory_lock($1)', [81_273_491])
  await client.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())'
  )

  const files = (await readdir(migrationsDirectory))
    .filter((file) => /^\d+_[a-z0-9_-]+\.sql$/i.test(file))
    .sort()

  for (const file of files) {
    const sql = await readFile(path.join(migrationsDirectory, file), 'utf8')
    const checksum = createHash('sha256').update(sql).digest('hex')
    const existing = await client.query(
      'SELECT checksum FROM schema_migrations WHERE name = $1',
      [file]
    )

    if (existing.rowCount) {
      if (existing.rows[0].checksum !== checksum) {
        throw new Error('Applied migration was modified: ' + file)
      }
      console.log('Already applied: ' + file)
      continue
    }

    await client.query('BEGIN')
    try {
      await client.query(sql)
      await client.query(
        'INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)',
        [file, checksum]
      )
      await client.query('COMMIT')
      console.log('Applied: ' + file)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  }

  console.log('out-data migrations are up to date.')
} finally {
  try {
    await client.query('SELECT pg_advisory_unlock($1)', [81_273_491])
  } finally {
    client.release()
    await pool.end()
  }
}
