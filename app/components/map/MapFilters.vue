<script setup lang="ts">
import { Trees, Eye, Coffee, Building2 } from '@lucide/vue'

const props = defineProps<{ active: string[] }>()
const emit = defineEmits<{ toggle: [category: string] }>()

const filters = [
  { label: 'Courtyards', icon: Trees },
  { label: 'Views', icon: Eye },
  { label: 'Cafés', icon: Coffee },
  { label: 'Arch', full: 'Architecture', icon: Building2 }
]
</script>

<template>
  <div class="hide-scrollbar flex max-w-full gap-1.5 overflow-x-auto pb-0.5">
    <SmoothCorners
      v-for="filter in filters"
      :key="filter.label"
      as="button"
      :corners="{ radius: 18, smoothing: 0.78 }"
      type="button"
      :aria-pressed="props.active.includes(filter.full || filter.label)"
      class="inline-flex h-8 shrink-0 items-center gap-1.5 px-3 text-[10px] font-semibold transition active:scale-[0.98]"
      :class="props.active.includes(filter.full || filter.label)
        ? 'bg-gradient-to-b from-[#303036] to-[#151519] text-white shadow-[0_4px_10px_rgba(22,22,27,0.20)]'
        : 'border border-white/90 bg-white/95 text-[#55555d] shadow-[0_2px_7px_rgba(24,24,28,0.09)]'"
      @click="emit('toggle', filter.full || filter.label)"
    >
      <component :is="filter.icon" :size="12" :stroke-width="2" />
      {{ filter.label }}
    </SmoothCorners>
  </div>
</template>
