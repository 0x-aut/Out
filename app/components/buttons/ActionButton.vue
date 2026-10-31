<script setup lang="ts">
import { useSmoothCorners } from '@lisse/vue'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'light'
  type?: 'button' | 'submit' | 'reset'
  block?: boolean
  disabled?: boolean
}>(), { variant: 'primary', type: 'button', block: false, disabled: false })

const button = ref<HTMLElement | null>(null)
useSmoothCorners(button, { radius: 22, smoothing: 0.78 }, {
  effects: props.variant === 'primary'
    ? { shadow: { offsetX: 0, offsetY: 4, blur: 10, spread: 0, color: '#16161b', opacity: 0.20 } }
    : { innerBorder: { width: 1, color: '#e7e7ec', opacity: 1 } },
  autoEffects: false
})
</script>

<template>
  <button ref="button" :type="props.type" :disabled="props.disabled" :class="[
    'inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[13px] font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
    props.block ? 'w-full' : '',
    props.variant === 'primary'
      ? 'bg-gradient-to-b from-[#303036] to-[#151519] text-white hover:from-[#393940] hover:to-[#202025]'
      : 'bg-white text-[#19191e] hover:bg-[#fafafd]'
  ]">
    <slot />
  </button>
</template>
