<script setup lang="ts">
import { ArrowLeft, Navigation, Search } from '@lucide/vue'
import { authClient } from '~/lib/auth-client'
import type { MapPlace, MapRouteGeometry, UserMapLocation } from '~/types/map'

type RecommendationItem = Omit<MapPlace, 'latitude' | 'longitude'> & {
  latitude: number | null
  longitude: number | null
}

type RecommendationResponse = {
  status: 'ready' | 'profile_incomplete' | 'no_matches'
  location: string | null
  personalized: boolean
  matchedInterests: string[]
  items: RecommendationItem[]
}

type DirectionsResponse = {
  route: {
    geometry: MapRouteGeometry
    distance: number
    duration: number
  }
}

type SavedWalkResponse = {
  walk: { id: string; title: string }
}

const router = useRouter()
const routeQuery = useRoute()
const authSession = authClient.useSession()
const mapCanvas = ref<{ locateUser: () => void; focusPlace: (id: string) => void } | null>(null)

const search = ref(typeof routeQuery.query.vibe === 'string' ? routeQuery.query.vibe : '')
const chatOpen = ref(false)
const plannerOpen = ref(false)
const activeFilters = ref<string[]>([])
const places = ref<MapPlace[]>([])
const recommendedPlaces = ref<MapPlace[]>([])
const recommendationsLoading = ref(false)
const recommendationsError = ref('')
const recommendationLocation = ref<string | null>(null)
const recommendationPersonalized = ref(false)
const selectedIds = ref<string[]>([])
const userLocation = ref<UserMapLocation | null>(null)
const locationPending = ref(false)
const locationError = ref('')
const walkingRoute = ref<MapRouteGeometry | null>(null)
const routeDistance = ref(0)
const routeDuration = ref(0)
const routeBuilding = ref(false)
const walkSaving = ref(false)
const walkSaved = ref(false)
const plannerError = ref('')
const activeWalk = ref<{ id: string; title: string; description: string | null; visibility: 'private' | 'public'; isOwner: boolean } | null>(null)
let recommendationRequestId = 0
let mapTargetRequestId = 0
let recommendationsReady = false
let recommendationsPromise: Promise<void> | null = null
let activePlaceId = ''

useHead({ title: 'Map — Out' })

const selectedPlaces = computed(() =>
  selectedIds.value
    .map(id => places.value.find(place => place.id === id))
    .filter((place): place is MapPlace => Boolean(place))
)

function apiErrorMessage(error: unknown, fallback: string) {
  const value = error as { data?: { statusMessage?: string }; statusMessage?: string }
  return value?.data?.statusMessage || value?.statusMessage || fallback
}

function clearRoute() {
  walkingRoute.value = null
  routeDistance.value = 0
  routeDuration.value = 0
  walkSaved.value = false
  plannerError.value = ''
}

async function loadRecommendations() {
  const requestId = ++recommendationRequestId
  recommendationsLoading.value = true
  recommendationsError.value = ''

  try {
    const response = await $fetch<RecommendationResponse>('/api/recommendations')
    if (requestId !== recommendationRequestId) return

    places.value = response.items.flatMap(item => {
      if (
        typeof item.latitude !== 'number' || !Number.isFinite(item.latitude) ||
        typeof item.longitude !== 'number' || !Number.isFinite(item.longitude)
      ) return []

      return [{
        id: item.id,
        name: item.name,
        category: item.category,
        address: item.address,
        city: item.city,
        country: item.country,
        latitude: item.latitude,
        longitude: item.longitude,
        imageUrl: item.imageUrl
      }]
    })

    recommendedPlaces.value = [...places.value]
    recommendationLocation.value = response.location
    recommendationPersonalized.value = response.personalized
    selectedIds.value = []
    clearRoute()

    if (response.items.length && !places.value.length) {
      recommendationsError.value = 'Your recommendations do not include map coordinates yet. Try refreshing your picks later.'
    }
  } catch (error) {
    if (requestId !== recommendationRequestId) return
    recommendationsError.value = apiErrorMessage(error, 'Your places could not be loaded. Please try again.')
    places.value = []
    recommendedPlaces.value = []
  } finally {
    if (requestId === recommendationRequestId) recommendationsLoading.value = false
  }
}

