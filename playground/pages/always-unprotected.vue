<script setup lang="ts">
import { definePageMeta } from '#imports'

definePageMeta({
  auth: false,
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-3">Always unprotected</h1>
    <div class="bg-amber-50 border border-amber-100 rounded-lg p-5 mb-6">
      <p class="text-sm text-amber-700 leading-relaxed">
        This page is accessible to everyone &mdash; signed in or not. The global
        auth middleware is completely bypassed here.
      </p>
    </div>
    <div class="bg-white border border-gray-200 rounded-lg p-5">
      <h2 class="font-semibold text-gray-800 mb-2">How it works</h2>
      <p class="text-sm text-gray-500 leading-relaxed">
        Setting
        <code class="font-mono text-gray-600"
          >definePageMeta({ auth: false })</code
        >
        tells the middleware to skip this page entirely. Use this for public
        pages like landing pages, terms of service, or marketing content that
        should always be visible regardless of auth state.
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
