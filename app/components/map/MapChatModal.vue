<script setup lang="ts">
import { ArrowUp, X } from '@lucide/vue'
import { useSmoothCorners } from '@lisse/vue'

const props = defineProps<{ modelValue: boolean; initialPrompt: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; save: [value: string] }>()
const panel = ref<HTMLElement | null>(null)
const input = ref('')

useSmoothCorners(panel, { radius: 28, smoothing: 0.82 }, {
  effects: {
    innerBorder: { width: 1, color: '#ffffff', opacity: 1 },
    shadow: { offsetX: 0, offsetY: -8, blur: 32, spread: 0, color: '#16161c', opacity: 0.18 }
  }
})

watch(() => [props.modelValue, props.initialPrompt] as const, ([open, prompt]) => {
  if (open) input.value = prompt
}, { immediate: true })

function close() { emit('update:modelValue', false) }
function submit() {
  const value = input.value.trim()
  if (!value) return
  emit('save', value)
}
</script>

<template>
  <div v-if="props.modelValue" class="fixed inset-0 z-[60] flex items-end justify-center bg-[#17171c]/30 px-0 pb-0 backdrop-blur-[2px]" @click.self="close" @keydown.esc="close">
    <section ref="panel" aria-label="Ask Out" class="w-full max-w-[560px] rounded-t-[28px] bg-white px-4 pb-[max(18px,env(safe-area-inset-bottom))] pt-3.5 sm:px-5">
      <div class="mx-auto mb-3 h-1 w-9 rounded-full bg-[#e6e6eb]" />
      <form class="flex items-end gap-2" @submit.prevent="submit">
        <div class="min-h-[48px] min-w-0 flex-1 rounded-[23px] border border-[#e8e8ed] bg-[#f8f8fa] px-4 py-3">
          <textarea v-model="input" rows="1" aria-label="Message Out" placeholder="Ask Out anything..." class="block max-h-32 min-h-[22px] w-full resize-none bg-transparent text-[13px] leading-[22px] text-[#25252b] outline-none placeholder:text-[#92929a]" @keydown.enter.exact.prevent="submit" />
        </div>
        <button type="submit" aria-label="Send message" :disabled="!input.trim()" class="mb-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#303036] to-[#151519] text-white shadow-[0_4px_10px_rgba(22,22,27,0.20)] transition active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40">
          <ArrowUp :size="19" :stroke-width="2.2" />
        </button>
        <button type="button" aria-label="Close Ask Out" class="mb-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#777780] transition hover:bg-[#f2f2f5]" @click="close"><X :size="16" /></button>
      </form>
    </section>
  </div>
</template>
