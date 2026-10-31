<script setup lang="ts">
import 'mapbox-gl/dist/mapbox-gl.css'
import type {
  GeoJSONSource as MapboxGeoJSONSource,
  Map as MapboxMap,
  Marker as MapboxMarker
} from 'mapbox-gl'
import type { MapPlace, MapRouteGeometry, UserMapLocation } from '~/types/map'

const props = defineProps<{
  places: MapPlace[]
  selectedIds: string[]
  route: MapRouteGeometry | null
}>()

const emit = defineEmits<{
  select: [place: MapPlace]
  location: [location: UserMapLocation]
  locationError: [message: string]
  ready: []
}>()

const config = useRuntimeConfig()
const accessToken = String(config.public.mapboxToken || '')
const container = ref<HTMLElement | null>(null)
const mapError = ref('')
const mapLoading = ref(true)

let map: MapboxMap | null = null
let mapbox: typeof import('mapbox-gl/esm') | null = null
let userLocationMarker: MapboxMarker | null = null
let markers: MapboxMarker[] = []
let pendingFocusId: string | null = null
let mapLoaded = false
let fittedInitialPlaces = false
let hasLocatedUser = false

function routeFeatureCollection() {
  return {
    type: 'FeatureCollection' as const,
    features: props.route
      ? [{ type: 'Feature' as const, properties: {}, geometry: props.route }]
      : []
  }
}

function validPlaces() {
  return props.places.filter(place =>
    Number.isFinite(place.latitude) &&
    Number.isFinite(place.longitude) &&
    place.latitude >= -90 &&
    place.latitude <= 90 &&
    place.longitude >= -180 &&
    place.longitude <= 180
  )
}

function syncMarkers() {
  if (!map || !mapbox || !mapLoaded) return

  markers.forEach(marker => marker.remove())
  markers = []

  for (const place of validPlaces()) {
    const selected = props.selectedIds.includes(place.id)
    const element = document.createElement('button')
    element.type = 'button'
    element.className = selected ? 'out-map-marker is-selected' : 'out-map-marker'
    element.setAttribute('aria-label', (selected ? 'Remove ' : 'Add ') + place.name + (selected ? ' from walk' : ' to walk'))

    const dot = document.createElement('span')
    dot.className = 'out-map-marker__dot'
    const label = document.createElement('span')
    label.className = 'out-map-marker__label'
    label.textContent = place.name
    element.append(dot, label)
    element.addEventListener('click', () => emit('select', place))

    const marker = new mapbox.Marker({ element, anchor: 'bottom' })
      .setLngLat([place.longitude, place.latitude])
      .addTo(map)
    markers.push(marker)
  }
}

function fitPlaces() {
  if (!map || !mapLoaded || fittedInitialPlaces || hasLocatedUser) return
  const places = validPlaces()
  if (!places.length) return

  fittedInitialPlaces = true
  if (places.length === 1) {
    map.flyTo({
      center: [places[0]!.longitude, places[0]!.latitude],
      zoom: 14,
      duration: 800
    })
    return
  }

  const longitudes = places.map(place => place.longitude)
  const latitudes = places.map(place => place.latitude)
  map.fitBounds(
    [
      [Math.min(...longitudes), Math.min(...latitudes)],
      [Math.max(...longitudes), Math.max(...latitudes)]
    ],
    {
      padding: { top: 120, right: 60, bottom: 250, left: 60 },
      maxZoom: 15,
      duration: 800
    }
  )
}

function syncRoute() {
  if (!map || !mapLoaded) return
  const source = map.getSource('out-walk-route') as MapboxGeoJSONSource | undefined
  source?.setData(routeFeatureCollection())

  if (!props.route || props.route.coordinates.length < 2) return
  const longitudes = props.route.coordinates.map(coordinate => coordinate[0])
  const latitudes = props.route.coordinates.map(coordinate => coordinate[1])
  map.fitBounds(
    [
      [Math.min(...longitudes), Math.min(...latitudes)],
      [Math.max(...longitudes), Math.max(...latitudes)]
    ],
    {
      padding: { top: 120, right: 60, bottom: 250, left: 60 },
      maxZoom: 16,
      duration: 700
    }
  )
}

function focusPlace(id: string) {
  pendingFocusId = id
  if (!map || !mapLoaded) return
  const place = validPlaces().find(item => item.id === id)
  if (!place) return
  map.flyTo({ center: [place.longitude, place.latitude], zoom: 15, duration: 850 })
  pendingFocusId = null
}

function updateUserLocationMarker(location: UserMapLocation) {
  if (!map || !mapbox) return

  if (!userLocationMarker) {
    const element = document.createElement('div')
    element.className = 'out-browser-location-marker'
    element.setAttribute('aria-label', 'Your browser location')
    userLocationMarker = new mapbox.Marker({ element, anchor: 'center' })
      .setLngLat([location.longitude, location.latitude])
      .addTo(map)
    return
  }

  userLocationMarker.setLngLat([location.longitude, location.latitude])
}

