<script setup lang="ts">
import { ArrowLeft, Navigation, Search } from '@lucide/vue'
import type { MapPoint } from '~/types/map'

const router = useRouter()
const route = useRoute()
const search = ref(typeof route.query.vibe === 'string' ? route.query.vibe : '')
const duration = ref('1.5 h')
const built = ref(false)
const chatOpen = ref(false)
const plannerOpen = ref(false)
const activeFilters = ref(['Courtyards', 'Views', 'Cafés', 'Architecture'])
const selectedPlace = ref('You, at the Sé')

useHead({ title: 'Map — Out' })

const allPoints: MapPoint[] = [
  { id: 'you', name: 'You, at the Sé', category: 'You', color: '#347de1', x: 18, y: 50 },
  { id: 'portas', name: 'Portas do Sol', category: 'Views', color: '#52c8e8', icon: 'view', x: 59, y: 25 },
  { id: 'santa', name: 'Santa Luzia', category: 'Views', color: '#52c8e8', icon: 'view', x: 51, y: 36 },
  { id: 'beco', name: 'Beco de Mexias', category: 'Courtyards', color: '#55c987', icon: 'courtyard', x: 76, y: 44 },
  { id: 'pois', name: 'Pois, Café', category: 'Cafés', color: '#f2c94c', icon: 'cafe', x: 57, y: 51 },
  { id: 'casa', name: 'Casa dos Bicos', category: 'Architecture', color: '#ea83b8', icon: 'architecture', x: 25, y: 56 }
]

const visiblePoints = computed(() => allPoints
  .filter(point => point.category === 'You' || activeFilters.value.includes(point.category))
  .map(point => ({ ...point, selected: point.name === selectedPlace.value })))

watch(() => route.query.vibe, value => {
  search.value = typeof value === 'string' ? value : ''
}, { immediate: true })

watch(() => route.query.mode, mode => {
  if (mode === 'chat') chatOpen.value = true
}, { immediate: true })

watch(chatOpen, open => {
  if (!open && route.query.mode === 'chat') {
    const query = typeof route.query.vibe === 'string' ? { vibe: route.query.vibe } : {}
    router.replace({ path: '/map', query })
  }
})

function toggleFilter(category: string) {
  activeFilters.value = activeFilters.value.includes(category)
    ? activeFilters.value.filter(item => item !== category)
    : [...activeFilters.value, category]
  built.value = false
}

function selectPoint(point: MapPoint) {
  selectedPlace.value = point.name
  built.value = false
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

function buildWalk() {
  built.value = true
}

function selectCurrentLocation() {
  selectedPlace.value = 'You, at the Sé'
  built.value = false
}
</script>

<template>
  <main class="relative h-dvh min-h-[620px] overflow-hidden bg-[#efefec]">
    <MapCanvas :points="visiblePoints" @select="selectPoint" />

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

        <button type="button" aria-label="Select your current location" class="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white bg-white text-[#19191e] shadow-[0_3px_12px_rgba(24,24,28,0.12)] transition hover:bg-[#f8f8fa]" @click="selectCurrentLocation">
          <Navigation :size="16" :stroke-width="2" />
        </button>
      </div>
      <div class="pointer-events-auto mx-auto mt-2 max-w-[760px]">
        <MapFilters :active="activeFilters" @toggle="toggleFilter" />
      </div>
    </div>

    <div v-if="!chatOpen && !plannerOpen" class="pointer-events-none absolute bottom-0 left-0 right-0 z-20 px-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-5 sm:pb-6">
      <WalkBuilderSheet @ask="openChat" @plan="plannerOpen = true" />
    </div>

    <MapChatModal v-model="chatOpen" :initial-prompt="search" @save="saveVibe" />
    <WalkPlanModal v-model="plannerOpen" v-model:duration="duration" :built="built" @build="buildWalk" />
  </main>
</template>
