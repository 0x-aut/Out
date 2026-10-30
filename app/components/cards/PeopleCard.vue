<script setup lang="ts">
</script>

<template>
  <SmoothCorners
    as="article"
    :corners="{ radius: 19, smoothing: 0.78 }"
    class="flex w-full items-center gap-3 border border-white/90 bg-white px-3 py-2.5 text-left shadow-[0_4px_14px_rgba(36,36,51,0.06)] transition hover:bg-[#fdfdff]"
  >
    <div class="flex -space-x-2">
      <img src="https://i.pravatar.cc/64?img=47" alt="Karina" class="h-8 w-8 rounded-full border-2 border-white object-cover" />
      <img src="https://i.pravatar.cc/64?img=12" alt="Tom" class="h-8 w-8 rounded-full border-2 border-white object-cover" />
      <img src="https://i.pravatar.cc/64?img=32" alt="Mia" class="h-8 w-8 rounded-full border-2 border-white object-cover" />
    </div>
    <div class="min-w-0 flex-1">
      <p class="truncate text-[11px] font-semibold text-[#222228]">Karina, Tom <span class="font-medium text-[#777780]">+ 2 more</span></p>
    </div>
    <SmoothCorners as="div" :corners="{ radius: 10, smoothing: 0.78 }" class="h-9 w-12 shrink-0 overflow-hidden">
      <img src="https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=160&h=120&fit=crop" alt="Lisbon street" class="h-full w-full object-cover" />
    </SmoothCorners>
  </SmoothCorners>
</template>
