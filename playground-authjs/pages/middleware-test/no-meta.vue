<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-3">no-meta</h1>
    <div class="bg-green-50 border border-green-100 rounded-lg p-5 mb-6">
      <p class="text-sm text-green-700 leading-relaxed">
        You can see this page because you are signed in. It has no
        <code class="font-mono text-green-800">definePageMeta</code> at all.
      </p>
    </div>
    <div class="bg-white border border-gray-200 rounded-lg p-5">
      <h2 class="font-semibold text-gray-800 mb-2">How it works</h2>
      <p class="text-sm text-gray-500 leading-relaxed">
        When no auth meta is defined, the global middleware applies by default
        and protects the page. Unauthenticated visitors are redirected to the
        sign-in page. This is the zero-configuration default.
      </p>
    </div>
    <nuxt-link to="/" class="inline-block mt-6 text-sm text-blue-600 hover:underline">
      &larr; Back to home
    </nuxt-link>
  </div>
</template>
