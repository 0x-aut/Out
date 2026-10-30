<script setup lang="ts">
import { Compass, Map, Heart } from '@lucide/vue'
import { useSmoothCorners } from '@lisse/vue'

defineProps<{ active: 'explore' | 'map' }>()

const nav = ref<HTMLElement | null>(null)
useSmoothCorners(nav, { radius: 28, smoothing: 0.82 }, {
  effects: {
    innerBorder: { width: 1, color: '#ffffff', opacity: 0.9 },
    shadow: { offsetX: 0, offsetY: 7, blur: 24, spread: 0, color: '#15151c', opacity: 0.16 }
  }
})
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-[max(12px,env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
    <nav ref="nav" aria-label="Main navigation" class="pointer-events-auto flex h-[52px] items-center gap-1 bg-white/95 p-1.5 backdrop-blur-xl">
      <NuxtLink to="/" class="flex h-9 min-w-[84px] items-center justify-center gap-2 rounded-full px-3 text-[10px] font-medium transition" :class="active === 'explore' ? 'bg-gradient-to-b from-[#303036] to-[#151519] text-white shadow-[0_4px_10px_rgba(22,22,27,0.20)]' : 'text-[#55555d] hover:bg-[#f4f4f7]'">
        <Compass :size="15" :stroke-width="1.9" />Explore
      </NuxtLink>
      <NuxtLink to="/map" class="flex h-9 min-w-[66px] items-center justify-center gap-2 rounded-full px-3 text-[10px] font-medium transition" :class="active === 'map' ? 'bg-gradient-to-b from-[#303036] to-[#151519] text-white shadow-[0_4px_10px_rgba(22,22,27,0.20)]' : 'text-[#55555d] hover:bg-[#f4f4f7]'">
        <Map :size="15" :stroke-width="1.9" />Map
      </NuxtLink>
      <button type="button" disabled aria-label="Favorites coming later" class="flex h-9 min-w-[66px] cursor-not-allowed items-center justify-center gap-2 rounded-full px-3 text-[10px] font-medium text-[#55555d] opacity-80">
        <Heart :size="15" :stroke-width="1.9" />Favs
      </button>
    </nav>
  </div>
</template>
