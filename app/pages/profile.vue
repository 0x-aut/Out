<script setup lang="ts">
import { ArrowLeft, Check, Compass, LogOut, MapPin, Plus, Save, Sparkles } from '@lucide/vue'
import { authClient } from '~/lib/auth-client'

useHead({ title: 'Your profile — Out' })

const { data: session, isPending } = authClient.useSession()
const name = ref('')
const bio = ref('')
const homeBase = ref('')
const travelStyle = ref('Curious wanderer')
const selected = ref<string[]>([])
const saving = ref(false)
const saved = ref(false)
const error = ref('')

const interestGroups = [
  { title: 'Places you gravitate towards', hint: 'The places you want to discover', items: ['Hidden gems', 'Local neighbourhoods', 'Museums & galleries', 'Markets', 'Bookshops', 'Parks & gardens', 'Architecture', 'Beaches', 'Historic places', 'Independent shops'] },
  { title: 'Your kind of vibe', hint: 'The atmosphere that makes a place feel right', items: ['Slow & peaceful', 'Creative & artsy', 'Lively & social', 'Romantic', 'Off the beaten path', 'Outdoorsy', 'Cosy & intimate', 'Late-night energy', 'Design-led', 'Local & authentic'] },
  { title: 'Things you love doing', hint: 'Experiences worth leaving home for', items: ['Coffee & bakeries', 'Street food', 'Fine dining', 'Live music', 'Cocktail bars', 'Photography', 'Walking tours', 'Vintage shopping', 'Festivals & events', 'Food markets', 'Nature trails', 'Street art'] }
]

const styles = ['Curious wanderer', 'Slow traveller', 'Culture seeker', 'Food explorer', 'Adventure first', 'Night owl', 'A little bit of everything']

watchEffect(() => {
  const user = session.value?.user
  if (!user) return
  name.value = user.name || ''
  bio.value = String((user as Record<string, unknown>).bio || '')
  homeBase.value = String((user as Record<string, unknown>).homeBase || '')
  travelStyle.value = String((user as Record<string, unknown>).travelStyle || 'Curious wanderer')
  try {
    const interests = JSON.parse(String((user as Record<string, unknown>).interests || '[]'))
    selected.value = Array.isArray(interests) ? interests : []
  } catch {
    selected.value = []
  }
})

function toggleInterest(interest: string) {
  selected.value = selected.value.includes(interest)
    ? selected.value.filter(item => item !== interest)
    : [...selected.value, interest]
  saved.value = false
}

async function saveProfile() {
  error.value = ''
  saved.value = false
  saving.value = true
  const result = await authClient.updateUser({
    name: name.value.trim(),
    bio: bio.value.trim(),
    homeBase: homeBase.value.trim(),
    travelStyle: travelStyle.value,
    interests: JSON.stringify(selected.value)
  })
  saving.value = false
  if (result.error) {
    error.value = result.error.message || 'Your profile could not be saved.'
    return
  }
  saved.value = true
}

async function signOut() {
  await authClient.signOut()
  await navigateTo('/signin')
}
</script>

