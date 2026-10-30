<script setup lang="ts">
withDefaults(defineProps<{
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
</script>

<template>
  <SmoothCorners
    as="div"
    :corners="{ radius: 13, smoothing: 0.78 }"
    :style="{ transform: 'rotate(' + rotation + 'deg)', zIndex: layer }"
    class="relative h-[54px] w-[54px] shrink-0 overflow-hidden border-[3px] border-white bg-[#e6e3dd] shadow-[0_3px_8px_rgba(25,25,30,0.16)]"
  >
    <img :src="image" :alt="alt || name" class="h-full w-full object-cover" loading="lazy" />
    <span v-if="!visualOnly" class="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1 py-1 text-center text-[8px] font-semibold text-white">{{ name }}</span>
  </SmoothCorners>
</template>
