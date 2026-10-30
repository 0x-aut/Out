import { betterAuth } from 'better-auth'
import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to configure Better Auth')
}

const database = new URL('out-auth', databaseUrl.endsWith('/') ? databaseUrl : `${databaseUrl}/`)

export const auth = betterAuth({
  appName: 'Out',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET,
  database: new Pool({
    connectionString: database.toString(),
    ssl: {
      ca: process.env.DATABASE_CA_CERTIFICATE,
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8
  },
  user: {
    additionalFields: {
      bio: { type: 'string', required: false },
      homeBase: { type: 'string', required: false },
      interests: { type: 'string', required: false },
      travelStyle: { type: 'string', required: false }
    }
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL || 'http://localhost:3000']
})
