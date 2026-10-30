import { createError, getRequestHeader, readBody, type H3Event } from 'h3'

export type InterestCategory = 'places' | 'vibes' | 'activities'

export interface InterestInput {
  name: string
  category: InterestCategory
}

export interface PlaceInput {
  source: string
  sourceId: string | null
  name: string
  description: string | null
  category: string | null
  address: string | null
  city: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  imageUrl: string | null
  metadata: Record<string, unknown>
}

export interface WalkStopInput {
  placeId: string | null
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  notes: string | null
  durationMinutes: number | null
}

export interface WalkInput {
  title: string
  description: string | null
  durationMinutes: number | null
  distanceMeters: number | null
  visibility: 'private' | 'public'
  stops: WalkStopInput[]
}

function invalid(message: string): never {
  throw createError({ statusCode: 400, statusMessage: message })
}

export async function readJsonObject(event: H3Event): Promise<Record<string, unknown>> {
  const contentType = getRequestHeader(event, 'content-type')?.split(';', 1)[0].trim().toLowerCase()
  if (contentType !== 'application/json') invalid('Content-Type must be application/json')

  const value: unknown = await readBody(event)

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    invalid('Request body must be a JSON object')
  }

  return value as Record<string, unknown>
}

export function asRecord(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    invalid(field + ' must be an object')
  }

  return value as Record<string, unknown>
}

export function stringField(
  value: unknown,
  field: string,
  maxLength: number,
  required = false
): string | null {
  if (value === undefined || value === null) {
    if (required) invalid(field + ' is required')
    return null
  }

  if (typeof value !== 'string') invalid(field + ' must be a string')

  const result = value.trim()
  if (required && !result) invalid(field + ' is required')
  if (result.length > maxLength) invalid(field + ' must be ' + maxLength + ' characters or fewer')

  return result
}

export function numberField(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
  integer = false
): number | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'number' || !Number.isFinite(value)) invalid(field + ' must be a number')
  if (value < minimum || value > maximum) invalid(field + ' is out of range')
  if (integer && !Number.isInteger(value)) invalid(field + ' must be an integer')
  return value
}

export function uuidField(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    invalid(field + ' must be a valid UUID')
  }
  return value
}

export function parseMetadata(value: unknown): Record<string, unknown> {
  if (value === undefined || value === null) return {}
  if (typeof value !== 'object' || Array.isArray(value)) invalid('metadata must be an object')

  const serialized = JSON.stringify(value)
  if (Buffer.byteLength(serialized, 'utf8') > 20_000) invalid('metadata must be 20 KB or smaller')

  return value as Record<string, unknown>
}

function urlField(value: unknown, field: string): string | null {
  const result = stringField(value, field, 2048)
  if (!result) return null

  try {
    const url = new URL(result)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') invalid(field + ' must be an HTTP or HTTPS URL')
  } catch {
    invalid(field + ' must be a valid HTTP or HTTPS URL')
  }

  return result
}

export function parsePlaceInput(body: Record<string, unknown>): PlaceInput {
  const source = stringField(body.source ?? 'manual', 'source', 40, true)!
  if (!/^[a-z0-9_-]+$/i.test(source)) invalid('source contains unsupported characters')

  const latitude = numberField(body.latitude, 'latitude', -90, 90)
  const longitude = numberField(body.longitude, 'longitude', -180, 180)
  if ((latitude === null) !== (longitude === null)) invalid('latitude and longitude must be provided together')

  return {
    source,
    sourceId: stringField(body.sourceId, 'sourceId', 200),
    name: stringField(body.name, 'name', 120, true)!,
    description: stringField(body.description, 'description', 1200),
    category: stringField(body.category, 'category', 80),
    address: stringField(body.address, 'address', 240),
    city: stringField(body.city, 'city', 120),
    country: stringField(body.country, 'country', 120),
    latitude,
    longitude,
    imageUrl: urlField(body.imageUrl, 'imageUrl'),
    metadata: parseMetadata(body.metadata)
  }
}

export function parseWalkInput(body: Record<string, unknown>): WalkInput {
  const visibility = body.visibility ?? 'private'
  if (visibility !== 'private' && visibility !== 'public') invalid('visibility must be private or public')

  const stopsValue = body.stops ?? []
  if (!Array.isArray(stopsValue) || stopsValue.length > 100) {
    invalid('stops must be an array containing no more than 100 items')
  }

  const stops = stopsValue.map((value, index): WalkStopInput => {
    const stop = asRecord(value, 'stops[' + index + ']')
    const latitude = numberField(stop.latitude, 'stops[' + index + '].latitude', -90, 90)
    const longitude = numberField(stop.longitude, 'stops[' + index + '].longitude', -180, 180)

    if ((latitude === null) !== (longitude === null)) {
      invalid('Each stop must provide both latitude and longitude, or neither')
    }

    return {
      placeId: stop.placeId === undefined || stop.placeId === null ? null : uuidField(stop.placeId, 'stops[' + index + '].placeId'),
      name: stringField(stop.name, 'stops[' + index + '].name', 120, true)!,
      address: stringField(stop.address, 'stops[' + index + '].address', 240),
      latitude,
      longitude,
      notes: stringField(stop.notes, 'stops[' + index + '].notes', 600),
      durationMinutes: numberField(stop.durationMinutes, 'stops[' + index + '].durationMinutes', 1, 1440, true)
    }
  })

  return {
    title: stringField(body.title, 'title', 120, true)!,
    description: stringField(body.description, 'description', 1200),
    durationMinutes: numberField(body.durationMinutes, 'durationMinutes', 1, 1440, true),
    distanceMeters: numberField(body.distanceMeters, 'distanceMeters', 1, 2_000_000, true),
    visibility,
    stops
  }
}

export function parseInterests(value: unknown): InterestInput[] {
  if (!Array.isArray(value) || value.length > 60) {
    invalid('interests must be an array containing no more than 60 items')
  }

  const seen = new Set<string>()
  const result: InterestInput[] = []

  for (const [index, entry] of value.entries()) {
    const interest = asRecord(entry, 'interests[' + index + ']')
    const name = stringField(interest.name, 'interest name', 80, true)!
    const category = interest.category

    if (category !== 'places' && category !== 'vibes' && category !== 'activities') {
      invalid('interest category must be places, vibes, or activities')
    }

    const key = category + ':' + name.toLocaleLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push({ name, category })
  }

  return result
}
