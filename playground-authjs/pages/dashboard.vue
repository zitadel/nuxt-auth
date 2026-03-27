<script setup lang="ts">
</script>

<template>
  <div>
    <div class="mb-10">
      <h1 class="text-4xl font-extrabold tracking-tight text-gray-900 mb-3">
        Dashboard
      </h1>
      <p class="text-lg text-gray-400 max-w-lg">
        You are signed in. Explore the pages below. Use the profile menu in the
        top-right to sign out or refresh your session.
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
        class="bg-white border-l-4 border-l-green-400 border border-gray-200 rounded-lg p-5 hover:shadow-md transition group"
      >
        <div class="font-semibold text-gray-800 group-hover:text-green-600">
          Globally protected
        </div>
        <p class="text-sm text-gray-400 mt-2 leading-relaxed">
          Protected by the global middleware with no explicit auth meta.
          You can access this because you are signed in.
        </p>
      </nuxt-link>
      <nuxt-link
        to="/protected/locally"
        class="bg-white border-l-4 border-l-green-400 border border-gray-200 rounded-lg p-5 hover:shadow-md transition group"
      >
        <div class="font-semibold text-gray-800 group-hover:text-green-600">
          Locally protected
        </div>
        <p class="text-sm text-gray-400 mt-2 leading-relaxed">
          Protected by the named
          <code class="text-gray-500">zitadel-auth</code> middleware via
          <code class="text-gray-500">definePageMeta</code>.
          You can access this because you are signed in.
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
        class="bg-white border-l-4 border-l-red-400 border border-gray-200 rounded-lg p-5 hover:shadow-md transition group"
      >
        <div class="font-semibold text-gray-800 group-hover:text-red-600">
          Guest only
        </div>
        <p class="text-sm text-gray-400 mt-2 leading-relaxed">
          Restricted to unauthenticated users via
          <code class="text-gray-500">unauthenticatedOnly: true</code>.
          You will be redirected away because you are signed in.
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
          Demonstrates stale-while-revalidate caching with route rules.
          Compares server vs client render times.
        </p>
      </nuxt-link>
      <nuxt-link
        to="/api/protected/inline"
        external
        class="bg-white border-l-4 border-l-green-400 border border-gray-200 rounded-lg p-5 hover:shadow-md transition group"
      >
        <div class="font-semibold text-gray-800 group-hover:text-green-600">
          API (inline auth)
        </div>
        <p class="text-sm text-gray-400 mt-2 leading-relaxed">
          Nitro server route that checks the session inside the handler.
          Returns your session data as JSON.
        </p>
      </nuxt-link>
      <nuxt-link
        to="/api/protected/middleware"
        external
        class="bg-white border-l-4 border-l-green-400 border border-gray-200 rounded-lg p-5 hover:shadow-md transition group"
      >
        <div class="font-semibold text-gray-800 group-hover:text-green-600">
          API (middleware auth)
        </div>
        <p class="text-sm text-gray-400 mt-2 leading-relaxed">
          Nitro server route where auth is checked by server middleware
          before the handler runs. Returns your session data as JSON.
        </p>
      </nuxt-link>
    </div>
  </div>
</template>
