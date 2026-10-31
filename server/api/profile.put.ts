import { randomUUID } from 'node:crypto'
import { createError, getRequestHeader, setResponseHeader, toWebRequest } from 'h3'
import { auth } from '../lib/auth'
import { database } from '../utils/database'
import { requireUser } from '../utils/auth-session'
import {
  asRecord,
  parseInterests,
  readJsonObject,
  stringField
} from '../utils/validation'

const travelStyles = new Set([
  'Curious wanderer',
  'Slow traveller',
  'Culture seeker',
  'Food explorer',
  'Adventure first',
  'Night owl',
  'A little bit of everything'
])

function withTimeout<T>(operation: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs)
    operation.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export default defineEventHandler(async (event) => {
  const suppliedRequestId = getRequestHeader(event, 'x-out-request-id')
  const requestId = suppliedRequestId && /^[a-z0-9-]{8,80}$/i.test(suppliedRequestId)
    ? suppliedRequestId
    : randomUUID()

  setResponseHeader(event, 'x-out-request-id', requestId)

  const startedAt = Date.now()
  let stage = 'request_received'
  let client: Awaited<ReturnType<typeof database.connect>> | undefined
  let transactionStarted = false
  let profileCommitted = false
  let discardClient = false

  const log = (message: string, details: Record<string, unknown> = {}) => {
    console.info('[profile.put]', message, {
      requestId,
      elapsedMs: Date.now() - startedAt,
      ...details
    })
  }

  log('request received', { method: event.method })

  try {
    stage = 'authentication'
    log('authentication started')
    const user = await withTimeout(
      requireUser(event),
      12_000,
      'Profile save timed out while verifying your session'
    )
    log('authentication completed')

    stage = 'read_request'
    const body = await readJsonObject(event)

    stage = 'validation'
    const name = stringField(body.name, 'name', 80, true)!
    const profile = asRecord(body.profile, 'profile')
    const bio = stringField(profile.bio, 'bio', 240) ?? ''
    const homeBase = stringField(profile.homeBase, 'homeBase', 100, true)!
    const travelStyle = stringField(profile.travelStyle ?? 'Curious wanderer', 'travelStyle', 60, true)!

    if (!travelStyles.has(travelStyle)) {
      throw createError({ statusCode: 400, statusMessage: 'travelStyle is not supported' })
    }

    const interests = parseInterests(body.interests)
    if (!interests.length) {
      throw createError({ statusCode: 400, statusMessage: 'Choose at least one interest before saving your profile' })
    }

    log('request validated', {
      hasHomeBase: Boolean(homeBase),
      interestCount: interests.length
    })

    stage = 'database_connection'
    log('database connection started')
    client = await database.connect()
    log('database connection acquired')

    stage = 'database_transaction'
    transactionStarted = true
    await client.query('BEGIN')
    await client.query("SET LOCAL statement_timeout = '8000ms'")

    await client.query(
      'INSERT INTO user_profiles (user_id, bio, home_base, travel_style) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET bio = EXCLUDED.bio, home_base = EXCLUDED.home_base, travel_style = EXCLUDED.travel_style, updated_at = NOW()',
      [user.id, bio, homeBase, travelStyle]
    )
    log('profile row written')

    await client.query('DELETE FROM user_interests WHERE user_id = $1', [user.id])
    log('previous interests cleared')

    const savedInterests = await client.query<{ name: string; category: string }>(
      `INSERT INTO user_interests (user_id, name, category)
       SELECT $1, interest.name, interest.category
       FROM jsonb_to_recordset($2::jsonb) AS interest(name TEXT, category TEXT)
       RETURNING name, category`,
      [user.id, JSON.stringify(interests)]
    )

    if (savedInterests.rowCount !== interests.length) {
      throw new Error(`Expected to save ${interests.length} interests, but the database returned ${savedInterests.rowCount ?? 0}`)
    }
    log('interests written', { interestCount: savedInterests.rowCount })

    await client.query('COMMIT')
    transactionStarted = false
    profileCommitted = true
    log('profile transaction committed')

    stage = 'account_name_sync'
    let nameUpdated = true
    try {
      log('account name sync started')
      await withTimeout(
        auth.api.updateUser({
          headers: toWebRequest(event).headers,
          body: { name }
        }),
        6_000,
        'Account name update timed out'
      )
      log('account name sync completed')
    } catch (error) {
      nameUpdated = false
      console.warn('[profile.put] profile data saved but account name sync did not complete', {
        requestId,
        elapsedMs: Date.now() - startedAt,
        error: getErrorMessage(error)
      })
    }

    stage = 'response'
    log('save completed', { interestCount: savedInterests.rows.length, nameUpdated })

    return {
      success: true,
      name,
      nameUpdated,
      warning: nameUpdated
        ? null
        : 'Your location and interests were saved, but your account name could not be synced. You can keep using Out and retry the name update later.',
      profile: { bio, homeBase, travelStyle },
      interests: savedInterests.rows
    }
  } catch (error) {
    if (client && transactionStarted && !profileCommitted) {
      try {
        await client.query('ROLLBACK')
        transactionStarted = false
        log('database transaction rolled back')
      } catch (rollbackError) {
        discardClient = true
        console.error('[profile.put] rollback failed', {
          requestId,
          error: getErrorMessage(rollbackError)
        })
      }
    }

    const statusCode = (error as { statusCode?: number } | null)?.statusCode
    if (statusCode && statusCode < 500) {
      log('request rejected', { stage, statusCode, error: getErrorMessage(error) })
      throw error
    }

    console.error('[profile.put] save failed', {
      requestId,
      stage,
      elapsedMs: Date.now() - startedAt,
      error: getErrorMessage(error)
    })

    if (stage === 'authentication') {
      throw createError({
        statusCode: 503,
        statusMessage: 'Out could not verify your session. Refresh the page and try again.'
      })
    }

    if (stage === 'database_connection' || stage === 'database_transaction') {
      throw createError({
        statusCode: 503,
        statusMessage: 'Out could not finish saving to the database. Your changes were not confirmed; refresh your profile and try again.'
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Your profile could not be saved. Please try again.'
    })
  } finally {
    if (client) client.release(discardClient)
    log('request finished', { stage, profileCommitted })
  }
})
