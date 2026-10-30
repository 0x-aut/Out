<script setup lang="ts">
import { useSmoothCorners } from '@lisse/vue'

const props = withDefaults(defineProps<{
  name: string
  image: string
  alt?: string
  visualOnly?: boolean
  rotation?: number
  layer?: number
}>(), {
  visualOnly: false,
  rotation: 0,
  layer: 1
})

const card = ref<HTMLElement | null>(null)
useSmoothCorners(card, { radius: 13, smoothing: 0.78 }, { autoEffects: false })
</script>

<template>
  <div
    ref="card"
    :style="{ transform: 'rotate(' + props.rotation + 'deg)', zIndex: props.layer }"
    class="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-[13px] bg-white p-[3px] shadow-[0_3px_8px_rgba(25,25,30,0.16)]"
  >
    <img :src="props.image" :alt="props.alt || props.name" class="h-full w-full rounded-[10px] object-cover" loading="eager" />
    <span v-if="!props.visualOnly" class="absolute inset-x-[3px] bottom-[3px] truncate bg-black/55 px-1 py-1 text-center text-[8px] font-semibold text-white">{{ props.name }}</span>
  </div>
</template>
