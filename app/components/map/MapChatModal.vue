<script setup lang="ts">
import { MessageCircle, X } from '@lucide/vue'

const props = defineProps<{
  modelValue: boolean
  initialPrompt: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [value: string]
}>()

const draft = ref('')

watch(() => [props.modelValue, props.initialPrompt] as const, ([open, prompt]) => {
  if (open) draft.value = prompt
}, { immediate: true })

function close() {
  emit('update:modelValue', false)
}

function save() {
  emit('save', draft.value.trim())
}
</script>

<template>
  <div
    v-if="props.modelValue"
    class="fixed inset-0 z-[60] flex items-end justify-center bg-[#17171c]/30 px-0 pb-0 backdrop-blur-[2px] sm:items-center sm:px-4 sm:py-8"
    @click.self="close"
    @keydown.esc="close"
  >
    <SmoothCorners
      as="section"
      :corners="{ radius: 30, smoothing: 0.82 }"
      aria-labelledby="chat-modal-title"
      class="flex max-h-[86dvh] w-full max-w-[430px] flex-col overflow-hidden border border-white bg-white px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 shadow-[0_12px_38px_rgba(22,22,28,0.22)] sm:pb-5"
    >
      <header class="flex items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-2.5">
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#dff5f5] text-[#299da5]">
            <MessageCircle :size="17" :stroke-width="1.8" />
          </span>
          <div class="min-w-0 text-left">
            <h2 id="chat-modal-title" class="unmodified-font-san text-[17px] font-bold tracking-[-0.045em] text-[#19191e]">Tell me the vibe</h2>
            <p class="text-[10px] text-[#777780]">Shape the kind of walk you want</p>
          </div>
        </div>
        <button type="button" aria-label="Close chat" class="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#55555d] transition hover:bg-[#f2f2f5]" @click="close">
          <X :size="17" />
        </button>
      </header>

      <div class="mt-5 flex-1 overflow-y-auto rounded-[20px] bg-[#f6f6f8] p-3.5 text-left">
        <p class="max-w-[290px] text-[11px] leading-relaxed text-[#64646d]">What would make this walk feel like your kind of day? Tell me what you’re in the mood for.</p>
        <div v-if="draft" class="ml-auto mt-3 max-w-[90%] rounded-[18px] rounded-br-md bg-[#19191e] px-3.5 py-2.5 text-[11px] leading-relaxed text-white">
          {{ draft }}
        </div>
        <p v-else class="mt-3 text-[10px] text-[#96969e]">Your message will appear here.</p>
      </div>

      <form class="mt-3 flex flex-col gap-2.5" @submit.prevent="save">
        <textarea
          v-model="draft"
          rows="3"
          aria-label="Describe your vibe"
          placeholder="A slow afternoon, beautiful views, good coffee..."
          class="w-full resize-none rounded-[18px] border border-[#e8e8ed] bg-white px-3.5 py-3 text-[12px] leading-relaxed text-[#25252b] outline-none placeholder:text-[#92929a] focus:border-[#c9c9d4]"
        />
        <ActionButton block type="submit" :disabled="!draft.trim()">
          Use this vibe
        </ActionButton>
      </form>
    </SmoothCorners>
  </div>
</template>
