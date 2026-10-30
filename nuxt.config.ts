import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/fonts', '@nuxt/image', '@nuxt/scripts'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],
  runtimeConfig: {
    public: {
      // A browser-visible token is required by Mapbox GL JS. Never expose MAPBOX_API_KEY here.
      mapboxToken: process.env.NUXT_PUBLIC_MAPBOX_TOKEN
        || (process.env.MAPBOX_API_KEY?.startsWith('pk.') ? process.env.MAPBOX_API_KEY : '')
    }
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  app: {
    head: {
      title: 'Out — Find your way out',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#eeeffb' },
        { name: 'description', content: 'Find walks, places and little moments that fit your taste.' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&display=swap' }
      ]
    }
  }
})
