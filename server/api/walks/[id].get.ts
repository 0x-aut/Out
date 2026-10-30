import { createError } from 'h3'
import { requireUser } from '../../utils/auth-session'
import { uuidField } from '../../utils/validation'
import { fetchWalk } from '../../utils/walks'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = uuidField(getRouterParam(event, 'id'), 'id')
  const walk = await fetchWalk(id, user.id)

  if (!walk) {
    throw createError({ statusCode: 404, statusMessage: 'Walk not found' })
  }

  return { walk }
})
