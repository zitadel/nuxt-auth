<script setup lang="ts">
import { definePageMeta } from '#imports'

definePageMeta({
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/protected/globally',
  },
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-3">Guest only</h1>
    <div class="bg-purple-50 border border-purple-100 rounded-lg p-5 mb-6">
      <p class="text-sm text-purple-700 leading-relaxed">
        You are seeing this page because you are <strong>not</strong> signed in.
        If you sign in and come back here, you will be redirected to the
        globally protected page instead.
      </p>
    </div>
    <div class="bg-white border border-gray-200 rounded-lg p-5">
      <h2 class="font-semibold text-gray-800 mb-2">How it works</h2>
      <p class="text-sm text-gray-500 leading-relaxed mb-3">
        This page uses
        <code class="font-mono text-gray-600">unauthenticatedOnly: true</code>
        in its page meta. This is the inverse of a protected page &mdash; only
        unauthenticated visitors are allowed. Authenticated users are sent to
        the URL specified by
        <code class="font-mono text-gray-600">navigateAuthenticatedTo</code>.
      </p>
      <p class="text-sm text-gray-500 leading-relaxed">
        This pattern is ideal for sign-in pages, registration forms, or
        onboarding flows where it makes no sense for an already-authenticated
        user to visit.
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
