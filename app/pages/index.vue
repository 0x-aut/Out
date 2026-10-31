<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
import { authClient } from '~/lib/auth-client'

type RecommendationItem = {
  id: string
  name: string
  category: string | null
  address: string | null
  city: string | null
  country: string | null
  imageUrl: string | null
}
type RecommendationResponse = {
  status: 'ready' | 'profile_incomplete' | 'no_matches'
  location: string | null
  personalized: boolean
  matchedInterests: string[]
  items: RecommendationItem[]
}
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

const router = useRouter()
const authSession = authClient.useSession()
const recommendationItems = ref<RecommendationItem[]>([])
const recommendationLoading = ref(false)
const recommendationError = ref('')
const recommendationStatus = ref<'idle' | 'loading' | RecommendationResponse['status']>('idle')
const recommendationLocation = ref<string | null>(null)
const recommendationPersonalized = ref(false)
const walks = ref<WalkSummary[]>([])
const savedWalkIds = ref<string[]>([])
const walksLoading = ref(false)
const walksError = ref('')
const vibe = ref('')
let feedRequestId = 0

useHead({ title: 'Explore — Out' })

const ownWalks = computed(() => walks.value.filter(walk => walk.isOwner).slice(0, 6))
const savedWalks = computed(() => {
  const ids = new Set(savedWalkIds.value)
  return walks.value.filter(walk => ids.has(walk.id))
})
const discoverWalks = computed(() => {
  const saved = new Set(savedWalkIds.value)
  return walks.value.filter(walk => !walk.isOwner && !saved.has(walk.id)).slice(0, 8)
})

function formatDuration(minutes: number | null) {
  if (!minutes) return 'Time not set'
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return hours ? hours + ' hr' + (remainder ? ' ' + remainder + ' min' : '') : minutes + ' min'
}
function formatDistance(meters: number | null) {
  if (!meters) return 'Saved walk'
  return meters >= 1000 ? (meters / 1000).toFixed(1) + ' km' : Math.round(meters) + ' m'
}
function toWalkCard(walk: WalkSummary) {
  return {
    id: walk.id,
    title: walk.title,
    duration: formatDuration(walk.durationMinutes),
    stops: walk.stopCount + (walk.stopCount === 1 ? ' stop' : ' stops'),
    distance: walk.firstStopName || formatDistance(walk.distanceMeters),
    image: walk.imageUrl
  }
}

async function loadRecommendations(requestId: number) {
  recommendationLoading.value = true
  recommendationError.value = ''
  recommendationStatus.value = 'loading'
  try {
    const response = await $fetch<RecommendationResponse>('/api/recommendations')
    if (requestId !== feedRequestId) return
    recommendationItems.value = response.items
    recommendationLocation.value = response.location
    recommendationPersonalized.value = response.personalized
    recommendationStatus.value = response.status
  } catch {
    if (requestId !== feedRequestId) return
    recommendationItems.value = []
    recommendationError.value = 'Your picks could not load. Please try again.'
    recommendationStatus.value = 'idle'
  } finally {
    if (requestId === feedRequestId) recommendationLoading.value = false
  }
}

async function loadWalks(requestId: number) {
  walksLoading.value = true
  walksError.value = ''
  try {
    const [walkResponse, savedResponse] = await Promise.all([
      $fetch<{ items: WalkSummary[] }>('/api/walks?limit=30'),
      $fetch<{ items: SavedItem[] }>('/api/saved-items')
    ])
    if (requestId !== feedRequestId) return
    walks.value = walkResponse.items
    savedWalkIds.value = savedResponse.items.filter(item => item.itemType === 'walk').map(item => item.item.id)
  } catch {
    if (requestId !== feedRequestId) return
    walks.value = []
    walksError.value = 'Your walks could not load. Please try again.'
  } finally {
    if (requestId === feedRequestId) walksLoading.value = false
  }
}

function loadFeed() {
  const requestId = ++feedRequestId
  void Promise.all([loadRecommendations(requestId), loadWalks(requestId)])
}

watch(() => authSession.value.data?.user?.id, userId => {
  if (userId) {
    loadFeed()
  } else {
    feedRequestId++
    recommendationItems.value = []
    recommendationLocation.value = null
    recommendationPersonalized.value = false
    recommendationStatus.value = 'idle'
    recommendationLoading.value = false
    walks.value = []
    savedWalkIds.value = []
    walksLoading.value = false
  }
}, { immediate: true })

