<script setup lang="ts">
import { ArrowLeft, Bookmark, Footprints, Plus, Search } from '@lucide/vue'
import { authClient } from '~/lib/auth-client'

type WalkSummary = {
  id: string
  title: string
  description: string | null
  durationMinutes: number | null
  distanceMeters: number | null
  visibility: 'private' | 'public'
  createdAt: string
  updatedAt: string
  stopCount: number
  firstStopName: string | null
  imageUrl: string | null
  isOwner: boolean
}
type SavedItem = {
  id: string
  itemType: 'place' | 'walk'
  item: { id: string; title?: string; name?: string }
}

const authSession = authClient.useSession()
const router = useRouter()
const walks = ref<WalkSummary[]>([])
const savedItems = ref<SavedItem[]>([])
const search = ref('')
const activeTab = ref<'all' | 'mine' | 'saved'>('all')
const loading = ref(false)
const savingId = ref('')
const error = ref('')
let requestId = 0

useHead({ title: 'Your walks — Out' })

const tabs = [{ id: 'all', label: 'All walks' }, { id: 'mine', label: 'Created by me' }, { id: 'saved', label: 'Saved' }] as const

const savedWalks = computed(() => {
  const ids = new Set(savedItems.value.filter(item => item.itemType === 'walk').map(item => item.item.id))
  return walks.value.filter(walk => ids.has(walk.id))
})
const visibleWalks = computed(() => {
  if (activeTab.value === 'mine') return walks.value.filter(walk => walk.isOwner)
  if (activeTab.value === 'saved') return savedWalks.value
  return walks.value
})

function formatDuration(minutes: number | null) {
  if (!minutes) return 'Time not set'
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return hours ? hours + ' hr' + (remainder ? ' ' + remainder + ' min' : '') : minutes + ' min'
}
function formatDistance(meters: number | null) {
  if (!meters) return ''
  return meters >= 1000 ? (meters / 1000).toFixed(1) + ' km' : Math.round(meters) + ' m'
}
function savedItemFor(walkId: string) {
  return savedItems.value.find(item => item.itemType === 'walk' && item.item.id === walkId)
}

async function loadWalks() {
  const id = ++requestId
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({ limit: '50' })
    if (search.value.trim()) params.set('q', search.value.trim())
    const [walkResponse, savedResponse] = await Promise.all([
      $fetch<{ items: WalkSummary[] }>('/api/walks?' + params.toString()),
      $fetch<{ items: SavedItem[] }>('/api/saved-items')
    ])
    if (id !== requestId) return
    walks.value = walkResponse.items
    savedItems.value = savedResponse.items
  } catch {
    if (id !== requestId) return
    error.value = 'Your walks could not be loaded. Please try again.'
  } finally {
    if (id === requestId) loading.value = false
  }
}

watch(() => authSession.value.data?.user?.id, userId => {
  if (userId) void loadWalks()
  else {
    requestId++
    walks.value = []
    savedItems.value = []
    loading.value = false
  }
}, { immediate: true })

async function saveWalk(walk: WalkSummary) {
  savingId.value = walk.id
  error.value = ''
  try {
    await $fetch('/api/saved-items', { method: 'POST', body: { itemType: 'walk', itemId: walk.id } })
    await loadWalks()
  } catch {
    error.value = 'This walk could not be saved. Please try again.'
  } finally {
    savingId.value = ''
  }
}

function openWalk(id: string) {
  router.push('/walks/' + id)
}
</script>

