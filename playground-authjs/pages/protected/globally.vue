<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-3">Globally protected</h1>
    <div class="bg-green-50 border border-green-100 rounded-lg p-5 mb-6">
      <p class="text-sm text-green-700 leading-relaxed">
        You are viewing this page because you are signed in. This page has
        no explicit <code class="font-mono text-green-800">definePageMeta</code>
        for auth &mdash; the global middleware protects it automatically.
      </p>
    </div>
    <div class="bg-white border border-gray-200 rounded-lg p-5">
      <h2 class="font-semibold text-gray-800 mb-2">How it works</h2>
      <p class="text-sm text-gray-500 leading-relaxed">
        The <code class="font-mono text-gray-600">zitadel-auth</code> middleware
        runs on every route by default. When an unauthenticated user tries to
        visit this page, the middleware intercepts the request and redirects
        them to the sign-in page. After signing in, they are sent back here.
        No page-level configuration is needed &mdash; protection is the default.
      </p>
    </div>
    <nuxt-link to="/" class="inline-block mt-6 text-sm text-blue-600 hover:underline">
      &larr; Back to home
    </nuxt-link>
  </div>
</template>