function locateUser() {
  if (!map || !mapLoaded) {
    emit('locationError', 'The map is still loading. Please try again in a moment.')
    return
  }

  if (!navigator.geolocation) {
    emit('locationError', 'This browser does not support location access. Try a browser with geolocation enabled.')
    return
  }

  navigator.geolocation.getCurrentPosition(
    position => {
      if (!map || !mapLoaded) return

      const location: UserMapLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      }

      hasLocatedUser = true
      updateUserLocationMarker(location)
      map.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 15,
        duration: 900,
        essential: true
      })
      emit('location', location)
    },
    error => {
      const message = error.code === 1
        ? 'Location access was blocked. Allow location for Out in your browser site settings, then try again.'
        : error.code === 2
          ? 'Your browser could not determine your current location. Check your device location settings.'
          : 'The browser location request timed out. Please try again.'
      emit('locationError', message)
    },
    {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 30_000
    }
  )
}

defineExpose({ locateUser, focusPlace })

watch(() => props.places, () => {
  if (!mapLoaded) return
  syncMarkers()
  fitPlaces()
  if (pendingFocusId) focusPlace(pendingFocusId)
}, { deep: true })

watch(() => props.selectedIds, () => {
  syncMarkers()
}, { deep: true })

watch(() => props.route, () => {
  syncRoute()
}, { deep: true })

onMounted(async () => {
  if (!accessToken) {
    mapLoading.value = false
    mapError.value = 'Add a public Mapbox token (pk…) as NUXT_PUBLIC_MAPBOX_TOKEN to render the map.'
    return
  }

  try {
    mapbox = await import('mapbox-gl/esm')
    if (!container.value) return

    map = new mapbox.Map({
      accessToken,
      container: container.value,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [0, 20],
      zoom: 3.5,
      attributionControl: true,
      logoPosition: 'bottom-left'
    })

    map.on('load', () => {
      if (!map || !mapbox) return
      mapLoaded = true
      mapLoading.value = false

      map.addControl(new mapbox.NavigationControl({ showCompass: false }), 'bottom-right')

      map.addSource('out-walk-route', {
        type: 'geojson',
        data: routeFeatureCollection()
      })

      map.addLayer({
        id: 'out-walk-route-casing',
        type: 'line',
        source: 'out-walk-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#ffffff',
          'line-width': 9,
          'line-opacity': 0.94
        }
      })

      map.addLayer({
        id: 'out-walk-route-line',
        type: 'line',
        source: 'out-walk-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#7659d6',
          'line-width': 5,
          'line-opacity': 0.96
        }
      })

      syncMarkers()
      fitPlaces()
      syncRoute()
      if (pendingFocusId) focusPlace(pendingFocusId)
      emit('ready')
    })

    map.on('error', event => {
      const message = event.error?.message || ''
      if (/access token|unauthorized|not authorized|forbidden/i.test(message)) {
        mapError.value = 'Mapbox could not authorize the map. Check the public token and its URL restrictions.'
      }
    })
  } catch (error) {
    console.error('Could not initialize Mapbox GL JS', error)
    mapLoading.value = false
    mapError.value = 'The map could not be initialized in this browser.'
  }
})

onBeforeUnmount(() => {
  markers.forEach(marker => marker.remove())
  markers = []
  userLocationMarker?.remove()
  userLocationMarker = null
  map?.remove()
  map = null
  mapLoaded = false
})
</script>

<template>
  <div class="absolute inset-0 overflow-hidden bg-[#efefec]" aria-label="Interactive map">
    <div ref="container" class="absolute inset-0 h-full w-full" />

    <div
      v-if="mapError"
      role="status"
      class="absolute inset-x-4 top-24 z-10 mx-auto max-w-[380px] rounded-[18px] border border-white bg-white/95 px-4 py-3 text-center text-[11px] leading-relaxed text-[#55555d] shadow-[0_4px_16px_rgba(24,24,28,0.12)]"
    >
      {{ mapError }}
    </div>

    <div
      v-else-if="mapLoading"
      class="absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 text-center text-[11px] font-medium text-[#777780]"
    >
      Loading map…
    </div>
  </div>
</template>

<style>
.out-browser-location-marker {
  width: 18px;
  height: 18px;
  border: 4px solid #ffffff;
  border-radius: 9999px;
  background: #347de1;
  box-shadow: 0 0 0 6px rgb(52 125 225 / 18%), 0 2px 8px rgb(20 20 28 / 28%);
}

.out-map-marker {
  display: flex;
  max-width: 180px;
  align-items: center;
  gap: 6px;
  border: 0;
  padding: 0;
  background: transparent;
  color: #25252c;
  cursor: pointer;
  text-align: left;
}

.out-map-marker__dot {
  display: block;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  border: 3px solid #fff;
  border-radius: 999px;
  background: #9b91dc;
  box-shadow: 0 2px 8px rgb(20 20 28 / 22%);
}

.out-map-marker__label {
  max-width: 132px;
  overflow: hidden;
  border-radius: 999px;
  padding: 4px 8px;
  background: rgb(255 255 255 / 94%);
  box-shadow: 0 2px 8px rgb(20 20 28 / 14%);
  font: 600 10px/1.25 Geist, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.out-map-marker.is-selected .out-map-marker__dot {
  background: #7659d6;
  box-shadow: 0 0 0 3px rgb(118 89 214 / 22%), 0 2px 8px rgb(20 20 28 / 22%);
}

.out-map-marker.is-selected .out-map-marker__label {
  background: #19191e;
  color: white;
}

.out-map-marker:focus-visible {
  border-radius: 999px;
  outline: 3px solid rgb(118 89 214 / 45%);
  outline-offset: 3px;
}
</style>
