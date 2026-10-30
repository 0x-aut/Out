<script setup lang="ts">
import { Coffee, Eye, Building2, Trees, MapPin } from '@lucide/vue'
import type { MapPoint } from '~/types/map'

defineProps<{ point: MapPoint }>()
const emit = defineEmits<{ select: [point: MapPoint] }>()

const iconMap = { view: Eye, cafe: Coffee, architecture: Building2, courtyard: Trees, you: MapPin }
</script>

<template>
  <button
    type="button"
    class="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap text-left transition hover:z-30"
    :style="{ left: `${point.x}%`, top: `${point.y}%` }"
    :aria-label="`Select ${point.name}`"
    @click="emit('select', point)"
  >
    <span
      class="relative grid h-[27px] w-[27px] shrink-0 place-items-center rounded-full border-[2px] border-white shadow-[0_2px_7px_rgba(22,22,28,0.20)] transition"
      :class="point.selected ? 'scale-110 ring-2 ring-[#19191e]/20' : ''"
      :style="{ backgroundColor: point.color }"
    >
      <component :is="iconMap[point.icon]" :size="12" :stroke-width="2" class="text-[#202026]" />
      <span v-if="point.id === 'you'" class="absolute -inset-[5px] rounded-full border-2 border-[#347de1]/35" />
    </span>
    <span class="max-w-[110px] truncate text-[9px] font-semibold text-[#28282e] [text-shadow:0_1px_3px_rgba(255,255,255,0.95)]">{{ point.name }}</span>
  </button>
</template>
