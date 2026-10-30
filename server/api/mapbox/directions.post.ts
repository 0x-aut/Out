import { createError } from 'h3'
import { requireUser } from '../../utils/auth-session'
import { readJsonObject } from '../../utils/validation'

interface Coordinate {
  latitude: number
  longitude: number
}

function parseCoordinates(value: unknown): Coordinate[] {
  if (!Array.isArray(value) || value.length < 2 || value.length > 25) {
    throw createError({
      statusCode: 400,
      statusMessage: 'coordinates must contain between 2 and 25 locations'
    })
  }

  return value.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw createError({ statusCode: 400, statusMessage: 'Each coordinate must be an object' })
    }

    const coordinate = entry as Record<string, unknown>
    const latitude = coordinate.latitude
    const longitude = coordinate.longitude

    if (
      typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: 'coordinates[' + index + '] must contain a valid latitude and longitude'
      })
    }

    return { latitude, longitude }
  })
}

export default defineEventHandler(async (event) => {
  await requireUser(event)

  const body = await readJsonObject(event)
  const coordinates = parseCoordinates(body.coordinates)
  const accessToken = process.env.MAPBOX_API_KEY?.trim()

  if (!accessToken) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Walking routes are not configured. Add MAPBOX_API_KEY to the server environment.'
    })
  }

  const path = coordinates
    .map(coordinate => coordinate.longitude + ',' + coordinate.latitude)
    .join(';')
  const url = new URL('https://api.mapbox.com/directions/v5/mapbox/walking/' + path)
  url.searchParams.set('access_token', accessToken)
  url.searchParams.set('geometries', 'geojson')
  url.searchParams.set('overview', 'full')
  url.searchParams.set('steps', 'true')

  let response: Response
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12_000)
    })
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError'
    throw createError({
      statusCode: timedOut ? 504 : 502,
      statusMessage: timedOut
        ? 'Mapbox took too long to calculate this walk. Please try again.'
        : 'Mapbox could not be reached. Please try again.'
    })
  }

  let payload: {
    code?: string
    message?: string
    routes?: Array<{
      distance?: number
      duration?: number
      geometry?: {
        type?: string
        coordinates?: unknown
      }
    }>
  }

  try {
    payload = await response.json() as typeof payload
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Mapbox returned an unreadable route response.' })
  }

  if (!response.ok) {
    console.error('Mapbox Directions request failed', {
      status: response.status,
      code: payload.code
    })
    throw createError({
      statusCode: response.status === 401 || response.status === 403 ? 502 : 422,
      statusMessage: response.status === 401 || response.status === 403
        ? 'Mapbox rejected the server access token. Check that it has directions:read permission.'
        : 'Mapbox could not find a walking route between those places.'
    })
  }

  const route = payload.routes?.[0]
  const geometry = route?.geometry
  const routeCoordinates = geometry?.coordinates

  if (
    payload.code !== 'Ok' ||
    geometry?.type !== 'LineString' ||
    !Array.isArray(routeCoordinates) ||
    routeCoordinates.length < 2 ||
    typeof route?.distance !== 'number' ||
    !Number.isFinite(route.distance) ||
    typeof route.duration !== 'number' ||
    !Number.isFinite(route.duration)
  ) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Mapbox could not find a walkable route for those places.'
    })
  }

  return {
    route: {
      geometry: {
        type: 'LineString' as const,
        coordinates: routeCoordinates
      },
      distance: route.distance,
      duration: route.duration
    }
  }
})
