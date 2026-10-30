import { createError } from 'h3'
import { database } from '../../utils/database'
import { requireUser } from '../../utils/auth-session'
import { readJsonObject, parseWalkInput, uuidField } from '../../utils/validation'
import { insertWalkStops, fetchWalk } from '../../utils/walks'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = uuidField(getRouterParam(event, 'id'), 'id')
  const input = parseWalkInput(await readJsonObject(event))
  const client = await database.connect()

  try {
    await client.query('BEGIN')
    const result = await client.query(
      'UPDATE walks SET title = $3, description = $4, duration_minutes = $5, distance_meters = $6, visibility = $7, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, user.id, input.title, input.description, input.durationMinutes, input.distanceMeters, input.visibility]
    )

    if (!result.rowCount) {
      throw createError({ statusCode: 404, statusMessage: 'Walk not found' })
    }

    await client.query('DELETE FROM walk_stops WHERE walk_id = $1', [id])
    await insertWalkStops(client, id, input.stops)
    await client.query('COMMIT')
  } catch (error) {
    try { await client.query('ROLLBACK') } catch {}
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    if ((error as { code?: string })?.code === '23503') {
      throw createError({ statusCode: 400, statusMessage: 'One or more stops refer to a place that does not exist' })
    }
    console.error('Could not update walk', error)
    throw createError({ statusCode: 500, statusMessage: 'Your walk could not be updated' })
  } finally {
    client.release()
  }

  return { walk: await fetchWalk(id, user.id) }
})
