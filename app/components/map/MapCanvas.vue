<script setup lang="ts">
import type { MapPoint } from '~/types/map'

defineProps<{ points: MapPoint[] }>()
const emit = defineEmits<{ select: [point: MapPoint] }>()
</script>

<template>
  <div class="absolute inset-0 overflow-hidden bg-[#efefec]" aria-label="Map preview">
    <div class="absolute inset-0 opacity-60" style="background-image: radial-gradient(#d9d9d4 0.7px, transparent 0.7px); background-size: 17px 17px;" />
    <svg viewBox="0 0 900 900" preserveAspectRatio="xMidYMid slice" class="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
      <path d="M-80 150 210 55 420 130 700 20 970 90M-60 290 180 185 380 245 610 135 960 220M-90 450 150 350 360 420 560 310 980 390M-70 615 180 500 390 570 670 465 960 545M-80 800 150 685 380 750 650 640 980 730" stroke="#d9dad5" stroke-width="18" />
      <path d="M80-40 160 180 110 390 230 590 160 940M300-40 360 160 300 380 430 580 390 940M520-40 590 170 525 390 650 580 590 940M740-40 810 160 750 380 860 600 830 940" stroke="#dcdcd7" stroke-width="15" />
      <path d="M-60 70 220 15 440 90 690-5 980 70M-50 365 170 265 390 330 620 230 970 315M-50 560 170 455 390 520 625 415 970 500M-40 750 165 650 390 710 630 610 980 700" stroke="#fff" stroke-width="7" />
      <path d="M120-20 205 180 155 380 275 575 215 930M345-20 405 160 350 380 475 575 445 930M565-20 635 160 575 380 700 575 675 930M785-20 855 160 800 380 915 575 895 930" stroke="#fff" stroke-width="6" />
      <path d="M20 210 180 150l110 60-80 100-170-15M560 90l135-40 75 95-80 90-160-30M400 655l155-80 120 80-70 140-180-10" fill="#e8e9e3" stroke="#e0e1db" stroke-width="3" />
      <path d="M650 250 760 210 820 290 780 365 660 340Z" fill="#e4e9df" />
      <path d="M-30 540 70 500 160 570 110 665 0 650Z" fill="#e4e9df" />
      <path d="M250 340c65-18 80 16 120 4s55-48 100-38" stroke="#d2d3cd" stroke-width="5" stroke-linecap="round" />
    </svg>

    <div class="absolute left-[9%] top-[28%] h-2 w-2 rounded-full bg-[#70c88d] shadow-[0_0_0_3px_rgba(255,255,255,0.75)]" />
    <div class="absolute left-[35%] top-[38%] h-2 w-2 rounded-full bg-[#6fc5dc] shadow-[0_0_0_3px_rgba(255,255,255,0.75)]" />
    <div class="absolute left-[68%] top-[49%] h-2 w-2 rounded-full bg-[#e58bc0] shadow-[0_0_0_3px_rgba(255,255,255,0.75)]" />
    <div class="absolute left-[78%] top-[25%] h-2 w-2 rounded-full bg-[#75c88f] shadow-[0_0_0_3px_rgba(255,255,255,0.75)]" />

    <MapPin
      v-for="point in points"
      :key="point.id"
      :point="point"
      @select="emit('select', $event)"
    />
  </div>
</template>
