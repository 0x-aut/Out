import { getQuery, createError } from 'h3'
import { database } from '../../utils/database'
import { requireUser } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const query = getQuery(event)
  const search = query.q === undefined ? '' : query.q

  if (typeof search !== 'string' || search.length > 120) {
    throw createError({ statusCode: 400, statusMessage: 'q must be a string of 120 characters or fewer' })
  }

  const limitValue = query.limit === undefined ? '30' : query.limit
  const offsetValue = query.offset === undefined ? '0' : query.offset
  const limit = Number(limitValue)
  const offset = Number(offsetValue)

  if (!Number.isInteger(limit) || limit < 1 || limit > 50 || !Number.isInteger(offset) || offset < 0 || offset > 100_000) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid pagination values' })
  }

  const result = await database.query(
    'SELECT id, source, source_id AS "sourceId", name, description, category, address, city, country, latitude, longitude, image_url AS "imageUrl", metadata, created_at AS "createdAt", updated_at AS "updatedAt" FROM places WHERE ($1 = \'\' OR name ILIKE $2 OR COALESCE(category, \'\') ILIKE $2 OR COALESCE(city, \'\') ILIKE $2) ORDER BY updated_at DESC LIMIT $3 OFFSET $4',
    [search.trim(), '%' + search.trim() + '%', limit, offset]
  )

  return { items: result.rows, limit, offset }
})
