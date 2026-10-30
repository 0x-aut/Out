<script setup lang="ts">
import { Navigation, Sparkles } from '@lucide/vue'
import { useSmoothCorners } from '@lisse/vue'
import type { MapPlace } from '~/types/map'

const props = defineProps<{
  selectedPlaces: MapPlace[]
  locationReady: boolean
  recommendationsLoading: boolean
  routeReady: boolean
}>()

const emit = defineEmits<{
  ask: []
  plan: []
  locate: []
}>()

const sheet = ref<HTMLElement | null>(null)
useSmoothCorners(sheet, { radius: 30, smoothing: 0.82 }, {
  effects: {
    innerBorder: { width: 1, color: '#ffffff', opacity: 1 },
    shadow: { offsetX: 0, offsetY: 8, blur: 28, spread: 0, color: '#1b1b20', opacity: 0.18 }
  }
})
</script>

<template>
  <section
    ref="sheet"
    aria-labelledby="walk-builder-title"
    class="pointer-events-auto relative z-30 mx-auto w-full max-w-[390px] bg-white px-4 pb-4 pt-3.5 text-center sm:px-5 sm:pt-4"
  >
    <h1 id="walk-builder-title" class="unmodified-font-san text-[19px] font-bold leading-tight tracking-[-0.055em] text-[#19191e]">Build a walk from here</h1>
    <p class="mx-auto mt-1 max-w-[285px] text-[11px] leading-[1.45] text-[#66666f]">
      {{ props.selectedPlaces.length ? 'Your stops are ready to turn into a route.' : 'Choose places on the map and I’ll connect them into a walk.' }}
    </p>

    <div class="mt-3.5 flex min-h-[44px] items-center justify-center gap-1.5">
      <template v-if="props.selectedPlaces.length">
        <span
          v-for="(place, index) in props.selectedPlaces.slice(0, 4)"
          :key="place.id"
          class="flex h-9 max-w-[108px] items-center gap-1.5 rounded-full border border-[#eeeeF2] bg-[#fafafd] px-2.5 text-[9px] font-semibold text-[#45454d]"
        >
          <span class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#eeecfa] text-[8px] font-bold text-[#6854b4]">{{ index + 1 }}</span>
          <span class="truncate">{{ place.name }}</span>
        </span>
        <span v-if="props.selectedPlaces.length > 4" class="grid h-8 min-w-8 place-items-center rounded-full bg-[#f1f0f8] px-2 text-[9px] font-bold text-[#5f568f]">+{{ props.selectedPlaces.length - 4 }}</span>
      </template>
      <span v-else-if="props.recommendationsLoading" class="text-[10px] font-medium text-[#777780]">Finding places that fit your taste…</span>
      <span v-else class="flex items-center gap-1.5 text-[10px] font-medium text-[#777780]">
        <Sparkles :size="13" class="text-[#8a78d1]" />
        {{ props.locationReady ? 'Tap a place to add your first stop' : 'Find your location to get started' }}
      </span>
    </div>

    <div class="mt-3 flex items-center justify-center gap-2">
      <ActionButton variant="light" @click="emit('ask')">Ask Out</ActionButton>
      <ActionButton @click="emit('plan')">
        {{ props.routeReady ? 'View your walk' : props.selectedPlaces.length ? 'Plan this walk' : 'Plan a walk' }}
      </ActionButton>
    </div>
    <button
      v-if="!props.locationReady"
      type="button"
      class="mt-2 inline-flex h-7 items-center gap-1.5 rounded-full px-2 text-[9px] font-semibold text-[#66666f] transition hover:bg-[#f5f4fa]"
      @click="emit('locate')"
    >
      <Navigation :size="11" />
      Use my current location
    </button>
  </section>
</template>
