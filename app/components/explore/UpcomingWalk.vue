<script setup lang="ts">
import { MapPin } from '@lucide/vue'

defineProps<{
  title: string
  duration: string
  startTime: string
  stops: string
}>()

const emit = defineEmits<{ open: [] }>()
</script>

<template>
  <SmoothCorners
    as="button"
    type="button"
    :corners="{ radius: 22, smoothing: 0.78 }"
    class="grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_104px] items-center gap-3 border border-white/90 bg-white p-3.5 text-left shadow-[0_5px_17px_rgba(36,36,51,0.07)] transition hover:bg-[#fdfdff] sm:grid-cols-[minmax(0,1fr)_126px] sm:p-4"
    @click="emit('open')"
  >
    <div class="min-w-0">
      <h2 class="unmodified-font-san max-w-[250px] text-[21px] font-bold leading-[1.05] tracking-[-0.065em] text-[#17171c] sm:text-[24px]">
        {{ title }}
      </h2>
      <div class="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span class="flex h-7 items-center rounded-full bg-[#19191e] px-2.5 text-[10px] font-semibold text-white">{{ duration }}</span>
        <span class="flex h-7 items-center rounded-full bg-[#f1f1f4] px-2.5 text-[10px] font-semibold text-[#26262c]">{{ startTime }}</span>
      </div>
      <p class="mt-2.5 flex items-center gap-1.5 text-[10px] font-medium text-[#696972] sm:text-[11px]">
        <MapPin :size="13" :stroke-width="1.9" />
        {{ stops }}, kicks off at the Sé
      </p>
    </div>

    <SmoothCorners as="div" :corners="{ radius: 18, smoothing: 0.78 }" class="relative h-[108px] overflow-hidden border border-[#eeedf2] bg-[#f4f3f6] sm:h-[122px]">
      <svg viewBox="0 0 126 122" class="absolute inset-0 h-full w-full" fill="none" aria-label="Walk route preview" role="img">
        <path d="M-8 24 24 5l37 19 43-15 40 12M-12 67l34-20 35 20 28-21 48 15M-5 108l38-27 30 14 28-21 43 31M42-8l-7 33 22 29-12 34 28 35M98-8 84 24l23 25-15 35 25 27" stroke="#dedde4" stroke-width="2" />
        <path d="M22 89c20 2 16-34 38-34s13-31 40-38" stroke="#19191e" stroke-width="2.4" stroke-linecap="round" />
        <path d="M22 89h18c13 0 8-34 20-34s13-38 40-38" stroke="#19191e" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="2 4" />
        <circle cx="22" cy="89" r="6" fill="#347de1" stroke="white" stroke-width="2.5" />
        <circle cx="60" cy="55" r="5.5" fill="#d7b347" stroke="white" stroke-width="2.5" />
        <circle cx="100" cy="17" r="5.5" fill="#d7b347" stroke="white" stroke-width="2.5" />
        <circle cx="80" cy="83" r="5.5" fill="#d7b347" stroke="white" stroke-width="2.5" />
      </svg>
    </SmoothCorners>
  </SmoothCorners>
</template>
