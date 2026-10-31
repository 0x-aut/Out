<script setup lang="ts">
import { ArrowLeft, ArrowRight, Compass } from '@lucide/vue'
import { authClient } from '~/lib/auth-client'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Sign in — Out' })

const email = ref('')
const password = ref('')
const pending = ref(false)
const error = ref('')
const route = useRoute()

async function submit() {
  error.value = ''
  pending.value = true
  const result = await authClient.signIn.email({ email: email.value, password: password.value })
  pending.value = false
  if (result.error) {
    error.value = result.error.message || 'Unable to sign in. Check your details and try again.'
    return
  }
  await navigateTo(typeof route.query.redirect === 'string' ? route.query.redirect : '/')
}
</script>

<template>
  <main class="relative flex min-h-dvh items-center justify-center overflow-hidden px-5 py-12">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#dfe2ff_0%,#eeeffb_48%,#fafafd_100%)]" />
    <NuxtLink to="/" class="absolute left-5 top-5 inline-flex items-center gap-2 text-xs font-semibold text-[#555560] transition hover:text-[#19191e]">
      <ArrowLeft :size="15" /> Back to Out
    </NuxtLink>
    <section class="relative w-full max-w-[390px]">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[17px] bg-[#19191e] text-white shadow-lg shadow-black/10"><Compass :size="23" /></div>
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#777783]">Welcome back</p>
        <h1 class="unmodified-font-san mt-2 text-[30px] font-bold tracking-[-0.065em] text-[#19191e]">Your next out starts here.</h1>
        <p class="mt-2 text-[13px] text-[#777783]">Sign in to pick up where you left off.</p>
      </div>
      <form class="rounded-[28px] border border-white/90 bg-white/85 p-6 shadow-[0_18px_60px_rgba(39,40,70,0.09)] backdrop-blur-xl" @submit.prevent="submit">
        <label class="mb-2 block text-[11px] font-semibold text-[#44444e]" for="email">Email address</label>
        <input id="email" v-model="email" type="email" autocomplete="email" required placeholder="you@example.com" class="mb-4 h-12 w-full rounded-2xl border border-[#e8e8ef] bg-[#fafafd] px-4 text-sm outline-none transition focus:border-[#9699d9] focus:ring-4 focus:ring-[#8588d9]/10">
        <div class="mb-2 flex items-center justify-between">
          <label class="text-[11px] font-semibold text-[#44444e]" for="password">Password</label>
        </div>
        <input id="password" v-model="password" type="password" autocomplete="current-password" required placeholder="Your password" class="h-12 w-full rounded-2xl border border-[#e8e8ef] bg-[#fafafd] px-4 text-sm outline-none transition focus:border-[#9699d9] focus:ring-4 focus:ring-[#8588d9]/10">
        <p v-if="error" role="alert" class="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{{ error }}</p>
        <button type="submit" :disabled="pending" class="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#303036] to-[#151519] text-[14px] font-semibold text-white shadow-[0_5px_14px_rgba(22,22,27,0.18)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">
          {{ pending ? 'Signing in…' : 'Sign in' }} <ArrowRight :size="15" />
        </button>
        <p class="mt-5 text-center text-[11px] text-[#777783]">New to Out? <NuxtLink to="/signup" class="font-bold text-[#4d4f9b] hover:underline">Create an account</NuxtLink></p>
      </form>
      <p class="mt-6 text-center text-[10px] text-[#9999a3]">Find places. Follow your curiosity. Go somewhere.</p>
    </section>
  </main>
</template>
