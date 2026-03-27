<script setup lang="ts">
import { definePageMeta } from '#imports'

definePageMeta({
  middleware: 'zitadel-auth',
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-3">Locally protected</h1>
    <div class="bg-green-50 border border-green-100 rounded-lg p-5 mb-6">
      <p class="text-sm text-green-700 leading-relaxed">
        You are viewing this page because you are signed in. This page is
        protected by explicitly applying the named middleware.
      </p>
    </div>
    <div class="bg-white border border-gray-200 rounded-lg p-5">
      <h2 class="font-semibold text-gray-800 mb-2">How it works</h2>
      <p class="text-sm text-gray-500 leading-relaxed mb-3">
        This page uses
        <code class="font-mono text-gray-600">definePageMeta({ middleware: 'zitadel-auth' })</code>
        to attach the auth middleware directly. This is useful when you don't
        have the global middleware enabled and want to protect specific pages
        individually.
      </p>
      <p class="text-sm text-gray-500 leading-relaxed">
        In this playground, the global middleware is already active, so the
        explicit middleware here is redundant &mdash; but it demonstrates
        the per-page opt-in pattern.
      </p>
    </div>
    <nuxt-link to="/" class="inline-block mt-6 text-sm text-blue-600 hover:underline">
      &larr; Back to home
    </nuxt-link>
  </div>
</template>
