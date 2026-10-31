<script setup lang="ts">
import { Clock, Footprints } from '@lucide/vue'

export interface WalkItem {
  id: string
  title: string
  duration: string
  stops: string
  distance: string
  image: string | null
  position?: string
}

defineProps<{ walk: WalkItem }>()
const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <SmoothCorners
    as="article"
    :corners="{ radius: 21, smoothing: 0.78 }"
    class="group relative h-[190px] min-w-[218px] flex-1 snap-start overflow-hidden bg-[#d4d1cb] text-white shadow-[0_5px_14px_rgba(28,28,33,0.10)] sm:h-[198px] sm:min-w-[230px]"
  >
    <img
      v-if="walk.image"
      :src="walk.image"
      :alt="walk.title"
      :style="{ objectPosition: walk.position || 'center' }"
      class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
      loading="lazy"
    />
    <div v-else class="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_15%,#aaa4d1_0%,#65617d_48%,#292932_100%)]" />
    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/5" />
    <button type="button" class="absolute inset-0 z-10" :style="{ borderRadius: 'inherit' }" :aria-label="`Open ${walk.title}`" @click="emit('select', walk.id)" />

    <div class="pointer-events-none absolute inset-x-3 bottom-3 z-20">
      <div class="mb-2 flex items-center gap-1.5">
        <span class="inline-flex h-5 items-center gap-1 rounded-full bg-white/95 px-2 text-[9px] font-semibold text-[#1d1d22]">
          <Clock :size="10" /> {{ walk.duration }}
        </span>
        <span class="inline-flex h-5 items-center rounded-full bg-black/45 px-2 text-[9px] font-semibold text-white backdrop-blur-sm">{{ walk.stops }}</span>
      </div>
      <h3 class="unmodified-font-san text-[14px] font-bold leading-tight tracking-[-0.035em] text-white">{{ walk.title }}</h3>
      <p class="mt-1 flex items-center gap-1 text-[9px] font-medium text-white/85">
        <Footprints :size="10" /> {{ walk.distance }}
      </p>
    </div>
  </SmoothCorners>
</template>
