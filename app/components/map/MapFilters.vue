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
    <button
      v-for="filter in filters"
      :key="filter.label"
      type="button"
      :aria-pressed="props.active.includes(filter.full || filter.label)"
      class="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[10px] font-semibold transition"
      :class="props.active.includes(filter.full || filter.label) ? 'bg-[#19191e] text-white shadow-[0_2px_5px_rgba(20,20,24,0.14)]' : 'bg-white/90 text-[#55555d] shadow-sm'"
      @click="emit('toggle', filter.full || filter.label)"
    >
      <component :is="filter.icon" :size="12" :stroke-width="2" />
      {{ filter.label }}
    </button>
  </div>
</template>
