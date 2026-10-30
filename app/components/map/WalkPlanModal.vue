<script setup lang="ts">
import { Check } from '@lucide/vue'
import { useSmoothCorners } from '@lisse/vue'

const props = defineProps<{ modelValue: boolean; duration: string; built: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; 'update:duration': [value: string]; build: [] }>()
const panel = ref<HTMLElement | null>(null)
const dragStart = ref<number | null>(null)
const dragY = ref(0)

useSmoothCorners(panel, { radius: 30, smoothing: 0.82 }, {
  effects: {
    innerBorder: { width: 1, color: '#ffffff', opacity: 1 },
    shadow: { offsetX: 0, offsetY: -8, blur: 32, spread: 0, color: '#16161c', opacity: 0.18 }
  }
})

const options = ['1 h', '1.5 h', '2 h', 'More']
const spots = [
  { name: 'Colourful street', image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=480&h=480&fit=crop', rotation: -8 },
  { name: 'Yellow tram', image: 'https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=480&h=480&fit=crop', rotation: 4 },
  { name: 'Old architecture', image: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=480&h=480&fit=crop', rotation: -3 },
  { name: 'Lisbon lanes', image: 'https://images.unsplash.com/photo-1525207934214-58e69a8f8a87?w=480&h=480&fit=crop', rotation: 7 }
]

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
</script>

<template>
  <div v-if="props.modelValue" class="fixed inset-0 z-[60] flex items-end justify-center bg-[#17171c]/30 px-[7.5px] pb-[7.5px] backdrop-blur-[2px]" @click.self="close" @keydown.esc="close">
    <section
      ref="panel"
      aria-labelledby="walk-plan-title"
      class="max-h-[88dvh] w-[calc(100vw-15px)] max-w-[390px] overflow-y-auto rounded-[30px] bg-white px-5 pb-3 pt-4 text-center sm:px-6"
      :style="{ transform: `translateY(${dragY}px)`, transition: dragStart === null ? 'transform 220ms ease-out' : 'none' }"
    >
      <div
        class="mx-auto mb-3 flex h-5 w-16 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
        role="button"
        tabindex="0"
        aria-label="Drag down to return to walk selection"
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
        <h2 id="walk-plan-title" class="unmodified-font-san text-[20px] font-bold leading-tight tracking-[-0.055em] text-[#19191e]">Build a walk from here</h2>
        <p class="mx-auto mt-1 max-w-[275px] text-[11px] leading-[1.45] text-[#66666f]">Tap your must-sees, I’ll sneak in a few gems that fit.</p>
      </header>
      <div class="mt-5 flex items-center justify-center -space-x-2.5">
        <LocationCard v-for="(spot, index) in spots" :key="spot.name" :name="spot.name" :image="spot.image" :rotation="spot.rotation" :layer="spots.length - index" visual-only />
      </div>
      <div class="mt-5 text-left">
        <div class="flex items-center justify-center gap-2">
          <button v-for="option in options" :key="option" type="button" :aria-pressed="props.duration === option" class="h-10 min-w-[57px] rounded-full px-4 text-[11px] font-semibold transition active:scale-[0.98]" :class="props.duration === option ? 'bg-gradient-to-b from-[#303036] to-[#151519] text-white shadow-[0_4px_10px_rgba(22,22,27,0.20)]' : 'border border-[#e9e9ed] bg-white text-[#25252b] hover:bg-[#f8f8fa]'" @click="emit('update:duration', option)">{{ option }}</button>
        </div>
      </div>
      <div class="mx-[-8px] mt-5 sm:mx-[-12px]">
        <ActionButton block class="!h-12 !w-full !rounded-full" @click="emit('build')">
        <Check v-if="props.built" :size="13" />
        {{ props.built ? props.duration + ' walk is ready' : 'Build my ' + props.duration + ' walk' }}
        </ActionButton>
      </div>
      <p v-if="props.built" role="status" class="mt-2.5 text-[10px] font-medium text-[#4d9877]">Your walk draft is ready.</p>
    </section>
  </div>
</template>
