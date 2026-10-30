<script setup lang="ts">
import { Check, X } from '@lucide/vue'
import { useSmoothCorners } from '@lisse/vue'

const props = defineProps<{ modelValue: boolean; duration: string; built: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; 'update:duration': [value: string]; build: [] }>()
const panel = ref<HTMLElement | null>(null)

useSmoothCorners(panel, { radius: 30, smoothing: 0.82 }, {
  effects: {
    innerBorder: { width: 1, color: '#ffffff', opacity: 1 },
    shadow: { offsetX: 0, offsetY: 12, blur: 38, spread: 0, color: '#16161c', opacity: 0.22 }
  }
})

const options = ['1 h', '1.5 h', '2 h', 'More']
const spots = [
  { name: 'Colourful street', image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=240&h=240&fit=crop', rotation: -8 },
  { name: 'Yellow tram', image: 'https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=240&h=240&fit=crop', rotation: 4 },
  { name: 'Old architecture', image: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=240&h=240&fit=crop', rotation: -3 },
  { name: 'Lisbon lanes', image: 'https://images.unsplash.com/photo-1525207934214-58e69a8f8a87?w=240&h=240&fit=crop', rotation: 7 }
]

function close() { emit('update:modelValue', false) }
</script>

<template>
  <div v-if="props.modelValue" class="fixed inset-0 z-[60] flex items-end justify-center bg-[#17171c]/30 px-0 pb-0 backdrop-blur-[2px] sm:items-center sm:px-4 sm:py-8" @click.self="close" @keydown.esc="close">
    <section ref="panel" aria-labelledby="walk-plan-title" class="max-h-[88dvh] w-full max-w-[420px] overflow-y-auto bg-white px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 text-center sm:pb-5">
      <header class="flex items-start justify-between gap-3 text-left">
        <div>
          <h2 id="walk-plan-title" class="unmodified-font-san text-[20px] font-bold leading-tight tracking-[-0.055em] text-[#19191e]">Build a walk from here</h2>
          <p class="mt-1 max-w-[275px] text-[11px] leading-[1.45] text-[#66666f]">Tap your must-sees, I’ll sneak in a few gems that fit.</p>
        </div>
        <button type="button" aria-label="Close walk planner" class="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#55555d] transition hover:bg-[#f2f2f5]" @click="close"><X :size="17" /></button>
      </header>
      <div class="mt-5 flex items-center justify-center -space-x-2.5">
        <LocationCard v-for="(spot, index) in spots" :key="spot.name" :name="spot.name" :image="spot.image" :rotation="spot.rotation" :layer="spots.length - index" visual-only />
      </div>
      <div class="mt-5 text-left">
        <p class="mb-2.5 text-[11px] font-semibold text-[#41414a]">How long do you want to wander?</p>
        <div class="flex items-center justify-center gap-2">
          <button v-for="option in options" :key="option" type="button" :aria-pressed="props.duration === option" class="h-10 min-w-[57px] px-3 text-[11px] font-semibold transition active:scale-[0.98]" :class="props.duration === option ? 'bg-gradient-to-b from-[#303036] to-[#151519] text-white shadow-[0_4px_10px_rgba(22,22,27,0.20)]' : 'border border-[#e9e9ed] bg-white text-[#25252b] hover:bg-[#f8f8fa]'" @click="emit('update:duration', option)">{{ option }}</button>
        </div>
      </div>
      <ActionButton block class="mt-5" @click="emit('build')">
        <Check v-if="props.built" :size="13" />
        {{ props.built ? props.duration + ' walk is ready' : 'Build my ' + props.duration + ' walk' }}
      </ActionButton>
      <p v-if="props.built" role="status" class="mt-2.5 text-[10px] font-medium text-[#4d9877]">Your walk draft is ready.</p>
    </section>
  </div>
</template>
