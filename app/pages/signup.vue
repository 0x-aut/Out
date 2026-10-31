<script setup lang="ts">
import { ArrowLeft, ArrowRight, Compass } from '@lucide/vue'
import { authClient } from '~/lib/auth-client'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Create an account — Out' })

const name = ref('')
const email = ref('')
const password = ref('')
const pending = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  pending.value = true
  const result = await authClient.signUp.email({
    name: name.value.trim(),
    email: email.value.trim(),
    password: password.value
  })
  pending.value = false
  if (result.error) {
    error.value = result.error.message || 'Unable to create your account. Try again.'
    return
  }
  await navigateTo('/profile?setup=1')
}
</script>

<template>
  <main class="relative flex min-h-dvh items-center justify-center overflow-hidden px-5 py-12">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#dfe2ff_0%,#eeeffb_48%,#fafafd_100%)]" />
    <NuxtLink to="/" class="absolute left-5 top-5 inline-flex items-center gap-2 text-xs font-semibold text-[#555560] transition hover:text-[#19191e]">
      <ArrowLeft :size="15" /> Back to Out
    </NuxtLink>
    <section class="relative w-full max-w-[410px]">
      <div class="mb-7 text-center">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[17px] bg-[#19191e] text-white shadow-lg shadow-black/10"><Compass :size="23" /></div>
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#777783]">Make room for more</p>
        <h1 class="unmodified-font-san mt-2 text-[30px] font-bold tracking-[-0.065em] text-[#19191e]">Find your kind of somewhere.</h1>
        <p class="mt-2 text-[13px] text-[#777783]">Create an account and let Out learn what you love.</p>
      </div>
      <form class="rounded-[28px] border border-white/90 bg-white/85 p-6 shadow-[0_18px_60px_rgba(39,40,70,0.09)] backdrop-blur-xl" @submit.prevent="submit">
        <label for="name" class="mb-2 block text-[11px] font-semibold text-[#44444e]">Your name</label>
        <input id="name" v-model="name" autocomplete="name" required maxlength="80" placeholder="What should we call you?" class="mb-4 h-12 w-full rounded-2xl border border-[#e8e8ef] bg-[#fafafd] px-4 text-sm outline-none transition focus:border-[#9699d9] focus:ring-4 focus:ring-[#8588d9]/10">
        <label for="email" class="mb-2 block text-[11px] font-semibold text-[#44444e]">Email address</label>
        <input id="email" v-model="email" type="email" autocomplete="email" required placeholder="you@example.com" class="mb-4 h-12 w-full rounded-2xl border border-[#e8e8ef] bg-[#fafafd] px-4 text-sm outline-none transition focus:border-[#9699d9] focus:ring-4 focus:ring-[#8588d9]/10">
        <label for="password" class="mb-2 block text-[11px] font-semibold text-[#44444e]">Password</label>
        <input id="password" v-model="password" type="password" autocomplete="new-password" minlength="8" required placeholder="At least 8 characters" class="h-12 w-full rounded-2xl border border-[#e8e8ef] bg-[#fafafd] px-4 text-sm outline-none transition focus:border-[#9699d9] focus:ring-4 focus:ring-[#8588d9]/10">
        <p v-if="error" role="alert" class="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{{ error }}</p>
        <button type="submit" :disabled="pending" class="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#303036] to-[#151519] text-[14px] font-semibold text-white shadow-[0_5px_14px_rgba(22,22,27,0.18)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">
          {{ pending ? 'Creating your account…' : 'Create account' }} <ArrowRight :size="15" />
        </button>
        <p class="mt-5 text-center text-[11px] text-[#777783]">Already have an account? <NuxtLink to="/signin" class="font-bold text-[#4d4f9b] hover:underline">Sign in</NuxtLink></p>
      </form>
      <p class="mt-5 text-center text-[10px] text-[#9999a3]">By continuing, you agree to use Out respectfully.</p>
    </section>
  </main>
</template>
