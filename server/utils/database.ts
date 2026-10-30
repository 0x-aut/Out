import { Pool } from 'pg'

const rootConnectionString = process.env.DATABASE_URL

if (!rootConnectionString) {
  throw new Error('DATABASE_URL is required to configure the out-data database')
}

const databaseUrl = new URL(rootConnectionString)

if (databaseUrl.protocol !== 'postgres:' && databaseUrl.protocol !== 'postgresql:') {
  throw new Error('DATABASE_URL must be a PostgreSQL connection URL')
}

if (databaseUrl.pathname && databaseUrl.pathname !== '/') {
  throw new Error('DATABASE_URL must point to the PostgreSQL server, not a database')
}

databaseUrl.pathname = '/out-data'

type OutGlobal = typeof globalThis & { __outDataPool?: Pool }
const outGlobal = globalThis as OutGlobal

if (!outGlobal.__outDataPool) {
  const pool = new Pool({
    connectionString: databaseUrl.toString(),
    ssl: {
      ca: process.env.DATABASE_CA_CERTIFICATE,
      rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000
  })

  pool.on('error', (error) => {
    console.error('Unexpected error from the out-data PostgreSQL pool', error)
  })

  outGlobal.__outDataPool = pool
}

export const database = outGlobal.__outDataPool!
