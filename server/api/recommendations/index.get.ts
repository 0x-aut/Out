import { createError } from 'h3'
import { database } from '../../utils/database'
import { requireUser } from '../../utils/auth-session'
import { getQlooPlaceRecommendations, QlooApiError } from '../../utils/qloo'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const [profileResult, interestsResult] = await Promise.all([
    database.query(
      'SELECT home_base AS "homeBase", travel_style AS "travelStyle" FROM user_profiles WHERE user_id = $1',
      [user.id]
    ),
    database.query(
      'SELECT name, category FROM user_interests WHERE user_id = $1 ORDER BY category, name',
      [user.id]
    )
  ])

  const profile = profileResult.rows[0] as { homeBase?: string; travelStyle?: string } | undefined
  const interests = interestsResult.rows as Array<{ name: string; category: 'places' | 'vibes' | 'activities' }>
  const homeBase = profile?.homeBase?.trim() || ''
  const travelStyle = profile?.travelStyle || 'Curious wanderer'

  if (!homeBase && !interests.length && travelStyle === 'Curious wanderer') {
    return {
      status: 'profile_incomplete',
      location: null,
      personalized: false,
      matchedInterests: [],
      items: []
    }
  }

  let recommendations
  try {
    recommendations = await getQlooPlaceRecommendations({ interests, travelStyle, homeBase })
  } catch (error) {
    if (error instanceof QlooApiError) {
      if (error.statusCode === 503 || error.statusCode === 504) {
        throw createError({ statusCode: error.statusCode, statusMessage: error.message })
      }
      if (error.statusCode === 400 && homeBase) {
        throw createError({
          statusCode: 422,
          statusMessage: 'Qloo could not match your home base. Update the city or neighbourhood in your profile.'
        })
      }
      console.error('Qloo recommendation request failed', { statusCode: error.statusCode })
      throw createError({
        statusCode: 502,
        statusMessage: error.statusCode === 401 || error.statusCode === 403
          ? 'Qloo rejected the configured API key.'
          : 'Qloo recommendations could not be loaded.'
      })
    }

    console.error('Unexpected Qloo recommendation error', error)
    throw createError({ statusCode: 502, statusMessage: 'Qloo recommendations could not be loaded.' })
  }

  if (!recommendations.places.length) {
    return {
      status: recommendations.matchedInterests.length || homeBase ? 'no_matches' : 'profile_incomplete',
      location: homeBase || null,
      personalized: recommendations.usedTasteSignals,
      matchedInterests: recommendations.matchedInterests,
      items: []
    }
  }

  const rows = recommendations.places.map(place => ({
    source_id: place.sourceId,
    name: place.name,
    description: place.description,
    category: place.category,
    address: place.address,
    city: place.city,
    country: place.country,
    latitude: place.latitude,
    longitude: place.longitude,
    image_url: place.imageUrl,
    metadata: place.metadata
  }))

  await database.query(
    `INSERT INTO places (
      created_by, source, source_id, name, description, category, address, city, country,
      latitude, longitude, image_url, metadata
    )
    SELECT
      $1, 'qloo', incoming.source_id, incoming.name, incoming.description, incoming.category,
      incoming.address, incoming.city, incoming.country, incoming.latitude, incoming.longitude,
      incoming.image_url, incoming.metadata
    FROM jsonb_to_recordset($2::jsonb) AS incoming(
      source_id TEXT, name TEXT, description TEXT, category TEXT, address TEXT, city TEXT,
      country TEXT, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION, image_url TEXT,
      metadata JSONB
    )
    ON CONFLICT (source, source_id) WHERE source_id IS NOT NULL DO NOTHING`,
    [user.id, JSON.stringify(rows)]
  )

  const sourceIds = recommendations.places.map(place => place.sourceId)
  const persistedResult = await database.query(
    `SELECT
      id, source_id AS "sourceId", name, category, address, city, country,
      latitude, longitude, image_url AS "imageUrl"
    FROM places
    WHERE source = 'qloo' AND source_id = ANY($1::text[])`,
    [sourceIds]
  )

  const persistedBySource = new Map(
    persistedResult.rows.map((place: {
      id: string
      sourceId: string
      name: string
      category: string | null
      address: string | null
      city: string | null
      country: string | null
      latitude: number | null
      longitude: number | null
      imageUrl: string | null
    }) => [place.sourceId, place])
  )

  const items = recommendations.places.flatMap(place => {
    const saved = persistedBySource.get(place.sourceId)
    if (!saved) return []

    return [{
      id: saved.id,
      name: saved.name,
      category: saved.category,
      address: saved.address,
      city: saved.city,
      country: saved.country,
      latitude: saved.latitude,
      longitude: saved.longitude,
      imageUrl: saved.imageUrl,
      affinity: place.affinity
    }]
  })

  return {
    status: items.length ? 'ready' : 'no_matches',
    location: homeBase || null,
    personalized: recommendations.usedTasteSignals,
    matchedInterests: recommendations.matchedInterests,
    items
  }
})
