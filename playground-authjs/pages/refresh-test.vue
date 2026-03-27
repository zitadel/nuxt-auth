<script setup lang="ts">
import { ref, watch } from 'vue'
import { definePageMeta, useAuth } from '#imports'

definePageMeta({ auth: false })

const { status, lastRefreshedAt } = useAuth()

const refreshCount = ref(0)

watch(lastRefreshedAt, () => {
  refreshCount.value++
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-3">Refresh test</h1>
    <div class="bg-amber-50 border border-amber-100 rounded-lg p-5 mb-6">
      <p class="text-sm text-amber-700 leading-relaxed">
        This page monitors session refresh activity. The counter below
        increments every time the session is refreshed in the background.
      </p>
    </div>
    <div class="bg-white border border-gray-200 rounded-lg p-5 mb-6">
      <h2 class="font-semibold text-gray-800 mb-3">Session state</h2>
      <div class="space-y-2 text-sm font-mono">
        <div class="flex justify-between items-center bg-gray-50 rounded p-3">
          <span class="text-gray-500">Status</span>
          <pre data-testid="status" class="text-gray-800">{{ status }}</pre>
        </div>
        <div class="flex justify-between items-center bg-gray-50 rounded p-3">
          <span class="text-gray-500">Last refreshed</span>
          <pre data-testid="last-refreshed-at" class="text-gray-800">{{ lastRefreshedAt ?? 'never' }}</pre>
        </div>
        <div class="flex justify-between items-center bg-gray-50 rounded p-3">
          <span class="text-gray-500">Refresh count</span>
          <pre data-testid="refresh-count" class="text-gray-800">{{ refreshCount }}</pre>
        </div>
      </div>
    </div>
    <div class="bg-white border border-gray-200 rounded-lg p-5">
      <h2 class="font-semibold text-gray-800 mb-2">How it works</h2>
      <p class="text-sm text-gray-500 leading-relaxed mb-3">
        The playground is configured with
        <code class="font-mono text-gray-600">enablePeriodically: 3000</code>
        and <code class="font-mono text-gray-600">enableOnWindowFocus: true</code>.
        This means the session is automatically refreshed every 3 seconds and
        whenever you switch back to this browser tab.
      </p>
      <p class="text-sm text-gray-500 leading-relaxed">
        A Vue <code class="font-mono text-gray-600">watch</code> on
        <code class="font-mono text-gray-600">lastRefreshedAt</code> increments
        the counter on each refresh. Try switching tabs and coming back to see
        the count jump.
      </p>
    </div>
    <nuxt-link to="/" class="inline-block mt-6 text-sm text-blue-600 hover:underline">
      &larr; Back to home
    </nuxt-link>
  </div>
</template>
