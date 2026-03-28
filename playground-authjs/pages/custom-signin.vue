<script setup lang="ts">
import { ref } from 'vue'
import { definePageMeta, navigateTo, useAuth } from '#imports'

definePageMeta({ auth: false })

const username = ref('')
const password = ref('')

const { signIn } = useAuth()

async function mySignInHandler({
  username,
  password,
  callbackUrl,
}: {
  username: string
  password: string
  callbackUrl: string
}) {
  const { error, url } = await signIn('credentials', {
    username,
    password,
    callbackUrl,
    redirect: false,
  })

  if (error) {
    // eslint-disable-next-line no-alert
    alert('You have made a terrible mistake while entering your credentials')
  } else {
    return navigateTo(url, { external: true })
  }
}
</script>

<template>
  <div class="max-w-sm mx-auto">
    <h1 class="text-3xl font-bold text-gray-900 mb-3 text-center">Sign in</h1>
    <p class="text-center text-gray-400 mb-8">
      Use the test credentials or sign in with GitHub.
    </p>
    <div class="space-y-4">
      <button
        class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition font-medium"
        @click="signIn('github')"
      >
        Sign in with GitHub
      </button>
      <div class="relative py-2">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-200" />
        </div>
        <div class="relative flex justify-center text-xs">
          <span class="bg-gray-50 px-2 text-gray-400">or use credentials</span>
        </div>
      </div>
      <input
        v-model="username"
        type="text"
        placeholder="Username (jsmith)"
        class="block w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <input
        v-model="password"
        type="password"
        placeholder="Password (hunter2)"
        class="block w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button
        class="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
        @click="
          signIn('credentials', {
            username,
            password,
            callbackUrl: '/dashboard',
          })
        "
      >
        Sign in
      </button>
      <button
        class="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition text-gray-600"
        @click="
          mySignInHandler({
            username,
            password,
            callbackUrl: '/dashboard',
          })
        "
      >
        Sign in (custom handler)
      </button>
    </div>
    <div class="bg-white border border-gray-200 rounded-lg p-5 mt-8">
      <h2 class="font-semibold text-gray-800 mb-2">How it works</h2>
      <p class="text-sm text-gray-500 leading-relaxed mb-3">
        The first button calls
        <code class="font-mono text-gray-600"
          >signIn('credentials', { ... })</code
        >
        which submits credentials to the Auth.js backend and redirects on
        success. This is the standard flow.
      </p>
      <p class="text-sm text-gray-500 leading-relaxed">
        The second button uses a custom handler that passes
        <code class="font-mono text-gray-600">redirect: false</code> to get the
        result back as a return value. This lets you handle errors yourself
        (e.g. show an alert) and manually call
        <code class="font-mono text-gray-600">navigateTo()</code> on success.
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
