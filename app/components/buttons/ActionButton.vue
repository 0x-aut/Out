<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'light'
  type?: 'button' | 'submit' | 'reset'
  block?: boolean
  disabled?: boolean
}>(), {
  variant: 'primary',
  type: 'button',
  block: false,
  disabled: false
})
</script>

<template>
  <SmoothCorners
    as="button"
    :corners="{ radius: 18, smoothing: 0.78 }"
    :type="type"
    :disabled="disabled"
    :class="[
      'inline-flex h-8 items-center justify-center gap-2 px-4 text-[11px] font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
      block ? 'w-full' : '',
      variant === 'primary'
        ? 'bg-gradient-to-b from-[#303036] to-[#151519] text-white shadow-[0_4px_10px_rgba(22,22,27,0.20)] hover:from-[#393940] hover:to-[#202025]'
        : 'border border-[#e7e7ec] bg-white text-[#19191e] hover:bg-[#fafafd]'
    ]"
  >
    <slot />
  </SmoothCorners>
</template>
