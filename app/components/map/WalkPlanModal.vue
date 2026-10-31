<script setup lang="ts">
import { Check, MapPin } from '@lucide/vue'
import { useSmoothCorners } from '@lisse/vue'
import type { MapPlace } from '~/types/map'

const props = defineProps<{
  modelValue: boolean
  selectedPlaces: MapPlace[]
  locationReady: boolean
  locationPending: boolean
  routeDistance: number
  routeDuration: number
  building: boolean
  saving: boolean
  built: boolean
  saved: boolean
  error: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  build: []
  save: []
  locate: []
  move: [index: number, offset: -1 | 1]
  remove: [place: MapPlace]
  'clear-error': []
}>()

const panel = ref<HTMLElement | null>(null)
const dragStart = ref<number | null>(null)
const dragY = ref(0)

useSmoothCorners(panel, { radius: 30, smoothing: 0.82 }, {
  effects: {
    innerBorder: { width: 1, color: '#ffffff', opacity: 1 },
    shadow: { offsetX: 0, offsetY: -8, blur: 32, spread: 0, color: '#16161c', opacity: 0.18 }
  }
})

function close() {
  dragY.value = 0
  dragStart.value = null
  emit('update:modelValue', false)
}

function startDrag(event: PointerEvent) {
  if (event.button !== 0) return
  dragStart.value = event.clientY
  event.currentTarget instanceof HTMLElement && event.currentTarget.setPointerCapture(event.pointerId)
}

function moveDrag(event: PointerEvent) {
  if (dragStart.value === null) return
  dragY.value = Math.max(0, event.clientY - dragStart.value)
}

function endDrag() {
  if (dragStart.value === null) return
  const shouldClose = dragY.value > 90
  dragStart.value = null
  if (shouldClose) close()
  else dragY.value = 0
}

function formatDistance(meters: number) {
  return meters >= 1000 ? (meters / 1000).toFixed(1) + ' km' : Math.round(meters) + ' m'
}

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60))
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return hours ? hours + ' hr ' + remainder + ' min' : minutes + ' min'
}
</script>

