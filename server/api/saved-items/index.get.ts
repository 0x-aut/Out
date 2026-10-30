import { database } from '../../utils/database'
import { requireUser } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const result = await database.query(
    'SELECT s.id, s.item_type AS "itemType", s.created_at AS "createdAt", p.id AS "placeId", p.name AS "placeName", p.category AS "placeCategory", p.image_url AS "placeImageUrl", p.address AS "placeAddress", w.id AS "walkId", w.title AS "walkTitle", w.description AS "walkDescription", w.visibility AS "walkVisibility" FROM saved_items s LEFT JOIN places p ON p.id = s.place_id LEFT JOIN walks w ON w.id = s.walk_id WHERE s.user_id = $1 AND (s.item_type = \'place\' OR w.user_id = $1 OR w.visibility = \'public\') ORDER BY s.created_at DESC',
    [user.id]
  )

  return {
    items: result.rows.map((row) => ({
      id: row.id,
      itemType: row.itemType,
      createdAt: row.createdAt,
      item: row.itemType === 'place'
        ? { id: row.placeId, name: row.placeName, category: row.placeCategory, imageUrl: row.placeImageUrl, address: row.placeAddress }
        : { id: row.walkId, title: row.walkTitle, description: row.walkDescription, visibility: row.walkVisibility }
    }))
  }
})
