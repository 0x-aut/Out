<script setup lang="ts">
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

const router = useRouter()
const authSession = authClient.useSession()
const recommendationItems = ref<RecommendationItem[]>([])
const recommendationLoading = ref(false)
const recommendationError = ref('')
const recommendationStatus = ref<'idle' | 'loading' | RecommendationResponse['status']>('idle')
const recommendationLocation = ref<string | null>(null)
let recommendationRequestId = 0
const vibe = ref('')
const popularTab = ref<'spots' | 'walks'>('spots')

useHead({ title: 'Explore — Out' })

const walks = [
  { id: 'bica', title: 'Bica down to the river', duration: '1 h 10', stops: '4 stops', distance: '8 min from you, ends at Cais do Sodré', image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&h=900&fit=crop', position: 'center 54%' },
  { id: 'sunset', title: 'Sunset over the rooftops', duration: '1 h 45', stops: '5 stops', distance: '3 min from you', image: 'https://images.unsplash.com/photo-1506377585622-bedcbb027afc?w=800&h=900&fit=crop', position: 'center 52%' },
  { id: 'tiles', title: 'Tiles, tarts & tiny streets', duration: '55 min', stops: '3 stops', distance: '11 min from you', image: 'https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=800&h=900&fit=crop', position: 'center 54%' }
]

const popularSpots = [
  { id: 'miradouro-santa-luzia', name: 'Miradouro de Santa Luzia', category: 'Viewpoint · Alfama', activity: '24 planning to visit', friends: 'Karina + 2 friends', image: 'https://images.unsplash.com/photo-1506377585622-bedcbb027afc?w=800&h=600&fit=crop' },
  { id: 'timeout-market', name: 'Time Out Market', category: 'Food hall · Cais do Sodré', activity: '18 planning to visit', friends: 'Tom and Mia saved this', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop' },
  { id: 'lx-factory', name: 'LX Factory', category: 'Culture · Alcântara', activity: '16 planning to visit', friends: 'Popular with your circle', image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=800&h=600&fit=crop' }
]

const popularWalks = [
  { id: 'bica', title: 'Bica down to the river', duration: '1 h 10', stops: '4 stops', distance: 'Walked by 32 people this week', image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&h=900&fit=crop', position: 'center 54%' },
  { id: 'sunset', title: 'Sunset over the rooftops', duration: '1 h 45', stops: '5 stops', distance: 'Saved by 21 people', image: 'https://images.unsplash.com/photo-1506377585622-bedcbb027afc?w=800&h=900&fit=crop', position: 'center 52%' },
  { id: 'tiles', title: 'Tiles, tarts & tiny streets', duration: '55 min', stops: '3 stops', distance: 'Karina and 8 others tried this', image: 'https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=800&h=900&fit=crop', position: 'center 54%' }
]

async function loadRecommendations() {
  const requestId = ++recommendationRequestId
  recommendationLoading.value = true
  recommendationError.value = ''
  recommendationStatus.value = 'loading'

  try {
    const response = await $fetch<RecommendationResponse>('/api/recommendations')
    if (requestId !== recommendationRequestId) return
    recommendationItems.value = response.items
    recommendationLocation.value = response.location
    recommendationStatus.value = response.status
  } catch {
    if (requestId !== recommendationRequestId) return
    recommendationItems.value = []
    recommendationError.value = 'Your picks could not load. Please try again.'
    recommendationStatus.value = 'idle'
  } finally {
    if (requestId === recommendationRequestId) recommendationLoading.value = false
  }
}

watch(() => authSession.value.data?.user?.id, userId => {
  if (userId) {
    void loadRecommendations()
  } else {
    recommendationRequestId++
    recommendationItems.value = []
    recommendationError.value = ''
    recommendationLocation.value = null
    recommendationStatus.value = 'idle'
    recommendationLoading.value = false
  }
}, { immediate: true })

function startFromVibe() {
  const query = vibe.value.trim()
  router.push({ path: '/map', query: { ...(query ? { vibe: query } : {}), mode: 'chat' } })
}

function openWalk(id: string) {
  router.push({ path: '/map', query: { walk: id } })
}

function openSpot(id: string) {
  router.push({ path: '/map', query: { spot: id } })
}
</script>

<template>
  <main class="min-h-dvh overflow-hidden bg-[radial-gradient(ellipse_at_50%_0%,#e4e6fb_0%,#eef0fc_42%,#f8f8fc_78%,#fafafd_100%)] pb-24">
    <div class="mx-auto max-w-[1080px] px-4 pb-10 pt-5 sm:px-7 sm:pt-7 lg:px-10 lg:pt-9">
      <header class="mb-5 flex items-center justify-between gap-3 sm:mb-6">
        <div class="min-w-0">
          <h1 class="unmodified-font-san text-[20px] font-bold leading-tight tracking-[-0.055em] text-[#19191e] sm:text-[22px]">Alfama? Say less</h1>
        </div>
        <NuxtLink to="/profile" aria-label="Your profile" class="h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-[0_2px_8px_rgba(20,20,28,0.14)]">
          <img src="https://i.pravatar.cc/100?img=12" alt="Profile" class="h-full w-full object-cover" />
        </NuxtLink>
      </header>

      <div class="mb-6 sm:mb-7">
        <ExplorePrompt v-model="vibe" @submit="startFromVibe" />
      </div>

      <div class="grid gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-8">
        <section aria-labelledby="up-next-heading" class="min-w-0">
          <div class="mb-2.5 flex items-center justify-between">
            <h2 id="up-next-heading" class="unmodified-font-san text-[12px] font-semibold text-[#41414a]">Up next</h2>
          </div>
          <UpcomingWalk title="Alfama back streets tour" duration="1 h 25" start-time="Today 17:30" stops="4 stops" @open="openWalk('alfama')" />
        </section>

        <section aria-labelledby="walks-heading" class="min-w-0">
          <div class="mb-2.5 flex items-center justify-between gap-3">
            <h2 id="walks-heading" class="unmodified-font-san text-[12px] font-semibold text-[#41414a]">Walks near you</h2>
            <NuxtLink to="/map" class="flex h-8 items-center gap-1 rounded-full px-2 text-[11px] font-semibold text-[#33333a] transition hover:bg-white/70">
              See all <span aria-hidden="true">›</span>
            </NuxtLink>
          </div>
          <div class="hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-pl-6 px-6 pb-2 sm:mx-0 sm:px-2">
            <WalkCard v-for="walk in walks" :key="walk.id" :walk="walk" @select="openWalk" />
          </div>
        </section>

        <section v-if="authSession.data?.user" aria-labelledby="for-you-heading" class="min-w-0 lg:col-span-2">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 id="for-you-heading" class="unmodified-font-san text-[15px] font-bold tracking-[-0.04em] text-[#202027]">Picked for your taste</h2>
              <p class="mt-0.5 text-[10px] text-[#777780]">
                {{ recommendationLocation ? `Around ${recommendationLocation}` : 'Based on the things you enjoy' }}
              </p>
            </div>
            <NuxtLink to="/profile" class="flex h-8 shrink-0 items-center gap-1 rounded-full px-2 text-[10px] font-semibold text-[#555560] transition hover:bg-white/70">
              Tune your taste <span aria-hidden="true">›</span>
            </NuxtLink>
          </div>

          <div v-if="recommendationLoading" class="flex gap-2.5 overflow-hidden">
            <div v-for="item in 3" :key="item" class="h-[218px] min-w-[238px] animate-pulse rounded-[20px] border border-white/90 bg-white/70 sm:min-w-[250px]"></div>
          </div>
          <div v-else-if="recommendationError" class="rounded-[20px] border border-white/90 bg-white/80 px-4 py-4 shadow-[0_4px_14px_rgba(28,28,33,0.04)]">
            <p class="text-[11px] text-[#686873]">{{ recommendationError }}</p>
            <button type="button" class="mt-2 text-[10px] font-semibold text-[#24242a] underline underline-offset-2" @click="loadRecommendations">Try again</button>
          </div>
          <div v-else-if="recommendationItems.length" class="hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            <RecommendationCard v-for="place in recommendationItems" :key="place.id" :place="place" />
          </div>
          <div v-else class="rounded-[20px] border border-white/90 bg-white/75 px-4 py-4 shadow-[0_4px_14px_rgba(28,28,33,0.04)]">
            <p class="text-[11px] font-semibold text-[#34343c]">
              {{ recommendationStatus === 'profile_incomplete' ? 'A little more about you will make these picks better.' : 'We could not find a match just yet.' }}
            </p>
            <p class="mt-1 text-[10px] leading-relaxed text-[#777780]">
              {{ recommendationStatus === 'profile_incomplete' ? 'Add a few interests and your home base to get places shaped around your taste.' : 'Try adding a few more interests or checking your home base.' }}
            </p>
            <NuxtLink to="/profile" class="mt-2 inline-flex text-[10px] font-semibold text-[#24242a] underline underline-offset-2">Update your profile</NuxtLink>
          </div>
        </section>

        <section aria-labelledby="people-heading" class="min-w-0 lg:col-span-2">
          <div class="mb-2.5 flex items-center justify-between">
            <h2 id="people-heading" class="unmodified-font-san text-[12px] font-semibold text-[#41414a]">Your people were here</h2>
          </div>
          <PeopleCard />
        </section>

        <section aria-labelledby="popular-heading" class="min-w-0 lg:col-span-2">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 id="popular-heading" class="unmodified-font-san text-[15px] font-bold tracking-[-0.04em] text-[#202027]">Popular around you</h2>
              <p class="mt-0.5 text-[10px] text-[#777780]">Places and walks people are choosing</p>
            </div>
            <span class="rounded-full bg-white/75 px-2.5 py-1 text-[9px] font-semibold text-[#666672]">This week</span>
          </div>

          <div class="mb-3 inline-flex rounded-full border border-white/90 bg-white/65 p-1 shadow-[0_2px_8px_rgba(36,36,51,0.04)]" role="tablist" aria-label="Popular recommendations">
            <button
              type="button"
              role="tab"
              :aria-selected="popularTab === 'spots'"
              class="h-8 rounded-full px-4 text-[10px] font-semibold transition"
              :class="popularTab === 'spots' ? 'bg-[#19191e] text-white shadow-sm' : 'text-[#686873] hover:text-[#222228]'"
              @click="popularTab = 'spots'"
            >Spots</button>
            <button
              type="button"
              role="tab"
              :aria-selected="popularTab === 'walks'"
              class="h-8 rounded-full px-4 text-[10px] font-semibold transition"
              :class="popularTab === 'walks' ? 'bg-[#19191e] text-white shadow-sm' : 'text-[#686873] hover:text-[#222228]'"
              @click="popularTab = 'walks'"
            >Walks</button>
          </div>

          <div v-if="popularTab === 'spots'" role="tabpanel" class="hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            <PopularSpotCard v-for="spot in popularSpots" :key="spot.id" :spot="spot" @select="openSpot" />
          </div>
          <div v-else role="tabpanel" class="hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            <WalkCard v-for="walk in popularWalks" :key="walk.id" :walk="walk" @select="openWalk" />
          </div>
        </section>
      </div>
    </div>

    <BottomNavigation active="explore" />
  </main>
</template>
