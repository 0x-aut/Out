import { SmoothCorners } from '@lisse/vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('SmoothCorners', SmoothCorners)
})