<template>
  <main class="min-h-dvh bg-[radial-gradient(ellipse_at_50%_0%,#e4e6fb_0%,#eef0fc_42%,#f8f8fc_78%,#fafafd_100%)] px-4 pb-28 pt-5 sm:px-7 sm:pt-8">
    <div class="mx-auto max-w-[960px]">
      <header class="mb-7 flex items-center justify-between gap-3">
        <NuxtLink to="/" class="inline-flex h-9 items-center gap-2 rounded-full px-2 text-[11px] font-semibold text-[#4c4c55] transition hover:bg-white/70"><ArrowLeft :size="15" /> Explore</NuxtLink>
        <NuxtLink to="/map" class="inline-flex h-9 items-center gap-2 rounded-full bg-gradient-to-b from-[#303036] to-[#151519] px-4 text-[12px] font-semibold text-white shadow-[0_4px_12px_rgba(22,22,27,0.16)]"><Plus :size="13" /> Build a walk</NuxtLink>
      </header>

      <div class="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#777780]">Your routes</p>
          <h1 class="unmodified-font-san mt-1 text-[30px] font-bold tracking-[-0.06em] text-[#19191e] sm:text-[34px]">Walks</h1>
          <p class="mt-1.5 text-[12px] leading-relaxed text-[#777780]">The routes you make, save and find along the way.</p>
        </div>
        <label class="flex h-10 w-full items-center gap-2 rounded-full border border-white bg-white/90 px-3.5 shadow-[0_3px_12px_rgba(24,24,28,0.06)] sm:max-w-[260px]">
          <Search :size="14" class="text-[#777780]" />
          <input v-model="search" aria-label="Search walks" placeholder="Find a walk" class="min-w-0 flex-1 bg-transparent text-[11px] text-[#24242a] outline-none placeholder:text-[#9999a1]" @keydown.enter="loadWalks">
          <button v-if="search" type="button" aria-label="Clear search" class="text-[10px] text-[#777780]" @click="search = ''; loadWalks()">Clear</button>
        </label>
      </div>

      <section v-if="authSession.isPending" class="rounded-[22px] border border-white bg-white/80 px-5 py-10 text-center text-[11px] text-[#777780]">Loading your walks…</section>
      <section v-else-if="!authSession.data?.user" class="rounded-[24px] border border-white/90 bg-white/80 px-6 py-10 text-center shadow-[0_8px_24px_rgba(35,35,55,0.05)]">
        <Footprints :size="25" class="mx-auto text-[#777780]" />
        <h2 class="mt-3 text-[17px] font-bold tracking-[-0.04em] text-[#202027]">Your walks live here.</h2>
        <p class="mx-auto mt-2 max-w-[300px] text-[11px] leading-relaxed text-[#777780]">Sign in to create, edit and save routes.</p>
        <NuxtLink to="/signin" class="mt-4 inline-flex h-10 items-center rounded-full bg-gradient-to-b from-[#303036] to-[#151519] px-6 text-[13px] font-semibold text-white">Sign in</NuxtLink>
      </section>
      <template v-else>
        <div class="mb-5 flex items-center gap-1.5 rounded-full border border-white/90 bg-white/65 p-1" role="tablist" aria-label="Walk library">
          <button v-for="tab in tabs" :key="tab.id" type="button" role="tab" :aria-selected="activeTab === tab.id" class="h-8 flex-1 rounded-full px-3 text-[10px] font-semibold transition" :class="activeTab === tab.id ? 'bg-gradient-to-b from-[#303036] to-[#151519] text-white shadow-sm' : 'text-[#686873] hover:text-[#222228]'" @click="activeTab = tab.id">{{ tab.label }}</button>
        </div>

        <div v-if="error" role="alert" class="mb-4 rounded-[16px] bg-[#fff5f4] px-4 py-3 text-[10px] text-[#a34b46]">{{ error }}</div>
        <div v-if="loading" class="grid gap-3 sm:grid-cols-2">
          <div v-for="item in 4" :key="item" class="h-[132px] animate-pulse rounded-[21px] border border-white bg-white/70"></div>
        </div>
        <div v-else-if="visibleWalks.length" class="grid gap-3 sm:grid-cols-2">
          <article v-for="walk in visibleWalks" :key="walk.id" class="flex min-w-0 gap-3 rounded-[21px] border border-white/90 bg-white/90 p-3 shadow-[0_5px_17px_rgba(36,36,51,0.06)]">
            <NuxtLink :to="'/walks/' + walk.id" class="relative h-[108px] w-[104px] shrink-0 overflow-hidden rounded-[16px] bg-[#77738e]" :aria-label="'Open ' + walk.title">
              <img v-if="walk.imageUrl" :src="walk.imageUrl" :alt="walk.title" class="h-full w-full object-cover">
              <div v-else class="h-full w-full bg-[radial-gradient(ellipse_at_25%_15%,#aaa4d1_0%,#65617d_48%,#292932_100%)]"></div>
            </button>
            <div class="flex min-w-0 flex-1 flex-col py-0.5">
              <div class="mb-1 flex items-center gap-1.5">
                <span class="rounded-full px-2 py-1 text-[8px] font-semibold" :class="walk.isOwner ? 'bg-[#f0effb] text-[#6854b4]' : 'bg-[#f1f1f4] text-[#686873]'">{{ walk.isOwner ? 'Your walk' : walk.visibility === 'public' ? 'Community' : 'Saved' }}</span>
                <span v-if="walk.isOwner" class="ml-auto inline-flex items-center rounded-full bg-[#f1f1f4] px-2 py-1 text-[8px] font-semibold text-[#686873]">{{ walk.visibility }}</span>
              </div>
              <button type="button" class="truncate text-left text-[13px] font-bold tracking-[-0.035em] text-[#202027]" @click="openWalk(walk.id)">{{ walk.title }}</button>
              <p class="mt-1 truncate text-[9px] text-[#777780]">{{ walk.firstStopName || walk.description || 'A route on Out' }}</p>
              <div class="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-[9px] font-medium text-[#686873]">
                <span>{{ walk.stopCount }} {{ walk.stopCount === 1 ? 'stop' : 'stops' }}</span>
                <span v-if="walk.durationMinutes">{{ formatDuration(walk.durationMinutes) }}</span>
                <span v-if="walk.distanceMeters">{{ formatDistance(walk.distanceMeters) }}</span>
              </div>
              <div class="mt-2 flex items-center gap-2">
                <button type="button" class="text-[9px] font-semibold text-[#24242a] underline underline-offset-2" @click="openWalk(walk.id)">View walk</button>
                <button v-if="!walk.isOwner && !savedItemFor(walk.id)" type="button" :disabled="savingId === walk.id" class="ml-auto inline-flex items-center gap-1 rounded-full bg-gradient-to-b from-[#303036] to-[#151519] px-2.5 py-1.5 text-[10px] font-semibold text-white disabled:opacity-50" @click="saveWalk(walk)"><Bookmark :size="10" />{{ savingId === walk.id ? 'Saving' : 'Save' }}</button>
                <span v-else-if="!walk.isOwner" class="ml-auto inline-flex items-center rounded-full bg-[#f0effb] px-2.5 py-1.5 text-[9px] font-semibold text-[#6854b4]">Saved</span>
              </div>
            </div>
          </article>
        </div>
        <div v-else class="rounded-[22px] border border-white/90 bg-white/75 px-5 py-10 text-center">
          <Footprints :size="24" class="mx-auto text-[#85858d]" />
          <h2 class="mt-3 text-[14px] font-bold text-[#292930]">{{ activeTab === 'mine' ? 'No walks created yet.' : activeTab === 'saved' ? 'No saved walks yet.' : 'No walks found.' }}</h2>
          <p class="mt-1 text-[10px] text-[#777780]">{{ activeTab === 'mine' ? 'Build a route from places on the map and save it here.' : activeTab === 'saved' ? 'Save a public walk to keep it close.' : 'Try a different search or create your first route.' }}</p>
          <NuxtLink v-if="activeTab !== 'saved'" to="/map" class="mt-4 inline-flex h-9 items-center rounded-full bg-gradient-to-b from-[#303036] to-[#151519] px-5 text-[12px] font-semibold text-white">Build a walk</NuxtLink>
        </div>
      </template>
    </div>
    <BottomNavigation active="walks" />
  </main>
</template>