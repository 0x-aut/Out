<script setup lang="ts">
const router = useRouter()
const vibe = ref('')

useHead({ title: 'Explore — Out' })

const walks = [
  { id: 'bica', title: 'Bica down to the river', duration: '1 h 10', stops: '4 stops', distance: '8 min from you, ends at Cais do Sodré', image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&h=900&fit=crop', position: 'center 54%' },
  { id: 'sunset', title: 'Sunset over the rooftops', duration: '1 h 45', stops: '5 stops', distance: '3 min from you', image: 'https://images.unsplash.com/photo-1506377585622-bedcbb027afc?w=800&h=900&fit=crop', position: 'center 52%' },
  { id: 'tiles', title: 'Tiles, tarts & tiny streets', duration: '55 min', stops: '3 stops', distance: '11 min from you', image: 'https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=800&h=900&fit=crop', position: 'center 54%' }
]

function startFromVibe() {
  const query = vibe.value.trim()
  router.push({ path: '/map', query: { ...(query ? { vibe: query } : {}), mode: 'chat' } })
}

function openWalk(id: string) {
  router.push({ path: '/map', query: { walk: id } })
}
</script>

<template>
  <main class="min-h-dvh overflow-hidden bg-[radial-gradient(ellipse_at_50%_0%,#e4e6fb_0%,#eef0fc_42%,#f8f8fc_78%,#fafafd_100%)] pb-24">
    <div class="mx-auto max-w-[1080px] px-4 pb-10 pt-5 sm:px-7 sm:pt-7 lg:px-10 lg:pt-9">
      <header class="mb-5 flex items-center justify-between gap-3 sm:mb-6">
        <div class="min-w-0">
          <h1 class="unmodified-font-san text-[20px] font-bold leading-tight tracking-[-0.055em] text-[#19191e] sm:text-[22px]">Alfama? Say less</h1>
        </div>
        <NuxtLink to="/signin" aria-label="Your profile" class="h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-[0_2px_8px_rgba(20,20,28,0.14)]">
          <img src="https://i.pravatar.cc/100?img=12" alt="Profile" class="h-full w-full object-cover" />
        </NuxtLink>
      </header>

      <div class="mb-6 sm:mb-7">
        <ExplorePrompt v-model="vibe" @submit="startFromVibe" />
      </div>

      <div class="grid gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-8">
        <section aria-labelledby="up-next-heading" class="min-w-0">
          <div class="mb-2.5 flex items-center justify-between">
            <h2 id="up-next-heading" class="unmodified-font-san text-[12px] font-semibold text-[#41414a]">Up next</h2>
          </div>
          <UpcomingWalk title="Alfama back streets tour" duration="1 h 25" start-time="Today 17:30" stops="4 stops" @open="openWalk('alfama')" />
        </section>

        <section aria-labelledby="walks-heading" class="min-w-0">
          <div class="mb-2.5 flex items-center justify-between gap-3">
            <h2 id="walks-heading" class="unmodified-font-san text-[12px] font-semibold text-[#41414a]">Walks near you</h2>
            <NuxtLink to="/map" class="flex h-8 items-center gap-1 rounded-full px-2 text-[11px] font-semibold text-[#33333a] transition hover:bg-white/70">
              See all <span aria-hidden="true">›</span>
            </NuxtLink>
          </div>
          <div class="hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-pl-6 px-6 pb-2 sm:mx-0 sm:px-2">
            <WalkCard v-for="walk in walks" :key="walk.id" :walk="walk" @select="openWalk" />
          </div>
        </section>

        <section aria-labelledby="people-heading" class="min-w-0 lg:col-span-2">
          <div class="mb-2.5 flex items-center justify-between">
            <h2 id="people-heading" class="unmodified-font-san text-[12px] font-semibold text-[#41414a]">Your people were here</h2>
          </div>
          <PeopleCard />
        </section>
      </div>
    </div>

    <BottomNavigation active="explore" />
  </main>
</template>
