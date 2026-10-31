<script setup lang="ts">
import { MapPin, Users } from '@lucide/vue'

export interface PopularSpot {
  id: string
  name: string
  category: string
  activity: string
  friends: string
  image: string
}

defineProps<{ spot: PopularSpot }>()
const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <SmoothCorners
    as="article"
    :corners="{ radius: 20, smoothing: 0.78 }"
    class="group relative h-[188px] min-w-[238px] snap-start overflow-hidden bg-[#d4d1cb] text-white shadow-[0_5px_14px_rgba(28,28,33,0.10)] sm:min-w-[250px]"
  >
    <img :src="spot.image" :alt="spot.name" class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" loading="lazy" />
    <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/5" />
    <button type="button" class="absolute inset-0 z-10" :style="{ borderRadius: 'inherit' }" :aria-label="`Open ${spot.name}`" @click="emit('select', spot.id)" />

    <div class="pointer-events-none absolute inset-x-3 bottom-3 z-20">
      <span class="mb-2 inline-flex h-5 items-center rounded-full bg-white/95 px-2 text-[9px] font-semibold text-[#24242a]">{{ spot.category }}</span>
      <h3 class="unmodified-font-san text-[14px] font-bold leading-tight tracking-[-0.035em] text-white">{{ spot.name }}</h3>
      <p class="mt-1.5 flex items-center gap-1 text-[9px] font-semibold text-white/90">
        <Users :size="11" /> {{ spot.activity }}
      </p>
      <p class="mt-1 flex items-center gap-1 text-[9px] font-medium text-white/75">
        <MapPin :size="10" /> {{ spot.friends }}
      </p>
    </div>
  </SmoothCorners>
</template>