async function ensureRecommendations() {
  if (recommendationsReady) return
  if (!recommendationsPromise) {
    const ownerId = authSession.value.data?.user?.id
    let pending: Promise<void>
    pending = loadRecommendations().finally(() => {
      if (recommendationsPromise === pending) {
        recommendationsReady = authSession.value.data?.user?.id === ownerId
        recommendationsPromise = null
      }
    })
    recommendationsPromise = pending
  }
  await recommendationsPromise
}

async function loadExistingWalk(id: string) {
  activeWalk.value = null
  plannerError.value = ''
  try {
    const response = await $fetch<{ walk: {
      id: string
      title: string
      description: string | null
      visibility: 'private' | 'public'
      isOwner: boolean
      durationMinutes: number | null
      distanceMeters: number | null
      stops: Array<{
        id: string
        placeId: string | null
        name: string
        address: string | null
        latitude: number | null
        longitude: number | null
        notes: string | null
        durationMinutes: number | null
        imageUrl: string | null
      }>
    } }>('/api/walks/' + id)

    const walk = response.walk
    const locatedStops = walk.stops.filter(stop =>
      typeof stop.latitude === 'number' && Number.isFinite(stop.latitude) &&
      typeof stop.longitude === 'number' && Number.isFinite(stop.longitude)
    )
    if (!locatedStops.length) {
      plannerError.value = 'This walk does not have map coordinates for its stops.'
      return
    }

    const origin = locatedStops.find(stop => !stop.placeId) || locatedStops[0]!
    const destinationStops = locatedStops.filter(stop => stop.id !== origin.id)
    places.value = destinationStops.map(stop => ({
      id: stop.placeId || stop.id,
      placeId: stop.placeId,
      name: stop.name,
      category: null,
      address: stop.address,
      city: null,
      country: null,
      latitude: stop.latitude!,
      longitude: stop.longitude!,
      imageUrl: stop.imageUrl
    }))
    selectedIds.value = places.value.map(place => place.id)
    userLocation.value = {
      latitude: origin.latitude!,
      longitude: origin.longitude!,
      accuracy: 0
    }
    activeWalk.value = {
      id: walk.id,
      title: walk.title,
      description: walk.description,
      visibility: walk.visibility,
      isOwner: walk.isOwner
    }
    routeDistance.value = walk.distanceMeters || 0
    routeDuration.value = walk.durationMinutes ? walk.durationMinutes * 60 : 0
    walkingRoute.value = null
    walkSaved.value = false

    const coordinates = locatedStops.map(stop => ({
      latitude: stop.latitude!,
      longitude: stop.longitude!
    }))
    if (coordinates.length >= 2) {
      const routeResponse = await $fetch<DirectionsResponse>('/api/mapbox/directions', {
        method: 'POST',
        body: { coordinates }
      })
      walkingRoute.value = routeResponse.route.geometry
      routeDistance.value = routeResponse.route.distance
      routeDuration.value = routeResponse.route.duration
    }
  } catch (error) {
    plannerError.value = apiErrorMessage(error, 'This saved walk could not be opened on the map.')
  }
}

async function loadPlace(id: string) {
  try {
    const response = await $fetch<{ place: {
      id: string
      name: string
      category: string | null
      address: string | null
      city: string | null
      country: string | null
      latitude: number | null
      longitude: number | null
      imageUrl: string | null
    } }>('/api/places/' + id)
    const place = response.place
    if (typeof place.latitude !== 'number' || typeof place.longitude !== 'number') {
      recommendationsError.value = 'This place does not have map coordinates.'
      return
    }
    const mapPlace: MapPlace = {
      id: place.id,
      name: place.name,
      category: place.category,
      address: place.address,
      city: place.city,
      country: place.country,
      latitude: place.latitude,
      longitude: place.longitude,
      imageUrl: place.imageUrl
    }
    if (!places.value.some(item => item.id === mapPlace.id)) places.value = [...places.value, mapPlace]
    await nextTick()
    mapCanvas.value?.focusPlace(mapPlace.id)
  } catch (error) {
    recommendationsError.value = apiErrorMessage(error, 'This place could not be opened on the map.')
  }
}

