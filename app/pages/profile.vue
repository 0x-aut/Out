<script setup lang="ts">
import { ArrowLeft, Check, Compass, LogOut, MapPin, Save } from '@lucide/vue'
import { authClient } from '~/lib/auth-client'

useHead({ title: 'Your profile — Out' })
const session = authClient.useSession()
const name = ref('')
const bio = ref('')
const homeBase = ref('')
const travelStyle = ref('Curious wanderer')
const selected = ref<string[]>([])
const saving = ref(false)
const saved = ref(false)
const error = ref('')
const profileLoading = ref(true)
const profileReady = ref(false)

const interestGroups = [
  { category: 'places', title: 'Places', hint: 'The places you naturally gravitate towards.', items: ['Hidden gems', 'Local neighbourhoods', 'Museums & galleries', 'Markets', 'Bookshops', 'Parks & gardens', 'Architecture', 'Beaches', 'Historic places', 'Independent shops'] },
  { category: 'vibes', title: 'Atmosphere', hint: 'The feeling that makes somewhere worth staying.', items: ['Slow & peaceful', 'Creative & artsy', 'Lively & social', 'Romantic', 'Off the beaten path', 'Outdoorsy', 'Cosy & intimate', 'Late-night energy', 'Design-led', 'Local & authentic'] },
  { category: 'activities', title: 'Things to do', hint: 'Experiences you would make time for.', items: ['Coffee & bakeries', 'Street food', 'Fine dining', 'Live music', 'Cocktail bars', 'Photography', 'Walking tours', 'Vintage shopping', 'Festivals & events', 'Food markets', 'Nature trails', 'Street art'] }
]
const styles = ['Curious wanderer', 'Slow traveller', 'Culture seeker', 'Food explorer', 'Adventure first', 'Night owl', 'A little bit of everything']

watch(() => session.value.data?.user?.id, async userId => {
  if (!userId) { profileLoading.value = false; profileReady.value = false; return }
  profileLoading.value = true
  profileReady.value = false
  name.value = session.value.data?.user?.name || ''
  try {
    const data = await $fetch<{ profile: { bio: string; homeBase: string; travelStyle: string }; interests: Array<{ name: string; category: string }> }>('/api/profile')
    bio.value = data.profile.bio
    homeBase.value = data.profile.homeBase
    travelStyle.value = data.profile.travelStyle
    selected.value = data.interests.map(item => item.name)
    profileReady.value = true
  } catch { error.value = 'Your profile could not be loaded. Please refresh and try again.' }
  finally { profileLoading.value = false }
}, { immediate: true })

function toggleInterest(value: string) {
  selected.value = selected.value.includes(value) ? selected.value.filter(item => item !== value) : [...selected.value, value]
  saved.value = false
}

async function saveProfile() {
  error.value = ''
  saved.value = false
  saving.value = true
  let nameSaved = false
  try {
    const result = await authClient.updateUser({ name: name.value.trim() })
    if (result.error) throw new Error(result.error.message || 'Your name could not be saved.')
    nameSaved = true
    const interests = interestGroups.flatMap(group => group.items.filter(item => selected.value.includes(item)).map(name => ({ name, category: group.category })))
    await $fetch('/api/profile', { method: 'PUT', body: { profile: { bio: bio.value.trim(), homeBase: homeBase.value.trim(), travelStyle: travelStyle.value }, interests } })
    saved.value = true
  } catch {
    error.value = nameSaved ? 'Your name was saved, but the rest of your profile could not be saved. Please try again.' : 'Your profile could not be saved. Please try again.'
  } finally { saving.value = false }
}

async function signOut() {
  await authClient.signOut()
  await navigateTo('/signin')
}
</script>