<template>
  <main class="min-h-dvh bg-[radial-gradient(ellipse_at_50%_0%,#e4e6fb_0%,#eef0fc_42%,#f8f8fc_78%,#fafafd_100%)] px-4 pb-12 pt-5 sm:px-7 sm:pt-8">
    <div class="mx-auto max-w-[760px]">
      <header class="mb-7 flex items-center justify-between gap-3">
        <NuxtLink to="/" class="inline-flex items-center gap-2 text-xs font-semibold text-[#555560] hover:text-[#19191e]"><ArrowLeft :size="15" /> Back to Explore</NuxtLink>
        <button v-if="session" type="button" class="inline-flex h-9 items-center gap-2 rounded-full border border-white bg-white/70 px-3 text-[10px] font-semibold text-[#686873] transition hover:bg-white" @click="signOut"><LogOut :size="13" /> Sign out</button>
      </header>

      <div v-if="isPending" class="rounded-[28px] bg-white/80 p-8 text-center text-sm text-[#777783]">Loading your profile…</div>
      <section v-else-if="!session" class="rounded-[28px] border border-white bg-white/85 p-8 text-center shadow-[0_18px_60px_rgba(39,40,70,0.07)]">
        <Compass :size="28" class="mx-auto text-[#7779c9]" />
        <h1 class="mt-3 text-xl font-bold tracking-tight">Your Out profile</h1>
        <p class="mt-2 text-sm text-[#777783]">Sign in to save your interests and make every discovery feel more like you.</p>
        <NuxtLink to="/signin" class="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#19191e] px-6 text-xs font-semibold text-white">Sign in</NuxtLink>
      </section>

      <template v-else>
        <div class="mb-6">
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#777783]">Your account</p>
          <h1 class="unmodified-font-san mt-1 text-[30px] font-bold tracking-[-0.06em] text-[#19191e]">Make Out feel like you.</h1>
          <p class="mt-2 max-w-[540px] text-[13px] leading-relaxed text-[#777783]">Tell us what you love. We'll use your taste to shape the places, walks and experiences we bring your way.</p>
        </div>

        <div class="mb-5 flex items-center gap-3 rounded-[24px] border border-white/90 bg-white/75 p-4 shadow-[0_8px_24px_rgba(39,40,70,0.04)]">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e9eaff] text-[#5658a6]"><span class="text-lg font-bold">{{ (name || session.user.name || 'O').charAt(0).toUpperCase() }}</span></div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold text-[#25252c]">{{ name || session.user.name }}</p>
            <p class="truncate text-[11px] text-[#858590]">{{ session.user.email }}</p>
          </div>
          <span class="rounded-full bg-[#eeeffb] px-3 py-1.5 text-[9px] font-bold text-[#6668ad]">Out member</span>
        </div>

        <form class="space-y-5" @submit.prevent="saveProfile">
          <section class="rounded-[24px] border border-white/90 bg-white/85 p-5 shadow-[0_8px_24px_rgba(39,40,70,0.04)] sm:p-6">
            <div class="mb-5 flex items-center gap-2"><div class="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eeeffb] text-[#686ac0]"><MapPin :size="16" /></div><div><h2 class="text-sm font-bold text-[#25252c]">The basics</h2><p class="text-[10px] text-[#898994]">A little context about you</p></div></div>
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block text-[11px] font-semibold text-[#4c4c56]">Name<input v-model="name" required maxlength="80" class="mt-2 h-11 w-full rounded-xl border border-[#e8e8ef] bg-[#fafafd] px-3 text-sm font-normal outline-none focus:border-[#9699d9]"></label>
              <label class="block text-[11px] font-semibold text-[#4c4c56]">Home base<input v-model="homeBase" maxlength="100" placeholder="City or neighbourhood" class="mt-2 h-11 w-full rounded-xl border border-[#e8e8ef] bg-[#fafafd] px-3 text-sm font-normal outline-none focus:border-[#9699d9]"></label>
            </div>
            <label class="mt-4 block text-[11px] font-semibold text-[#4c4c56]">A line about you<textarea v-model="bio" maxlength="240" rows="2" placeholder="A little about what you enjoy…" class="mt-2 w-full resize-none rounded-xl border border-[#e8e8ef] bg-[#fafafd] px-3 py-3 text-sm font-normal outline-none focus:border-[#9699d9]"></textarea></label>
            <label class="mt-4 block text-[11px] font-semibold text-[#4c4c56]">Your travel style<select v-model="travelStyle" class="mt-2 h-11 w-full rounded-xl border border-[#e8e8ef] bg-[#fafafd] px-3 text-sm font-normal outline-none focus:border-[#9699d9]"><option v-for="style in styles" :key="style">{{ style }}</option></select></label>
          </section>

          <section class="rounded-[24px] border border-white/90 bg-white/85 p-5 shadow-[0_8px_24px_rgba(39,40,70,0.04)] sm:p-6">
            <div class="mb-5 flex items-center gap-2"><div class="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eeeffb] text-[#686ac0]"><Sparkles :size="16" /></div><div><h2 class="text-sm font-bold text-[#25252c]">Your taste</h2><p class="text-[10px] text-[#898994]">Choose anything that sounds like you. Pick as many as you like.</p></div></div>
            <div v-for="group in interestGroups" :key="group.title" class="mb-6 last:mb-0">
              <h3 class="text-[12px] font-bold text-[#383841]">{{ group.title }}</h3>
              <p class="mb-3 mt-1 text-[10px] text-[#8b8b95]">{{ group.hint }}</p>
              <div class="flex flex-wrap gap-2">
                <button v-for="interest in group.items" :key="interest" type="button" :aria-pressed="selected.includes(interest)" class="inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[10px] font-semibold transition" :class="selected.includes(interest) ? 'border-[#7779c9] bg-[#7779c9] text-white shadow-[0_3px_8px_rgba(95,97,180,0.16)]' : 'border-[#e8e8ef] bg-[#fafafd] text-[#666672] hover:border-[#b7b8df] hover:bg-[#f4f4fc]'" @click="toggleInterest(interest)"><Check v-if="selected.includes(interest)" :size="12" />{{ interest }}</button>
              </div>
            </div>
            <p class="mt-5 text-[10px] text-[#9999a3]">{{ selected.length }} interests selected</p>
          </section>

          <p v-if="error" role="alert" class="rounded-xl bg-red-50 px-4 py-3 text-xs text-red-600">{{ error }}</p>
          <div class="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <p class="text-[10px] text-[#898994]">Your taste can always change as you explore.</p>
            <button type="submit" :disabled="saving" class="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#303036] to-[#151519] px-7 text-xs font-semibold text-white shadow-[0_5px_14px_rgba(22,22,27,0.18)] transition hover:brightness-110 disabled:opacity-60"><Check v-if="saved" :size="15" /><Save v-else :size="15" />{{ saving ? 'Saving…' : saved ? 'Saved' : 'Save profile' }}</button>
          </div>
        </form>
      </template>
    </div>
  </main>
</template>
