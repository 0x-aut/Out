<script setup lang="ts">
import { Check } from '@lucide/vue'

const props = defineProps<{
  duration: string
  built: boolean
}>()

const emit = defineEmits<{
  'update:duration': [value: string]
  build: []
}>()

const options = ['1 h', '1.5 h', '2 h', 'More']
const spots = [
  { name: 'Colourful street', image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=140&h=140&fit=crop' },
  { name: 'Yellow tram', image: 'https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=140&h=140&fit=crop' },
  { name: 'Old architecture', image: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=140&h=140&fit=crop' },
  { name: 'Lisbon lanes', image: 'https://images.unsplash.com/photo-1525207934214-58e69a8f8a87?w=140&h=140&fit=crop' }
]
</script>

<template>
  <SmoothCorners
    as="section"
    aria-labelledby="walk-builder-title"
    :corners="{ radius: 30, smoothing: 0.82 }"
    class="relative z-30 mx-auto w-full max-w-[390px] border border-white bg-white px-4 pb-4 pt-3.5 text-center shadow-[0_8px_28px_rgba(27,27,32,0.18)] sm:px-5 sm:pt-4"
  >
    <h1 id="walk-builder-title" class="unmodified-font-san text-[19px] font-bold leading-tight tracking-[-0.055em] text-[#19191e]">Build a walk from here</h1>
    <p class="mx-auto mt-1 max-w-[270px] text-[11px] leading-[1.45] text-[#66666f]">
      Tap your must-sees, I’ll sneak<br class="hidden sm:block" /> in a few gems that fit
    </p>

    <div class="mt-3.5 flex items-center justify-center gap-2">
      <LocationCard
        v-for="spot in spots"
        :key="spot.name"
        :name="spot.name"
        :image="spot.image"
        visual-only
      />
    </div>

    <div class="mt-3.5 grid grid-cols-4 gap-2">
      <button
        v-for="option in options"
        :key="option"
        type="button"
        :aria-pressed="props.duration === option"
        class="h-8 rounded-full border text-[11px] font-semibold transition"
        :class="props.duration === option ? 'border-[#19191e] bg-[#19191e] text-white shadow-sm' : 'border-[#e9e9ed] bg-white text-[#25252b] hover:bg-[#f8f8fa]'"
        @click="emit('update:duration', option)"
      >
        {{ option }}
      </button>
    </div>

    <ActionButton block class="mt-3" @click="emit('build')">
      <Check v-if="props.built" :size="13" />
      {{ props.built ? `${props.duration} walk is ready` : `Build my ${props.duration} walk` }}
    </ActionButton>
    <p v-if="props.built" role="status" class="mt-2 text-[9px] font-medium text-[#4d9877]">
      Your walk draft is ready.
    </p>
  </SmoothCorners>
</template>