<template>
  <main class="min-h-dvh bg-[radial-gradient(ellipse_at_50%_0%,#e4e6fb_0%,#eef0fc_42%,#f8f8fc_78%,#fafafd_100%)] px-4 pb-12 pt-5 sm:px-7 sm:pt-8">
    <div class="mx-auto max-w-[960px]">
      <header class="mb-8 flex items-center justify-between gap-3">
        <NuxtLink to="/" class="inline-flex h-9 items-center gap-2 rounded-full px-2 text-[11px] font-semibold text-[#4c4c55] transition hover:bg-white/70 hover:text-[#19191e]"><ArrowLeft :size="15" /> Explore</NuxtLink>
        <button v-if="session.data" type="button" class="inline-flex h-9 items-center gap-2 rounded-full border border-white/90 bg-white/75 px-3.5 text-[10px] font-semibold text-[#45454d] transition hover:bg-white" @click="signOut"><LogOut :size="13" /> Sign out</button>
      </header>

      <section v-if="session.isPending" class="rounded-[28px] border border-white/90 bg-white/90 p-10 text-center text-sm text-[#777780] shadow-[0_14px_40px_rgba(35,35,55,0.05)]">Loading your profile…</section>
      <section v-else-if="!session.data" class="mx-auto max-w-[520px] rounded-[28px] border border-white/90 bg-white/90 px-7 py-12 text-center shadow-[0_14px_40px_rgba(35,35,55,0.06)] sm:px-12">
        <div class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#19191e] text-white"><Compass :size="23" :stroke-width="1.7" /></div>
        <p class="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-[#85858d]">Out account</p>
        <h1 class="unmodified-font-san mt-2 text-[27px] font-bold tracking-[-0.055em] text-[#19191e]">Your profile, your point of view.</h1>
        <p class="mx-auto mt-3 max-w-[340px] text-[12px] leading-[1.8] text-[#777780]">Sign in to save the places, experiences and little details that make a day out feel like yours.</p>
        <NuxtLink to="/signin" class="mt-7 inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-b from-[#303036] to-[#151519] px-7 text-[11px] font-semibold text-white shadow-[0_5px_14px_rgba(22,22,27,0.18)] transition hover:brightness-110">Sign in</NuxtLink>
      </section>

      <template v-else>
        <div class="mb-6 flex flex-col justify-between gap-3 sm:mb-7 sm:flex-row sm:items-end">
          <div><p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#777780]">Your account</p><h1 class="unmodified-font-san mt-1 text-[30px] font-bold tracking-[-0.06em] text-[#19191e] sm:text-[34px]">Your profile</h1><p class="mt-1.5 max-w-[520px] text-[12px] leading-relaxed text-[#777780]">A little about you, and a lot about the places you love.</p></div>
          <p class="text-[10px] text-[#898991]">Your details shape what Out recommends.</p>
        </div>

        <form class="overflow-hidden rounded-[28px] border border-white/90 bg-white/90 shadow-[0_16px_48px_rgba(35,35,55,0.07)] backdrop-blur-xl" @submit.prevent="saveProfile">
          <div class="flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:px-8 sm:py-7">
            <div class="grid h-[68px] w-[68px] shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#303036] to-[#151519] text-[25px] font-semibold tracking-[-0.06em] text-white shadow-[0_5px_14px_rgba(22,22,27,0.16)]">{{ (name || session.data.user.name || 'O').charAt(0).toUpperCase() }}</div>
            <div class="min-w-0 flex-1"><p class="text-[10px] font-bold uppercase tracking-[0.16em] text-[#898991]">Out member</p><p class="mt-1 truncate text-[20px] font-semibold tracking-[-0.045em] text-[#19191e]">{{ name || session.data.user.name }}</p><p class="mt-1 truncate text-[11px] text-[#777780]">{{ session.data.user.email }}</p></div>
            <div class="flex items-center gap-2 self-start rounded-full bg-[#f3f3f6] px-3 py-2 text-[10px] font-medium text-[#62626b] sm:self-center"><MapPin :size="12" />{{ homeBase || 'Add your home base' }}</div>
          </div>
          <div class="h-px bg-[#ededf0]"></div>

          <div class="grid lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
            <section class="px-5 py-7 sm:px-8 sm:py-8 lg:border-r lg:border-[#ededf0]">
              <div class="mb-6"><p class="text-[10px] font-bold uppercase tracking-[0.16em] text-[#898991]">01 / About</p><h2 class="mt-1.5 text-[17px] font-semibold tracking-[-0.04em] text-[#202027]">The basics</h2><p class="mt-1 text-[11px] leading-relaxed text-[#85858d]">The details people and places can know you by.</p></div>
              <div class="space-y-5">
                <label class="block"><span class="text-[11px] font-semibold text-[#42424a]">Name</span><input v-model="name" required maxlength="80" autocomplete="name" class="mt-2 h-11 w-full rounded-xl border border-[#e7e7eb] bg-[#fbfbfc] px-3.5 text-[12px] text-[#202027] outline-none transition placeholder:text-[#a0a0a8] focus:border-[#777780] focus:bg-white"></label>
                <label class="block"><span class="text-[11px] font-semibold text-[#42424a]">Home base</span><input v-model="homeBase" maxlength="100" autocomplete="address-level2" placeholder="City or neighbourhood" class="mt-2 h-11 w-full rounded-xl border border-[#e7e7eb] bg-[#fbfbfc] px-3.5 text-[12px] text-[#202027] outline-none transition placeholder:text-[#a0a0a8] focus:border-[#777780] focus:bg-white"></label>
                <label class="block"><span class="text-[11px] font-semibold text-[#42424a]">About you</span><textarea v-model="bio" maxlength="240" rows="4" placeholder="What do you enjoy? What are you always curious about?" class="mt-2 w-full resize-y rounded-xl border border-[#e7e7eb] bg-[#fbfbfc] px-3.5 py-3 text-[12px] leading-relaxed text-[#202027] outline-none transition placeholder:text-[#a0a0a8] focus:border-[#777780] focus:bg-white"></textarea><span class="mt-1.5 block text-right text-[9px] text-[#a0a0a8]">{{ bio.length }}/240</span></label>
                <label class="block"><span class="text-[11px] font-semibold text-[#42424a]">Travel style</span><select v-model="travelStyle" class="mt-2 h-11 w-full appearance-none rounded-xl border border-[#e7e7eb] bg-[#fbfbfc] px-3.5 text-[12px] text-[#202027] outline-none transition focus:border-[#777780] focus:bg-white"><option v-for="style in styles" :key="style">{{ style }}</option></select></label>
              </div>
            </section>

            <section class="px-5 py-7 sm:px-8 sm:py-8">
              <div class="mb-6"><p class="text-[10px] font-bold uppercase tracking-[0.16em] text-[#898991]">02 / Your taste</p><div class="mt-1.5 flex items-end justify-between gap-3"><div><h2 class="text-[17px] font-semibold tracking-[-0.04em] text-[#202027]">What feels like you?</h2><p class="mt-1 text-[11px] leading-relaxed text-[#85858d]">Choose the things you would happily go out of your way for.</p></div><span class="shrink-0 rounded-full bg-[#19191e] px-3 py-1.5 text-[9px] font-semibold tabular-nums text-white">{{ selected.length }} selected</span></div></div>
              <div class="space-y-7">
                <div v-for="group in interestGroups" :key="group.category">
                  <div class="mb-3"><h3 class="text-[12px] font-semibold text-[#303038]">{{ group.title }}</h3><p class="mt-1 text-[10px] text-[#898991]">{{ group.hint }}</p></div>
                  <div class="flex flex-wrap gap-2">
                    <button v-for="interest in group.items" :key="interest" type="button" :aria-pressed="selected.includes(interest)" class="inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-[10px] font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19191e] focus-visible:ring-offset-2" :class="selected.includes(interest) ? 'border-[#19191e] bg-gradient-to-b from-[#303036] to-[#151519] text-white shadow-[0_3px_9px_rgba(22,22,27,0.16)]' : 'border-[#e4e4e8] bg-white text-[#45454d] hover:border-[#9a9aa1] hover:bg-[#f8f8fa]'" @click="toggleInterest(interest)"><Check v-if="selected.includes(interest)" :size="11" :stroke-width="2.5" />{{ interest }}</button>
                  </div>
                </div>
              </div>
              <p class="mt-7 border-t border-[#ededf0] pt-4 text-[10px] leading-relaxed text-[#898991]">Your interests are private to your account and help shape your recommendations.</p>
            </section>
          </div>

          <div class="flex flex-col gap-3 border-t border-[#ededf0] bg-[#fcfcfd] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div class="min-h-[18px]"><p v-if="error" role="alert" class="text-[11px] font-medium text-[#b33d3d]">{{ error }}</p><p v-else-if="saved" role="status" class="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#4e6856]"><Check :size="13" /> Changes saved</p><p v-else class="text-[10px] text-[#898991]">You can update these details whenever you like.</p></div>
            <button type="submit" :disabled="saving || !profileReady" class="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#303036] to-[#151519] px-7 text-[11px] font-semibold text-white shadow-[0_5px_14px_rgba(22,22,27,0.18)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"><Check v-if="saved && !saving" :size="14" /><Save v-else :size="14" />{{ saving ? 'Saving…' : profileLoading ? 'Loading profile…' : !profileReady ? 'Profile unavailable' : saved ? 'Saved' : 'Save changes' }}</button>
          </div>
        </form>
      </template>
    </div>
  </main>
</template>