function startFromVibe() {
  const query = vibe.value.trim()
  router.push({ path: '/map', query: { ...(query ? { vibe: query } : {}), mode: 'chat' } })
}
function openWalk(id: string) { router.push('/walks/' + id) }
function openSpot(id: string) { router.push({ path: '/map', query: { place: id } }) }
function openWalkLibrary() { router.push('/walks') }
</script>

<template>
  <main class="min-h-dvh overflow-hidden bg-[radial-gradient(ellipse_at_50%_0%,#e4e6fb_0%,#eef0fc_42%,#f8f8fc_78%,#fafafd_100%)] pb-24">
    <div class="mx-auto max-w-[1080px] px-4 pb-10 pt-5 sm:px-7 sm:pt-7 lg:px-10 lg:pt-9">
      <header class="mb-5 flex items-center justify-between gap-3 sm:mb-6">
        <div class="min-w-0">
          <h1 class="unmodified-font-san text-[20px] font-bold leading-tight tracking-[-0.055em] text-[#19191e] sm:text-[22px]">
            {{ recommendationLocation ? 'Find your world in ' + recommendationLocation : 'Find your world' }}
          </h1>
          <p class="mt-1 text-[10px] text-[#777780]">A little closer to the things you love.</p>
        </div>
        <NuxtLink to="/profile" aria-label="Your profile" class="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-white bg-gradient-to-b from-[#303036] to-[#151519] text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(20,20,28,0.14)]">
          {{ (authSession.data?.user?.name || 'O').charAt(0).toUpperCase() }}
        </NuxtLink>
      </header>

      <div class="mb-7 sm:mb-8">
        <ExplorePrompt v-model="vibe" @submit="startFromVibe" />
      </div>

      <section v-if="authSession.data?.user" aria-labelledby="for-you-heading" class="mb-8 min-w-0">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 id="for-you-heading" class="unmodified-font-san text-[15px] font-bold tracking-[-0.04em] text-[#202027]">{{ recommendationPersonalized ? 'Picked for your taste' : 'Places around you' }}</h2>
            <p class="mt-0.5 text-[10px] text-[#777780]">{{ recommendationLocation ? 'Around ' + recommendationLocation : 'Based on the things you enjoy' }}</p>
          </div>
          <NuxtLink to="/profile" class="flex h-8 shrink-0 items-center rounded-full px-2 text-[10px] font-semibold text-[#555560] transition hover:bg-white/70">Tune your taste <span aria-hidden="true" class="ml-1">›</span></NuxtLink>
        </div>
        <div v-if="recommendationLoading" class="flex gap-2.5 overflow-hidden">
          <div v-for="item in 3" :key="item" class="h-[218px] min-w-[238px] animate-pulse rounded-[20px] border border-white/90 bg-white/70 sm:min-w-[250px]"></div>
        </div>
        <div v-else-if="recommendationError" class="rounded-[20px] border border-white/90 bg-white/80 px-4 py-4 shadow-[0_4px_14px_rgba(28,28,33,0.04)]">
          <p class="text-[11px] text-[#686873]">{{ recommendationError }}</p>
          <button type="button" class="mt-2 text-[10px] font-semibold text-[#24242a] underline underline-offset-2" @click="loadFeed">Try again</button>
        </div>
        <div v-else-if="recommendationItems.length" class="hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <RecommendationCard v-for="place in recommendationItems" :key="place.id" :place="place" :personalized="recommendationPersonalized" @select="openSpot" />
        </div>
        <div v-else class="rounded-[20px] border border-white/90 bg-white/75 px-4 py-4 shadow-[0_4px_14px_rgba(28,28,33,0.04)]">
          <p class="text-[11px] font-semibold text-[#34343c]">{{ recommendationStatus === 'profile_incomplete' ? 'Add your home base to find places nearby.' : 'No matching places yet.' }}</p>
          <p class="mt-1 text-[10px] leading-relaxed text-[#777780]">{{ recommendationStatus === 'profile_incomplete' ? 'Set a city or neighbourhood in your profile and add a few interests.' : 'Try adding a few more interests or checking your home base.' }}</p>
          <NuxtLink to="/profile" class="mt-2 inline-flex text-[10px] font-semibold text-[#24242a] underline underline-offset-2">Update your profile</NuxtLink>
        </div>
      </section>

      <section v-if="authSession.data?.user" aria-labelledby="your-walks-heading" class="mb-8 min-w-0">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 id="your-walks-heading" class="unmodified-font-san text-[15px] font-bold tracking-[-0.04em] text-[#202027]">Your walks</h2>
            <p class="mt-0.5 text-[10px] text-[#777780]">Routes you have created and saved.</p>
          </div>
          <button type="button" class="flex h-8 shrink-0 items-center rounded-full px-2 text-[10px] font-semibold text-[#555560] transition hover:bg-white/70" @click="openWalkLibrary">See all <span aria-hidden="true" class="ml-1">›</span></button>
        </div>
        <div v-if="walksLoading" class="flex gap-2.5 overflow-hidden">
          <div v-for="item in 3" :key="item" class="h-[190px] min-w-[218px] animate-pulse rounded-[21px] bg-white/70"></div>
        </div>
        <div v-else-if="walksError" class="rounded-[18px] border border-white bg-white/75 px-4 py-4 text-[11px] text-[#686873]">{{ walksError }}</div>
        <div v-else-if="ownWalks.length" class="hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <WalkCard v-for="walk in ownWalks" :key="walk.id" :walk="toWalkCard(walk)" @select="openWalk" />
          <NuxtLink to="/walks" class="flex h-[190px] min-w-[150px] snap-start flex-col items-center justify-center rounded-[21px] border border-dashed border-[#c9c8d7] bg-white/60 px-5 text-center text-[#555560] transition hover:bg-white">
            <span class="mb-2 grid h-9 w-9 place-items-center rounded-full bg-gradient-to-b from-[#303036] to-[#151519] text-[20px] text-white">+</span>
            <span class="text-[11px] font-semibold">All your walks</span>
          </NuxtLink>
        </div>
        <div v-else class="rounded-[20px] border border-white/90 bg-white/75 px-4 py-4">
          <p class="text-[11px] font-semibold text-[#34343c]">Your next walk starts here.</p>
          <p class="mt-1 text-[10px] text-[#777780]">Choose a few places on the map and save your first route.</p>
          <NuxtLink to="/map" class="mt-2 inline-flex text-[10px] font-semibold text-[#24242a] underline underline-offset-2">Build a walk</NuxtLink>
        </div>
      </section>

      <section v-if="authSession.data?.user && savedWalks.length" aria-labelledby="saved-walks-heading" class="mb-8 min-w-0">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 id="saved-walks-heading" class="unmodified-font-san text-[15px] font-bold tracking-[-0.04em] text-[#202027]">Saved for later</h2>
            <p class="mt-0.5 text-[10px] text-[#777780]">Walks you want to come back to.</p>
          </div>
          <button type="button" class="text-[10px] font-semibold text-[#555560]" @click="openWalkLibrary">See all ›</button>
        </div>
        <div class="hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <WalkCard v-for="walk in savedWalks.slice(0, 6)" :key="walk.id" :walk="toWalkCard(walk)" @select="openWalk" />
        </div>
      </section>

      <section v-if="authSession.data?.user" aria-labelledby="discover-walks-heading" class="mb-8 min-w-0">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 id="discover-walks-heading" class="unmodified-font-san text-[15px] font-bold tracking-[-0.04em] text-[#202027]">Walks to discover</h2>
            <p class="mt-0.5 text-[10px] text-[#777780]">Public routes shared by the Out community.</p>
          </div>
          <button type="button" class="text-[10px] font-semibold text-[#555560]" @click="openWalkLibrary">Browse all ›</button>
        </div>
        <div v-if="discoverWalks.length" class="hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <WalkCard v-for="walk in discoverWalks.slice(0, 6)" :key="walk.id" :walk="toWalkCard(walk)" @select="openWalk" />
        </div>
        <div v-else-if="!walksLoading" class="rounded-[18px] border border-white/90 bg-white/75 px-4 py-4 text-[10px] text-[#777780]">No public walks have been shared yet.</div>
      </section>

      <section v-if="!authSession.data?.user && !authSession.isPending" class="rounded-[24px] border border-white/90 bg-white/80 px-5 py-7 text-center shadow-[0_8px_24px_rgba(35,35,55,0.05)]">
        <h2 class="unmodified-font-san text-[20px] font-bold tracking-[-0.05em] text-[#19191e]">Make Out yours.</h2>
        <p class="mx-auto mt-2 max-w-[300px] text-[11px] leading-relaxed text-[#777780]">Sign in to get places picked around your taste, save walks and keep your favourite routes close.</p>
        <NuxtLink to="/signin" class="mt-5 inline-flex"><ActionButton><span class="px-1 text-[14px]">Sign in</span><ArrowRight :size="17" /></ActionButton></NuxtLink>
      </section>
    </div>
    <BottomNavigation active="explore" />
  </main>
</template>