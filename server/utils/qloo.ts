import type { InterestInput } from './validation'

const DEFAULT_QLOO_BASE_URL = 'https://hackathon.api.qloo.com'
const TAG_CACHE_TTL = 6 * 60 * 60 * 1000
const RECOMMENDATION_CACHE_TTL = 5 * 60 * 1000

export interface QlooPlace {
  sourceId: string
  name: string
  description: string | null
  category: string | null
  address: string | null
  city: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  imageUrl: string | null
  affinity: number | null
  metadata: Record<string, unknown>
}

export interface QlooRecommendations {
  places: QlooPlace[]
  matchedInterests: string[]
  usedTasteSignals: boolean
}

export class QlooApiError extends Error {
  constructor(
    readonly statusCode: number,
    message: string
  ) {
    super(message)
    this.name = 'QlooApiError'
  }
}

interface CacheEntry<T> {
  expiresAt: number
  value: T
}

interface QlooCache {
  tags: Map<string, CacheEntry<QlooTag[]>>
  recommendations: Map<string, CacheEntry<QlooRecommendations>>
}

interface QlooTag {
  id: string
  name: string
  types: string[]
}

interface QlooEntity {
  entity_id?: string
  id?: string
  name?: string
  subtype?: string
  properties?: Record<string, unknown>
  query?: Record<string, unknown>
  affinity?: number
}

const qlooGlobal = globalThis as typeof globalThis & { __outQlooCache?: QlooCache }
const cache = qlooGlobal.__outQlooCache ??= {
  tags: new Map<string, CacheEntry<QlooTag[]>>(),
  recommendations: new Map<string, CacheEntry<QlooRecommendations>>()
}

const MIN_QLOO_REQUEST_INTERVAL = 250
let qlooRequestQueue = Promise.resolve()
let lastQlooRequestStartedAt = 0

async function waitForQlooRequestSlot(): Promise<void> {
  let release!: () => void
  const previous = qlooRequestQueue
  qlooRequestQueue = new Promise<void>(resolve => { release = resolve })
  await previous

  const delay = Math.max(0, MIN_QLOO_REQUEST_INTERVAL - (Date.now() - lastQlooRequestStartedAt))
  if (delay) await new Promise(resolve => setTimeout(resolve, delay))

  lastQlooRequestStartedAt = Date.now()
  release()
}

const interestAliases: Record<string, string[]> = {
  'Hidden gems': ['hidden gem', 'off the beaten path'],
  'Local neighbourhoods': ['local neighborhood', 'neighborhood'],
  'Museums & galleries': ['museum', 'art gallery'],
  'Markets': ['market'],
  'Bookshops': ['bookshop', 'bookstore'],
  'Parks & gardens': ['park', 'garden'],
  'Architecture': ['architecture'],
  'Beaches': ['beach'],
  'Historic places': ['historic site', 'historical place'],
  'Independent shops': ['independent shop', 'boutique'],
  'Slow & peaceful': ['quiet place', 'tranquil'],
  'Creative & artsy': ['art', 'creative'],
  'Lively & social': ['lively', 'social'],
  'Romantic': ['romantic'],
  'Off the beaten path': ['hidden gem'],
  'Outdoorsy': ['outdoor recreation'],
  'Cosy & intimate': ['cozy', 'intimate'],
  'Late-night energy': ['nightlife'],
  'Design-led': ['design'],
  'Local & authentic': ['local', 'authentic'],
  'Coffee & bakeries': ['coffee shop', 'bakery'],
  'Street food': ['street food'],
  'Fine dining': ['fine dining restaurant'],
  'Live music': ['live music venue'],
  'Cocktail bars': ['cocktail bar'],
  'Photography': ['photography'],
  'Walking tours': ['walking tour'],
  'Vintage shopping': ['vintage store'],
  'Festivals & events': ['festival', 'event venue'],
  'Food markets': ['food market'],
  'Nature trails': ['nature trail', 'hiking trail'],
  'Street art': ['street art']
}

