import { createError } from 'h3'
import { database } from '../../utils/database'
import { requireUser } from '../../utils/auth-session'
import { readJsonObject, stringField, uuidField } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readJsonObject(event)
  const itemType = stringField(body.itemType, 'itemType', 10, true)
  const itemId = uuidField(body.itemId, 'itemId')

  if (itemType !== 'place' && itemType !== 'walk') {
    throw createError({ statusCode: 400, statusMessage: 'itemType must be place or walk' })
  }

  if (itemType === 'place') {
    const exists = await database.query('SELECT id FROM places WHERE id = $1', [itemId])
    if (!exists.rowCount) throw createError({ statusCode: 404, statusMessage: 'Place not found' })

    await database.query(
      'INSERT INTO saved_items (user_id, item_type, place_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, place_id) WHERE item_type = \'place\' DO NOTHING',
      [user.id, itemType, itemId]
    )
  } else {
    const exists = await database.query(
      'SELECT id FROM walks WHERE id = $1 AND (user_id = $2 OR visibility = \'public\')',
      [itemId, user.id]
    )
    if (!exists.rowCount) throw createError({ statusCode: 404, statusMessage: 'Walk not found' })

    await database.query(
      'INSERT INTO saved_items (user_id, item_type, walk_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, walk_id) WHERE item_type = \'walk\' DO NOTHING',
      [user.id, itemType, itemId]
    )
  }

  const saved = await database.query(
    'SELECT id, item_type AS "itemType", created_at AS "createdAt" FROM saved_items WHERE user_id = $1 AND item_type = $2 AND ' + (itemType === 'place' ? 'place_id' : 'walk_id') + ' = $3',
    [user.id, itemType, itemId]
  )

  return { savedItem: saved.rows[0] }
})
