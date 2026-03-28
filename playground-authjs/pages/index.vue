<script setup lang="ts">
import { definePageMeta } from '#imports'

definePageMeta({ auth: false })
</script>

<template>
  <div>
    <div class="mb-10">
      <div
        class="inline-block px-3 py-1 mb-4 text-xs font-medium text-blue-600 bg-blue-50 rounded-full"
      >
        @zitadel/nuxt-auth
      </div>
      <h1 class="text-4xl font-extrabold tracking-tight text-gray-900 mb-3">
        NuxtAuth Playground
      </h1>
      <p class="text-lg text-gray-400 max-w-lg">
        A demo app for testing authentication flows, middleware, and session
        management. Sign in from the top-right to get started.
      </p>
    </div>

    <div class="bg-blue-50 border border-blue-100 rounded-lg p-5 mb-10">
      <h2 class="font-semibold text-blue-900 mb-2">How this works</h2>
      <p class="text-sm text-blue-700 leading-relaxed">
        This playground demonstrates the
        <code class="font-mono text-blue-800">@zitadel/nuxt-auth</code> module.
        A global auth middleware protects every page by default &mdash;
        unauthenticated visitors are redirected to sign in. Pages can opt out
        with <code class="font-mono text-blue-800">auth: false</code>, restrict
        access to guests only, or apply the named middleware explicitly. Two
        built-in providers are configured: a hardcoded credentials provider
        (<code class="font-mono text-blue-800">jsmith</code> /
        <code class="font-mono text-blue-800">hunter2</code>) and GitHub OAuth.
      </p>
    </div>

    <h2
      class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4"
    >
      Pages
    </h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <nuxt-link
        to="/protected/globally"
        class="bg-white border-l-4 border-l-red-400 border border-gray-200 rounded-lg p-5 hover:shadow-md transition group"
      >
        <div class="font-semibold text-gray-800 group-hover:text-red-600">
          Globally protected
        </div>
        <p class="text-sm text-gray-400 mt-2 leading-relaxed">
          Protected by the global middleware with no explicit auth meta. You
          will be redirected to sign in.
        </p>
      </nuxt-link>
      <nuxt-link
        to="/protected/locally"
        class="bg-white border-l-4 border-l-red-400 border border-gray-200 rounded-lg p-5 hover:shadow-md transition group"
      >
        <div class="font-semibold text-gray-800 group-hover:text-red-600">
          Locally protected
        </div>
        <p class="text-sm text-gray-400 mt-2 leading-relaxed">
          Protected by the named
          <code class="text-gray-500">zitadel-auth</code> middleware via
          <code class="text-gray-500">definePageMeta</code>. You will be
          redirected to sign in.
        </p>
      </nuxt-link>
      <nuxt-link
        to="/always-unprotected"
        class="bg-white border-l-4 border-l-green-400 border border-gray-200 rounded-lg p-5 hover:shadow-md transition group"
      >
        <div class="font-semibold text-gray-800 group-hover:text-green-600">
          Always unprotected
        </div>
        <p class="text-sm text-gray-400 mt-2 leading-relaxed">
          Opts out with <code class="text-gray-500">auth: false</code>.
          Accessible to everyone regardless of auth state.
        </p>
      </nuxt-link>
      <nuxt-link
        to="/guest"
        class="bg-white border-l-4 border-l-green-400 border border-gray-200 rounded-lg p-5 hover:shadow-md transition group"
      >
        <div class="font-semibold text-gray-800 group-hover:text-green-600">
          Guest only
        </div>
        <p class="text-sm text-gray-400 mt-2 leading-relaxed">
          Restricted to unauthenticated users via
          <code class="text-gray-500">unauthenticatedOnly: true</code>. You can
          access this as a guest.
        </p>
      </nuxt-link>
      <nuxt-link
        to="/with-caching"
        class="bg-white border-l-4 border-l-amber-400 border border-gray-200 rounded-lg p-5 hover:shadow-md transition group"
      >
        <div class="font-semibold text-gray-800 group-hover:text-amber-600">
          SWR cached
        </div>
        <p class="text-sm text-gray-400 mt-2 leading-relaxed">
          Demonstrates stale-while-revalidate caching with route rules. Compares
          server vs client render times.
        </p>
      </nuxt-link>
      <nuxt-link
        to="/api/protected/inline"
        external
        class="bg-white border-l-4 border-l-red-400 border border-gray-200 rounded-lg p-5 hover:shadow-md transition group"
      >
        <div class="font-semibold text-gray-800 group-hover:text-red-600">
          API (inline auth)
        </div>
        <p class="text-sm text-gray-400 mt-2 leading-relaxed">
          Nitro server route that checks the session inside the handler. Returns
          401 without a valid session.
        </p>
      </nuxt-link>
      <nuxt-link
        to="/api/protected/middleware"
        external
        class="bg-white border-l-4 border-l-red-400 border border-gray-200 rounded-lg p-5 hover:shadow-md transition group"
      >
        <div class="font-semibold text-gray-800 group-hover:text-red-600">
          API (middleware auth)
        </div>
        <p class="text-sm text-gray-400 mt-2 leading-relaxed">
          Nitro server route where auth is checked by server middleware before
          the handler runs. Returns 403 without a valid session.
        </p>
      </nuxt-link>
    </div>
  </div>
</template>
