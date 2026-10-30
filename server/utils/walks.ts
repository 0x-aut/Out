import type { PoolClient } from 'pg'
import { database } from './database'
import type { WalkInput } from './validation'

export async function insertWalkStops(client: PoolClient, walkId: string, stops: WalkInput['stops']) {
  for (const [position, stop] of stops.entries()) {
    await client.query(
      'INSERT INTO walk_stops (walk_id, place_id, position, name, address, latitude, longitude, notes, duration_minutes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [
        walkId,
        stop.placeId,
        position,
        stop.name,
        stop.address,
        stop.latitude,
        stop.longitude,
        stop.notes,
        stop.durationMinutes
      ]
    )
  }
}

export async function fetchWalk(id: string, userId: string) {
  const walkResult = await database.query(
    'SELECT id, title, description, duration_minutes AS "durationMinutes", distance_meters AS "distanceMeters", visibility, created_at AS "createdAt", updated_at AS "updatedAt" FROM walks WHERE id = $1 AND (user_id = $2 OR visibility = $3)',
    [id, userId, 'public']
  )

  if (!walkResult.rowCount) return null

  const stopResult = await database.query(
    'SELECT id, place_id AS "placeId", position, name, address, latitude, longitude, notes, duration_minutes AS "durationMinutes" FROM walk_stops WHERE walk_id = $1 ORDER BY position ASC',
    [id]
  )

  return { ...walkResult.rows[0], stops: stopResult.rows }
}
