import { database } from '../utils/database'
import { requireUser } from '../utils/auth-session'

const placeInterests = new Set([
  'Hidden gems', 'Local neighbourhoods', 'Museums & galleries', 'Markets', 'Bookshops',
  'Parks & gardens', 'Architecture', 'Beaches', 'Historic places', 'Independent shops'
])
const vibeInterests = new Set([
  'Slow & peaceful', 'Creative & artsy', 'Lively & social', 'Romantic', 'Off the beaten path',
  'Outdoorsy', 'Cosy & intimate', 'Late-night energy', 'Design-led', 'Local & authentic'
])

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const [profileResult, interestsResult] = await Promise.all([
    database.query(
      'SELECT bio, home_base AS "homeBase", travel_style AS "travelStyle" FROM user_profiles WHERE user_id = $1',
      [user.id]
    ),
    database.query(
      'SELECT name, category FROM user_interests WHERE user_id = $1 ORDER BY category, name',
      [user.id]
    )
  ])

  const storedProfile = profileResult.rows[0]
  const legacy = user as typeof user & {
    bio?: string
    homeBase?: string
    travelStyle?: string
    interests?: string
  }

  let interests = interestsResult.rows as Array<{ name: string; category: string }>

  if (!storedProfile && !interests.length && legacy.interests) {
    try {
      const previousInterests: unknown = JSON.parse(legacy.interests)
      if (Array.isArray(previousInterests)) {
        interests = previousInterests
          .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
          .map((name) => ({
            name,
            category: placeInterests.has(name) ? 'places' : vibeInterests.has(name) ? 'vibes' : 'activities'
          }))
      }
    } catch {
      interests = []
    }
  }

  return {
    profile: {
      bio: storedProfile?.bio ?? legacy.bio ?? '',
      homeBase: storedProfile?.homeBase ?? legacy.homeBase ?? '',
      travelStyle: storedProfile?.travelStyle ?? legacy.travelStyle ?? 'Curious wanderer'
    },
    interests
  }
})