const travelStyleAliases: Record<string, string[]> = {
  'Slow traveller': ['slow travel', 'quiet place'],
  'Culture seeker': ['cultural heritage', 'museum'],
  'Food explorer': ['food', 'restaurant'],
  'Adventure first': ['outdoor recreation', 'nature trail'],
  'Night owl': ['nightlife']
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function stringValue(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function numberValue(...values: unknown[]): number | null {
  for (const value of values) {
    const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
    if (Number.isFinite(number)) return number
  }
  return null
}

function getBaseUrl(): URL {
  let url: URL

  try {
    url = new URL(process.env.QLOO_BASE_URL?.trim() || DEFAULT_QLOO_BASE_URL)
  } catch {
    throw new QlooApiError(500, 'QLOO_BASE_URL must be a valid URL.')
  }

  const localHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)
  if (url.protocol !== 'https:' && !localHttp) {
    throw new QlooApiError(500, 'QLOO_BASE_URL must use HTTPS.')
  }

  return url
}

async function qlooGet(path: string, params: URLSearchParams): Promise<Record<string, unknown>> {
  const apiKey = process.env.QLOO_API_KEY?.trim()
  if (!apiKey) {
    throw new QlooApiError(503, 'Qloo is not configured. Add QLOO_API_KEY to the server environment.')
  }

  const url = new URL(path.replace(/^\//, ''), getBaseUrl().toString().replace(/\/$/, '') + '/')
  url.search = params.toString()

  await waitForQlooRequestSlot()

  let response: Response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Api-Key': apiKey
      },
      signal: AbortSignal.timeout(12_000)
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new QlooApiError(504, 'Qloo took too long to respond.')
    }
    throw new QlooApiError(502, 'Could not reach the Qloo API.')
  }

  if (!response.ok) {
    throw new QlooApiError(response.status, `Qloo returned HTTP ${response.status}.`)
  }

  try {
    return asRecord(await response.json())
  } catch {
    throw new QlooApiError(502, 'Qloo returned an unreadable response.')
  }
}

function extractTagRecords(payload: Record<string, unknown>): QlooTag[] {
  const results = asRecord(payload.results)
  const rawTags = Array.isArray(results.tags)
    ? results.tags
    : Array.isArray(payload.tags)
      ? payload.tags
      : []

  return rawTags.flatMap((value): QlooTag[] => {
    const tag = asRecord(value)
    const id = stringValue(tag.tag_id, tag.tag_value, tag.id)
    const name = stringValue(tag.name, tag.label)
    if (!id?.startsWith('urn:tag:') || !name) return []

    const types = Array.isArray(tag.types)
      ? tag.types.filter((type): type is string => typeof type === 'string')
      : []

    return [{ id, name, types }]
  })
}

async function searchTags(query: string): Promise<QlooTag[]> {
  const cacheKey = query.toLocaleLowerCase()
  const cached = cache.tags.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const params = new URLSearchParams({
    'filter.query': query,
    take: '30'
  })
  const payload = await qlooGet('/v2/tags', params)
  const tags = extractTagRecords(payload)

  cache.tags.set(cacheKey, { value: tags, expiresAt: Date.now() + TAG_CACHE_TTL })
  return tags
}

function normaliseWords(value: string): string[] {
  return value
    .toLocaleLowerCase()
    .replace(/&/g, ' and ')
    .replace(/neighbourhood/g, 'neighborhood')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.length > 4 && word.endsWith('s') ? word.slice(0, -1) : word)
}

function isPlaceTag(tag: QlooTag): boolean {
  if (tag.types.includes('urn:entity:place')) return true
  return /:(place|restaurant|hotel|venue|landmark):/i.test(tag.id)
}

function tagMatchScore(tagName: string, query: string): number {
  const name = normaliseWords(tagName)
  const wanted = normaliseWords(query)
  if (!name.length || !wanted.length) return 0
  if (name.join(' ') === wanted.join(' ')) return 1

  const nameSet = new Set(name)
  const overlap = wanted.filter(word => nameSet.has(word)).length
  return overlap / wanted.length
}

async function resolveOneInterest(interest: InterestInput): Promise<QlooTag[]> {
  const queries = [interest.name, ...(interestAliases[interest.name] || [])]
  const used = new Set<string>()

  for (const query of queries) {
    const normalizedQuery = query.trim()
    if (!normalizedQuery || used.has(normalizedQuery.toLocaleLowerCase())) continue
    used.add(normalizedQuery.toLocaleLowerCase())

    const candidates = (await searchTags(normalizedQuery))
      .filter(isPlaceTag)
      .map(tag => ({ tag, score: tagMatchScore(tag.name, normalizedQuery) }))
      .filter(result => result.score >= 0.5)
      .sort((a, b) => b.score - a.score)

    if (candidates.length) return candidates.slice(0, 2).map(result => result.tag)
  }

  return []
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  callback: (value: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(values.length)
  let nextIndex = 0

  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (nextIndex < values.length) {
      const index = nextIndex++
      results[index] = await callback(values[index]!)
    }
  }))

  return results
}