let currentUserId: string | undefined

async function syncMapTarget() {
  const requestId = ++mapTargetRequestId
  const userId = authSession.value.data?.user?.id
  if (!userId) {
    if (currentUserId) {
      recommendationRequestId++
      recommendationsReady = false
      recommendationsPromise = null
      places.value = []
      recommendedPlaces.value = []
      selectedIds.value = []
      userLocation.value = null
      activeWalk.value = null
      recommendationLocation.value = null
      recommendationPersonalized.value = false
      recommendationsLoading.value = false
      clearRoute()
    }
    currentUserId = undefined
    return
  }

  if (currentUserId !== userId) {
    currentUserId = userId
    recommendationsReady = false
    recommendationsPromise = null
    recommendationRequestId++
  }
  await ensureRecommendations()
  if (requestId !== mapTargetRequestId) return

  const walkId = routeQuery.query.walk
  const placeId = routeQuery.query.place
  if (typeof walkId === 'string') {
    activePlaceId = ''
    await loadExistingWalk(walkId)
    return
  }

  if (activeWalk.value || activePlaceId !== (typeof placeId === 'string' ? placeId : '')) {
    activeWalk.value = null
    activePlaceId = ''
    places.value = [...recommendedPlaces.value]
    selectedIds.value = []
    userLocation.value = null
    clearRoute()
  }
  if (typeof placeId === 'string' && activePlaceId !== placeId) {
    activePlaceId = placeId
    await loadPlace(placeId)
  } else if (!placeId && !places.value.length && recommendedPlaces.value.length) {
    places.value = [...recommendedPlaces.value]
  }
}

watch(
  () => [
    authSession.value.data?.user?.id,
    routeQuery.query.walk,
    routeQuery.query.place
  ] as const,
  () => { void syncMapTarget() },
  { immediate: true }
)

function matchesFilter(place: MapPlace, filter: string) {
  const value = (place.category + ' ' + place.name).toLocaleLowerCase()

  const keywords: Record<string, string[]> = {
    Courtyards: ['courtyard', 'garden', 'park', 'plaza', 'square'],
    Views: ['view', 'viewpoint', 'lookout', 'miradouro', 'overlook', 'scenic'],
    Cafés: ['cafe', 'coffee', 'bakery', 'tea house', 'patisserie'],
    Architecture: ['architecture', 'museum', 'gallery', 'monument', 'historic', 'church', 'landmark']
  }

  return (keywords[filter] || []).some(keyword => value.includes(keyword))
}

const visiblePlaces = computed(() => places.value.filter(place =>
  selectedIds.value.includes(place.id) ||
  !activeFilters.value.length ||
  activeFilters.value.some(filter => matchesFilter(place, filter))
))

function toggleFilter(category: string) {
  activeFilters.value = activeFilters.value.includes(category)
    ? activeFilters.value.filter(item => item !== category)
    : [...activeFilters.value, category]
}

function togglePlace(place: MapPlace) {
  const selected = selectedIds.value.includes(place.id)
  if (selected) {
    selectedIds.value = selectedIds.value.filter(id => id !== place.id)
  } else {
    if (selectedIds.value.length >= 24) {
      plannerError.value = 'A walk can include up to 24 stops.'
      plannerOpen.value = true
      return
    }
    selectedIds.value = [...selectedIds.value, place.id]
  }

  clearRoute()
}

function moveStop(index: number, offset: -1 | 1) {
  const nextIndex = index + offset
  if (nextIndex < 0 || nextIndex >= selectedIds.value.length) return

  const next = [...selectedIds.value]
  const [item] = next.splice(index, 1)
  next.splice(nextIndex, 0, item!)
  selectedIds.value = next
  clearRoute()
}

function onLocation(location: UserMapLocation) {
  userLocation.value = location
  locationPending.value = false
  locationError.value = ''
  clearRoute()
}

function onLocationError(message: string) {
  locationPending.value = false
  locationError.value = message || 'Your location could not be determined. Check your browser location permission.'
}

