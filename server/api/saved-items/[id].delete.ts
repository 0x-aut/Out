import { createError } from 'h3'
import { database } from '../../utils/database'
import { requireUser } from '../../utils/auth-session'
import { uuidField } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = uuidField(getRouterParam(event, 'id'), 'id')
  const result = await database.query(
    'DELETE FROM saved_items WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, user.id]
  )

  if (!result.rowCount) {
    throw createError({ statusCode: 404, statusMessage: 'Saved item not found' })
  }

  return { success: true }
})
