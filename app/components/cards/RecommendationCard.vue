<script setup lang="ts">
import { MapPin, Sparkles } from '@lucide/vue'

defineProps<{
  place: {
    id: string
    name: string
    category: string | null
    address: string | null
    city: string | null
    country: string | null
    imageUrl: string | null
  }
}>()

</script>

<template>
  <article class="h-[218px] min-w-[238px] snap-start overflow-hidden rounded-[20px] border border-white/90 bg-white shadow-[0_5px_14px_rgba(28,28,33,0.08)] sm:min-w-[250px]">
    <div class="relative h-[126px] overflow-hidden bg-[#e7e8f2]">
      <img
        v-if="place.imageUrl"
        :src="place.imageUrl"
        :alt="place.name"
        class="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      <div v-else class="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,#d8daf1_0%,#e9eaf5_48%,#f4f4f8_100%)]" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />
      <span class="absolute left-3 top-3 inline-flex h-6 items-center gap-1.5 rounded-full bg-white/95 px-2.5 text-[9px] font-semibold text-[#24242a] shadow-sm">
        <Sparkles :size="11" />
        Picked for you
      </span>
    </div>

    <div class="px-3.5 pb-3 pt-2.5">
      <div class="mb-1 flex items-center gap-2">
        <span class="truncate text-[9px] font-semibold uppercase tracking-[0.08em] text-[#888891]">{{ place.category || 'Place' }}</span>
      </div>
      <h3 class="truncate text-[13px] font-bold leading-tight tracking-[-0.035em] text-[#202027]">{{ place.name }}</h3>
      <p class="mt-1.5 flex items-center gap-1 truncate text-[9px] font-medium text-[#777780]">
        <MapPin :size="10" class="shrink-0" />
        {{ place.address || [place.city, place.country].filter(Boolean).join(', ') || 'Location details unavailable' }}
      </p>
    </div>
  </article>
</template>
