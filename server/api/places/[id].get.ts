import { createError } from 'h3'
import { database } from '../../utils/database'
import { requireUser } from '../../utils/auth-session'
import { uuidField } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const id = uuidField(getRouterParam(event, 'id'), 'id')
  const result = await database.query(
    'SELECT id, source, source_id AS "sourceId", name, description, category, address, city, country, latitude, longitude, image_url AS "imageUrl", metadata, created_at AS "createdAt", updated_at AS "updatedAt" FROM places WHERE id = $1',
    [id]
  )

  if (!result.rowCount) {
    throw createError({ statusCode: 404, statusMessage: 'Place not found' })
  }

  return { place: result.rows[0] }
})