function requestLocation() {
  locationError.value = ''
  locationPending.value = true
  if (!mapCanvas.value) {
    locationPending.value = false
    locationError.value = 'The map is still loading. Please try again.'
    return
  }
  mapCanvas.value.locateUser()
}

async function buildWalk() {
  plannerError.value = ''

  if (!userLocation.value) {
    plannerError.value = 'Share your current location to start a walking route.'
    return
  }
  if (!selectedPlaces.value.length) {
    plannerError.value = 'Choose at least one place on the map.'
    return
  }

  routeBuilding.value = true
  walkSaved.value = false

  try {
    const response = await $fetch<DirectionsResponse>('/api/mapbox/directions', {
      method: 'POST',
      body: {
        coordinates: [
          userLocation.value,
          ...selectedPlaces.value
        ].map(point => ({
          latitude: point.latitude,
          longitude: point.longitude
        }))
      }
    })

    walkingRoute.value = response.route.geometry
    routeDistance.value = response.route.distance
    routeDuration.value = response.route.duration
  } catch (error) {
    plannerError.value = apiErrorMessage(error, 'Your walking route could not be calculated. Please try again.')
  } finally {
    routeBuilding.value = false
  }
}

async function saveWalk() {
  if (!walkingRoute.value || !selectedPlaces.value.length) return

  walkSaving.value = true
  plannerError.value = ''

  const title = activeWalk.value?.title || (selectedPlaces.value.length === 1
    ? 'A walk to ' + selectedPlaces.value[0]!.name
    : 'A walk around ' + selectedPlaces.value[0]!.name)
  const body = {
    title: title.slice(0, 120),
    description: activeWalk.value?.description || 'A walking route starting from your current location.',
    durationMinutes: Math.max(1, Math.ceil(routeDuration.value / 60)),
    distanceMeters: Math.max(1, Math.round(routeDistance.value)),
    visibility: activeWalk.value?.visibility || 'private',
    stops: [
      ...(userLocation.value ? [{
        placeId: null,
        name: 'Starting location',
        address: null,
        latitude: userLocation.value.latitude,
        longitude: userLocation.value.longitude,
        notes: null,
        durationMinutes: null
      }] : []),
      ...selectedPlaces.value.map(place => ({
        placeId: place.placeId === undefined ? place.id : place.placeId,
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        notes: null,
        durationMinutes: null
      }))
    ]
  }

  try {
    if (activeWalk.value?.isOwner) {
      await $fetch('/api/walks/' + activeWalk.value.id, { method: 'PUT', body })
      walkSaved.value = true
      await router.replace('/walks/' + activeWalk.value.id)
    } else {
      const response = await $fetch<SavedWalkResponse>('/api/walks', {
        method: 'POST',
        body: {
          ...body,
          title: activeWalk.value ? 'Copy of ' + activeWalk.value.title : body.title,
          description: activeWalk.value
            ? 'A copy of a community walk, adjusted to your preferences.'
            : body.description,
          visibility: 'private'
        }
      })
      walkSaved.value = true
      await router.replace('/walks/' + response.walk.id)
    }
  } catch (error) {
    plannerError.value = apiErrorMessage(error, 'Your walk could not be saved. Please try again.')
  } finally {
    walkSaving.value = false
  }
}

function goBack() {
  const previous = router.options.history.state.back
  if (typeof previous === 'string' && previous.startsWith('/')) {
    router.back()
    return
  }
  router.push('/')
}

function openChat() {
  chatOpen.value = true
}

function saveVibe(value: string) {
  search.value = value
  chatOpen.value = false
}

watch(() => routeQuery.query.vibe, value => {
  search.value = typeof value === 'string' ? value : ''
}, { immediate: true })

watch(() => routeQuery.query.mode, mode => {
  if (mode === 'chat') chatOpen.value = true
}, { immediate: true })

watch(chatOpen, open => {
  if (!open && routeQuery.query.mode === 'chat') {
    const query = typeof routeQuery.query.vibe === 'string' ? { vibe: routeQuery.query.vibe } : {}
    router.replace({ path: '/map', query })
  }
})
</script>

