<script setup lang="ts">
import { useAuth } from '#imports'

const {
  data,
  status,
  lastRefreshedAt,
  getCsrfToken,
  getProviders,
  getSession,
  signIn,
  signOut,
} = useAuth()

const providers = await getProviders()
const csrfToken = await getCsrfToken()
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans text-gray-700">
    <header class="bg-white shadow-sm">
      <div
        class="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between"
      >
        <nuxt-link to="/" class="font-bold text-gray-900 tracking-tight">
          NuxtAuth
          <span class="text-gray-400 font-normal text-sm ml-1">playground</span>
        </nuxt-link>
        <div class="flex items-center gap-4">
          <details class="relative text-xs text-gray-400 group">
            <summary class="cursor-pointer hover:text-gray-600 list-none">
              debug
            </summary>
            <div
              class="absolute right-0 mt-2 z-50 w-96 bg-white border border-gray-200 rounded-lg shadow-xl p-4 space-y-2 text-xs"
            >
              <pre
                class="bg-gray-50 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all"
              >
Status: {{ status }}</pre
              >
              <pre
                class="bg-gray-50 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all"
              >
Data: {{ data || 'none' }}</pre
              >
              <pre class="bg-gray-50 rounded p-2 overflow-x-auto">
Refreshed: {{ lastRefreshedAt || 'never' }}</pre
              >
              <pre class="bg-gray-50 rounded p-2 overflow-x-auto">
CSRF: {{ csrfToken }}</pre
              >
              <pre
                class="bg-gray-50 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all"
              >
Providers: {{ providers }}</pre
              >
            </div>
          </details>

          <details v-if="status === 'authenticated'" class="relative">
            <summary
              class="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 rounded-full hover:bg-gray-200 transition cursor-pointer list-none select-none"
            >
              <span class="w-2 h-2 bg-green-400 rounded-full" />
              {{ data?.user?.name || 'Signed in' }}
              <svg
                class="w-3 h-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            <div
              class="absolute right-0 mt-2 z-50 w-48 bg-white border border-gray-200 rounded-lg shadow-xl py-1"
            >
              <nuxt-link
                to="/dashboard"
                class="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Dashboard
              </nuxt-link>
              <button
                class="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                @click="getSession({ required: false })"
              >
                Refresh session
              </button>
              <div class="border-t border-gray-100 my-1" />
              <button
                class="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                @click="signOut({ callbackUrl: '/signout' })"
              >
                Sign out
              </button>
            </div>
          </details>

          <details v-else class="relative">
            <summary
              class="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition cursor-pointer list-none select-none"
            >
              Sign in
              <svg
                class="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            <div
              class="absolute right-0 mt-2 z-50 w-60 bg-white border border-gray-200 rounded-lg shadow-xl py-1"
            >
              <button
                class="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                @click="signIn(undefined, { callbackUrl: '/dashboard' })"
              >
                Sign in with provider
              </button>
              <nuxt-link
                to="/custom-signin"
                class="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Sign in with credentials
              </nuxt-link>
              <div class="border-t border-gray-100 my-1" />
              <button
                class="block w-full text-left px-4 py-2.5 text-xs text-gray-400 hover:bg-gray-50"
                @click="
                  signIn(undefined, { callbackUrl: '/protected/globally' })
                "
              >
                Sign in &amp; redirect to protected page
              </button>
            </div>
          </details>
        </div>
      </div>
    </header>
    <main class="max-w-5xl mx-auto px-6 py-10">
      <slot />
    </main>
  </div>
</template>