<template>
  <div v-if="props.modelValue" class="fixed inset-0 z-[60] flex items-end justify-center bg-[#17171c]/30 px-[7.5px] pb-[7.5px] backdrop-blur-[2px]" @click.self="close" @keydown.esc="close">
    <section
      ref="panel"
      aria-labelledby="walk-plan-title"
      class="max-h-[88dvh] w-[calc(100vw-15px)] max-w-[430px] overflow-y-auto rounded-[30px] bg-white px-5 pb-4 pt-4 text-center sm:px-6"
      :style="{ transform: 'translateY(' + dragY + 'px)', transition: dragStart === null ? 'transform 220ms ease-out' : 'none' }"
    >
      <div
        class="mx-auto mb-3 flex h-5 w-16 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
        role="button"
        tabindex="0"
        aria-label="Drag down to return to the map"
        @pointerdown="startDrag"
        @pointermove="moveDrag"
        @pointerup="endDrag"
        @pointercancel="endDrag"
        @keydown.enter.prevent="close"
        @keydown.space.prevent="close"
      >
        <span class="h-1 w-9 rounded-full bg-[#e6e6eb]" />
      </div>

      <header class="text-center">
        <h2 id="walk-plan-title" class="unmodified-font-san text-[20px] font-bold leading-tight tracking-[-0.055em] text-[#19191e]">Your walk</h2>
        <p class="mx-auto mt-1 max-w-[290px] text-[11px] leading-[1.45] text-[#66666f]">
          {{ props.locationReady ? 'Starting from your current location.' : 'Share your location to calculate a real walking route.' }}
        </p>
      </header>

      <div class="mt-4 rounded-[18px] border border-[#eeeeF2] bg-[#fafafd] px-3.5 py-3 text-left">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-[10px] font-semibold text-[#33333a]">
            <span class="grid h-7 w-7 place-items-center rounded-full bg-white text-[#7659d6] shadow-sm"><MapPin :size="14" /></span>
            <span>{{ props.locationReady ? 'Your current location' : 'Current location not set' }}</span>
          </div>
          <button
            v-if="!props.locationReady"
            type="button"
            :disabled="props.locationPending"
            class="rounded-full bg-gradient-to-b from-[#303036] to-[#151519] px-3.5 py-2 text-[10px] font-semibold text-white shadow-[0_3px_9px_rgba(22,22,27,0.16)] disabled:opacity-50"
            @click="emit('locate')"
          >
            {{ props.locationPending ? 'Locating…' : 'Use my location' }}
          </button>
          <span v-else class="rounded-full bg-[#edf7f1] px-3 py-1.5 text-[9px] font-semibold text-[#4c9877]">Ready</span>
        </div>
      </div>

      <div class="mt-4 text-left">
        <div class="mb-2 flex items-center justify-between gap-3">
          <h3 class="text-[11px] font-bold text-[#292930]">Stops</h3>
          <span class="rounded-full bg-[#f2f1f8] px-2.5 py-1 text-[9px] font-semibold text-[#686873]">{{ props.selectedPlaces.length }} of 24</span>
        </div>

        <div v-if="!props.selectedPlaces.length" class="rounded-[16px] border border-dashed border-[#ddddE5] px-4 py-5 text-center">
          <p class="text-[10px] font-medium text-[#777780]">Choose places from the map to build your walk.</p>
        </div>

        <ol v-else class="space-y-1.5">
          <li
            v-for="(place, index) in props.selectedPlaces"
            :key="place.id"
            class="flex min-w-0 items-center gap-2 rounded-[15px] border border-[#eeeeF2] bg-white px-2.5 py-2"
          >
            <span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#f0effb] text-[9px] font-bold text-[#6854b4]">{{ index + 1 }}</span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-[10px] font-semibold text-[#292930]">{{ place.name }}</p>
              <p class="truncate text-[9px] text-[#85858d]">{{ place.address || place.city || place.category || 'Selected place' }}</p>
            </div>
            <button type="button" :disabled="index === 0" :aria-label="'Move ' + place.name + ' up'" class="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold text-[#686873] hover:bg-[#f2f2f6] disabled:opacity-25" @click="emit('move', index, -1)">↑</button>
            <button type="button" :disabled="index === props.selectedPlaces.length - 1" :aria-label="'Move ' + place.name + ' down'" class="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold text-[#686873] hover:bg-[#f2f2f6] disabled:opacity-25" @click="emit('move', index, 1)">↓</button>
            <button type="button" :aria-label="'Remove ' + place.name" class="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[15px] text-[#85858d] hover:bg-[#f2f2f6]" @click="emit('remove', place)">×</button>
          </li>
        </ol>
      </div>

      <div v-if="props.built" class="mt-4 grid grid-cols-2 gap-2">
        <div class="rounded-[16px] bg-[#f6f5fb] px-3 py-3 text-center">
          <p class="text-[16px] font-bold tracking-tight text-[#222229]">{{ formatDistance(props.routeDistance) }}</p>
          <p class="mt-0.5 text-[9px] font-medium text-[#777780]">Walking distance</p>
        </div>
        <div class="rounded-[16px] bg-[#f6f5fb] px-3 py-3 text-center">
          <p class="text-[16px] font-bold tracking-tight text-[#222229]">{{ formatDuration(props.routeDuration) }}</p>
          <p class="mt-0.5 text-[9px] font-medium text-[#777780]">Estimated walk</p>
        </div>
      </div>

      <div v-if="props.error" role="alert" class="mt-3 rounded-[13px] bg-[#fff5f4] px-3 py-2 text-left text-[10px] leading-relaxed text-[#a34b46]">
        {{ props.error }}
      </div>

      <div class="mt-4 space-y-2">
        <ActionButton block :disabled="!props.locationReady || !props.selectedPlaces.length || props.building || props.saving" @click="emit('build')">
          {{ props.building ? 'Calculating walking route…' : props.built ? 'Recalculate walking route' : 'Build walking route' }}
        </ActionButton>
        <ActionButton v-if="props.built" block variant="light" :disabled="props.saving || props.building" @click="emit('save')">
          <Check v-if="props.saved" :size="13" />
          {{ props.saving ? 'Saving walk…' : props.saved ? 'Walk saved' : 'Save this walk' }}
        </ActionButton>
      </div>
    </section>
  </div>
</template>