function normalizePlace(entity: QlooEntity): QlooPlace | null {
  const properties = asRecord(entity.properties)
  const geocode = asRecord(properties.geocode)
  const location = asRecord(properties.location)
  const coordinates = asRecord(properties.coordinates)
  const addressObject = asRecord(properties.address)
  const image = asRecord(properties.image)
  const query = asRecord(entity.query)

  const sourceId = stringValue(entity.entity_id, entity.id)
  const name = stringValue(entity.name, properties.name)
  if (!sourceId || !name) return null

  const city = stringValue(
    geocode.city, geocode.locality, location.city, properties.city, properties.locality
  )
  const country = stringValue(
    geocode.country, geocode.country_name, location.country, properties.country
  )
  const address = stringValue(
    properties.address,
    properties.formatted_address,
    addressObject.formatted,
    addressObject.label,
    properties.street_address,
    properties.street
  ) || [city, country].filter(Boolean).join(', ') || null

  const rawImage = stringValue(image.url, properties.image_url, properties.imageUrl)
  let imageUrl: string | null = null
  if (rawImage) {
    try {
      const parsed = new URL(rawImage)
      if (parsed.protocol === 'https:') imageUrl = parsed.toString()
    } catch {
      imageUrl = null
    }
  }

  const subtype = stringValue(entity.subtype, properties.subtype)
  const category = stringValue(
    properties.category,
    properties.primary_type,
    subtype?.split(':').at(-1)?.replace(/_/g, ' ')
  )

  const latitude = numberValue(
    geocode.latitude, geocode.lat, location.latitude, coordinates.latitude, coordinates.lat,
    properties.latitude, properties.lat
  )
  const longitude = numberValue(
    geocode.longitude, geocode.lng, location.longitude, coordinates.longitude, coordinates.lng,
    properties.longitude, properties.lng
  )
  const validCoordinates = latitude !== null && longitude !== null
    && latitude >= -90 && latitude <= 90
    && longitude >= -180 && longitude <= 180

  const tags = Array.isArray(properties.tags)
    ? properties.tags.slice(0, 8).flatMap(value => {
      const tag = asRecord(value)
      const tagName = stringValue(tag.name)
      return tagName ? [tagName] : []
    })
    : []

  const affinity = numberValue(query.affinity, entity.affinity)

  return {
    sourceId,
    name: name.slice(0, 120),
    description: stringValue(properties.description, properties.short_description)?.slice(0, 1200) || null,
    category: category?.slice(0, 80) || null,
    address: address?.slice(0, 240) || null,
    city: city?.slice(0, 120) || null,
    country: country?.slice(0, 120) || null,
    latitude: validCoordinates ? latitude : null,
    longitude: validCoordinates ? longitude : null,
    imageUrl,
    affinity,
    metadata: {
      qloo: {
        subtype,
        affinity,
        tags
      }
    }
  }
}

function extractEntities(payload: Record<string, unknown>): QlooEntity[] {
  const results = asRecord(payload.results)
  const records = Array.isArray(results.entities) ? results.entities : []
  return records.map(asRecord) as QlooEntity[]
}

export async function getQlooPlaceRecommendations(input: {
  interests: InterestInput[]
  travelStyle: string
  homeBase: string
}): Promise<QlooRecommendations> {
  const interests = input.interests.slice(0, 20)
  const styleTerms = travelStyleAliases[input.travelStyle] || []
  const styleSignals: InterestInput[] = styleTerms.map(name => ({
    name,
    category: 'vibes'
  }))
  const signals = [...interests, ...styleSignals]

  const resolved = await mapWithConcurrency(signals, 4, resolveOneInterest)
  const resolvedByInterest = new Map<string, QlooTag[]>()
  for (let index = 0; index < signals.length; index++) {
    resolvedByInterest.set(signals[index]!.name, resolved[index] || [])
  }

  const tagIds = [...new Set(resolved.flat().map(tag => tag.id))]
  const matchedInterests = interests
    .filter(interest => (resolvedByInterest.get(interest.name) || []).length > 0)
    .map(interest => interest.name)

  const homeBase = input.homeBase.trim()
  if (!tagIds.length && !homeBase) {
    return { places: [], matchedInterests, usedTasteSignals: false }
  }

  const recommendationKey = JSON.stringify([
    homeBase.toLocaleLowerCase(),
    tagIds,
    matchedInterests
  ])
  const cached = cache.recommendations.get(recommendationKey)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const params = new URLSearchParams({
    'filter.type': 'urn:entity:place',
    take: '24'
  })

  // Tags belong in signal.interests.tags: filter.tags would constrain results rather than rank by taste.
  if (tagIds.length) params.set('signal.interests.tags', tagIds.join(','))
  // Qloo's Place insights support filter.location.query for locality-scoped place results.
  if (homeBase) params.set('filter.location.query', homeBase)

  const payload = await qlooGet('/v2/insights/', params)
  const places = extractEntities(payload)
    .map(normalizePlace)
    .filter((place): place is QlooPlace => place !== null)

  const result = { places, matchedInterests, usedTasteSignals: tagIds.length > 0 }
  cache.recommendations.set(recommendationKey, {
    value: result,
    expiresAt: Date.now() + RECOMMENDATION_CACHE_TTL
  })

  return result
}
