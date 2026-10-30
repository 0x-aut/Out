import { createError, setResponseHeader, toWebRequest, type H3Event } from 'h3'
import { auth } from '../lib/auth'

export async function requireUser(event: H3Event) {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')

  const session = await auth.api.getSession({
    headers: toWebRequest(event).headers
  })

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'You must be signed in to access this resource'
    })
  }

  return session.user
}
