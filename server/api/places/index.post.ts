import { createError } from 'h3'
import { database } from '../../utils/database'
import { requireUser } from '../../utils/auth-session'
import { parsePlaceInput, readJsonObject } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const input = parsePlaceInput(await readJsonObject(event))
  const result = await database.query(
    'INSERT INTO places (created_by, source, source_id, name, description, category, address, city, country, latitude, longitude, image_url, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb) ON CONFLICT (source, source_id) WHERE source_id IS NOT NULL DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category, address = EXCLUDED.address, city = EXCLUDED.city, country = EXCLUDED.country, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, image_url = EXCLUDED.image_url, metadata = EXCLUDED.metadata, updated_at = NOW() WHERE places.created_by = EXCLUDED.created_by RETURNING id, source, source_id AS "sourceId", name, description, category, address, city, country, latitude, longitude, image_url AS "imageUrl", metadata, created_at AS "createdAt", updated_at AS "updatedAt"',
    [
      user.id, input.source, input.sourceId, input.name, input.description, input.category,
      input.address, input.city, input.country, input.latitude, input.longitude,
      input.imageUrl, JSON.stringify(input.metadata)
    ]
  )

  if (result.rowCount) return { place: result.rows[0] }

  const existing = await database.query(
    'SELECT id, source, source_id AS "sourceId", name, description, category, address, city, country, latitude, longitude, image_url AS "imageUrl", metadata, created_at AS "createdAt", updated_at AS "updatedAt" FROM places WHERE source = $1 AND source_id = $2',
    [input.source, input.sourceId]
  )

  if (!existing.rowCount) {
    throw createError({ statusCode: 409, statusMessage: 'The place record changed while it was being saved' })
  }

  return { place: existing.rows[0] }
})
