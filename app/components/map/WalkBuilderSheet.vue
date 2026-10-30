<script setup lang="ts">
import { useSmoothCorners } from '@lisse/vue'

const emit = defineEmits<{
  ask: []
  plan: []
}>()

const sheet = ref<HTMLElement | null>(null)
useSmoothCorners(sheet, { radius: 30, smoothing: 0.82 }, {
  effects: {
    innerBorder: { width: 1, color: '#ffffff', opacity: 1 },
    shadow: { offsetX: 0, offsetY: 8, blur: 28, spread: 0, color: '#1b1b20', opacity: 0.18 }
  }
})

const spots = [
  { name: 'Colourful street', image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=240&h=240&fit=crop', rotation: -8 },
  { name: 'Yellow tram', image: 'https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=240&h=240&fit=crop', rotation: 4 },
  { name: 'Old architecture', image: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=240&h=240&fit=crop', rotation: -3 },
  { name: 'Lisbon lanes', image: 'https://images.unsplash.com/photo-1525207934214-58e69a8f8a87?w=240&h=240&fit=crop', rotation: 7 }
]
</script>

<template>
  <section
    ref="sheet"
    aria-labelledby="walk-builder-title"
    class="pointer-events-auto relative z-30 mx-auto w-full max-w-[390px] bg-white px-4 pb-4 pt-3.5 text-center sm:px-5 sm:pt-4"
  >
    <h1 id="walk-builder-title" class="unmodified-font-san text-[19px] font-bold leading-tight tracking-[-0.055em] text-[#19191e]">Build a walk from here</h1>
    <p class="mx-auto mt-1 max-w-[270px] text-[11px] leading-[1.45] text-[#66666f]">Tap your must-sees, I’ll sneak<br class="hidden sm:block" /> in a few gems that fit</p>
    <div class="mt-3.5 flex items-center justify-center -space-x-2.5">
      <LocationCard v-for="(spot, index) in spots" :key="spot.name" :name="spot.name" :image="spot.image" :rotation="spot.rotation" :layer="spots.length - index" visual-only />
    </div>
    <div class="mt-3.5 flex items-center justify-center gap-2">
      <ActionButton variant="light" @click="emit('ask')">Ask Out</ActionButton>
      <ActionButton @click="emit('plan')">Plan a walk</ActionButton>
    </div>
  </section>
</template>
