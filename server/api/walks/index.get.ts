import { createError, getQuery } from 'h3'
import { database } from '../../utils/database'
import { requireUser } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const query = getQuery(event)
  const search = query.q === undefined ? '' : query.q

  if (typeof search !== 'string' || search.length > 120) {
    throw createError({ statusCode: 400, statusMessage: 'q must be a string of 120 characters or fewer' })
  }

  const limit = query.limit === undefined ? 30 : Number(query.limit)
  const offset = query.offset === undefined ? 0 : Number(query.offset)

  if (!Number.isInteger(limit) || limit < 1 || limit > 50 || !Number.isInteger(offset) || offset < 0 || offset > 100_000) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid pagination values' })
  }

  const result = await database.query(
    'SELECT w.id, w.title, w.description, w.duration_minutes AS "durationMinutes", w.distance_meters AS "distanceMeters", w.visibility, w.created_at AS "createdAt", w.updated_at AS "updatedAt", COUNT(s.id)::int AS "stopCount" FROM walks w LEFT JOIN walk_stops s ON s.walk_id = w.id WHERE (w.user_id = $1 OR w.visibility = \'public\') AND ($2 = \'\' OR w.title ILIKE $3 OR COALESCE(w.description, \'\') ILIKE $3) GROUP BY w.id ORDER BY w.updated_at DESC LIMIT $4 OFFSET $5',
    [user.id, search.trim(), '%' + search.trim() + '%', limit, offset]
  )

  return { items: result.rows, limit, offset }
})
