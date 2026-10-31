<script setup lang="ts">
import { ArrowLeft, Bookmark, Check, Footprints, MapPin, Pencil, Save, Trash2 } from '@lucide/vue'
import { authClient } from '~/lib/auth-client'

type WalkStop = {
  id: string
  placeId: string | null
  position: number
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  notes: string | null
  durationMinutes: number | null
  imageUrl: string | null
}
type WalkDetail = {
  id: string
  title: string
  description: string | null
  durationMinutes: number | null
  distanceMeters: number | null
  visibility: 'private' | 'public'
  createdAt: string
  updatedAt: string
  isOwner: boolean
  stops: WalkStop[]
}
type DirectionsResponse = {
  route: { distance: number; duration: number }
}
type SavedItem = {
  id: string
  itemType: 'place' | 'walk'
  item: { id: string }
}

const route = useRoute()
const router = useRouter()
const authSession = authClient.useSession()
const walk = ref<WalkDetail | null>(null)
const savedItem = ref<SavedItem | null>(null)
const title = ref('')
const description = ref('')
const visibility = ref<'private' | 'public'>('private')
const stops = ref<WalkStop[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const savePending = ref(false)
const editing = ref(false)
const error = ref('')
const notice = ref('')
const walkId = computed(() => String(route.params.id || ''))

useHead({ title: 'Walk — Out' })

const coverImage = computed(() => walk.value?.stops.find(stop => stop.imageUrl)?.imageUrl || null)
const isOwner = computed(() => Boolean(walk.value?.isOwner))
const saved = computed(() => Boolean(savedItem.value))
const destinationCount = computed(() => walk.value?.stops.filter(stop => stop.placeId).length ?? walk.value?.stops.length ?? 0)

function formatDuration(minutes: number | null) {
  if (!minutes) return 'Time not set'
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return hours ? hours + ' hr' + (remainder ? ' ' + remainder + ' min' : '') : minutes + ' min'
}
function formatDistance(meters: number | null) {
  if (!meters) return null
  return meters >= 1000 ? (meters / 1000).toFixed(1) + ' km' : Math.round(meters) + ' m'
}
function copyWalk(value: WalkDetail) {
  walk.value = value
  title.value = value.title
  description.value = value.description || ''
  visibility.value = value.visibility
  stops.value = value.stops.map(stop => ({ ...stop }))
}

async function loadWalk() {
  loading.value = true
  error.value = ''
  try {
    const [response, savedResponse] = await Promise.all([
      $fetch<{ walk: WalkDetail }>('/api/walks/' + walkId.value),
      $fetch<{ items: SavedItem[] }>('/api/saved-items')
    ])
    copyWalk(response.walk)
    savedItem.value = savedResponse.items.find(item => item.itemType === 'walk' && item.item.id === walkId.value) || null
  } catch (cause) {
    const value = cause as { data?: { statusMessage?: string }; statusMessage?: string }
    error.value = value?.data?.statusMessage || 'This walk could not be loaded.'
  } finally {
    loading.value = false
  }
}

watch(() => [authSession.value.data?.user?.id, walkId.value] as const, ([userId, id]) => {
  if (userId && id) {
    void loadWalk()
  } else if (!authSession.value.isPending) {
    loading.value = false
    walk.value = null
    stops.value = []
    savedItem.value = null
    error.value = 'Sign in to view this walk.'
  }
}, { immediate: true })

function moveStop(index: number, direction: -1 | 1) {
  const next = index + direction
  if (next < 0 || next >= stops.value.length) return
  const updated = [...stops.value]
  const [item] = updated.splice(index, 1)
  updated.splice(next, 0, item!)
  stops.value = updated.map((stop, position) => ({ ...stop, position }))
}

function removeStop(index: number) {
  stops.value = stops.value.filter((_, stopIndex) => stopIndex !== index).map((stop, position) => ({ ...stop, position }))
}

function cancelEditing() {
  if (walk.value) copyWalk(walk.value)
  editing.value = false
  error.value = ''
}

async function saveChanges() {
  if (!walk.value || !isOwner.value) return
  if (!title.value.trim()) {
    error.value = 'Give your walk a title before saving.'
    return
  }
  saving.value = true
  error.value = ''
  notice.value = ''
  try {
    const originalOrder = walk.value.stops.map(stop => stop.id).join('|')
    const updatedOrder = stops.value.map(stop => stop.id).join('|')
    const routeChanged = originalOrder !== updatedOrder
    let durationMinutes = walk.value.durationMinutes
    let distanceMeters = walk.value.distanceMeters
    let routeStatsRefreshed = true

    if (routeChanged) {
      durationMinutes = null
      distanceMeters = null
      const coordinates = stops.value.flatMap(stop =>
        typeof stop.latitude === 'number' && typeof stop.longitude === 'number'
          ? [{ latitude: stop.latitude, longitude: stop.longitude }]
          : []
      )
      if (coordinates.length >= 2) {
        try {
          const routeResponse = await $fetch<DirectionsResponse>('/api/mapbox/directions', {
            method: 'POST',
            body: { coordinates }
          })
          durationMinutes = Math.max(1, Math.ceil(routeResponse.route.duration / 60))
          distanceMeters = Math.max(1, Math.round(routeResponse.route.distance))
        } catch {
          routeStatsRefreshed = false
        }
      } else {
        routeStatsRefreshed = false
      }
    }

    const response = await $fetch<{ walk: WalkDetail }>('/api/walks/' + walkId.value, {
      method: 'PUT',
      body: {
        title: title.value.trim(),
        description: description.value.trim() || null,
        durationMinutes,
        distanceMeters,
        visibility: visibility.value,
        stops: stops.value.map(stop => ({
          placeId: stop.placeId,
          name: stop.name,
          address: stop.address,
          latitude: stop.latitude,
          longitude: stop.longitude,
          notes: stop.notes,
          durationMinutes: stop.durationMinutes
        }))
      }
    })
    copyWalk(response.walk)
    editing.value = false
    notice.value = routeChanged && !routeStatsRefreshed
      ? 'Your walk was updated. Route distance and time need to be recalculated on the map.'
      : 'Your walk has been updated.'
  } catch (cause) {
    const value = cause as { data?: { statusMessage?: string }; statusMessage?: string }
    error.value = value?.data?.statusMessage || 'Your walk could not be updated.'
  } finally {
    saving.value = false
  }
}

async function deleteWalk() {
  if (!walk.value || !isOwner.value || !window.confirm('Delete this walk? This cannot be undone.')) return
  deleting.value = true
  error.value = ''
  try {
    await $fetch('/api/walks/' + walkId.value, { method: 'DELETE' })
    await router.replace('/walks')
  } catch {
    error.value = 'This walk could not be deleted.'
  } finally {
    deleting.value = false
  }
}

async function toggleSaved() {
  if (!walk.value || isOwner.value || savePending.value) return
  savePending.value = true
  error.value = ''
  try {
    if (savedItem.value) {
      await $fetch('/api/saved-items/' + savedItem.value.id, { method: 'DELETE' })
      savedItem.value = null
      notice.value = 'Removed from your saved walks.'
    } else {
      const response = await $fetch<{ savedItem: { id: string; itemType: 'walk'; createdAt: string } }>('/api/saved-items', {
        method: 'POST',
        body: { itemType: 'walk', itemId: walkId.value }
      })
      savedItem.value = { id: response.savedItem.id, itemType: 'walk', item: { id: walkId.value } }
      notice.value = 'Saved to your walks.'
    }
  } catch {
    error.value = 'This walk could not be updated in your saved list.'
  } finally {
    savePending.value = false
  }
}

function openInMap() {
  router.push({ path: '/map', query: { walk: walkId.value } })
}
</script>

<template>
  <main class="min-h-dvh bg-[radial-gradient(ellipse_at_50%_0%,#e4e6fb_0%,#eef0fc_42%,#f8f8fc_78%,#fafafd_100%)] px-4 pb-28 pt-5 sm:px-7 sm:pt-8">
    <div class="mx-auto max-w-[820px]">
      <header class="mb-6 flex items-center justify-between gap-3">
        <NuxtLink to="/walks" class="inline-flex h-9 items-center gap-2 rounded-full px-2 text-[11px] font-semibold text-[#4c4c55] transition hover:bg-white/70"><ArrowLeft :size="15" /> Walks</NuxtLink>
        <button v-if="walk && !isOwner" type="button" :disabled="savePending" class="inline-flex h-9 items-center gap-2 rounded-full border border-white bg-white/85 px-3.5 text-[10px] font-semibold text-[#34343c] shadow-sm disabled:opacity-50" @click="toggleSaved"><Bookmark :size="13" />{{ savePending ? 'Saving…' : saved ? 'Saved' : 'Save walk' }}</button>
        <button v-else-if="walk && isOwner && !editing" type="button" class="inline-flex h-9 items-center gap-2 rounded-full bg-gradient-to-b from-[#303036] to-[#151519] px-3.5 text-[12px] font-semibold text-white shadow-sm" @click="editing = true"><Pencil :size="13" /> Edit walk</button>
      </header>

      <section v-if="loading" class="rounded-[24px] border border-white bg-white/80 px-6 py-14 text-center text-[11px] text-[#777780]">Loading walk…</section>
      <section v-else-if="error && !walk" class="rounded-[24px] border border-white bg-white/80 px-6 py-12 text-center">
        <h1 class="text-[16px] font-bold text-[#222228]">Walk unavailable</h1>
        <p class="mt-2 text-[11px] text-[#777780]">{{ error }}</p>
        <NuxtLink to="/walks" class="mt-4 inline-flex text-[10px] font-semibold text-[#24242a] underline">Back to walks</NuxtLink>
      </section>
      <template v-else-if="walk">
        <div class="overflow-hidden rounded-[26px] border border-white/90 bg-white/90 shadow-[0_12px_35px_rgba(35,35,55,0.07)]">
          <div class="relative h-[190px] overflow-hidden bg-[#77738e] sm:h-[250px]">
            <img v-if="coverImage" :src="coverImage" :alt="walk.title" class="h-full w-full object-cover">
            <div v-else class="h-full w-full bg-[radial-gradient(ellipse_at_25%_15%,#aaa4d1_0%,#65617d_48%,#292932_100%)]"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent"></div>
            <span class="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[9px] font-semibold text-[#292930]">{{ walk.visibility === 'public' ? 'Public walk' : 'Private walk' }}</span>
            <div class="absolute inset-x-5 bottom-4">
              <h1 class="unmodified-font-san text-[27px] font-bold leading-tight tracking-[-0.06em] text-white sm:text-[34px]">{{ walk.title }}</h1>
              <p class="mt-1 text-[10px] font-medium text-white/85">{{ destinationCount }} {{ destinationCount === 1 ? 'stop' : 'stops' }}<span v-if="walk.durationMinutes"> · {{ formatDuration(walk.durationMinutes) }}</span><span v-if="formatDistance(walk.distanceMeters)"> · {{ formatDistance(walk.distanceMeters) }}</span></p>
            </div>
          </div>

          <div class="p-5 sm:p-7">
            <div v-if="notice" role="status" class="mb-4 flex items-center gap-2 rounded-[14px] bg-[#f0effb] px-3 py-2.5 text-[10px] font-medium text-[#6854b4]"><Check :size="13" />{{ notice }}</div>
            <div v-if="error" role="alert" class="mb-4 rounded-[14px] bg-[#fff5f4] px-3 py-2.5 text-[10px] text-[#a34b46]">{{ error }}</div>

            <form v-if="editing" class="mb-6 space-y-4" @submit.prevent="saveChanges">
              <label class="block"><span class="text-[10px] font-semibold text-[#42424a]">Walk title</span><input v-model="title" maxlength="120" required class="mt-1.5 h-10 w-full rounded-xl border border-[#e7e7eb] bg-[#fbfbfc] px-3 text-[12px] text-[#202027] outline-none focus:border-[#777780] focus:bg-white"></label>
              <label class="block"><span class="text-[10px] font-semibold text-[#42424a]">Description</span><textarea v-model="description" rows="3" maxlength="1200" class="mt-1.5 w-full rounded-xl border border-[#e7e7eb] bg-[#fbfbfc] px-3 py-2.5 text-[11px] leading-relaxed text-[#202027] outline-none focus:border-[#777780] focus:bg-white"></textarea></label>
              <label class="block"><span class="text-[10px] font-semibold text-[#42424a]">Who can see this walk?</span><select v-model="visibility" class="mt-1.5 h-10 w-full rounded-xl border border-[#e7e7eb] bg-[#fbfbfc] px-3 text-[11px] text-[#202027] outline-none focus:border-[#777780]"><option value="private">Only me</option><option value="public">Everyone on Out</option></select></label>
            </form>
            <p v-else-if="walk.description" class="mb-6 text-[12px] leading-[1.8] text-[#66666f]">{{ walk.description }}</p>

            <div class="mb-3 flex items-center justify-between gap-3">
              <h2 class="text-[13px] font-bold tracking-[-0.03em] text-[#202027]">Your route</h2>
              <span class="text-[9px] font-medium text-[#85858d]">{{ stops.length }} stops</span>
            </div>
            <ol class="space-y-2">
              <li v-for="(stop, index) in stops" :key="stop.id" class="flex items-center gap-3 rounded-[16px] border border-[#eeeeF2] bg-[#fafafd] px-3 py-3">
                <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f0effb] text-[10px] font-bold text-[#6854b4]">{{ index + 1 }}</span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-[11px] font-semibold text-[#292930]">{{ stop.name }}</p>
                  <p class="mt-0.5 truncate text-[9px] text-[#85858d]">{{ stop.address || (stop.placeId ? 'Place on your route' : 'Starting point') }}</p>
                  <p v-if="stop.notes && !editing" class="mt-1 text-[9px] leading-relaxed text-[#777780]">{{ stop.notes }}</p>
                </div>
                <div v-if="editing" class="flex shrink-0 items-center gap-1">
                  <button type="button" :disabled="index === 0" :aria-label="'Move ' + stop.name + ' up'" class="grid h-7 w-7 place-items-center rounded-full text-[12px] text-[#686873] hover:bg-white disabled:opacity-25" @click="moveStop(index, -1)">↑</button>
                  <button type="button" :disabled="index === stops.length - 1" :aria-label="'Move ' + stop.name + ' down'" class="grid h-7 w-7 place-items-center rounded-full text-[12px] text-[#686873] hover:bg-white disabled:opacity-25" @click="moveStop(index, 1)">↓</button>
                  <button type="button" :aria-label="'Remove ' + stop.name" class="grid h-7 w-7 place-items-center rounded-full text-[14px] text-[#a34b46] hover:bg-white" @click="removeStop(index)">×</button>
                </div>
                <span v-else-if="stop.latitude !== null && stop.longitude !== null" class="shrink-0 text-[#a0a0a8]"><MapPin :size="13" /></span>
              </li>
            </ol>

            <div class="mt-6 flex flex-wrap items-center gap-2">
              <button type="button" class="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-b from-[#303036] to-[#151519] px-5 text-[12px] font-semibold text-white shadow-[0_4px_12px_rgba(22,22,27,0.16)]" @click="openInMap"><Footprints :size="13" /> Open on map</button>
              <template v-if="editing">
                <button type="button" class="inline-flex h-10 items-center rounded-full border border-[#e4e4e9] bg-white px-4 text-[10px] font-semibold text-[#55555d]" @click="cancelEditing">Cancel</button>
                <button type="button" :disabled="saving" class="ml-auto inline-flex h-10 items-center gap-2 rounded-full bg-[#7659d6] px-5 text-[10px] font-semibold text-white disabled:opacity-50" @click="saveChanges"><Save :size="12" />{{ saving ? 'Saving…' : 'Save changes' }}</button>
              </template>
              <button v-else-if="isOwner" type="button" :disabled="deleting" class="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[9px] font-semibold text-[#a34b46] transition hover:bg-[#fff5f4] disabled:opacity-50" @click="deleteWalk"><Trash2 :size="12" />{{ deleting ? 'Deleting…' : 'Delete walk' }}</button>
            </div>
          </div>
        </div>
      </template>
    </div>
    <BottomNavigation active="walks" />
  </main>
</template>