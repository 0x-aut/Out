<script setup lang="ts">
defineProps<{
  name: string
  image: string
  alt?: string
  visualOnly?: boolean
}>()
</script>

<template>
  <SmoothCorners
    as="div"
    :corners="{ radius: 15, smoothing: 0.78 }"
    class="relative h-[56px] w-[56px] shrink-0 overflow-hidden border border-white/80 bg-[#e6e3dd] shadow-[0_2px_6px_rgba(25,25,30,0.12)]"
  >
    <img :src="image" :alt="alt || name" class="h-full w-full object-cover" loading="lazy" />
    <span v-if="!visualOnly" class="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1 py-1 text-center text-[8px] font-semibold text-white">{{ name }}</span>
  </SmoothCorners>
</template>
