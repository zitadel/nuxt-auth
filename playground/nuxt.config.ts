export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  modules: ['../src/module.ts'],
  app: {
    head: {
      script: [{ src: 'https://cdn.tailwindcss.com' }],
    },
  },
  auth: {
    provider: {
      type: 'authjs',
      trustHost: true,
    },
    baseURL: '/api/auth',
    sessionRefresh: {
      enablePeriodically: 3000,
      enableOnWindowFocus: true,
    },
  },
  routeRules: {
    '/with-caching': {
      swr: 86400000,
      auth: {
        disableServerSideAuth: true,
      },
    },
  },
})
