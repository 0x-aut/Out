import { createError } from 'h3'
import { database } from '../../utils/database'
import { requireUser } from '../../utils/auth-session'
import { readJsonObject, parseWalkInput } from '../../utils/validation'
import { insertWalkStops, fetchWalk } from '../../utils/walks'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const input = parseWalkInput(await readJsonObject(event))
  const client = await database.connect()
  let walkId: string | undefined

  try {
    await client.query('BEGIN')
    const result = await client.query(
      'INSERT INTO walks (user_id, title, description, duration_minutes, distance_meters, visibility) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [user.id, input.title, input.description, input.durationMinutes, input.distanceMeters, input.visibility]
    )
    walkId = result.rows[0].id
    await insertWalkStops(client, walkId!, input.stops)
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    if ((error as { code?: string })?.code === '23503') {
      throw createError({ statusCode: 400, statusMessage: 'One or more stops refer to a place that does not exist' })
    }
    console.error('Could not create walk', error)
    throw createError({ statusCode: 500, statusMessage: 'Your walk could not be saved' })
  } finally {
    client.release()
  }

  return { walk: await fetchWalk(walkId!, user.id) }
})
