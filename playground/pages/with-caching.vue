<script setup lang="ts">
import { definePageMeta, ref, useState } from '#imports'

const clientRenderTime = ref<Date>(new Date())
const serverRenderTime = useState('server-render-date', () => new Date())

definePageMeta({ auth: false })
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-3">SWR cached</h1>
    <div class="bg-amber-50 border border-amber-100 rounded-lg p-5 mb-6">
      <p class="text-sm text-amber-700 leading-relaxed">
        This page is publicly accessible and demonstrates how auth interacts
        with Nuxt's stale-while-revalidate caching.
      </p>
    </div>
    <div class="bg-white border border-gray-200 rounded-lg p-5 mb-6">
      <h2 class="font-semibold text-gray-800 mb-3">Render times</h2>
      <div class="space-y-2 text-sm font-mono">
        <div class="flex justify-between items-center bg-gray-50 rounded p-3">
          <span class="text-gray-500">Server</span>
          <span class="text-gray-800">{{
            serverRenderTime?.toISOString()
          }}</span>
        </div>
        <div class="flex justify-between items-center bg-gray-50 rounded p-3">
          <span class="text-gray-500">Client</span>
          <span class="text-gray-800">{{
            clientRenderTime?.toISOString()
          }}</span>
        </div>
      </div>
    </div>
    <div class="bg-white border border-gray-200 rounded-lg p-5">
      <h2 class="font-semibold text-gray-800 mb-2">How it works</h2>
      <p class="text-sm text-gray-500 leading-relaxed mb-3">
        This route has a
        <code class="font-mono text-gray-600">routeRule</code> with
        <code class="font-mono text-gray-600">swr: 86400000</code> (24 hours)
        and
        <code class="font-mono text-gray-600">disableServerSideAuth: true</code
        >. The server renders the page once and caches it. Subsequent visits
        serve the cached version while revalidating in the background.
      </p>
      <p class="text-sm text-gray-500 leading-relaxed">
        If the server render time stays the same across refreshes but the client
        render time updates, caching is working. The
        <code class="font-mono text-gray-600">disableServerSideAuth</code>
        flag prevents the server from checking auth on cached responses,
        avoiding stale session data in the cache.
      </p>
    </div>
    <nuxt-link
      to="/"
      class="inline-block mt-6 text-sm text-blue-600 hover:underline"
    >
      &larr; Back to home
    </nuxt-link>
  </div>
</template>
