<script setup lang="ts">
import { Compass, Map, Heart } from '@lucide/vue'

defineProps<{
  active: 'explore' | 'map'
}>()
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-[max(12px,env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
    <SmoothCorners
      as="nav"
      aria-label="Main navigation"
      :corners="{ radius: 28, smoothing: 0.82 }"
      class="pointer-events-auto flex h-[52px] items-center gap-1 border border-white/90 bg-white/95 p-1.5 shadow-[0_7px_24px_rgba(21,21,28,0.16)] backdrop-blur-xl"
    >
      <NuxtLink
        to="/"
        class="flex h-9 min-w-[84px] items-center justify-center gap-2 rounded-full px-3 text-[10px] font-medium transition"
        :class="active === 'explore' ? 'bg-[#19191e] text-white shadow-sm' : 'text-[#55555d] hover:bg-[#f4f4f7]'"
      >
        <Compass :size="15" :stroke-width="1.9" />
        Explore
      </NuxtLink>
      <NuxtLink
        to="/map"
        class="flex h-9 min-w-[66px] items-center justify-center gap-2 rounded-full px-3 text-[10px] font-medium transition"
        :class="active === 'map' ? 'bg-[#19191e] text-white shadow-sm' : 'text-[#55555d] hover:bg-[#f4f4f7]'"
      >
        <Map :size="15" :stroke-width="1.9" />
        Map
      </NuxtLink>
      <button
        type="button"
        disabled
        aria-label="Favorites coming later"
        class="flex h-9 min-w-[66px] cursor-not-allowed items-center justify-center gap-2 rounded-full px-3 text-[10px] font-medium text-[#55555d] opacity-80"
      >
        <Heart :size="15" :stroke-width="1.9" />
        Favs
      </button>
    </SmoothCorners>
  </div>
</template>
