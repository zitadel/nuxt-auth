<script setup lang="ts">
import { definePageMeta } from '#imports'

definePageMeta({ auth: { unauthenticatedOnly: false } })
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-3">protected</h1>
    <div class="bg-green-50 border border-green-100 rounded-lg p-5 mb-6">
      <p class="text-sm text-green-700 leading-relaxed">
        You can see this page because you are signed in. This uses the object
        form of auth meta.
      </p>
    </div>
    <div class="bg-white border border-gray-200 rounded-lg p-5">
      <h2 class="font-semibold text-gray-800 mb-2">How it works</h2>
      <p class="text-sm text-gray-500 leading-relaxed">
        Setting
        <code class="font-mono text-gray-600"
          >definePageMeta({ auth: { unauthenticatedOnly: false } })</code
        >
        is the object form of protection. It behaves identically to
        <code class="font-mono text-gray-600">auth: true</code> &mdash; the
        explicit
        <code class="font-mono text-gray-600">unauthenticatedOnly: false</code>
        confirms this is not a guest-only page.
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
