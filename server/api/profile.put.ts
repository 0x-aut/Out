import { createError, toWebRequest } from 'h3'
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

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readJsonObject(event)
  const name = stringField(body.name, 'name', 80, true)!
  const profile = asRecord(body.profile, 'profile')
  const bio = stringField(profile.bio, 'bio', 240) ?? ''
  const homeBase = stringField(profile.homeBase, 'homeBase', 100) ?? ''
  const travelStyle = stringField(profile.travelStyle ?? 'Curious wanderer', 'travelStyle', 60, true)!

  if (!travelStyles.has(travelStyle)) {
    throw createError({ statusCode: 400, statusMessage: 'travelStyle is not supported' })
  }

  const interests = parseInterests(body.interests)
  const client = await database.connect()

  try {
    await client.query('BEGIN')
    await client.query(
      'INSERT INTO user_profiles (user_id, bio, home_base, travel_style) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET bio = EXCLUDED.bio, home_base = EXCLUDED.home_base, travel_style = EXCLUDED.travel_style, updated_at = NOW()',
      [user.id, bio, homeBase, travelStyle]
    )
    await client.query('DELETE FROM user_interests WHERE user_id = $1', [user.id])

    for (const interest of interests) {
      await client.query(
        'INSERT INTO user_interests (user_id, name, category) VALUES ($1, $2, $3)',
        [user.id, interest.name, interest.category]
      )
    }

    await client.query('COMMIT')

    await auth.api.updateUser({
      headers: toWebRequest(event).headers,
      body: { name }
    })

    return { success: true, name, profile: { bio, homeBase, travelStyle }, interests }
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Could not save Out profile', error)
    throw createError({ statusCode: 500, statusMessage: 'Your profile could not be saved' })
  } finally {
    client.release()
  }
})