<template>
  <main class="relative h-dvh min-h-[620px] overflow-hidden bg-[#efefec]">
    <MapCanvas
      ref="mapCanvas"
      :places="visiblePlaces"
      :selected-ids="selectedIds"
      :route="walkingRoute"
      @select="togglePlace"
      @location="onLocation"
      @location-error="onLocationError"
    />

    <div class="pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-[max(12px,env(safe-area-inset-top))] sm:px-5 sm:pt-5">
      <div class="pointer-events-auto mx-auto flex max-w-[760px] items-center gap-2">
        <button
          type="button"
          aria-label="Back to previous page"
          class="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/90 bg-white/95 text-[#24242a] shadow-[0_3px_12px_rgba(24,24,28,0.12)] transition hover:bg-[#f8f8fa]"
          @click="goBack"
        >
          <ArrowLeft :size="15" :stroke-width="2" />
        </button>

        <form class="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full border border-white/90 bg-white/95 px-3.5 shadow-[0_3px_12px_rgba(24,24,28,0.12)] backdrop-blur-md sm:max-w-[420px]" @submit.prevent="openChat">
          <Search :size="15" class="shrink-0 text-[#24242a]" />
          <input v-model="search" aria-label="Search or ask" placeholder="Search or just ask" class="h-full min-w-0 flex-1 bg-transparent text-[11px] font-medium text-[#24242a] outline-none placeholder:text-[#777780]" />
        </form>

        <button
          type="button"
          aria-label="Show my current location"
          :disabled="locationPending"
          class="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white bg-white text-[#19191e] shadow-[0_3px_12px_rgba(24,24,28,0.12)] transition hover:bg-[#f8f8fa] disabled:opacity-60"
          @click="requestLocation"
        >
          <Navigation :size="16" :stroke-width="2" :class="locationPending ? 'animate-pulse' : ''" />
        </button>
      </div>

      <div class="pointer-events-auto mx-auto mt-2 max-w-[760px]">
        <MapFilters :active="activeFilters" @toggle="toggleFilter" />
      </div>
    </div>

    <div v-if="!chatOpen && !plannerOpen" class="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-5 sm:pb-6">
      <WalkBuilderSheet
        :selected-places="selectedPlaces"
        :location-ready="Boolean(userLocation)"
        :recommendations-loading="recommendationsLoading"
        :route-ready="Boolean(walkingRoute)"
        @ask="openChat"
        @plan="plannerOpen = true"
        @locate="requestLocation"
      />
    </div>

    <div
      v-if="locationError || recommendationsError"
      role="status"
      class="pointer-events-none absolute left-4 right-4 top-[132px] z-30 mx-auto max-w-[390px] rounded-[16px] border border-white bg-white/95 px-3.5 py-2.5 text-center text-[10px] leading-relaxed text-[#686873] shadow-[0_4px_14px_rgba(28,28,33,0.12)]"
    >
      {{ locationError || recommendationsError }}
    </div>

    <MapChatModal v-model="chatOpen" :initial-prompt="search" @save="saveVibe" />
    <WalkPlanModal
      v-model="plannerOpen"
      :selected-places="selectedPlaces"
      :location-ready="Boolean(userLocation)"
      :location-pending="locationPending"
      :route-distance="routeDistance"
      :route-duration="routeDuration"
      :building="routeBuilding"
      :saving="walkSaving"
      :built="Boolean(walkingRoute)"
      :saved="walkSaved"
      :error="plannerError"
      @build="buildWalk"
      @save="saveWalk"
      @locate="requestLocation"
      @move="moveStop"
      @remove="togglePlace"
      @clear-error="plannerError = ''"
    />

    <div v-if="recommendationLocation" class="pointer-events-none absolute left-4 top-[92px] z-10 rounded-full border border-white/90 bg-white/85 px-3 py-1.5 text-[9px] font-semibold text-[#585861] shadow-sm backdrop-blur">
      {{ recommendationPersonalized ? 'Picked for your taste · ' : 'Around ' }}{{ recommendationLocation }}
    </div>
  </main>
</template>
