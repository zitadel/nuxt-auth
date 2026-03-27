<script setup lang="ts">
import { definePageMeta } from '#imports'

definePageMeta({
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/',
  },
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-3">guest-only</h1>
    <div class="bg-purple-50 border border-purple-100 rounded-lg p-5 mb-6">
      <p class="text-sm text-purple-700 leading-relaxed">
        You are seeing this page because you are <strong>not</strong> signed in.
        Authenticated users are redirected to the home page.
      </p>
    </div>
    <div class="bg-white border border-gray-200 rounded-lg p-5">
      <h2 class="font-semibold text-gray-800 mb-2">How it works</h2>
      <p class="text-sm text-gray-500 leading-relaxed">
        Setting
        <code class="font-mono text-gray-600">unauthenticatedOnly: true</code>
        with <code class="font-mono text-gray-600">navigateAuthenticatedTo: '/'</code>
        means only guests can see this page. If a signed-in user navigates
        here, they are automatically sent to the home page. This pattern is
        ideal for login or registration pages.
      </p>
    </div>
    <nuxt-link to="/" class="inline-block mt-6 text-sm text-blue-600 hover:underline">
      &larr; Back to home
    </nuxt-link>
  </div>
</template>
