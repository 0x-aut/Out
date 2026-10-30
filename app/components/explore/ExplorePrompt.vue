<script setup lang="ts">
import { ArrowUpRight, Sparkles } from '@lucide/vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
}>()

function updateValue(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <form @submit.prevent="emit('submit')" class="w-full">
    <SmoothCorners
      as="div"
      :corners="{ radius: 28, smoothing: 0.8 }"
      class="flex h-[48px] items-center gap-2.5 border border-white bg-white pl-2.5 pr-2 shadow-[0_7px_18px_rgba(39,39,57,0.12)]"
    >
      <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#dff5f5] text-[#299da5]">
        <Sparkles :size="16" :stroke-width="1.8" />
      </span>
      <input
        :value="props.modelValue"
        aria-label="Describe the kind of walk you want"
        class="h-full min-w-0 flex-1 bg-transparent text-[12px] font-medium text-[#25252b] outline-none placeholder:text-[#777780]"
        placeholder="Tell me the vibe, I’ll plan the walk"
        @input="updateValue"
      />
      <button
        type="submit"
        aria-label="Plan a walk"
        class="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#777780] transition hover:bg-[#f1f1f5] hover:text-[#19191e]"
      >
        <ArrowUpRight :size="16" :stroke-width="2" />
      </button>
    </SmoothCorners>
  </form>
</template>
